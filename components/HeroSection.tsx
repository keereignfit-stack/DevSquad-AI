import React from 'react';
import { AGENTS } from '../constants';

interface HeroSectionProps {
  onTemplateClick: () => void;
  onIntegrationClick: () => void;
  onPromptSelect: (prompt: string) => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onTemplateClick, onIntegrationClick, onPromptSelect }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto animate-fade-in">
      <div className="max-w-4xl w-full text-center space-y-8">
        
        {/* Main Header */}
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-2xl mb-4 ring-1 ring-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.15)]">
             <i className="fa-solid fa-users-viewfinder text-3xl text-indigo-400"></i>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
            Build Software with <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">DevSquad</span>
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Your autonomous AI team is ready. From requirements to deployment, 
            orchestrate Sarah, Marcus, Neo, and Chloe to build your vision.
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left max-w-3xl mx-auto">
            <button 
                onClick={onTemplateClick}
                className="group p-5 bg-gray-900 border border-gray-800 rounded-xl hover:bg-gray-800 hover:border-indigo-500/30 transition-all duration-200 shadow-sm hover:shadow-indigo-500/10"
            >
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <i className="fa-solid fa-layer-group text-blue-400"></i>
                </div>
                <h3 className="font-semibold text-gray-200 mb-1">Start from Template</h3>
                <p className="text-xs text-gray-500">Launch E-commerce, Blogs, or Landing Pages instantly.</p>
            </button>

            <button 
                onClick={onIntegrationClick}
                className="group p-5 bg-gray-900 border border-gray-800 rounded-xl hover:bg-gray-800 hover:border-purple-500/30 transition-all duration-200 shadow-sm hover:shadow-purple-500/10"
            >
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <i className="fa-solid fa-plug text-purple-400"></i>
                </div>
                <h3 className="font-semibold text-gray-200 mb-1">Connect Tools</h3>
                <p className="text-xs text-gray-500">Integrate GitHub, Supabase, Vercel, and Stripe.</p>
            </button>

            <button 
                onClick={() => onPromptSelect("I need a system architecture for a high-scale real-time chat application using WebSocket and Redis.")}
                className="group p-5 bg-gray-900 border border-gray-800 rounded-xl hover:bg-gray-800 hover:border-orange-500/30 transition-all duration-200 shadow-sm hover:shadow-orange-500/10"
            >
                <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <i className="fa-solid fa-sitemap text-orange-400"></i>
                </div>
                <h3 className="font-semibold text-gray-200 mb-1">Plan Architecture</h3>
                <p className="text-xs text-gray-500">Let Marcus design a scalable system for your needs.</p>
            </button>
        </div>

        {/* Team Avatars */}
        <div className="pt-8 opacity-80">
            <p className="text-xs text-gray-600 uppercase tracking-widest mb-4">Meet the Squad</p>
            <div className="flex justify-center gap-4 flex-wrap">
                {AGENTS.map(agent => (
                    <div key={agent.id} className="flex flex-col items-center gap-2 group cursor-default">
                        <div className={`w-10 h-10 rounded-full border border-gray-800 bg-gray-900 flex items-center justify-center transition-transform group-hover:-translate-y-1 ${agent.textColor}`}>
                            <i className={`fa-solid ${agent.icon}`}></i>
                        </div>
                        <span className="text-[10px] text-gray-500">{agent.role}</span>
                    </div>
                ))}
            </div>
        </div>

      </div>
    </div>
  );
};

export default HeroSection;