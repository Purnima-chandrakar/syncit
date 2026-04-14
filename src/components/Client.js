import React, { useState } from 'react';
import Avatar from 'react-avatar';

const Client = ({ username, isAdminView, canEdit, isSelf, onTogglePermission, onRaiseHand, handRaised, isAdminUser, isActiveEditor, onRemoveUser }) => {
    const [showConfirmRemove, setShowConfirmRemove] = useState(false);
    const [showAdminMenu, setShowAdminMenu] = useState(false);
    const displayName = username || 'Unknown user';

    const handleRemoveConfirm = () => {
        setShowConfirmRemove(false);
        setShowAdminMenu(false);
        if (onRemoveUser) onRemoveUser();
    };

    const handleTogglePermission = () => {
        setShowAdminMenu(false);
        if (onTogglePermission) onTogglePermission();
    };

    return (
        <div 
            className={`flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-colors group relative ${!canEdit ? 'opacity-60' : ''} ${isActiveEditor ? 'bg-primary-dim/10' : ''}`}
            onClick={(e) => {
                if (isAdminView && !isSelf && (onTogglePermission || onRemoveUser) && !isAdminUser) {
                    e.stopPropagation(); setShowAdminMenu(!showAdminMenu);
                }
            }}
            style={{cursor: (isAdminView && !isSelf && !isAdminUser) ? 'pointer' : 'default'}}
        >
            <div className="flex items-center gap-3 overflow-hidden">
                <div className="relative shrink-0">
                    <Avatar name={username} size={32} round={"8px"} className="pointer-events-none" />
                    {isActiveEditor ? (
                        <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-indigo-400 border-[1.5px] border-surface-container-low rounded-full animate-pulse"></span>
                    ) : canEdit ? (
                        <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 border-[1.5px] border-surface-container-low rounded-full"></span>
                    ) : (
                        <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-slate-600 border-[1.5px] border-surface-container-low rounded-full"></span>
                    )}
                </div>
                <div className="flex flex-col min-w-0">
                    <span className="text-xs font-medium text-on-surface overflow-hidden text-ellipsis whitespace-nowrap group-hover:text-primary transition-colors flex items-center gap-1">
                        {displayName} {isSelf && '(you)'}
                        {handRaised && <span title="Hand Raised" className="text-sm">✋</span>}
                    </span>
                    {isAdminUser && <span className="text-[9px] uppercase tracking-widest text-primary font-bold">Admin</span>}
                </div>
            </div>

            {/* Action / Status Icons */}
            <div className="flex items-center gap-2 shrink-0">
                {!isAdminUser && isSelf && (
                    <button
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded transition-all ${handRaised ? 'bg-primary/20 text-primary' : 'text-slate-400 hover:bg-white/5'}`}
                        onClick={(e) => { e.stopPropagation(); onRaiseHand && onRaiseHand(!handRaised); }}
                        title={handRaised ? 'Lower hand' : 'Raise hand'}
                    >
                        ✋
                    </button>
                )}
                {isActiveEditor ? (
                    <span className="material-symbols-outlined text-indigo-400 text-sm">edit</span>
                ) : canEdit ? (
                    <span className="material-symbols-outlined text-on-surface-variant group-hover:text-white transition-colors text-sm">terminal</span>
                ) : (
                    <span className="material-symbols-outlined text-on-surface-variant text-sm opacity-50">schedule</span>
                )}
            </div>

            {/* Admin Popup Menu */}
            {showAdminMenu && isAdminView && !isSelf && !isAdminUser && (
                <div 
                    className="absolute top-full right-0 mt-1 bg-surface border border-outline-variant/30 rounded-lg py-1 z-50 shadow-2xl min-w-[140px]" 
                    onClick={e => e.stopPropagation()}
                >
                    {onTogglePermission && (
                        <button
                            className="w-full text-left px-3 py-2 text-xs text-on-surface hover:bg-white/5 transition-colors"
                            onClick={(e) => { e.stopPropagation(); handleTogglePermission(); }}
                        >
                            {canEdit ? '🚫 Block editing' : '✓ Allow editing'}
                        </button>
                    )}
                    {onRemoveUser && (
                        <button
                            className="w-full text-left px-3 py-2 text-xs text-error hover:bg-error/10 transition-colors"
                            onClick={(e) => { e.stopPropagation(); setShowAdminMenu(false); setShowConfirmRemove(true); }}
                        >
                            ✕ Remove user
                        </button>
                    )}
                </div>
            )}

            {/* Remove Confirmation Modal */}
            {showConfirmRemove && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999]" onClick={(e) => { e.stopPropagation(); setShowConfirmRemove(false); }}>
                    <div className="bg-surface border border-outline-variant/30 rounded-xl p-6 min-w-[300px] shadow-2xl glass-card" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-headline font-bold text-on-surface mb-2">Remove user?</h3>
                        <p className="text-sm text-on-surface-variant mb-6">Are you sure you want to remove <strong className="text-on-surface">{username}</strong> from the room?</p>
                        <div className="flex gap-3 justify-end">
                            <button
                                className="bg-primary text-on-primary px-4 py-2 font-headline text-xs font-bold uppercase tracking-widest rounded-sm hover:brightness-110 transition-all active:scale-95"
                                onClick={() => setShowConfirmRemove(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="bg-primary text-on-primary px-4 py-2 font-headline text-xs font-bold uppercase tracking-widest rounded-sm hover:brightness-110 transition-all active:scale-95"
                                onClick={(e) => { e.stopPropagation(); handleRemoveConfirm(); }}
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Client;
