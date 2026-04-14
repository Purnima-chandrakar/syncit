import React from 'react';

export default function HomeBackground({ children }) {
    return (
        <div className="selection:bg-primary/30 animate-home-bg-slow text-on-surface font-body antialiased relative min-h-screen overflow-x-hidden bg-[#020617]">
            <div className="fixed inset-0 dotted-pattern opacity-40 z-[-2]" aria-hidden />
            <div className="fixed inset-0 grain-texture z-[-1]" aria-hidden />
            <div className="fixed inset-0 flex items-center justify-center overflow-hidden z-[-1] pointer-events-none" aria-hidden>
                <h1 className="text-watermark text-[40vw] font-headline">SYNCIT</h1>
            </div>
            {children}
        </div>
    );
}
