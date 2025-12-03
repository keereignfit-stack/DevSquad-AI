import React from 'react';
import { AGENTS } from '../constants';
import { Agent } from '../types';

interface AgentSidebarProps {
  onAgentClick: (agent: Agent) => void;
  selectedAgentId: string | null;
}

const AgentSidebar: React.FC<AgentSidebarProps> = ({ onAgentClick, selectedAgentId }) => {
  return (
    <div className="w-20 md:w-64 bg-gray-900 border-r border-gray-800 flex flex-col flex-shrink-0 h-full transition-all duration-300">
      <div className="p-4 border-b border-gray-800 flex items-center justify-center md:justify-start space-x-3">
        <div className="w-8 h-8 rounded bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <i className="fa-solid fa-users-viewfinder text-white text-xs"></i>
        </div>
        <h1 className="text-lg font-bold text-gray-100 hidden md:block tracking-tight">DevSquad AI</h1>
      </div>

      <div className="flex-1 overflow-y-auto py-4 space-y-1">
        {AGENTS.map((agent) => (
          <button
            key={agent.id}
            onClick={() => onAgentClick(agent)}
            className={`w-full flex items-center px-4 py-3 transition-colors duration-200 group relative
              ${selectedAgentId === agent.id ? 'bg-gray-800' : 'hover:bg-gray-800/50'}
            `}
          >
            <div className={`
              w-10 h-10 rounded-full flex items-center justify-center border-2 shrink-0 transition-transform group-hover:scale-105
              ${agent.borderColor} ${agent.bgColor}
            `}>
              <i className={`fa-solid ${agent.icon} ${agent.textColor}`}></i>
            </div>
            
            <div className="ml-3 text-left hidden md:block overflow-hidden">
              <p className={`text-sm font-semibold ${agent.textColor}`}>{agent.name}</p>
              <p className="text-xs text-gray-500 truncate">{agent.role}</p>
            </div>

            {/* Tooltip for collapsed state */}
            <div className="absolute left-16 bg-gray-800 text-xs px-2 py-1 rounded border border-gray-700 opacity-0 group-hover:opacity-100 md:hidden pointer-events-none whitespace-nowrap z-50 transition-opacity">
              {agent.name} - {agent.role}
            </div>
          </button>
        ))}
      </div>

      <div className="p-4 border-t border-gray-800 hidden md:block">
        <div className="text-xs text-gray-500 leading-relaxed">
          <p>Select an agent to direct your message, or chat generally to the whole team.</p>
        </div>
      </div>
    </div>
  );
};

export default AgentSidebar;