const express = require("express");
const app = express();
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");
const ACTIONS = require("./src/Actions");

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin:
      process.env.NODE_ENV === "production" ? false : "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const fs = require("fs");
const os = require("os");
const { spawn } = require("child_process");
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");

// Configuration for sandboxed execution using Judge0
const USE_JUDGE0 = process.env.USE_JUDGE0 === "true";
const JUDGE0_URL = process.env.JUDGE0_URL || "http://localhost:2358";

// Map basic language names to Judge0 language_id values. Update these if your Judge0
// installation uses different ids. You can also set language mapping via env if needed.
const JUDGE0_LANG_MAP = {
  javascript: 63, // Node.js (verify in your Judge0)
  python: 71, // Python 3
  java: 62, // Java (OpenJDK)
  c: 50, // C (gcc)
  cpp: 54, // C++ (g++)
};

// Helper to run code via Judge0 (self-hosted or hosted). Streams the final stdout/stderr
// back to the requesting socket. Uses polling. Adjust timeouts as needed.
async function runViaJudge0({ socket, runId, language, code }) {
  const emit = (payload) =>
    io.to(socket.id).emit(ACTIONS.TERMINAL_OUTPUT, payload);
  try {
    const langKey = (language || "javascript").toLowerCase();
    const language_id =
      JUDGE0_LANG_MAP[langKey] || JUDGE0_LANG_MAP["javascript"];

    emit({
      output: `Submitting run ${runId} to Judge0 (language_id=${language_id})...\n`,
      isError: false,
    });

    const submitUrl = `${JUDGE0_URL.replace(
      /\/$/,
      ""
    )}/submissions?base64_encoded=false&wait=false`;
    const submitResp = await axios.post(
      submitUrl,
      {
        source_code: code || "",
        language_id,
        stdin: "",
      },
      { timeout: 10000 }
    );

    const token = submitResp.data.token;
    if (!token) {
      emit({
        output: `Runner did not return a token.\n`,
        isError: true,
        done: true,
      });
      return;
    }

    emit({
      output: `Submitted (token=${token}). Polling for result...\n`,
      isError: false,
    });

    const pollUrl = `${JUDGE0_URL.replace(
      /\/$/,
      ""
    )}/submissions/${token}?base64_encoded=false`;
    const start = Date.now();
    const overallTimeout = 20 * 1000; // 20s
    while (true) {
      const res = await axios.get(pollUrl, { timeout: 10000 });
      const data = res.data || {};

      // If we have partial output, emit it (Judge0 typically returns full stdout/stderr when done)
      if (data.stdout) emit({ output: data.stdout, isError: false });
      if (data.stderr) emit({ output: data.stderr, isError: true });

      const statusId = data.status?.id || 0; // 1 = in queue, 2 = processing, >=3 finished
      if (statusId >= 3) {
        emit({
          output: `\nStatus: ${data.status?.description || "finished"}\n`,
          isError: false,
          done: true,
        });
        return;
      }

      if (Date.now() - start > overallTimeout) {
        emit({
          output: "\nTimed out waiting for runner.\n",
          isError: true,
          done: true,
        });
        return;
      }

      // wait briefly before polling again
      await new Promise((r) => setTimeout(r, 500));
    }
  } catch (err) {
    emit({
      output: `Judge0 error: ${err.message}\n`,
      isError: true,
      done: true,
    });
  }
}
const tmpBase = path.join(__dirname, "tmp_runs");
if (!fs.existsSync(tmpBase)) fs.mkdirSync(tmpBase, { recursive: true });

// Only serve static build files in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static("build"));
  app.use((req, res, next) => {
    res.sendFile(path.join(__dirname, "build", "index.html"));
  });
}

const userSocketMap = {};
function getAllConnectedClients(roomId) {
  // Map
  return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
    (socketId) => {
      return {
        socketId,
        username: userSocketMap[socketId],
      };
    }
  );
}

io.on("connection", (socket) => {
  console.log("socket connected", socket.id);

  socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
    userSocketMap[socket.id] = username;
    socket.join(roomId);
    const clients = getAllConnectedClients(roomId);
    clients.forEach(({ socketId }) => {
      io.to(socketId).emit(ACTIONS.JOINED, {
        clients,
        username,
        socketId: socket.id,
      });
    });
  });

  socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
    socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code });
  });

  // Handle block/unblock editing from host and broadcast to room
  socket.on(ACTIONS.BLOCK_EDITING, ({ roomId, blocked }) => {
    io.in(roomId).emit(ACTIONS.EDITING_BLOCKED, { blocked });
  });

  // Terminal run request: receive language and code, run on server and stream output
  socket.on(ACTIONS.TERMINAL_RUN, async ({ roomId, language, code }) => {
    const runId = uuidv4();
    try {
      // If configured to use Judge0 (sandboxed runner), submit to Judge0 and return the streamed result.
      if (USE_JUDGE0) {
        // inform client that run started
        io.to(socket.id).emit(ACTIONS.TERMINAL_OUTPUT, {
          output: `Run ${runId} starting (sandboxed)...\n`,
          isError: false,
        });
        await runViaJudge0({ socket, runId, language, code });
        return;
      }

      // Fallback: run on host (existing logic)
      const runDir = path.join(tmpBase, `${Date.now()}_${runId}`);
      fs.mkdirSync(runDir, { recursive: true });

      let filename;
      let compileCmd = null;
      let runCmd = null;

      // choose file extension and commands based on language
      switch ((language || "").toLowerCase()) {
        case "python":
          filename = "Main.py";
          runCmd = `python "${filename}"`;
          break;
        case "javascript":
        case "node":
          filename = "Main.js";
          runCmd = `node "${filename}"`;
          break;
        case "java":
          // require class Main
          filename = "Main.java";
          compileCmd = `javac "${filename}"`;
          runCmd = `java Main`;
          break;
        case "c":
          filename = "main.c";
          compileCmd = `gcc "${filename}" -o main.out`;
          runCmd = os.platform() === "win32" ? `main.out` : `./main.out`;
          break;
        case "cpp":
        case "c++":
          filename = "main.cpp";
          compileCmd = `g++ "${filename}" -o main.out`;
          runCmd = os.platform() === "win32" ? `main.out` : `./main.out`;
          break;
        default:
          // Not a compiled language - treat as shell command if user provided code as a single-line command
          filename = "cmd.txt";
          break;
      }

      const filePath = path.join(runDir, filename);
      fs.writeFileSync(filePath, code || "");

      // helper to emit output back only to the socket that requested the run
      // so multiple users can run code concurrently without interfering
      function emitOut(payload) {
        io.to(socket.id).emit(ACTIONS.TERMINAL_OUTPUT, payload);
      }

      // If there's a compile step, run it first
      const execWithStream = (command, workdir) => {
        const proc = spawn(command, { cwd: workdir, shell: true });
        proc.stdout.on("data", (chunk) => {
          emitOut({ output: chunk.toString(), isError: false });
        });
        proc.stderr.on("data", (chunk) => {
          emitOut({ output: chunk.toString(), isError: true });
        });
        return proc;
      };

      let proc = null;
      if (compileCmd) {
        emitOut({ output: `Compiling with: ${compileCmd}\n`, isError: false });
        proc = execWithStream(compileCmd, runDir);
        await new Promise((res) => proc.on("close", res));
      }

      // Decide how to run
      if (runCmd) {
        emitOut({ output: `Running: ${runCmd}\n`, isError: false });
        proc = execWithStream(runCmd, runDir);
      } else {
        // if no runCmd (e.g., unknown language), treat code as a shell command or display message
        const trimmed = (code || "").trim();
        if (trimmed.length === 0) {
          emitOut({
            output: "No runnable command or code provided for this language.\n",
            isError: true,
          });
        } else {
          emitOut({
            output: `Running shell command: ${trimmed}\n`,
            isError: false,
          });
          proc = execWithStream(trimmed, runDir);
        }
      }

      if (proc) {
        // safety timeout
        const killTimeout = setTimeout(() => {
          try {
            proc.kill();
            emitOut({ output: "\nProcess killed (timeout).\n", isError: true });
          } catch (e) {}
        }, 15 * 1000); // 15s

        proc.on("close", (code) => {
          clearTimeout(killTimeout);
          emitOut({
            output: `\nProcess exited with code ${code}\n`,
            isError: false,
            done: true,
          });
          // cleanup
          try {
            fs.rmSync(runDir, { recursive: true, force: true });
          } catch (e) {}
        });
      } else {
        // no proc (e.g., nothing to run)
        emitOut({
          output: "\nFinished (no process started).\n",
          isError: false,
          done: true,
        });
        try {
          fs.rmSync(runDir, { recursive: true, force: true });
        } catch (e) {}
      }
    } catch (err) {
      // send error only to the requester
      io.to(socket.id).emit(ACTIONS.TERMINAL_OUTPUT, {
        output: String(err),
        isError: true,
        done: true,
      });
    }
  });

  socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
    io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
  });

  socket.on("disconnecting", () => {
    const rooms = [...socket.rooms];
    rooms.forEach((roomId) => {
      socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
        socketId: socket.id,
        username: userSocketMap[socket.id],
      });
    });
    delete userSocketMap[socket.id];
    socket.leave();
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
