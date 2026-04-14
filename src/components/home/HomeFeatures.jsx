import React from 'react';

const INSIGHT_IMG =
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCzQILNzkH3abmpKTxfKwTExx8LTL7kfg4dq7YKOCFZRva4ZsoC3kGG1P-YJRuCr45A7P0Zjlc5j9jiLpXyYPee9YeQMbX8psyjCavk8G22HZX2xHk8RvB11h-Nz4QV_cDsal408SuL-A3vSDmf5PcK5n6cShq-lZrzqLC0M-hxWDRht4Slfk2b4Kzbn1UZSmG-FTmUDjKujb6VIllGx5wIeESqsNQs9Vc2bls_hcciUV2fQF5iFEwKRxoXgcVyWfYBjtEdenS24R8';

export default function HomeFeatures() {
    return (
        <section id="features" className="max-w-7xl mx-auto px-6 py-24 scroll-mt-24">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-8 group relative overflow-hidden glass-card rounded-xl machined-stroke p-12 flex flex-col justify-between min-h-[360px]">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                        <span className="material-symbols-outlined text-9xl text-primary">bolt</span>
                    </div>
                    <div className="relative z-10 max-w-lg">
                        <div className="w-12 h-12 bg-primary/10 rounded flex items-center justify-center mb-8 border border-primary/20">
                            <span className="material-symbols-outlined text-primary">speed</span>
                        </div>
                        <h4 className="font-headline text-3xl font-bold tracking-tight text-slate-100 mb-4">Zero-Latency Mirroring</h4>
                        <p className="font-body text-on-surface-variant text-lg leading-relaxed">
                            Instant code sync across all terminals with sub-10ms intervals. Teach at the speed of thought without interruption.
                        </p>
                    </div>
                </div>

                <div className="md:col-span-4 group relative glass-card rounded-xl machined-stroke p-8 flex flex-col items-start justify-end min-h-[360px] overflow-hidden">
                    <div className="w-full h-full absolute inset-0 opacity-20 z-0">
                        <img
                            className="w-full h-full object-cover grayscale brightness-50"
                            alt="digital data visualization heatmap"
                            src={INSIGHT_IMG}
                        />
                    </div>
                    <div className="relative z-10">
                        <span className="material-symbols-outlined text-primary mb-4 text-4xl">insights</span>
                        <h4 className="font-headline text-xl font-bold text-slate-100 mb-2">Live Insight Engine</h4>
                        <p className="font-body text-sm text-on-surface-variant">
                            Real-time student performance analytics and heatmap visualization. Identify stuck learners instantly.
                        </p>
                    </div>
                </div>

                <div className="md:col-span-12 group relative overflow-hidden glass-card rounded-xl machined-stroke p-12 flex flex-col md:flex-row items-center gap-12">
                    <div className="flex-1 space-y-6">
                        <div className="flex items-center space-x-3">
                            <div className="h-px w-8 bg-primary" />
                            <span className="text-[0.6875rem] font-label uppercase tracking-[0.2em] text-primary">Isolation standard</span>
                        </div>
                        <h4 className="font-headline text-4xl font-bold tracking-tight text-slate-100">Polyglot Sandbox</h4>
                        <p className="font-body text-lg text-on-surface-variant max-w-xl">
                            20+ languages pre-configured in isolated container architectures. No local setup required, ever. Scalable and secure.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            {['Rust', 'Go', 'Python', 'Haskell'].map((lang) => (
                                <span
                                    key={lang}
                                    className="px-3 py-1 bg-surface-container-low border border-outline-variant/20 rounded-sm font-mono text-xs text-slate-400"
                                >
                                    {lang}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className="flex-1 relative w-full">
                        <div className="aspect-video bg-surface-container-lowest rounded-lg machined-stroke overflow-hidden relative shadow-2xl">
                            <div className="p-6 font-mono text-sm text-primary/80">
                                <div className="animate-pulse">
                                    container.spawn(<span className="text-white">&quot;rust-node-v1&quot;</span>)
                                </div>
                                <div className="ml-4 opacity-70">sync.init()</div>
                                <div className="ml-4 text-emerald-500 opacity-90">✓ Isolated environment ready.</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="md:col-span-6 group relative overflow-hidden glass-card rounded-xl machined-stroke p-10 flex flex-col justify-between min-h-[320px]">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                        <span className="material-symbols-outlined text-8xl text-primary">bug_report</span>
                    </div>
                    <div className="relative z-10">
                        <span className="material-symbols-outlined text-primary mb-4 text-4xl">terminal</span>
                        <h4 className="font-headline text-2xl font-bold text-slate-100 mb-4">Interactive Debugging</h4>
                        <p className="font-body text-on-surface-variant text-base leading-relaxed">
                            Jointly step through breakpoints and call stacks in a shared environment. Collaborative troubleshooting made simple.
                        </p>
                    </div>
                </div>

                <div className="md:col-span-6 group relative overflow-hidden glass-card rounded-xl machined-stroke p-10 flex flex-col justify-between min-h-[320px]">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                        <span className="material-symbols-outlined text-8xl text-primary">history</span>
                    </div>
                    <div className="relative z-10">
                        <span className="material-symbols-outlined text-primary mb-4 text-4xl">database</span>
                        <h4 className="font-headline text-2xl font-bold text-slate-100 mb-4">Session Persistence</h4>
                        <p className="font-body text-on-surface-variant text-base leading-relaxed">
                            Never lose a state. Deep snapshots of the entire terminal environment allow you to resume exactly where you left off.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
