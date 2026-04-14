import React from 'react';

export default function HomeLoader({ fadeOut }) {
    return (
        <div
            className={`fixed inset-0 z-[100] flex items-center justify-center bg-[#020617] transition-[opacity] duration-[1100ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${
                fadeOut ? 'pointer-events-none opacity-0' : 'opacity-100'
            }`}
            aria-hidden={fadeOut}
        >
            <div
                className="loader-logo-zoom font-headline font-bold text-on-surface-variant will-change-transform"
                style={{
                    fontSize: '35vw',
                    lineHeight: 1,
                    letterSpacing: '-0.07em',
                    textTransform: 'uppercase',
                }}
            >
                SyncIt
            </div>
        </div>
    );
}
