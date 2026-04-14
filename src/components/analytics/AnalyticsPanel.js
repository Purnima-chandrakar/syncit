import React from 'react';

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

const AnalyticsPanel = ({ clients, adminId, progressMap }) => {
  const sortedClients = [...clients].sort((a, b) => {
    const aIsAdmin = a.socketId === adminId ? -1 : 0;
    const bIsAdmin = b.socketId === adminId ? -1 : 0;
    if (aIsAdmin !== bIsAdmin) return aIsAdmin - bIsAdmin;
    return (a.username || "").localeCompare(b.username || "");
  });

  // Calculate aggregates
  let activeCount = 0;
  let stuckCount = 0;
  let errorCount = 0;
  let avgProgress = 0;
  let validProgressCount = 0;

  sortedClients.forEach(c => {
    if (c.socketId === adminId) return; // Optional: exclude admin from stats
    const info = progressMap?.[c.socketId] || {};
    if (info.status === 'active') activeCount++;
    if (info.status === 'stuck') stuckCount++;
    if (info.lastError && isErrorRecent(info.lastErrorTime)) errorCount++;
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

  return (
    <div className="p-8 overflow-auto custom-scrollbar flex-1 relative z-10 w-full h-full bg-[#070d1f]">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-headline font-bold tracking-widest uppercase text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">assessment</span>
          Live Class Analytics
        </h2>
      </div>

      {/* Aggregate Stats Dash */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        
        {/* Average Progress Chart (Circular) */}
        <div className="glass-card p-6 rounded-2xl flex items-center gap-6 relative overflow-hidden group border-t-2 border-t-primary/50">
          <div className="relative w-20 h-20 shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="30" stroke="rgba(255,255,255,0.05)" strokeWidth="6" fill="transparent" />
              <circle 
                cx="40" cy="40" r="30" 
                stroke="#5d5cff" strokeWidth="6" fill="transparent" 
                strokeDasharray={circumference} strokeDashoffset={avgOffset}
                className="transition-all duration-1000 ease-out" 
                strokeLinecap="round" 
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-lg">
              {avgProgress}%
            </div>
          </div>
          <div>
            <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Class Progress</h3>
            <p className="text-3xl text-white font-black">{avgProgress}%</p>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl flex flex-col justify-center border-t-2 border-t-green-500/50">
          <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">Active Students</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl text-white font-black">{activeCount}</span>
            <span className="text-xs font-bold text-green-400 flex items-center uppercase tracking-wider"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-1"></span> Live</span>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl flex flex-col justify-center border-t-2 border-t-orange-500/50">
          <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">Stuck Students</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl text-white font-black">{stuckCount}</span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Needs Help?</span>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl flex flex-col justify-center border-t-2 border-t-error/50">
          <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">Recent Errors</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl text-white font-black">{errorCount}</span>
            <span className="text-xs font-bold text-error uppercase tracking-wider">Issues triggered</span>
          </div>
        </div>

      </div>

      <h3 className="text-lg font-headline font-bold mb-6 tracking-widest uppercase text-white/80">Student Details</h3>
      
      <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6 pb-20">
        {sortedClients.map((client) => {
          const info = progressMap?.[client.socketId] || {};
          const status = info.status || "unknown";
          
          let statusColor = "bg-slate-500";
          if(status === 'active') statusColor = "bg-green-500 animate-[pulse_2s_ease-in-out_infinite]";
          else if(status === 'stuck') statusColor = "bg-orange-500";
          else if(status === 'error') statusColor = "bg-error";

          const hasError = info.lastError && info.lastErrorTime;
          const hasRecentError = hasError && isErrorRecent(info.lastErrorTime);
          const pVal = info.progress || 0;

          return (
            <div key={client.socketId} className="glass-card rounded-xl overflow-hidden border border-white/5 hover:border-primary/30 transition-colors flex flex-col bg-surface/50 relative group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full pointer-events-none group-hover:bg-primary/10 transition-colors"></div>
              
              <div className="p-6 flex items-start gap-4 z-10">
                <div className="w-12 h-12 rounded-xl bg-surface-container-high border-2 border-white/5 flex items-center justify-center font-bold text-white text-lg shrink-0 relative shadow-lg">
                  {client.username?.charAt(0).toUpperCase() || '?'}
                  <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-surface ${statusColor}`}></div>
                </div>
                
                <div className="flex-1 min-w-0 flex flex-col justify-center h-12">
                  <h3 className="font-semibold text-white truncate text-base flex items-center gap-2" title={client.username}>
                    {client.username} 
                    {client.socketId === adminId && <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-sm border border-primary/20 uppercase tracking-wider">Host</span>}
                  </h3>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider truncate mt-0.5">Last activity: <span className="text-slate-200">{formatAgo(info.lastActivity)}</span></p>
                </div>

                <div className="flex flex-col items-end justify-center h-12">
                   <div className="text-2xl font-black text-white leading-none">{pVal}%</div>
                   <div className="text-[9px] uppercase tracking-wider text-slate-400 mt-1">Progress</div>
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
                  <div className="mt-auto p-3 bg-error/10 border border-error/20 rounded-lg flex-1">
                    <div className="flex items-center gap-1.5 mb-1.5 text-error text-[10px] font-bold uppercase tracking-wider">
                      <span className="material-symbols-outlined text-[14px]">warning</span>
                      Recent Error
                    </div>
                    <p className="text-[11px] text-error/90 font-mono break-words line-clamp-2 md:line-clamp-3">{info.lastError}</p>
                  </div>
                ) : (
                  <div className="mt-auto flex-1 flex items-center justify-center border border-white/5 bg-white/[0.02] rounded-lg border-dashed min-h-[60px]">
                      <p className="text-[11px] text-slate-500 font-mono text-center">No recent errors detected.</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AnalyticsPanel;
