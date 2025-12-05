const express = require("express");
const app = express();
// health endpoint
app.get('/health', (req, res) => res.json({ ok: true }));
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");
const ACTIONS = require("./src/Actions");

const server = http.createServer(app);
// Allow configuring allowed CORS origin(s) via environment variable.
// Example: CORS_ORIGIN="https://your-frontend.vercel.app"
// For production, be explicit. For dev, allow localhost.
let corsOrigin = process.env.CORS_ORIGIN || (process.env.NODE_ENV === 'production' ? false : 'http://localhost:3000');

// If CORS_ORIGIN is set, also allow it with http:// in case there's a mismatch
if (corsOrigin && typeof corsOrigin === 'string' && corsOrigin.startsWith('https://')) {
  corsOrigin = [corsOrigin, corsOrigin.replace('https://', 'http://')];
}

// Socket.IO CORS configured via env var
 
const io = new Server(server, {
  // Increase heartbeat intervals to better tolerate brief network hiccups
  pingInterval: 25000,
  pingTimeout: 20000,
  cors: {
    origin: corsOrigin,
    methods: ["GET", "POST"],
    credentials: true,
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
// Track per-room state: admin socketId, per-user edit permissions, and raised hands
// roomState[roomId] = { adminId, permissions: { socketId: boolean }, hands: Set<socketId>, activeEditor: socketId|null, typingTimeout: NodeJS.Timeout|null }
const roomState = {};
// Map socket.id -> currently running child process (for sending stdin)
const runningProcs = new Map();
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

    // initialize room state if first join
    if (!roomState[roomId]) {
      roomState[roomId] = { adminId: socket.id, permissions: {}, hands: new Set(), activeEditor: null, typingTimeout: null };
    }

    const room = roomState[roomId];

    // ensure permissions contains all clients; default true for admin, and true for others by default
    const currentClients = getAllConnectedClients(roomId);
    currentClients.forEach(({ socketId }) => {
      if (!(socketId in room.permissions)) room.permissions[socketId] = socketId === room.adminId ? true : true;
    });

    const clients = getAllConnectedClients(roomId);
    clients.forEach(({ socketId }) => {
      io.to(socketId).emit(ACTIONS.JOINED, {
        clients,
        username,
        socketId: socket.id,
      });
    });

    // broadcast current permissions and hands
    io.in(roomId).emit(ACTIONS.PERMISSION_UPDATE, {
      adminId: room.adminId,
      permissions: room.permissions,
      hands: Array.from(room.hands),
    });
  });

  socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code, mode }) => {
    // Only propagate shared edits
    if (mode !== 'shared') return;

    const room = roomState[roomId];
    if (room) {
      const canEdit = room.permissions[socket.id] !== false; // default true
      if (!canEdit && socket.id !== room.adminId) {
        // ignore edit attempts if not permitted
        return;
      }
    }
    socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code, mode: 'shared' });
  });

  // Legacy room-wide block/unblock editing from host and broadcast to room
  socket.on(ACTIONS.BLOCK_EDITING, ({ roomId, blocked }) => {
    io.in(roomId).emit(ACTIONS.EDITING_BLOCKED, { blocked });
  });

  // Admin sets per-user permission { roomId, targetSocketId, canEdit }
  socket.on(ACTIONS.SET_USER_PERMISSION, ({ roomId, targetSocketId, canEdit }) => {
    const room = roomState[roomId];
    if (!room) return;
    if (socket.id !== room.adminId) return; // only admin can change
    room.permissions[targetSocketId] = !!canEdit;
    io.in(roomId).emit(ACTIONS.PERMISSION_UPDATE, {
      adminId: room.adminId,
      permissions: room.permissions,
      hands: Array.from(room.hands),
    });
  });

  // Any user can raise/lower hand { roomId, raised: boolean }
  socket.on(ACTIONS.RAISE_HAND, ({ roomId, raised }) => {
    const room = roomState[roomId];
    if (!room) return;
    if (raised) room.hands.add(socket.id);
    else room.hands.delete(socket.id);
    io.in(roomId).emit(ACTIONS.PERMISSION_UPDATE, {
      adminId: room.adminId,
      permissions: room.permissions,
      hands: Array.from(room.hands),
    });
  });

  // Typing indicator from clients editing the shared doc { roomId }
  socket.on(ACTIONS.TYPING, ({ roomId }) => {
    const room = roomState[roomId];
    if (!room) return;

    // set current active editor and broadcast (only if changed)
    if (room.activeEditor !== socket.id) {
      room.activeEditor = socket.id;
      io.in(roomId).emit(ACTIONS.ACTIVE_EDITOR, {
        socketId: socket.id,
        username: userSocketMap[socket.id],
      });
    }

    // reset idle timeout to clear active editor after 1.5s of inactivity
    if (room.typingTimeout) {
      try { clearTimeout(room.typingTimeout); } catch (e) {}
    }
    room.typingTimeout = setTimeout(() => {
      // clear only if still the same editor
      if (room.activeEditor === socket.id) {
        room.activeEditor = null;
        io.in(roomId).emit(ACTIONS.ACTIVE_EDITOR, { socketId: null });
      }
      room.typingTimeout = null;
    }, 1500);
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

      // Detect runtime dependency hints in the submitted code and strip them
      // before saving/executing so interpreters don't try to run the header.
      // Supported header formats (top of file):
      //   Python:   `# requirements: pkg1 pkg2==1.2`  or `requirements: pkg1 pkg2`
      //   JS:       `// dependencies: pkg1 pkg2`      or `dependencies: pkg1 pkg2`
      const pythonReqMatch = (code || "").match(/^[ \t]*#?\s*requirements\s*:\s*(.+)$/im);
      const jsDepMatch = (code || "").match(/^[ \t]*\/\/??\s*dependencies\s*:\s*(.+)$/im);

      // Remove header lines (if present) so they are not part of the executed file
      let cleanedCode = code || "";
      if (pythonReqMatch) {
        cleanedCode = cleanedCode.replace(/^[ \t]*#?\s*requirements\s*:\s*.*$/im, "");
      }
      if (jsDepMatch) {
        cleanedCode = cleanedCode.replace(/^[ \t]*\/\/??\s*dependencies\s*:\s*.*$/im, "");
      }

      const filePath = path.join(runDir, filename);
      fs.writeFileSync(filePath, cleanedCode || "");

      // Helper to run install commands and stream output
      const runInstall = (command) => {
        return new Promise((resolve) => {
          try {
            const inst = spawn(command, { cwd: runDir, shell: true });
            inst.stdout.on("data", (c) => emitOut({ output: c.toString(), isError: false }));
            inst.stderr.on("data", (c) => emitOut({ output: c.toString(), isError: true }));
            const to = setTimeout(() => {
              try { inst.kill(); emitOut({ output: "\nInstall timed out.\n", isError: true }); } catch (e) {}
              resolve(false);
            }, 60 * 1000); // 60s install timeout
            inst.on("close", (code) => { clearTimeout(to); resolve(code === 0); });
          } catch (e) { emitOut({ output: `Install failed: ${String(e)}\n`, isError: true }); resolve(false); }
        });
      };

      // If Python requirements were declared, attempt pip install. If the
      // environment is externally-managed (PEP 668) try creating a venv and
      // installing into it, then use that venv's python to run the code.
      let pythonExecPath = process.env.PYTHON_CMD || "python"; // command used to invoke python
      let venvCreated = false;
      if (pythonReqMatch) {
        const pkgs = pythonReqMatch[1].trim();
        if (pkgs.length > 0) {
          emitOut({ output: `Installing Python requirements: ${pkgs}\n`, isError: false });
          // First try normal pip install
          const pyCmd = process.env.PYTHON_CMD || "python";
          let ok = await runInstall(`${pyCmd} -m pip install --no-cache-dir ${pkgs}`);
          if (!ok) {
            // Try venv fallback (Linux/Unix and Windows differ)
            try {
              if (os.platform() === 'win32') {
                // Windows: create venv and install using its python
                emitOut({ output: `Falling back to virtualenv install (Windows)...\n`, isError: false });
                ok = await runInstall(`${pyCmd} -m venv venv && venv\\Scripts\\python.exe -m pip install --no-cache-dir ${pkgs}`);
                if (ok) {
                  venvCreated = true;
                  pythonExecPath = path.join('.', 'venv', 'Scripts', 'python.exe');
                }
              } else {
                emitOut({ output: `Falling back to virtualenv install...\n`, isError: false });
                ok = await runInstall(`${pyCmd} -m venv venv && ./venv/bin/python -m pip install --no-cache-dir ${pkgs}`);
                if (ok) {
                  venvCreated = true;
                  pythonExecPath = path.join('.', 'venv', 'bin', 'python');
                }
              }
            } catch (e) {
              ok = false;
            }
          }

          if (!ok) {
            emitOut({ output: `\nFailed to install Python packages.\n`, isError: true, done: true });
            try { fs.rmSync(runDir, { recursive: true, force: true }); } catch (e) {}
            return;
          }
        }
      }

      // If JS dependencies were declared, create a minimal package.json and npm install
      if (jsDepMatch) {
        const pkgs = jsDepMatch[1].trim();
        if (pkgs.length > 0) {
          emitOut({ output: `Installing JS dependencies: ${pkgs}\n`, isError: false });
          // write a minimal package.json so npm install works
          try {
            fs.writeFileSync(path.join(runDir, 'package.json'), JSON.stringify({ name: 'temp-run', version: '1.0.0' }));
          } catch (e) {}
          const ok = await runInstall(`npm install ${pkgs} --no-audit --no-fund`);
          if (!ok) {
            emitOut({ output: `\nFailed to install JS packages.\n`, isError: true, done: true });
            try { fs.rmSync(runDir, { recursive: true, force: true }); } catch (e) {}
            return;
          }
        }
      }

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

      // If we created a Python venv, ensure we use its python binary
      if ((language || "").toLowerCase() === 'python' && venvCreated) {
        runCmd = `${pythonExecPath} "${filename}"`;
      }

      // Decide how to run
      if (runCmd) {
        emitOut({ output: `Running: ${runCmd}\n`, isError: false });
        proc = execWithStream(runCmd, runDir);
        // track running proc for this socket so clients can send stdin
        try { runningProcs.set(socket.id, proc); } catch (e) {}
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
          try { runningProcs.set(socket.id, proc); } catch (e) {}
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

        // Track when all streams have ended
        let stdoutEnded = false;
        let stderrEnded = false;

        proc.stdout.on("end", () => {
          stdoutEnded = true;
          checkAllDone();
        });

        proc.stderr.on("end", () => {
          stderrEnded = true;
          checkAllDone();
        });

        const checkAllDone = () => {
          if (stdoutEnded && stderrEnded) {
            proc.on("close", handleClose);
          }
        };

        const handleClose = (code) => {
          clearTimeout(killTimeout);
          // remove running proc reference for this socket
          try { runningProcs.delete(socket.id); } catch (e) {}

          emitOut({
            output: `\nProcess exited with code ${code}\n`,
            isError: false,
            done: true,
          });
          // cleanup
          try {
            fs.rmSync(runDir, { recursive: true, force: true });
          } catch (e) {}
        };

        proc.on("close", handleClose);
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
    // Send as a shared code-change payload to the specific socket
    io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code, mode: 'shared' });
  });

  // Terminal stdin input from client: write to running process stdin for this socket
  socket.on(ACTIONS.TERMINAL_INPUT, ({ input }) => {
    try {
      const proc = runningProcs.get(socket.id);
      if (!proc || !proc.stdin) {
        io.to(socket.id).emit(ACTIONS.TERMINAL_OUTPUT, {
          output: "No running process to send input to.\n",
          isError: true,
        });
        return;
      }
      // Ensure string and include newline if caller didn't
      const toWrite = typeof input === 'string' ? input : String(input || '');
      proc.stdin.write(toWrite);
    } catch (err) {
      io.to(socket.id).emit(ACTIONS.TERMINAL_OUTPUT, {
        output: `Failed to write to process stdin: ${String(err)}\n`,
        isError: true,
      });
    }
  });

  // Admin kick user { roomId, targetSocketId }
  socket.on(ACTIONS.KICK_USER, ({ roomId, targetSocketId }) => {
    const room = roomState[roomId];
    if (!room) return;
    // only admin may kick
    if (socket.id !== room.adminId) return;
    const target = io.sockets.sockets.get(targetSocketId);
    if (!target) return;
    try {
      const targetUsername = userSocketMap[targetSocketId];
      // notify target they were kicked
      io.to(targetSocketId).emit(ACTIONS.USER_KICKED, { reason: 'You were removed by admin' });
      // notify admin of success
      io.to(socket.id).emit('kick-success', { username: targetUsername });
      // disconnect target after brief delay to let message reach them
      setTimeout(() => {
        target.disconnect(true);
      }, 100);
    } catch (e) {
      console.warn('Error disconnecting target', e);
      io.to(socket.id).emit('kick-error', { error: 'Failed to remove user' });
    }
  });

  socket.on("disconnecting", () => {
    const rooms = [...socket.rooms];
    rooms.forEach((roomId) => {
      // update room state
      const room = roomState[roomId];
      if (room) {
        // remove from permissions and hands
        delete room.permissions[socket.id];
        room.hands.delete(socket.id);
        // if admin leaves, pick next client as admin
        if (room.adminId === socket.id) {
          const remaining = getAllConnectedClients(roomId).filter(c => c.socketId !== socket.id);
          room.adminId = remaining[0]?.socketId || null;
        }
        // if the disconnecting user was the active editor, clear it
        if (room.activeEditor === socket.id) {
          room.activeEditor = null;
          if (room.typingTimeout) {
            try { clearTimeout(room.typingTimeout); } catch (e) {}
            room.typingTimeout = null;
          }
          io.in(roomId).emit(ACTIONS.ACTIVE_EDITOR, { socketId: null });
        }

        // broadcast permission update
        io.in(roomId).emit(ACTIONS.PERMISSION_UPDATE, {
          adminId: room.adminId,
          permissions: room.permissions,
          hands: Array.from(room.hands),
        });
      }

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
