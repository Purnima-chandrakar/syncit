import React, { useEffect, useState, useRef } from "react";
import ACTIONS from "../Actions";

const LANGUAGES = ["javascript", "python", "java", "c", "cpp"];

const Terminal = ({ socketRef, roomId, codeRef, personalCodeRef, source = 'shared' }) => {
  const [language, setLanguage] = useState("javascript");
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const outRef = useRef(null);

  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket) return;

    function handleOutput({ output: chunk, isError, done }) {
      // Ensure each chunk ends with a newline
      const safeChunk = chunk.endsWith("\n") ? chunk : chunk + "\n";
      setOutput((prev) => prev + safeChunk);
      if (done) setRunning(false);
      // scroll
      setTimeout(() => {
        if (outRef.current)
          outRef.current.scrollTop = outRef.current.scrollHeight;
      }, 10);
    }

    socket.on(ACTIONS.TERMINAL_OUTPUT, handleOutput);

    return () => {
      try {
        socket.off(ACTIONS.TERMINAL_OUTPUT, handleOutput);
      } catch (e) {}
    };
  }, [socketRef]);

  function run() {
    if (!socketRef?.current) {
      console.error("Socket is null or undefined");
      setOutput("ERROR: Socket not connected\n");
      return;
    }
    if (!socketRef.current.connected) {
      console.error("Socket not connected, connected:", socketRef.current.connected);
      setOutput("ERROR: Socket not connected to backend\n");
      return;
    }
    console.log("Socket connected, emitting TERMINAL_RUN with code length:", code?.length);
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
