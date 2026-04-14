import React from 'react';

export default function HomeNav({ onSignIn, onSignUp }) {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-3 px-4 pointer-events-none">
            <nav className="pointer-events-auto flex w-full max-w-md items-center justify-between gap-4 rounded-full border border-slate-800/50 bg-slate-950/75 py-2 pl-4 pr-2 backdrop-blur-xl shadow-lg shadow-black/20">
                <div className="text-lg font-bold tracking-tighter text-slate-100 font-headline">SyncIt</div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        className="text-slate-400 hover:text-slate-100 transition-colors font-headline tracking-tight text-xs uppercase px-2 py-1.5"
                        onClick={onSignIn}
                    >
                        Sign In
                    </button>
                    <button
                        type="button"
                        className="bg-primary text-on-primary px-3.5 py-1.5 text-sm font-headline font-bold tracking-tight rounded-full hover:scale-[0.98] transition-transform duration-200"
                        onClick={onSignUp}
                    >
                        Sign Up
                    </button>
                </div>
            </nav>
        </header>
    );
}
