import React, { useState, useEffect } from "react";
import mermaid from "mermaid";
import { parse } from "@babel/parser";

// Initialize mermaid once
mermaid.initialize({
  startOnLoad: true,
  theme: "dark",
  themeVariables: {
    primaryColor: "#1e293b",
    primaryTextColor: "#f1f5f9",
    primaryBorderColor: "#3b82f6",
    lineColor: "#60a5fa",
    secondaryColor: "#1e40af",
    secondaryTextColor: "#dbeafe",
    tertiaryColor: "#0f172a",
    tertiaryTextColor: "#94a3b8",
    background: "#070d1f",
    mainBkg: "#1e293b",
    secondBkg: "#334155",
    tertiaryBkg: "#0f172a",
    edgeLabelBackground: "#1e293b",
    fontSize: "14px",
    fontFamily: "JetBrains Mono, Consolas, Monaco, monospace",
    labelBackground: "#1e293b",
    nodeBkg: "#1e293b",
    nodeBorder: "#3b82f6",
    clusterBkg: "#0f172a",
    clusterBorder: "#475569",
    defaultLinkColor: "#60a5fa",
    titleColor: "#f1f5f9",
    edgeLabelColor: "#cbd5e1",
    actorBorder: "#3b82f6",
    actorBkg: "#1e293b",
    actorTextColor: "#f1f5f9",
    actorLineColor: "#60a5fa",
    signalColor: "#60a5fa",
    signalTextColor: "#cbd5e1",
    labelBoxBkgColor: "#1e293b",
    labelBoxBorderColor: "#475569",
    labelTextColor: "#f1f5f9",
    loopTextColor: "#cbd5e1",
    noteBorderColor: "#64748b",
    noteBkgColor: "#1e293b",
    noteTextColor: "#e2e8f0",
    activationBorderColor: "#3b82f6",
    activationBkgColor: "#1e40af",
    gridColor: "#1e293b",
    altSectionBkgColor: "#0f172a",
    altSectionBorderColor: "#64748b",
    sectionBkgColor: "#1e293b",
    sectionBorderColor: "#475569",
    taskBorderColor: "#3b82f6",
    taskBkgColor: "#1e293b",
    taskTextColor: "#f1f5f9",
    taskTextDarkColor: "#cbd5e1",
    taskTextOutsideColor: "#cbd5e1",
    taskTextClickableColor: "#60a5fa",
    activeTaskBorderColor: "#60a5fa",
    activeTaskBkgColor: "#1e40af",
    doneTaskBkgColor: "#064e3b",
    doneTaskBorderColor: "#10b981",
    critBorderColor: "#ef4444",
    critBkgColor: "#7f1d1d",
    todayLineColor: "#3b82f6",
    personLabel: "#f1f5f9",
    sectionBkgColorVal: "#1e293b",
    altSectionBkgColorVal: "#0f172a",
    sectionBorderColorVal: "#475569",
    altSectionBorderColorVal: "#64748b",
    scale: 1,
    flowchart: {
      nodeSpacing: 50,
      rankSpacing: 80,
      curve: "basis",
      useMaxWidth: false,
      htmlLabels: true,
      wrap: true,
      padding: 20,
    },
  },
});

const CodeToFlowchartParser = (code, layout = "LR") => {
  let nodeId = 0;
  const nodes = [];
  const edges = [];
  const source = code;

  const label = (node) => source.slice(node.start, node.end).replace(/\s+/g, " ").trim();
  const safeLabel = (value) => value
    .replace(/"/g, "&quot;")
    .replace(/[{}]/g, "")
    .replace(/\|/g, " or ")
    .replace(/[;<>]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 90);
  const addNode = (text, shape = "process") => {
    const id = `node${nodeId++}`;
    nodes.push({ id, text: safeLabel(text), shape });
    return id;
  };
  const connect = (from, to, edgeLabel = "") => {
    if (from && to) edges.push({ from, to, label: safeLabel(edgeLabel) });
  };
  const connectAll = (froms, to, edgeLabel = "") => froms.forEach((from) => connect(from, to, edgeLabel));

  const parseStatement = (statement, incoming) => {
    if (!statement) return incoming;

    if (statement.type === "IfStatement") {
      const decision = addNode(`if (${label(statement.test)})`, "decision");
      connectAll(incoming, decision);
      const yesEntry = addNode("Yes", "process");
      connect(decision, yesEntry, "Yes");
      const yesExit = buildStatement(statement.consequent, [yesEntry]);
      const noEntry = addNode("No", "process");
      connect(decision, noEntry, "No");
      const noExit = statement.alternate
        ? buildStatement(statement.alternate, [noEntry])
        : [noEntry];
      const merge = addNode("Continue", "process");
      connectAll(yesExit, merge);
      connectAll(noExit, merge);
      return [merge];
    }

    if (["ForStatement", "ForInStatement", "ForOfStatement", "WhileStatement", "DoWhileStatement"].includes(statement.type)) {
      const loop = addNode(label(statement), "decision");
      connectAll(incoming, loop);
      const bodyExit = buildStatement(statement.body, [loop]);
      connectAll(bodyExit, loop, "Repeat");
      const merge = addNode("Continue", "process");
      connect(loop, merge, "Done");
      return [merge];
    }

    if (statement.type === "ReturnStatement" || statement.type === "ThrowStatement") {
      const result = addNode(label(statement), "io");
      const end = addNode("END", "end");
      connectAll(incoming, result);
      connect(result, end);
      return [];
    }

    if (statement.type === "BreakStatement" || statement.type === "ContinueStatement") {
      const control = addNode(label(statement), "process");
      connectAll(incoming, control);
      return [control];
    }

    if (statement.type === "BlockStatement") return buildStatements(statement.body, incoming);

    const text = label(statement);
    if (!text) return incoming;
    const node = addNode(text, statement.type === "ExpressionStatement" ? "process" : "function");
    connectAll(incoming, node);
    return [node];
  };

  const buildStatement = (statement, incoming) => parseStatement(statement, incoming);
  const buildStatements = (statements, incoming) => {
    let exits = incoming;
    statements.forEach((statement) => { exits = buildStatement(statement, exits); });
    return exits;
  };

  try {
    const parserOptions = {
      sourceType: "unambiguous",
      errorRecovery: false,
      allowAwaitOutsideFunction: true,
      allowReturnOutsideFunction: true,
    };
    let ast;
    try {
      ast = parse(code, { ...parserOptions, plugins: ["jsx"] });
    } catch (javascriptError) {
      ast = parse(code, {
        ...parserOptions,
        plugins: ["jsx", "typescript"],
      });
    }
    const start = addNode("START", "start");
    const exits = buildStatements(ast.program.body, [start]);
    const end = addNode("END", "end");
    connectAll(exits.length ? exits : [start], end);

    const mermaidCode = [`flowchart ${layout}`];
    nodes.forEach(({ id, text, shape }) => {
      const definition = shape === "start" || shape === "end"
        ? `${id}((${text}))`
        : shape === "decision"
          ? `${id}{${text}}`
          : shape === "io"
            ? `${id}[["${text}"]]`
            : `${id}["${text}"]`;
      mermaidCode.push(`    ${definition}`);
    });
    edges.forEach(({ from, to, label: edgeLabel }) => {
      mermaidCode.push(`    ${from} -->${edgeLabel ? `|${edgeLabel}|` : ""} ${to}`);
    });
    return mermaidCode.join("\n");
  } catch (err) {
    console.error("Flowchart generation error:", err);
    return { error: err.message || "The code could not be parsed." };
  }
};

const TextToFlowchartParser = (code, language, layout = "LR") => {
  let nodeId = 0;
  const nodes = [];
  const edges = [];
  const isPython = language === "python";
  const safeLabel = (value) => value
    .replace(/"/g, "&quot;")
    .replace(/[{}]/g, "")
    .replace(/\|/g, " or ")
    .replace(/[;<>]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 90);
  const addNode = (text, shape = "process") => {
    const id = `node${nodeId++}`;
    nodes.push({ id, text: safeLabel(text), shape });
    return id;
  };
  const connect = (from, to, edgeLabel = "") => {
    if (from && to) edges.push({ from, to, label: safeLabel(edgeLabel) });
  };
  const connectAll = (froms, to, edgeLabel = "") => {
    froms.forEach((from) => connect(from, to, edgeLabel));
  };
  const start = addNode("START", "start");
  let current = [start];
  const stack = [];

  const closeContext = () => {
    const context = stack.pop();
    if (!context) return;
    if (context.type === "loop") {
      connectAll(current, context.decision, "Repeat");
      connect(context.decision, context.merge, "Done");
    } else {
      connectAll(current, context.merge);
      if (!context.hasElse) connect(context.noEntry, context.merge);
    }
    current = [context.merge];
  };

  const lines = code.split("\n");
  lines.forEach((rawLine) => {
    const trimmed = rawLine.trim();
    if (!trimmed) return;

    const indent = rawLine.match(/^\s*/)?.[0].replace(/\t/g, "    ").length || 0;
    const isElseLine = /^(?:}\s*)?else\b|^elif\b/.test(trimmed);
    if (isPython) {
      while (stack.length && indent <= stack[stack.length - 1].indent && !isElseLine) {
        closeContext();
      }
    }

    let line = trimmed;
    const combinedElse = /^}\s*else\b/.test(line);
    if (combinedElse) line = line.replace(/^}\s*/, "");
    const closingBraces = (combinedElse ? 0 : (line.match(/}/g) || []).length);
    if (!isPython && closingBraces) {
      for (let i = 0; i < closingBraces; i += 1) closeContext();
      line = line.replace(/}/g, "").trim();
      if (!line) return;
    }
    if (line === "{" || line === "}") return;
    if (line.startsWith("//") || line.startsWith("#") || line.startsWith("/*")) return;

    if (/^(else\b|elif\b)/.test(line)) {
      const context = stack[stack.length - 1];
      if (context?.type === "if") {
        connectAll(current, context.merge);
        context.hasElse = true;
        if (line.startsWith("elif")) {
          const branch = addNode(line, "decision");
          connect(context.decision, branch, "No");
          current = [branch];
          context.decision = branch;
        } else {
          current = [context.noEntry];
        }
      }
      return;
    }

    const ifMatch = line.match(/^if\s*\((.*)\)|^if\s+(.+?)(?::|\s*\{)?$/);
    const loopMatch = line.match(/^(for|while|do)\b\s*(.*?)(?:\{|:)?$/);
    if (ifMatch) {
      const condition = (ifMatch[1] || ifMatch[2] || line).trim();
      const decision = addNode(`if (${condition})`, "decision");
      connectAll(current, decision);
      const yesEntry = addNode("Yes", "process");
      const noEntry = addNode("No", "process");
      const merge = addNode("Continue", "process");
      connect(decision, yesEntry, "Yes");
      connect(decision, noEntry, "No");
      stack.push({ type: "if", decision, noEntry, merge, hasElse: false, indent });
      current = [yesEntry];
      return;
    }
    if (loopMatch) {
      const loop = addNode(`${loopMatch[1]} ${loopMatch[2]}`.trim(), "decision");
      connectAll(current, loop);
      const merge = addNode("Continue", "process");
      stack.push({ type: "loop", decision: loop, merge, indent });
      current = [loop];
      return;
    }

    if (/^(return|throw|break|continue)\b/.test(line)) {
      const result = addNode(line, "io");
      connectAll(current, result);
      if (/^(return|throw)\b/.test(line)) {
        const end = addNode("END", "end");
        connect(result, end);
        current = [];
      } else {
        current = [result];
      }
      return;
    }

    const statement = addNode(line, /^(print|printf|System\.out|cout|console\.)/.test(line) ? "io" : "process");
    connectAll(current, statement);
    current = [statement];
  });

  while (stack.length) closeContext();
  const end = addNode("END", "end");
  connectAll(current.length ? current : [start], end);
  const mermaidCode = [`flowchart ${layout}`];
  nodes.forEach(({ id, text, shape }) => {
    const definition = shape === "start" || shape === "end"
      ? `${id}((${text}))`
      : shape === "decision"
        ? `${id}{${text}}`
        : shape === "io"
          ? `${id}[["${text}"]]`
          : `${id}["${text}"]`;
    mermaidCode.push(`    ${definition}`);
  });
  edges.forEach(({ from, to, label }) => {
    mermaidCode.push(`    ${from} -->${label ? `|${label}|` : ""} ${to}`);
  });
  return mermaidCode.join("\n");
};

const detectLanguage = (code, selectedLanguage) => {
  if (selectedLanguage !== "javascript") return selectedLanguage;
  if (/^\s*#include\s*[<"]/.test(code) || /\bstd::/.test(code)) {
    return "cpp";
  }
  if (/\b(public\s+static\s+void|System\.out\.|import\s+java\.)/.test(code)) {
    return "java";
  }
  if (/^\s*(def|from\s+\w+\s+import|import\s+\w+)/m.test(code)) {
    return "python";
  }
  return selectedLanguage;
};

const Flowchart = ({ code, source, onSourceChange, language = "javascript" }) => {
  const [renderedSvg, setRenderedSvg] = useState("");
  const [renderError, setRenderError] = useState("");
  const [zoom, setZoom] = useState(100);
  const [layout, setLayout] = useState("LR"); // "LR" for horizontal, "TD" for vertical
  const containerRef = React.useRef(null);
  const effectiveLanguage = detectLanguage(code || "", language);

  useEffect(() => {
    let cancelled = false;
    setRenderedSvg("");
    setRenderError("");

    if (!code || !code.trim()) return undefined;

    const flowchartCode = effectiveLanguage === "javascript"
      ? CodeToFlowchartParser(code, layout)
      : TextToFlowchartParser(code, effectiveLanguage, layout);
    if (!flowchartCode || flowchartCode.error) {
      setRenderError(
        flowchartCode?.error || "The code could not be parsed for a flowchart.",
      );
      return undefined;
    }

    mermaid
      .render(`flowchart-${Date.now()}`, flowchartCode)
      .then(({ svg }) => {
        if (!cancelled) setRenderedSvg(svg);
      })
      .catch((err) => {
        console.error("Mermaid render error:", err);
        if (!cancelled) setRenderError("The flowchart could not be rendered.");
      });

    return () => {
      cancelled = true;
    };
  }, [code, layout, effectiveLanguage]);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 10, 500));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 10, 50));
  };

  const handleResetZoom = () => {
    setZoom(100);
  };

  const toggleLayout = () => {
    setLayout((prev) => (prev === "LR" ? "TD" : "LR"));
  };

  return (
    <div className="h-full w-full bg-[#070d1f] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-white/10 bg-surface/30 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg">
              account_tree
            </span>
            <h2 className="text-base font-headline font-bold tracking-widest uppercase text-white">
              Code Flowchart
            </h2>
            <span className="text-[10px] uppercase tracking-widest text-slate-400">
              {effectiveLanguage === "cpp" ? "C++" : effectiveLanguage}
            </span>
          </div>

          {/* Source Selector */}
          <div className="flex items-center bg-surface-container rounded-md p-0.5">
            <button
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all flex items-center gap-1.5 ${
                source === "shared"
                  ? "bg-primary text-white"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Show Shared Code Flowchart"
              onClick={() => onSourceChange && onSourceChange("shared")}
            >
              <span className="material-symbols-outlined text-sm">
                diversity_3
              </span>
              Shared
            </button>
            <button
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all flex items-center gap-1.5 ${
                source === "personal"
                  ? "bg-primary text-white"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Show Personal Code Flowchart"
              onClick={() => onSourceChange && onSourceChange("personal")}
            >
              <span className="material-symbols-outlined text-sm">person</span>
              Personal
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleZoomOut}
            className="w-10 h-10 rounded-md bg-surface-container border border-white/10 text-white hover:bg-surface-container-high transition flex items-center justify-center"
            title="Zoom Out"
          >
            <span className="material-symbols-outlined text-base">
              zoom_out
            </span>
          </button>
          <div className="px-3 py-2 bg-surface-container rounded-md text-white text-sm font-medium min-w-[60px] text-center">
            {zoom}%
          </div>
          <button
            onClick={handleZoomIn}
            className="w-10 h-10 rounded-md bg-surface-container border border-white/10 text-white hover:bg-surface-container-high transition flex items-center justify-center"
            title="Zoom In"
          >
            <span className="material-symbols-outlined text-base">zoom_in</span>
          </button>
          <button
            onClick={handleResetZoom}
            className="w-10 h-10 rounded-md bg-surface-container border border-white/10 text-white hover:bg-surface-container-high transition flex items-center justify-center"
            title="Reset Zoom"
          >
            <span className="material-symbols-outlined text-base">
              zoom_out_map
            </span>
          </button>
          <button
            onClick={toggleLayout}
            className="w-10 h-10 rounded-md bg-surface-container border border-white/10 text-white hover:bg-surface-container-high transition flex items-center justify-center"
            title="Toggle Layout (Horizontal/Vertical)"
          >
            <span className="material-symbols-outlined text-base">
              {layout === "LR" ? "schema" : "account_tree"}
            </span>
          </button>
        </div>
      </div>

      {/* Flowchart Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto custom-scrollbar p-6"
        style={{ backgroundColor: "rgba(7, 13, 31, 0.5)" }}
      >
        {code && code.trim() ? (
          <div className="flex justify-center items-start min-h-full">
            <style>{`
              .mermaid {
                display: flex;
                flex-direction: column;
                align-items: center;
                min-width: fit-content;
              }
              .mermaid svg {
                max-width: none;
                height: auto;
                transform: scale(${zoom / 100});
                transform-origin: top center;
                transition: transform 0.2s ease;
                filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3));
                min-width: fit-content;
              }
              .mermaid .node {
                display: inline-block;
                margin: 4px;
              }
              .mermaid g.node rect, .mermaid g.node polygon {
                fill: #1e293b;
                stroke: #3b82f6;
                stroke-width: 2px;
                filter: drop-shadow(0 2px 4px rgba(59, 130, 246, 0.3));
                rx: 8px;
              }
              .mermaid g.node circle {
                fill: #1e293b;
                stroke: #3b82f6;
                stroke-width: 2px;
                filter: drop-shadow(0 2px 4px rgba(59, 130, 246, 0.3));
              }
              .mermaid g.node text {
                fill: #f1f5f9;
                font-family: 'JetBrains Mono', 'Consolas', 'Monaco', monospace;
                font-size: 12px;
                font-weight: 500;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
                white-space: nowrap;
              }
              .mermaid g.edgePath path {
                stroke: #60a5fa;
                stroke-width: 2px;
                fill: none;
                filter: drop-shadow(0 1px 2px rgba(96, 165, 250, 0.4));
              }
              .mermaid g.edgeLabel rect {
                fill: #1e293b;
                stroke: #475569;
                stroke-width: 1px;
                rx: 4px;
              }
              .mermaid g.edgeLabel text {
                fill: #cbd5e1;
                font-family: 'JetBrains Mono', 'Consolas', 'Monaco', monospace;
                font-size: 11px;
                white-space: nowrap;
              }
              .mermaid g.cluster rect {
                fill: #0f172a;
                stroke: #475569;
                stroke-width: 1px;
                rx: 8px;
              }
              .mermaid g.cluster text {
                fill: #94a3b8;
                font-family: 'JetBrains Mono', 'Consolas', 'Monaco', monospace;
                font-size: 12px;
                font-weight: bold;
              }
              .mermaid .edgeLabel {
                background: #1e293b;
                padding: 2px 6px;
                border-radius: 4px;
              }
            `}</style>
            {renderError ? (
              <p className="text-red-300 text-sm p-6">{renderError}</p>
            ) : (
              <div
                key={`${layout}-${code.length}`}
                className="mermaid inline-block"
                dangerouslySetInnerHTML={{ __html: renderedSvg }}
              />
            )}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <p className="material-symbols-outlined text-5xl text-slate-600 mb-4">
                flowchart
              </p>
              <p className="text-slate-400 text-sm">
                Start writing code to see the flowchart
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Flowchart;
