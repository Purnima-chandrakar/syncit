import React from 'react';

export default function HomeSessionForm({
    roomId,
    username,
    onRoomIdChange,
    onUsernameChange,
    onSubmit,
    onCreateRoom,
    onKeyUp,
}) {
    return (
        <div id="join" className="relative z-10 w-full max-w-md glass-card rounded-xl p-8 machined-stroke scroll-mt-28">
            <div className="mb-6">
                <h3 className="font-headline text-xl font-bold tracking-tight text-slate-100 mb-1">Join the Session</h3>
                <p className="font-body text-sm text-on-surface-variant">Enter your access code to synchronize with the lecture.</p>
            </div>
            <form
                className="space-y-4"
                onSubmit={(e) => {
                    e.preventDefault();
                    onSubmit();
                }}
            >
                <div>
                    <label className="block text-[0.6875rem] uppercase tracking-widest text-outline mb-2 font-label" htmlFor="room-id">
                        Session ID
                    </label>
                    <input
                        id="room-id"
                        className="w-full bg-surface-container-lowest border-0 border-b border-outline-variant/30 text-on-surface focus:ring-0 focus:border-primary transition-all py-3 font-mono rounded-none"
                        placeholder="SYNC-442-901"
                        type="text"
                        value={roomId}
                        onChange={(e) => onRoomIdChange(e.target.value)}
                        onKeyUp={onKeyUp}
                    />
                </div>
                <div>
                    <label className="block text-[0.6875rem] uppercase tracking-widest text-outline mb-2 font-label" htmlFor="username">
                        Your Name
                    </label>
                    <input
                        id="username"
                        className="w-full bg-surface-container-lowest border-0 border-b border-outline-variant/30 text-on-surface focus:ring-0 focus:border-primary transition-all py-3 rounded-none"
                        placeholder="Alex Chen"
                        type="text"
                        value={username}
                        onChange={(e) => onUsernameChange(e.target.value)}
                        onKeyUp={onKeyUp}
                    />
                </div>
                <button
                    className="w-full mt-4 bg-primary text-on-primary py-4 font-headline font-bold uppercase tracking-widest text-sm hover:brightness-110 transition-all active:scale-[0.98] relative overflow-hidden group"
                    type="submit"
                >
                    <span className="relative z-10">Initialize Sync</span>
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden />
                </button>
            </form>
            <p className="mt-4 text-center text-on-surface-variant text-sm">
                No room ID?{' '}
                <button
                    type="button"
                    className="text-primary hover:text-primary-fixed font-semibold underline decoration-primary/30 underline-offset-4 transition-colors"
                    onClick={onCreateRoom}
                >
                    Create new room
                </button>
            </p>
        </div>
    );
}
