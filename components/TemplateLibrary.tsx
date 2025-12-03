
import React from 'react';
import { TEMPLATES } from '../constants';
import { Template } from '../types';

interface TemplateLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (template: Template) => void;
}

const TemplateLibrary: React.FC<TemplateLibraryProps> = ({ isOpen, onClose, onSelect }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-gray-900 border border-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] flex flex-col overflow-hidden animate-fade-in-up">
        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-950/50">
          <div>
            <h2 className="text-xl font-bold text-white">Template Library</h2>
            <p className="text-gray-400 text-sm mt-1">Jumpstart your project with a pre-configured stack</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => onSelect(template)}
                className="flex flex-col text-left p-4 bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 hover:border-indigo-500/50 rounded-lg transition-all group duration-200"
              >
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center mb-3 group-hover:bg-indigo-500/20 transition-colors">
                  <i className={`fa-solid ${template.icon} text-indigo-400 text-lg`}></i>
                </div>
                <h3 className="text-gray-200 font-semibold mb-1 group-hover:text-white">{template.name}</h3>
                <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">{template.description}</p>
              </button>
            ))}
          </div>
        </div>
        
        <div className="p-4 bg-gray-950/30 border-t border-gray-800 text-center">
            <p className="text-[10px] text-gray-500">Select a template to load its prompt. You can customize it before sending.</p>
        </div>
      </div>
    </div>
  );
};

export default TemplateLibrary;
