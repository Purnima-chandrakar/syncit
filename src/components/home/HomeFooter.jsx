import React from 'react';

export default function HomeFooter() {
    const year = new Date().getFullYear();
    return (
        <footer className="home-footer relative w-full py-12">
            <div className="flex flex-col md:flex-row justify-between items-center px-8 max-w-7xl mx-auto space-y-8 md:space-y-0 gap-6">
                <div className="text-xl font-bold tracking-tighter text-slate-100 font-headline">SyncIt</div>
                <div className="flex flex-wrap justify-center gap-8 font-body text-sm uppercase tracking-widest font-bold">
                    <button className="text-slate-500 hover:text-indigo-300 transition-colors" onClick={() => {}}>
                        Privacy Policy
                    </button>
                    <button className="text-slate-500 hover:text-indigo-300 transition-colors" onClick={() => {}}>
                        Terms of Service
                    </button>
                    <button className="text-slate-500 hover:text-indigo-300 transition-colors" onClick={() => {}}>
                        Contact
                    </button>
                    <button className="text-slate-500 hover:text-indigo-300 transition-colors" onClick={() => {}}>
                        Twitter
                    </button>
                    <button className="text-slate-500 hover:text-indigo-300 transition-colors" onClick={() => {}}>
                        Github
                    </button>
                </div>
                <div className="text-center md:text-right space-y-2">
                    <div className="text-slate-500 font-body text-[0.6875rem] uppercase tracking-widest">
                        © {year} SyncIt Editorial. All rights reserved.
                    </div>
                    <p className="text-sm font-headline font-bold text-primary">Made by Purnima and Anshu</p>
                </div>
            </div>
        </footer>
    );
}
