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
  let mermaidCode = `flowchart ${layout}\n`;

  // Track control flow structure
  const controlStack = [];
  const loopStack = [];
  const decisionStack = [];

  const addNode = (text, shape = "process") => {
    const id = `node${nodeId++}`;
    let formatted = text.replace(/"/g, "'").substring(0, 60);

    switch (shape) {
      case "start":
        mermaidCode += `    ${id}((START));\n`;
        break;
      case "end":
        mermaidCode += `    ${id}((END));\n`;
        break;
      case "decision":
        mermaidCode += `    ${id}{${formatted}};\n`;
        break;
      case "io":
        mermaidCode += `    ${id}[["${formatted}"]];\n`;
        break;
      case "process":
        mermaidCode += `    ${id}["${formatted}"];\n`;
        break;
      case "function":
        mermaidCode += `    ${id}["${formatted}"];\n`;
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

  // Extract condition from if/while/for statements
  const extractCondition = (statement) => {
    const match = statement.match(/\((.*?)\)/);
    if (match) {
      return match[1].trim();
    }
    return statement;
  };

  // Format condition for better readability
  const formatCondition = (condition) => {
    // Handle common comparison operators
    return condition
      .replace(/===/g, "==")
      .replace(/!==/g, "!=")
      .replace(/<=/g, "less than or equal to")
      .replace(/>=/g, "greater than or equal to")
      .replace(/</g, "less than")
      .replace(/>/g, "greater than")
      .replace(/==/g, "equal to")
      .replace(/!=/g, "not equal to")
      .replace(/&&/g, "and")
      .replace(/\|\|/g, "or");
  };

  try {
    const lines = code.split("\n").filter((line) => line.trim());
    let prevId = addNode("Start", "start");

    // Track the main flow
    let currentFlow = prevId;
    // let pendingEnds = []; // TODO: implement end tracking if needed

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("/*")) continue;

      // Function definitions
      if (trimmed.match(/^(async\s+)?function\s+\w+\s*\(/i)) {
        const name = trimmed.match(/function\s+(\w+)/i)?.[1] || "Function";
        const funcId = addNode(`Function: ${name}`, "function");
        addEdge(currentFlow, funcId);
        currentFlow = funcId;
        controlStack.push({ type: 'function', id: funcId });
        continue;
      }

      // Variable declarations and assignments
      if (trimmed.match(/^(let|const|var)\s+\w+\s*=/)) {
        const varMatch = trimmed.match(/(?:let|const|var)\s+(\w+)\s*=\s*(.+)$/);
        if (varMatch) {
          const varName = varMatch[1];
          const value = varMatch[2].substring(0, 30);
          const varId = addNode(`${varName} = ${value}`, "process");
          addEdge(currentFlow, varId);
          currentFlow = varId;
        }
        continue;
      }

      // If statements
      if (trimmed.match(/^if\s*\(/)) {
        const condition = extractCondition(trimmed);
        const formattedCondition = formatCondition(condition);
        const decisionId = addNode(formattedCondition, "decision");
        addEdge(currentFlow, decisionId);

        // Push decision context
        decisionStack.push({
          decisionId,
          yesBranch: null,
          noBranch: null,
          endMerge: null
        });

        currentFlow = decisionId;
        continue;
      }

      // Else statements
      if (trimmed === "else" || trimmed.startsWith("else ")) {
        if (decisionStack.length > 0) {
          const currentDecision = decisionStack[decisionStack.length - 1];

          // Create the "No" branch if not already created
          if (!currentDecision.noBranch) {
            const elseId = addNode("Else path", "process");
            addEdge(currentDecision.decisionId, elseId, "No");
            currentDecision.noBranch = elseId;
            currentFlow = elseId;
          }
        }
        continue;
      }

      // For loops
      if (trimmed.match(/^for\s*\(/)) {
        const condition = extractCondition(trimmed);
        const loopId = addNode(`Loop: ${condition}`, "decision");
        addEdge(currentFlow, loopId);

        // Push loop context
        loopStack.push({
          loopId,
          condition,
          iterationVar: null
        });

        currentFlow = loopId;
        continue;
      }

      // While loops
      if (trimmed.match(/^while\s*\(/)) {
        const condition = extractCondition(trimmed);
        const formattedCondition = formatCondition(condition);
        const loopId = addNode(`While: ${formattedCondition}`, "decision");
        addEdge(currentFlow, loopId);

        // Push loop context
        loopStack.push({
          loopId,
          condition,
          iterationVar: null
        });

        currentFlow = loopId;
        continue;
      }

      // Return statements
      if (trimmed.startsWith("return")) {
        const returnVal = trimmed.substring(6).trim().substring(0, 35);
        const returnId = addNode(`Return: ${returnVal}`, "io");
        addEdge(currentFlow, returnId);

        const endId = addNode("End", "end");
        addEdge(returnId, endId);
        currentFlow = endId;

        // Close any open control structures
        if (decisionStack.length > 0) {
          const currentDecision = decisionStack.pop();
          if (currentDecision.yesBranch && !currentDecision.noBranch) {
            // Add "No" branch to end
            addEdge(currentDecision.decisionId, currentFlow, "No");
          }
        }
        continue;
      }

      // Console.log and output statements
      if (trimmed.match(/console\.(log|error|warn)|print\(|alert\(/)) {
        const outputText = trimmed.substring(0, 45);
        const outputId = addNode(outputText, "io");
        addEdge(currentFlow, outputId);
        currentFlow = outputId;
        continue;
      }

      // Regular statements
      if (trimmed && !trimmed.match(/^[{}]/)) {
        const statementId = addNode(trimmed.substring(0, 45), "process");

        // If we're in a decision context, this is likely the "Yes" branch
        if (decisionStack.length > 0) {
          const currentDecision = decisionStack[decisionStack.length - 1];
          if (!currentDecision.yesBranch) {
            addEdge(currentDecision.decisionId, statementId, "Yes");
            currentDecision.yesBranch = statementId;
          } else {
            addEdge(currentFlow, statementId);
          }
        } else {
          addEdge(currentFlow, statementId);
        }

        currentFlow = statementId;
      }

      // Handle closing braces
      if (trimmed === "}") {
        // Close decision contexts
        if (decisionStack.length > 0) {
          const currentDecision = decisionStack[decisionStack.length - 1];
          if (currentDecision.yesBranch && currentDecision.noBranch) {
            // Create merge point
            const mergeId = addNode("Continue", "process");
            addEdge(currentDecision.yesBranch, mergeId);
            addEdge(currentDecision.noBranch, mergeId);
            currentFlow = mergeId;
            decisionStack.pop();
          }
        }

        // Close loop contexts
        if (loopStack.length > 0) {
          const currentLoop = loopStack[loopStack.length - 1];
          // Loop back to condition
          addEdge(currentFlow, currentLoop.loopId);
          loopStack.pop();
        }
      }
    }

    // Add final end node if not already added
    if (!currentFlow.includes("node") || currentFlow === prevId) {
      const endId = addNode("End", "end");
      addEdge(currentFlow, endId);
    }

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
      <div className="border-b border-white/10 bg-surface/30 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg">
              account_tree
            </span>
            <h2 className="text-base font-headline font-bold tracking-widest uppercase text-white">
              Code Flowchart
            </h2>
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
