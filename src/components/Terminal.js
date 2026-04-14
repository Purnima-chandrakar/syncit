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
    <div className="flex flex-col h-full bg-transparent" style={{ padding: 8 }}>
      <div className="flex gap-3 items-center mb-2 flex-wrap">
        <select 
          className="bg-primary text-on-primary px-4 py-2 font-headline text-xs font-bold uppercase tracking-widest rounded-sm hover:brightness-110 transition-all focus:outline-none appearance-none cursor-pointer" 
          value={language} 
          onChange={(e) => setLanguage(e.target.value)}
        >
          {LANGUAGES.map((l) => (
            <option key={l} value={l} className="bg-surface text-on-surface">
              {l}
            </option>
          ))}
        </select>
        
        <select 
          className="bg-primary text-on-primary px-4 py-2 font-headline text-xs font-bold uppercase tracking-widest rounded-sm hover:brightness-110 transition-all focus:outline-none appearance-none cursor-pointer" 
          value={source} 
          onChange={(e) => (/* noop here, controlled by parent */ null)} 
          disabled
        >
          <option value="shared" className="bg-surface text-on-surface">Shared</option>
          <option value="personal" className="bg-surface text-on-surface">Personal</option>
        </select>

        <button 
          className="bg-primary text-on-primary px-4 py-2 font-headline text-xs font-bold uppercase tracking-widest rounded-sm hover:brightness-110 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100" 
          onClick={run} 
          disabled={running}
        >
          {running ? "Running..." : "Run"}
        </button>

        <button
          className="bg-primary text-on-primary px-4 py-2 font-headline text-xs font-bold uppercase tracking-widest rounded-sm hover:brightness-110 transition-all active:scale-95 border border-primary ml-auto"
          onClick={() => setOutput("")}
        >
          Clear
        </button>

        <input
          className="bg-surface-container-low text-on-surface px-4 py-2 font-mono text-xs rounded-sm border border-outline-variant/30 focus:outline-none focus:border-primary/50 w-64"
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
        />
      </div>
      <div
        ref={outRef}
        className="flex-1 custom-scrollbar"
        style={{
          background: "transparent",
          color: "#eee",
          padding: 10,
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
