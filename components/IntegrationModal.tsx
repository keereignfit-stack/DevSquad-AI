
import React from 'react';
import { TOOLS } from '../constants';
import { Tool } from '../types';

interface IntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeToolIds: Set<string>;
  onToggleTool: (toolId: string) => void;
}

const IntegrationModal: React.FC<IntegrationModalProps> = ({ isOpen, onClose, activeToolIds, onToggleTool }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-gray-900 border border-gray-800 rounded-xl shadow-2xl max-w-3xl w-full flex flex-col overflow-hidden animate-fade-in-up">
        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-950/50">
          <div>
            <h2 className="text-xl font-bold text-white">Stack & Integrations</h2>
            <p className="text-gray-400 text-sm mt-1">Select the tools you want the team to use</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TOOLS.map((tool) => {
              const isActive = activeToolIds.has(tool.id);
              return (
                <button
                  key={tool.id}
                  onClick={() => onToggleTool(tool.id)}
                  className={`flex items-start text-left p-4 rounded-lg border transition-all duration-200
                    ${isActive 
                      ? 'bg-indigo-900/20 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.1)]' 
                      : 'bg-gray-800/50 border-gray-700/50 hover:bg-gray-800 hover:border-gray-600'}
                  `}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 mr-4 transition-colors
                     ${isActive ? 'bg-indigo-500/20' : 'bg-gray-700/30'}
                  `}>
                    <i className={`fa-brands ${tool.icon} text-lg ${isActive ? tool.color : 'text-gray-400'}`}></i>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-semibold ${isActive ? 'text-white' : 'text-gray-300'}`}>
                        {tool.name}
                      </h3>
                      {isActive && <i className="fa-solid fa-check-circle text-indigo-400 text-xs"></i>}
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{tool.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        
        <div className="p-4 bg-gray-950/30 border-t border-gray-800 text-center">
            <p className="text-[10px] text-gray-500">
                Active tools will be injected into the team's context for future messages.
            </p>
        </div>
      </div>
    </div>
  );
};

export default IntegrationModal;
