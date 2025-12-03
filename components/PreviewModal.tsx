
import React, { useEffect, useState } from 'react';
import { Artifact } from '../types';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  artifact: Artifact | null;
}

type ViewMode = 'desktop' | 'tablet' | 'mobile';

const PreviewModal: React.FC<PreviewModalProps> = ({ isOpen, onClose, artifact }) => {
  const [srcDoc, setSrcDoc] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('desktop');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!artifact) {
      setSrcDoc('');
      return;
    }

    const content = artifact.content;
    let previewHtml = '';

    const isJsFamily = ['tsx', 'jsx', 'javascript', 'js', 'ts'].includes(artifact.language || '');
    const isFullHtml = content.trim().startsWith('<!DOCTYPE html>') || content.trim().startsWith('<html');

    if (isJsFamily && !isFullHtml) {
        // --- Code Transformation Logic ---
        let cleanContent = content;

        // 1. Shim Imports: Instead of just deleting, try to map known libs
        // Map lucide-react imports -> window.LucideReact
        cleanContent = cleanContent.replace(/import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"];?/g, 'const {$1} = window.LucideReact;');
        // Map recharts imports -> window.Recharts
        cleanContent = cleanContent.replace(/import\s+\{([^}]+)\}\s+from\s+['"]recharts['"];?/g, 'const {$1} = window.Recharts;');
        // Map react imports -> window.React
        cleanContent = cleanContent.replace(/import\s+React\s*(?:,\s*\{([^}]+)\})?\s+from\s+['"]react['"];?/g, 'const { $1 } = window.React;');
        cleanContent = cleanContent.replace(/import\s+\{([^}]+)\}\s+from\s+['"]react['"];?/g, 'const { $1 } = window.React;');
        // Map react-dom -> window.ReactDOM
        cleanContent = cleanContent.replace(/import\s+ReactDOM\s+from\s+['"]react-dom['"];?/g, 'const ReactDOM = window.ReactDOM;');
        cleanContent = cleanContent.replace(/import\s+ReactDOM\s+from\s+['"]react-dom\/client['"];?/g, 'const ReactDOM = window.ReactDOM;');

        // Remove any remaining imports to prevent runtime syntax errors
        cleanContent = cleanContent.replace(/import\s+[\s\S]*?from\s+['"].*?['"];?/g, '// import removed');
        
        // 2. Handle "export default function App" -> "const App = function"
        cleanContent = cleanContent.replace(/export\s+default\s+function\s+(\w+)/, 'const $1 = function');
        // Handle "export default App"
        if (cleanContent.match(/export\s+default\s+(\w+);?/)) {
             cleanContent = cleanContent.replace(/export\s+default\s+(\w+);?/, 'const _App = $1; ReactDOM.createRoot(document.getElementById("root")).render(<_App />);');
        } else {
             // Heuristic: If "App" exists and no render call, try to render it
             if ((cleanContent.includes('const App') || cleanContent.includes('function App')) && !cleanContent.includes('ReactDOM.createRoot')) {
                 const renderScript = 'setTimeout(() => { if(typeof App !== "undefined") ReactDOM.createRoot(document.getElementById("root")).render(<App />); }, 100);';
                 cleanContent += `\n${renderScript}`;
             }
        }

        // Escape existing script tags
        cleanContent = cleanContent.replace(/<\/script>/g, '<\\/script>');

        previewHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        body { background-color: #0d1117; color: #fff; font-family: 'Inter', sans-serif; margin: 0; padding: 0; }
        #root { padding: 20px; height: 100vh; overflow-y: auto; box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #111; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
        
        #error-overlay {
            position: fixed; top: 0; left: 0; right: 0; padding: 20px;
            background: #7f1d1d; color: #fecaca; font-family: monospace; z-index: 9999;
            display: none; box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        }
        #console-btn {
            position: fixed; bottom: 10px; right: 10px; z-index: 9998;
            background: #333; color: #fff; border: 1px solid #444; 
            padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 10px; opacity: 0.7;
        }
        #console-output { 
            background: #111; border-top: 1px solid #333; color: #aaa; 
            font-family: monospace; padding: 10px; font-size: 12px; 
            position: fixed; bottom: 0; left: 0; right: 0; height: 150px; 
            overflow-y: auto; display: none; z-index: 9999;
        }
        .log-entry { padding: 2px 0; border-bottom: 1px solid #222; white-space: pre-wrap; }
        .log-error { color: #f87171; }
        .log-warn { color: #facc15; }
    </style>
</head>
<body>
    <div id="error-overlay"></div>
    <div id="root"></div>
    <div id="console-output"></div>
    <button id="console-btn" onclick="toggleConsole()">Console</button>

    <script>
        // --- Error Handling ---
        window.onerror = function(message, source, lineno, colno, error) {
            const el = document.getElementById('error-overlay');
            el.style.display = 'block';
            el.innerHTML = '<strong>Runtime Error:</strong> ' + message + '<br><small>' + source + ':' + lineno + '</small>';
        };
        window.addEventListener('unhandledrejection', function(event) {
            const el = document.getElementById('error-overlay');
            el.style.display = 'block';
            el.innerHTML = '<strong>Unhandled Promise Rejection:</strong> ' + event.reason;
        });

        // --- Console Handling ---
        const consoleDiv = document.getElementById('console-output');
        const consoleBtn = document.getElementById('console-btn');
        let isConsoleOpen = false;
        
        window.toggleConsole = () => {
            isConsoleOpen = !isConsoleOpen;
            consoleDiv.style.display = isConsoleOpen ? 'block' : 'none';
            document.getElementById('root').style.paddingBottom = isConsoleOpen ? '160px' : '20px';
        };

        function logToUi(type, args) {
            const div = document.createElement('div');
            div.className = 'log-entry log-' + type;
            const text = args.map(a => {
                try { return typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a); } catch(e) { return String(a); }
            }).join(' ');
            div.textContent = '> ' + text;
            consoleDiv.appendChild(div);
            consoleDiv.scrollTop = consoleDiv.scrollHeight;
            
            // Auto-open on error
            if (type === 'error') {
                 if (!isConsoleOpen) toggleConsole();
            }
        }

        const originalLog = console.log;
        const originalWarn = console.warn;
        const originalError = console.error;

        console.log = (...args) => { originalLog.apply(console, args); logToUi('info', args); };
        console.warn = (...args) => { originalWarn.apply(console, args); logToUi('warn', args); };
        console.error = (...args) => { originalError.apply(console, args); logToUi('error', args); };
    </script>

    <script>
        // --- Shims for Common AI Libraries ---
        
        // React
        window.React = window.React || {};
        window.ReactDOM = window.ReactDOM || {};
        const { useState, useEffect, useRef, useMemo, useCallback, useReducer, useContext, createContext } = window.React;
        
        // Lucide-React (Proxy to prevent crashes)
        // Creates a placeholder SVG for any icon requested
        window.LucideReact = new Proxy({}, {
            get: (target, prop) => {
                return ({ size = 24, className = '', ...props }) => {
                     return window.React.createElement('svg', { 
                        width: size, height: size, 
                        viewBox: "0 0 24 24", 
                        fill: "none", 
                        stroke: "currentColor", 
                        strokeWidth: 2, 
                        strokeLinecap: "round", 
                        strokeLinejoin: "round",
                        className: className,
                        ...props
                     }, [
                        window.React.createElement('rect', { width: 18, height: 18, x: 3, y: 3, rx: 2, key: 'rect' }),
                        window.React.createElement('text', { x: 12, y: 16, fontSize: 10, textAnchor: 'middle', fill: 'currentColor', stroke: 'none', key: 'text' }, String(prop).substring(0,2))
                     ]);
                }
            }
        });

        // Recharts (Proxy to prevent crashes)
        window.Recharts = new Proxy({}, {
            get: (target, prop) => {
                return ({ children, ...props }) => window.React.createElement('div', { 
                    style: { border: '1px dashed #444', padding: '20px', margin: '10px 0', borderRadius: '8px', background: '#1a1a1a', color: '#888', textAlign: 'center' }
                }, [
                    window.React.createElement('div', { style: { marginBottom: '8px', fontWeight: 'bold' }, key: 'title' }, '[Chart: ' + String(prop) + ']'),
                    window.React.createElement('div', { style: { fontSize: '12px' }, key: 'sub' }, 'Visualization placeholder (library mocked)')
                ]);
            }
        });
    </script>

    <script type="text/babel" data-presets="env,react">
        ${cleanContent}
    </script>
</body>
</html>`;
    } else {
        previewHtml = content;
    }

    setSrcDoc(previewHtml);
  }, [artifact, refreshKey]);

  if (!isOpen || !artifact) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in p-4 md:p-8">
      <div className="w-full h-full max-w-7xl mx-auto flex flex-col bg-gray-950 rounded-xl border border-gray-800 shadow-2xl overflow-hidden">
        
        {/* Header / Toolbar */}
        <div className="h-14 border-b border-gray-800 flex items-center justify-between px-4 bg-gray-900 shrink-0">
          
          {/* Left: Title */}
          <div className="flex items-center gap-3 w-48">
             <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-400 border border-green-500/20">
                <i className="fa-solid fa-play text-xs"></i>
             </div>
             <div className="hidden md:block">
                <h3 className="text-sm font-bold text-gray-200">Live Preview</h3>
                <p className="text-[10px] text-gray-500 truncate">{artifact.language?.toUpperCase()}</p>
             </div>
          </div>

          {/* Center: Device Toggles */}
          <div className="flex items-center bg-gray-950 rounded-lg p-1 border border-gray-800 gap-1">
            <button 
                onClick={() => setViewMode('mobile')}
                className={`w-8 h-8 rounded flex items-center justify-center transition-all ${viewMode === 'mobile' ? 'bg-indigo-600 text-white shadow' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'}`}
                title="Mobile (375px)"
            >
                <i className="fa-solid fa-mobile-screen"></i>
            </button>
            <button 
                onClick={() => setViewMode('tablet')}
                className={`w-8 h-8 rounded flex items-center justify-center transition-all ${viewMode === 'tablet' ? 'bg-indigo-600 text-white shadow' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'}`}
                title="Tablet (768px)"
            >
                <i className="fa-solid fa-tablet-screen-button"></i>
            </button>
            <button 
                onClick={() => setViewMode('desktop')}
                className={`w-8 h-8 rounded flex items-center justify-center transition-all ${viewMode === 'desktop' ? 'bg-indigo-600 text-white shadow' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'}`}
                title="Desktop (100%)"
            >
                <i className="fa-solid fa-desktop"></i>
            </button>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 w-48 justify-end">
             <button 
                onClick={() => setRefreshKey(k => k + 1)}
                className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
                title="Refresh Preview"
            >
                <i className="fa-solid fa-rotate-right"></i>
            </button>
            <button 
                onClick={() => {
                    const blob = new Blob([srcDoc], { type: 'text/html' });
                    const url = URL.createObjectURL(blob);
                    window.open(url, '_blank');
                }}
                className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
                title="Open in New Tab"
            >
                <i className="fa-solid fa-arrow-up-right-from-square"></i>
            </button>
            <div className="h-6 w-px bg-gray-800 mx-1"></div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors">
                <i className="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>
        </div>

        {/* Preview Container */}
        <div className="flex-1 bg-gray-900/50 overflow-hidden relative flex items-center justify-center p-4">
            <div 
                className={`bg-white transition-all duration-300 shadow-2xl overflow-hidden origin-center relative
                    ${viewMode === 'mobile' ? 'w-[375px] h-[667px] rounded-2xl border-[8px] border-gray-800' : ''}
                    ${viewMode === 'tablet' ? 'w-[768px] h-[1024px] rounded-xl border-[8px] border-gray-800' : ''}
                    ${viewMode === 'desktop' ? 'w-full h-full rounded-none border-0' : ''}
                `}
            >
                <iframe 
                    key={refreshKey}
                    srcDoc={srcDoc}
                    title="Preview"
                    className="w-full h-full border-0 bg-white"
                    sandbox="allow-scripts allow-modals allow-forms allow-popups allow-same-origin"
                />
            </div>
            
            {/* Background pattern for non-desktop modes */}
            {viewMode !== 'desktop' && (
                <div className="absolute inset-0 -z-10 opacity-5 pointer-events-none" 
                    style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                </div>
            )}
        </div>

      </div>
    </div>
  );
};

export default PreviewModal;
