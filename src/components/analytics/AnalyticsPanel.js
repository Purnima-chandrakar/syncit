import React, { useState, useEffect } from "react";

const formatAgo = (timestamp) => {
  if (!timestamp) return "No activity yet";
  const diff = Math.max(0, Date.now() - timestamp);
  if (diff < 90 * 1000) return `${Math.floor(diff / 1000)}s ago`;
  const mins = Math.round(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  return `${hrs}h ago`;
};

const isErrorRecent = (lastErrorTime) => {
  if (!lastErrorTime) return false;
  const ERROR_VISIBLE_MS = 5 * 60 * 1000;
  return Date.now() - lastErrorTime < ERROR_VISIBLE_MS;
};

const AnalyticsPanel = ({ clients, adminId, progressMap, socket }) => {
  const [expandedErrorId, setExpandedErrorId] = useState(null);

  // Auto-detect stuck students (no activity for 1 minute) and auto-increment stuck counter
  const [autoStuckCount, setAutoStuckCount] = useState(0);
  const sortedClients = [...clients].sort((a, b) => {
    const aIsAdmin = a.socketId === adminId ? -1 : 0;
    const bIsAdmin = b.socketId === adminId ? -1 : 0;
    if (aIsAdmin !== bIsAdmin) return aIsAdmin - bIsAdmin;
    return (a.username || "").localeCompare(b.username || "");
  });

  const studentClients = sortedClients.filter((c) => c.socketId !== adminId);
  const noStudentClients = studentClients.length === 0;

  const expandedClient = expandedErrorId
    ? studentClients.find((c) => c.socketId === expandedErrorId)
    : null;
  const expandedInfo = expandedClient
    ? progressMap?.[expandedClient.socketId] || {}
    : {};

  // Auto-detect stuck students and update their status
  useEffect(() => {
    if (!socket || !adminId) return;

    const checkInterval = setInterval(() => {
      const now = Date.now();
      let updatedCount = 0;

      studentClients.forEach((client) => {
        if (client.socketId === adminId) return; // skip admin

        const info = progressMap?.[client.socketId] || {};
        const lastActivity = info.lastActivity || now;
        const timeSinceActivity = now - lastActivity;

        // Auto-detect stuck: no activity for 60 seconds AND not already marked as stuck
        if (timeSinceActivity > 60000 && info.status !== "stuck") {
          // Auto-increment stuck counter
          setAutoStuckCount((prev) => prev + 1);

          // Emit to server to update student status
          socket.emit("UPDATE_STUDENT_STATUS", {
            roomId: socket.roomId || "",
            studentSocketId: client.socketId,
            status: "stuck",
            stuckCount: (info.stuckCount || 0) + 1,
            reason: "No activity detected for 1+ minute",
          });

          updatedCount++;
        }
        // Auto-remove stuck status if student becomes active again
        else if (
          timeSinceActivity < 30000 &&
          info.status === "stuck" &&
          info.stuckCount > 0
        ) {
          socket.emit("UPDATE_STUDENT_STATUS", {
            roomId: socket.roomId || "",
            studentSocketId: client.socketId,
            status: "active",
            stuckCount: Math.max(0, (info.stuckCount || 0) - 1),
            reason: "Student resumed activity",
          });

          updatedCount++;
        }
      });

      if (updatedCount > 0) {
        console.log(`Auto-updated ${updatedCount} student statuses`);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(checkInterval);
  }, [socket, adminId, studentClients.length]);

  // Calculate aggregates
  let stuckCount = 0;
  let errorCount = 0;
  let idleCount = 0;
  let avgProgress = 0;
  let validProgressCount = 0;
  const totalStudents = studentClients.length;

  sortedClients.forEach((c) => {
    if (c.socketId === adminId) return; // exclude admin from student analytics
    const info = progressMap?.[c.socketId] || {};
    const hasRecentError = info.lastError && isErrorRecent(info.lastErrorTime);

    const status = info.status || "idle";
    if (status === "active") {
      // active students - do nothing (not displayed)
    } else if (status === "stuck") stuckCount++;
    else if (status === "error" || hasRecentError) errorCount++;
    else if (status === "idle" || !info.status) idleCount++;

    if (info.progress !== undefined) {
      avgProgress += info.progress;
      validProgressCount++;
    }
  });

  if (validProgressCount > 0) {
    avgProgress = Math.round(avgProgress / validProgressCount);
  }

  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const avgOffset = circumference - (avgProgress / 100) * circumference;

  if (noStudentClients) {
    return (
      <div className="p-8 flex-1 flex items-center justify-center bg-[#070d1f] text-white">
        <div className="max-w-2xl text-center rounded-3xl border border-white/10 bg-surface/80 p-10">
          <h2 className="text-2xl font-semibold mb-4">
            No student analytics available yet
          </h2>
          <p className="text-sm text-slate-300">
            Analytics will appear once students join the room and activity is
            recorded.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 overflow-auto custom-scrollbar flex-1 relative z-10 w-full h-full bg-[#070d1f]">
      <div className="mb-4 p-4 bg-slate-900/50 border border-slate-600/30 rounded-lg text-slate-300 text-xs">
        <p className="mb-2">
          <strong>Status Guide:</strong>{" "}
          <span className="text-green-400">Active</span> (typing in last 30s) |{" "}
          <span className="text-orange-400">Stuck</span> (no activity 1+ min) |{" "}
          <span className="text-slate-400">Idle</span> (minimal activity)
        </p>
      </div>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-headline font-bold tracking-widest uppercase text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">
            assessment
          </span>
          Live Class Analytics
        </h2>
      </div>

      {/* Aggregate Stats Dash */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {/* Average Progress Chart (Circular) */}
        <div className="glass-card p-6 rounded-2xl flex items-center gap-6 relative overflow-hidden group border-t-2 border-t-primary/50">
          <div className="relative w-20 h-20 shrink-0">
            <svg
              className="w-full h-full transform -rotate-90"
              viewBox="0 0 80 80"
            >
              <circle
                cx="40"
                cy="40"
                r="30"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="6"
                fill="transparent"
              />
              <circle
                cx="40"
                cy="40"
                r="30"
                stroke="#5d5cff"
                strokeWidth="6"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={avgOffset}
                className="transition-all duration-1000 ease-out"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-lg">
              {avgProgress}%
            </div>
          </div>
          <div>
            <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">
              Class Progress
            </h3>
            <p className="text-3xl text-white font-black">{avgProgress}%</p>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl flex flex-col justify-center border-t-2 border-t-orange-500/50">
          <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">
            Stuck Students
          </h3>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl text-white font-black">{stuckCount}</span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Needs Help?
            </span>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl flex flex-col justify-center border-t-2 border-t-error/50">
          <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">
            Recent Errors
          </h3>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl text-white font-black">{errorCount}</span>
            <span className="text-xs font-bold text-error uppercase tracking-wider">
              Issues triggered
            </span>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl flex flex-col justify-center border-t-2 border-t-slate-500/50">
          <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">
            Idle Students
          </h3>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl text-white font-black">{idleCount}</span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              No activity
            </span>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl flex flex-col justify-center border-t-2 border-t-white/20">
          <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">
            Total Students
          </h3>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl text-white font-black">
              {totalStudents}
            </span>
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Connected
            </span>
          </div>
        </div>
      </div>

      <h3 className="text-lg font-headline font-bold mb-6 tracking-widest uppercase text-white/80">
        Student Details
      </h3>

      <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6 pb-20">
        {studentClients.map((client) => {
          const info = progressMap?.[client.socketId] || {};
          const status = info.status || "idle";

          let statusColor = "bg-slate-400";
          let statusLabel = "Inactive";
          if (status === "active") {
            statusColor =
              "bg-green-500 animate-[pulse_2s_ease-in-out_infinite]";
            statusLabel = "Active";
          } else if (status === "stuck") {
            statusColor = "bg-orange-500";
            statusLabel = "Stuck";
          } else if (status === "error") {
            statusColor = "bg-error";
            statusLabel = "Error";
          }

          const hasError = info.lastError && info.lastErrorTime;
          const hasRecentError = hasError && isErrorRecent(info.lastErrorTime);
          const pVal = info.progress || 0;

          return (
            <div
              key={client.socketId}
              className="glass-card rounded-xl overflow-hidden border border-white/5 hover:border-primary/30 transition-colors flex flex-col bg-surface/50 relative group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full pointer-events-none group-hover:bg-primary/10 transition-colors"></div>

              <div className="p-6 flex items-start gap-4 z-10">
                <div className="w-12 h-12 rounded-xl bg-surface-container-high border-2 border-white/5 flex items-center justify-center font-bold text-white text-lg shrink-0 relative shadow-lg">
                  {client.username?.charAt(0).toUpperCase() || "?"}
                  <div
                    className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-surface ${statusColor}`}
                  ></div>
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-center h-12">
                  <h3
                    className="font-semibold text-white truncate text-base flex items-center gap-2"
                    title={client.username}
                  >
                    {client.username}
                    {client.socketId === adminId && (
                      <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-sm border border-primary/20 uppercase tracking-wider">
                        Host
                      </span>
                    )}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                      Status:{" "}
                      <span
                        className={`font-semibold ${statusLabel === "Active" ? "text-green-400" : statusLabel === "Stuck" ? "text-orange-400" : statusLabel === "Error" ? "text-error" : "text-slate-300"}`}
                      >
                        {statusLabel}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end justify-center h-12">
                  <div className="text-2xl font-black text-white leading-none">
                    {pVal}%
                  </div>
                  <div className="text-[9px] uppercase tracking-wider text-slate-400 mt-1">
                    Progress
                  </div>
                </div>
              </div>

              <div className="px-6 pb-6 flex-1 flex flex-col z-10">
                {/* Progress line */}
                <div className="w-full bg-surface-container-highest rounded-full h-1.5 mb-4 relative overflow-hidden">
                  <div
                    className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${pVal}%` }}
                  ></div>
                </div>

                {hasRecentError ? (
                  <button
                    type="button"
                    onClick={() => setExpandedErrorId(client.socketId)}
                    className="mt-auto text-left w-full p-3 bg-error/10 border border-error/20 rounded-lg flex-1 transition hover:bg-error/15 hover:border-error/40 cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 mb-1.5 text-error text-[10px] font-bold uppercase tracking-wider">
                      <span className="material-symbols-outlined text-[14px]">
                        warning
                      </span>
                      Recent Error
                      <span className="ml-auto text-[10px] text-slate-300">
                        Click to view
                      </span>
                    </div>
                    <p className="text-[11px] text-error/90 font-mono break-words line-clamp-2">
                      {info.lastError}
                    </p>
                  </button>
                ) : (
                  <div className="mt-auto flex-1 flex items-center justify-center border border-white/5 bg-white/[0.02] rounded-lg border-dashed min-h-[60px]">
                    <p className="text-[11px] text-slate-500 font-mono text-center">
                      No recent errors detected.
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Expanded Error Modal */}
      {expandedErrorId && expandedClient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl shadow-2xl border border-error/30 max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-error/10 border-b border-error/20 px-8 py-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  {expandedClient.username}'s Error
                </h2>
                <p className="text-sm text-slate-400">
                  Full error details and stack trace
                </p>
              </div>
              <button
                onClick={() => setExpandedErrorId(null)}
                className="material-symbols-outlined text-white text-2xl cursor-pointer hover:text-error transition"
              >
                close
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-auto p-8">
              <div className="rounded-xl border border-error/20 bg-error/5 p-6 mb-6">
                <div className="flex items-start gap-3 mb-4">
                  <span className="material-symbols-outlined text-error text-2xl shrink-0">
                    warning
                  </span>
                  <div className="flex-1">
                    <p className="text-xs font-bold uppercase tracking-widest text-error mb-3">
                      Error Message
                    </p>
                    <p className="text-sm text-white font-mono whitespace-pre-wrap break-words leading-relaxed">
                      {expandedInfo.lastError}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 text-sm text-slate-300">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                    Metadata
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-[11px]">
                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <p className="text-slate-400 mb-1">Error Type</p>
                      <p className="text-white font-semibold">
                        {expandedInfo.status === "error"
                          ? "Runtime Error"
                          : "Compilation Error"}
                      </p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <p className="text-slate-400 mb-1">Time Recorded</p>
                      <p className="text-white font-semibold">
                        {formatAgo(expandedInfo.lastErrorTime)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-white/10 px-8 py-4 flex gap-3 justify-end">
              <button
                onClick={() => setExpandedErrorId(null)}
                className="px-6 py-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition text-sm font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPanel;
