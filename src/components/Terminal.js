import React, { useEffect, useState, useRef } from "react";
import ACTIONS from "../Actions";

const LANGUAGES = ["javascript", "python", "java", "c", "cpp"];

const Terminal = ({ socketRef, roomId, codeRef, personalCodeRef, source = 'shared' }) => {
  const [language, setLanguage] = useState("javascript");
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const outRef = useRef(null);

  useEffect(() => {
    // The socketRef may be assigned after this component mounts (async init).
    // Poll briefly for `socketRef.current` and attach the listener when available.
    let intervalId = null;
    let cleanupFn = null;

    const attach = () => {
      const socket = socketRef?.current;
      if (!socket) return false;

      function handleOutput({ output: chunk, isError, done }) {
        const safeChunk = chunk.endsWith("\n") ? chunk : chunk + "\n";
        setOutput((prev) => prev + safeChunk);
        if (done) setRunning(false);
        setTimeout(() => {
          if (outRef.current) outRef.current.scrollTop = outRef.current.scrollHeight;
        }, 10);
      }

      socket.on(ACTIONS.TERMINAL_OUTPUT, handleOutput);
      cleanupFn = () => {
        try {
          socket.off(ACTIONS.TERMINAL_OUTPUT, handleOutput);
        } catch (e) {}
      };
      return true;
    };

    if (!attach()) {
      // try every 150ms for up to ~5s
      let attempts = 0;
      intervalId = setInterval(() => {
        attempts += 1;
        if (attach() || attempts > 33) {
          if (intervalId) clearInterval(intervalId);
          intervalId = null;
        }
      }, 150);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (cleanupFn) cleanupFn();
    };
  }, [socketRef]);

  function run() {
    if (!socketRef?.current) {
      setOutput("ERROR: Socket not connected\n");
      return;
    }
    if (!socketRef.current.connected) {
      setOutput("ERROR: Socket not connected to backend\n");
      return;
    }
    setOutput("");
    setRunning(true);
    const code = (source === 'personal' ? personalCodeRef?.current : codeRef?.current) || "";
    socketRef.current.emit(ACTIONS.TERMINAL_RUN, { roomId, language, code });
  }

  return (
    <div style={{ borderTop: "1px solid #333", padding: 8 }}>
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <label style={{ color: "#ddd" }}>Language</label>
        <select className="langSelect" value={language} onChange={(e) => setLanguage(e.target.value)}>
          {LANGUAGES.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <label style={{ color: "#ddd", marginLeft: 8 }}>Source</label>
        <select className="langSelect" value={source} onChange={(e) => (/* noop here, controlled by parent */ null)} disabled>
          <option value="shared">Shared</option>
          <option value="personal">Personal</option>
        </select>
        <button className="btn" onClick={run} disabled={running}>
          {running ? "Running..." : "Run"}
        </button>
        <button
          className="btn"
          onClick={() => setOutput("")}
          style={{ marginLeft: "auto" }}
        >
          Clear
        </button>
        <input
          className="termInput"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (!running) return;
              const toSend = inputValue || "\n";
              try {
                socketRef?.current?.emit && socketRef.current.emit(ACTIONS.TERMINAL_INPUT, { input: toSend + (toSend.endsWith("\n") ? "" : "\n") });
                setOutput((prev) => prev + `> ${inputValue}\n`);
              } catch (err) {}
              setInputValue("");
            }
          }}
          placeholder={running ? "Type input and press Enter" : "Run code to enable input"}
          disabled={!running}
          style={{ marginLeft: 8, padding: '6px 8px', flex: '0 0 240px', background: '#111', color: '#eee', border: '1px solid #333', borderRadius: 4 }}
        />
      </div>
      <div
        ref={outRef}
        style={{
          background: "#0b0b0b",
          color: "#eee",
          padding: 10,
          height: 200,
          overflow: "auto",
          fontFamily: "monospace",
          fontSize: 13,
          borderRadius: 4,
        }}
      >
        <pre
          style={{
            margin: 0,
            background: "none",
            color: "inherit",
            fontFamily: "inherit",
            fontSize: "inherit",
          }}
        >
          {output || (
            <span style={{ opacity: 0.6 }}>
              Terminal output will appear here.
            </span>
          )}
        </pre>
      </div>
    </div>
  );
};

export default Terminal;
