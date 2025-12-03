import React, { useEffect, useState, useRef } from 'react';
import ACTIONS from '../Actions';

const LANGUAGES = [
    'javascript',
    'python',
    'java',
    'c',
    'cpp',
    'html',
    'css',
];

const Terminal = ({ socketRef, roomId, codeRef }) => {
    const [language, setLanguage] = useState('javascript');
    const [output, setOutput] = useState('');
    const [running, setRunning] = useState(false);
    const outRef = useRef(null);

    useEffect(() => {
        if (!socketRef?.current) return;

        function handleOutput({ output: chunk, isError, done }) {
            setOutput((prev) => prev + chunk);
            if (done) setRunning(false);
            // scroll
            setTimeout(() => {
                if (outRef.current) outRef.current.scrollTop = outRef.current.scrollHeight;
            }, 10);
        }

        socketRef.current.on(ACTIONS.TERMINAL_OUTPUT, handleOutput);

        return () => {
            socketRef.current.off(ACTIONS.TERMINAL_OUTPUT, handleOutput);
        };
    }, [socketRef.current]);

    function run() {
        if (!socketRef?.current) return;
        setOutput('');
        setRunning(true);
        const code = codeRef?.current || '';
        socketRef.current.emit(ACTIONS.TERMINAL_RUN, { roomId, language, code });
    }

    return (
        <div style={{ borderTop: '1px solid #333', padding: 8 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <label style={{ color: '#ddd' }}>Language</label>
                <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                    {LANGUAGES.map((l) => (
                        <option key={l} value={l}>
                            {l}
                        </option>
                    ))}
                </select>
                <button className="btn" onClick={run} disabled={running}>
                    {running ? 'Running...' : 'Run'}
                </button>
                <button
                    className="btn"
                    onClick={() => setOutput('')}
                    style={{ marginLeft: 'auto' }}
                >
                    Clear
                </button>
            </div>
            <div
                ref={outRef}
                style={{
                    background: '#0b0b0b',
                    color: '#eee',
                    padding: 10,
                    height: 200,
                    overflow: 'auto',
                    fontFamily: 'monospace',
                    fontSize: 13,
                    borderRadius: 4,
                }}
            >
                {output || <span style={{ opacity: 0.6 }}>Terminal output will appear here.</span>}
            </div>
        </div>
    );
};

export default Terminal;
