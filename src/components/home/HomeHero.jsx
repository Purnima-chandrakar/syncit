import React from 'react';

export default function HomeHero() {
    return (
        <>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-dim/5 blur-[120px] rounded-full z-0" aria-hidden />
            <div className="relative z-10 text-center max-w-4xl mx-auto mb-16">
                <span className="inline-block py-1 px-3 mb-6 border border-primary/20 bg-primary/5 text-primary text-[0.6875rem] uppercase tracking-[0.2em] font-label font-bold rounded-sm">
                    Engineering The Future of Pedagogy
                </span>
                <h2 className="font-headline text-5xl md:text-7xl font-bold tracking-[-0.04em] text-on-surface mb-8 leading-[1.1]">
                    Code in Sync, <br />
                    <span className="text-primary italic">Learn in Flow.</span>
                </h2>
            </div>
        </>
    );
}
