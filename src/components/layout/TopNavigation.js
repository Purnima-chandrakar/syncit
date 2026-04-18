import React from 'react';
import { Link } from 'react-router-dom';

const TopNavigation = ({
  isHost,
  editingBlocked,
  handleBlockEditing,
  copyRoomId,
  username,
  leaveRoom,
  handleSaveFile,
  handleOpenFile,
  activeTab
}) => {
  return (
    <header className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 flex justify-between items-center px-8 h-12 max-w-[1920px] mx-auto">
      <div className="flex items-center gap-12">
        <div className="text-2xl font-black tracking-[-0.04em] text-indigo-400 font-headline">SyncIt</div>
        <nav className="hidden md:flex gap-8">
          <Link 
            to="/editor/:roomId" 
            className="font-headline tracking-[-0.04em] uppercase text-xs font-bold text-indigo-400 border-b-2 border-indigo-500 pb-1"
          >
            Classroom
          </Link>
          <Link 
            to="/curriculum" 
            className="font-headline tracking-[-0.04em] uppercase text-xs font-bold text-slate-400 hover:text-slate-100 transition-colors"
          >
            Curriculum
          </Link>
          <Link 
            to="/students" 
            className="font-headline tracking-[-0.04em] uppercase text-xs font-bold text-slate-400 hover:text-slate-100 transition-colors"
          >
            Students
          </Link>
          <Link 
            to="/resources" 
            className="font-headline tracking-[-0.04em] uppercase text-xs font-bold text-slate-400 hover:text-slate-100 transition-colors"
          >
            Resources
          </Link>
        </nav>
      </div>
      <div className="flex items-center gap-6 z-50 relative">
        <div className="flex gap-4">
          <span
            className="material-symbols-outlined text-on-surface-variant hover:bg-white/5 p-2 rounded-lg cursor-pointer transition-all"
            onClick={handleSaveFile}
            title="Save File"
          >
            save
          </span>
          <div className="relative">
            <label
              htmlFor="file-upload-nav"
              className="material-symbols-outlined text-on-surface-variant hover:bg-white/5 p-2 rounded-lg cursor-pointer transition-all"
              title="Open File"
            >
              file_upload
            </label>
            <input
              id="file-upload-nav"
              type="file"
              className="hidden"
              onChange={handleOpenFile}
            />
          </div>
          <span className="material-symbols-outlined text-on-surface-variant hover:bg-white/5 p-2 rounded-lg cursor-pointer transition-all" onClick={copyRoomId} title="Copy Room ID">tag</span>
        </div>
        {isHost && (
          <button 
            className="bg-primary text-on-primary px-4 py-1.5 font-headline text-xs font-bold uppercase tracking-widest rounded-sm hover:brightness-110 transition-all active:scale-95"
            onClick={handleBlockEditing}
          >
            {editingBlocked ? 'Unblock Editing' : 'Block Editing'}
          </button>
        )}
        <button 
          className="bg-primary text-on-primary px-4 py-1.5 font-headline text-xs font-bold uppercase tracking-widest rounded-sm hover:brightness-110 transition-all active:scale-95"
          onClick={copyRoomId}
        >
          Copy Room ID
        </button>
        <div 
          className="h-8 w-8 rounded-full overflow-hidden border border-outline-variant/30 bg-surface-container-high flex items-center justify-center font-bold text-xs relative group cursor-pointer"
          title="Leave Room"
          onClick={leaveRoom}
        >
          <span className="uppercase">{username?.charAt(0) || '?'}</span>
          <div className="absolute inset-0 bg-error/90 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white material-symbols-outlined text-sm">
            logout
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopNavigation;
