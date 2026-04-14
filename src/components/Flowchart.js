import React, { useState, useEffect } from "react";
import mermaid from "mermaid";

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
    sectionBkgColor: "#1e293b",
    altSectionBkgColor: "#0f172a",
    sectionBorderColor: "#475569",
    altSectionBorderColor: "#64748b",
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
  const lines = code.split("\n").filter((line) => line.trim());
  let nodeId = 0;
  // Use layout parameter to determine direction
  let mermaidCode = `flowchart ${layout}\n`;
  const nodeStack = [];

  const addNode = (text, shape = "process") => {
    const id = `node${nodeId++}`;
    let formatted = text.replace(/"/g, "'").substring(0, 60);

    switch (shape) {
      case "start":
        mermaidCode += `    ${id}((🟢 START));\n`;
        break;
      case "end":
        mermaidCode += `    ${id}((🔴 END));\n`;
        break;
      case "decision":
        mermaidCode += `    ${id}{${formatted}};\n`;
        break;
      case "io":
        mermaidCode += `    ${id}[["💾 ${formatted}"]];\n`;
        break;
      case "process":
        mermaidCode += `    ${id}["⚙️ ${formatted}"];\n`;
        break;
      case "function":
        mermaidCode += `    ${id}["📋 ${formatted}"];\n`;
        break;
      case "loop":
        mermaidCode += `    ${id}["🔄 ${formatted}"];\n`;
        break;
      default:
        mermaidCode += `    ${id}["${formatted}"];\n`;
    }
    return id;
  };

  const addEdge = (from, to, label = "") => {
    if (label) {
      mermaidCode += `    ${from} -->|${label}| ${to};\n`;
    } else {
      mermaidCode += `    ${from} --> ${to};\n`;
    }
  };

  try {
    let prevId = addNode("Start", "start");
    nodeStack.push(prevId);

    for (let line of lines) {
      const trimmed = line.trim();

      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith("//")) continue;

      // Function definitions
      if (trimmed.match(/^(async\s+)?function\s+\w+\s*\(/i)) {
        const name = trimmed.match(/function\s+(\w+)/i)?.[1] || "Function";
        prevId = addNode(`Function: ${name}`, "process");
        addEdge(nodeStack[nodeStack.length - 1], prevId);
        nodeStack.push(prevId);
        continue;
      }

      // Variable declarations and assignments
      if (trimmed.match(/^(let|const|var)\s+\w+\s*=/)) {
        const varName = trimmed.match(/(?:let|const|var)\s+(\w+)/)[1];
        const value = trimmed
          .substring(trimmed.indexOf("=") + 1)
          .trim()
          .substring(0, 30);
        prevId = addNode(`${varName} = ${value}`, "process");
        addEdge(nodeStack[nodeStack.length - 1], prevId);
        continue;
      }

      // If statements
      if (trimmed.match(/^if\s*\(/)) {
        const condition = trimmed
          .substring(trimmed.indexOf("(") + 1, trimmed.lastIndexOf(")"))
          .substring(0, 40);
        const decisionId = addNode(`${condition}?`, "decision");
        addEdge(nodeStack[nodeStack.length - 1], decisionId);
        nodeStack.push(decisionId);
        prevId = decisionId;
        continue;
      }

      // Else statements
      if (trimmed === "else") {
        const decisionId = nodeStack[nodeStack.length - 1];
        prevId = addNode("Alternative path", "process");
        addEdge(decisionId, prevId, "No");
        continue;
      }

      // For loops
      if (trimmed.match(/^for\s*\(/)) {
        const loopMatch = trimmed.match(/for\s*\(\s*(\w+)\s*in\s+(\w+)\)/);
        const loopMatch2 = trimmed.match(
          /for\s*\(\s*let\s+(\w+)\s*=\s*(\d+);\s*(\w+)\s*<\s*(\d+)/,
        );

        let loopText = "Loop";
        if (loopMatch) loopText = `for ${loopMatch[1]} in ${loopMatch[2]}`;
        else if (loopMatch2)
          loopText = `for ${loopMatch2[1]}=${loopMatch2[2]}; ${loopMatch2[3]}<${loopMatch2[4]}`;

        const loopId = addNode(loopText, "decision");
        addEdge(nodeStack[nodeStack.length - 1], loopId);
        nodeStack.push(loopId);
        prevId = loopId;
        continue;
      }

      // While loops
      if (trimmed.match(/^while\s*\(/)) {
        const condition = trimmed
          .substring(trimmed.indexOf("(") + 1, trimmed.lastIndexOf(")"))
          .substring(0, 40);
        const loopId = addNode(`while(${condition})`, "decision");
        addEdge(nodeStack[nodeStack.length - 1], loopId);
        nodeStack.push(loopId);
        prevId = loopId;
        continue;
      }

      // Console.log and other function calls
      if (trimmed.match(/console\.(log|error|warn)|print\(|return\s+/)) {
        prevId = addNode(trimmed.substring(0, 45), "io");
        addEdge(nodeStack[nodeStack.length - 1], prevId);
        if (trimmed.startsWith("return")) {
          const endId = addNode("End", "end");
          addEdge(prevId, endId);
        }
        continue;
      }

      // Return statements
      if (trimmed.startsWith("return")) {
        const returnVal = trimmed.substring(6).trim().substring(0, 35);
        prevId = addNode(`return ${returnVal}`, "io");
        addEdge(nodeStack[nodeStack.length - 1], prevId);
        const endId = addNode("End", "end");
        addEdge(prevId, endId);
        continue;
      }

      // Regular statements
      if (trimmed && !trimmed.match(/^[{}]/)) {
        prevId = addNode(trimmed.substring(0, 45), "process");
        addEdge(nodeStack[nodeStack.length - 1], prevId);
      }
    }

    // Add final end node
    const endId = addNode("End", "end");
    addEdge(prevId, endId);

    return mermaidCode;
  } catch (err) {
    console.error("Flowchart generation error:", err);
    return 'flowchart TD\n    error["Error parsing code"]';
  }
};

const Flowchart = ({ code, source, onSourceChange }) => {
  const [mermaidContent, setMermaidContent] = useState("");
  const [zoom, setZoom] = useState(100);
  const [layout, setLayout] = useState("LR"); // "LR" for horizontal, "TD" for vertical
  const containerRef = React.useRef(null);

  useEffect(() => {
    if (code && code.trim()) {
      const flowchartCode = CodeToFlowchartParser(code, layout);
      setMermaidContent(flowchartCode);

      // Render flowchart with mermaid after content updates
      setTimeout(() => {
        try {
          mermaid.run();
        } catch (err) {
          console.error("Mermaid render error:", err);
        }
      }, 200);
    }
  }, [code, layout]);

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
      <div className="border-b border-white/10 bg-surface/30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div>
            <h2 className="text-lg font-headline font-bold tracking-widest uppercase text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">
                account_tree
              </span>
              Code Flowchart
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Real-time visualization of your code logic
            </p>
          </div>

          {/* Source Selector */}
          <div className="flex items-center gap-2 bg-surface-container rounded-lg p-1">
            <button
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
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
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
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

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className="p-2 rounded-lg bg-surface-container border border-white/10 text-white hover:bg-surface-container-high transition"
            title="Zoom Out"
          >
            <span className="material-symbols-outlined text-base">
              zoom_out
            </span>
          </button>
          <span className="px-4 py-2 bg-surface-container rounded-lg text-white text-sm font-semibold min-w-[60px] text-center">
            {zoom}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-2 rounded-lg bg-surface-container border border-white/10 text-white hover:bg-surface-container-high transition"
            title="Zoom In"
          >
            <span className="material-symbols-outlined text-base">zoom_in</span>
          </button>
          <button
            onClick={handleResetZoom}
            className="p-2 rounded-lg bg-surface-container border border-white/10 text-white hover:bg-surface-container-high transition"
            title="Reset Zoom"
          >
            <span className="material-symbols-outlined text-base">
              zoom_out_map
            </span>
          </button>
          <div className="w-px h-6 bg-white/10"></div>
          <button
            onClick={toggleLayout}
            className="p-2 rounded-lg bg-surface-container border border-white/10 text-white hover:bg-surface-container-high transition"
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
            <div
              key={`${layout}-${code.length}`}
              className="mermaid inline-block"
            >
              {mermaidContent}
            </div>
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
