
import React, { useState, useEffect, useRef } from 'react';
import AgentSidebar from './components/AgentSidebar';
import ArtifactPanel from './components/ArtifactPanel';
import ChatMessage from './components/ChatMessage';
import TemplateLibrary from './components/TemplateLibrary';
import IntegrationModal from './components/IntegrationModal';
import HeroSection from './components/HeroSection';
import PreviewModal from './components/PreviewModal';
import { Agent, Message, ChatStatus, Artifact, Template } from './types';
import { AGENTS, TOOLS } from './constants';
import { sendMessageToSquad, initializeGemini, resetSession } from './services/geminiService';
import { v4 as uuidv4 } from 'uuid';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [status, setStatus] = useState<ChatStatus>('idle');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [showArtifacts, setShowArtifacts] = useState(true);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isIntegrationModalOpen, setIsIntegrationModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewArtifact, setPreviewArtifact] = useState<Artifact | null>(null);
  const [activeToolIds, setActiveToolIds] = useState<Set<string>>(new Set());
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const initChat = () => {
    resetSession();
    setMessages([]);
    setArtifacts([]);
  };

  useEffect(() => {
    initializeGemini();
    initChat();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, status]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleAgentClick = (agent: Agent) => {
    setSelectedAgentId(prev => prev === agent.id ? null : agent.id);
    if (textareaRef.current) {
        textareaRef.current.focus();
    }
  };

  const handleNewProject = () => {
    if (messages.length > 0 && window.confirm("Start a new project? This will clear the current chat history.")) {
        initChat();
    }
  };

  const handleTemplateSelect = (template: Template) => {
    setInputValue(template.prompt);
    setIsTemplateModalOpen(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleHeroPromptSelect = (prompt: string) => {
    setInputValue(prompt);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleToggleTool = (toolId: string) => {
    setActiveToolIds(prev => {
      const next = new Set(prev);
      if (next.has(toolId)) {
        next.delete(toolId);
      } else {
        next.add(toolId);
      }
      return next;
    });
  };

  const handleOpenPreview = (artifact: Artifact) => {
    setPreviewArtifact(artifact);
    setIsPreviewModalOpen(true);
  };

  const handleLatestPreview = () => {
      // Find the last previewable artifact
      const latest = [...artifacts].reverse().find(a => 
          ['html', 'tsx', 'jsx', 'javascript', 'js'].includes(a.language || '')
      );
      if (latest) {
          handleOpenPreview(latest);
      } else {
          alert("No previewable code (HTML/JS/React) generated yet.");
      }
  };

  // Extract code blocks from text to populate artifacts
  const extractArtifacts = (text: string) => {
    // Improved Regex: allows for optional whitespace/newline after language identifier
    // Matches ```lang\nCode...``` or ```lang Code...```
    const codeBlockRegex = /```(\w+)?\s*([\s\S]*?)```/g;
    let match;
    const newArtifacts: Artifact[] = [];
    
    while ((match = codeBlockRegex.exec(text)) !== null) {
      const language = match[1] || 'text';
      const code = match[2];
      const title = `Snippet ${new Date().toLocaleTimeString()} (${language})`;
      
      // Basic deduping based on exact content match to prevent re-adding during streaming
      const exists = artifacts.some(a => a.content === code);
      if (!exists && code.trim().length > 0) {
          newArtifacts.push({
            id: uuidv4(),
            title,
            type: 'code',
            content: code,
            language: language.toLowerCase()
          });
      }
    }
    
    if (newArtifacts.length > 0) {
      setArtifacts(prev => [...prev, ...newArtifacts]);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || status === 'thinking' || status === 'streaming') return;

    let finalPrompt = inputValue;
    
    // Inject active tools
    if (activeToolIds.size > 0) {
        const activeToolsList = TOOLS.filter(t => activeToolIds.has(t.id)).map(t => t.name).join(', ');
        const toolContext = `[System Note]: The user has enabled the following integrations/tools: ${activeToolsList}. Ensure the architecture and code use these tools where appropriate.`;
        finalPrompt = `${toolContext}\n\n${inputValue}`;
    }

    if (selectedAgentId) {
        const agent = AGENTS.find(a => a.id === selectedAgentId);
        if (agent) {
            finalPrompt = `@${agent.name} ${inputValue}`;
        }
    }

    const newMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: inputValue, 
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue('');
    setStatus('thinking');

    try {
      const botMessageId = uuidv4();
      let streamContent = '';

      setMessages(prev => [...prev, {
        id: botMessageId,
        role: 'model',
        content: '',
        timestamp: Date.now()
      }]);

      await sendMessageToSquad(finalPrompt, (textChunk) => {
        setStatus('streaming');
        streamContent = textChunk;
        setMessages(prev => prev.map(m => 
          m.id === botMessageId ? { ...m, content: streamContent } : m
        ));
      });
      
      extractArtifacts(streamContent);
      setStatus('idle');
      setSelectedAgentId(null); 

    } catch (error) {
      console.error(error);
      setStatus('error');
      setMessages(prev => [...prev, {
        id: uuidv4(),
        role: 'model',
        content: "[System]: Error connecting to the team. Please check your API key or connection.",
        timestamp: Date.now()
      }]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const selectedAgent = selectedAgentId 
    ? AGENTS.find(a => a.id === selectedAgentId) 
    : null;

  const hasPreviewableArtifacts = artifacts.some(a => ['html', 'tsx', 'jsx', 'javascript', 'js'].includes(a.language || ''));

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden selection:bg-indigo-500/30">
      
      <AgentSidebar 
        onAgentClick={handleAgentClick} 
        selectedAgentId={selectedAgentId} 
      />

      <main className="flex-1 flex flex-col min-w-0 relative">
        <header className="h-16 border-b border-gray-800 flex items-center justify-between px-6 bg-gray-950/80 backdrop-blur z-10">
          <div>
            <h2 className="text-gray-100 font-semibold tracking-wide">Squad Channel</h2>
            <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className={`w-2 h-2 rounded-full ${status === 'idle' ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`}></span>
                {status === 'idle' ? 'SOP Workflow Active' : 'Squad is collaborating...'}
            </div>
          </div>
          <div className="flex items-center gap-3">
             {hasPreviewableArtifacts && (
                 <button 
                    onClick={handleLatestPreview}
                    className="text-xs bg-green-600 hover:bg-green-500 text-white px-4 py-1.5 rounded shadow-lg shadow-green-900/20 transition-all flex items-center gap-2 font-semibold animate-pulse-slow"
                 >
                    <i className="fa-solid fa-play"></i>
                    Build & Run
                 </button>
             )}

             <button 
                onClick={() => setIsIntegrationModalOpen(true)}
                className={`text-xs px-3 py-1.5 rounded border transition-colors flex items-center gap-2 hidden md:flex
                  ${activeToolIds.size > 0 
                    ? 'bg-indigo-900/40 text-indigo-300 border-indigo-500/50 hover:bg-indigo-900/60' 
                    : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700'}
                `}
             >
                <i className="fa-solid fa-plug"></i>
                Integrations
                {activeToolIds.size > 0 && <span className="bg-indigo-500 text-white text-[9px] px-1 rounded-full">{activeToolIds.size}</span>}
             </button>
             <button 
                onClick={() => setIsTemplateModalOpen(true)}
                className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded border border-gray-700 transition-colors flex items-center gap-2 hidden md:flex"
             >
                <i className="fa-solid fa-layer-group"></i>
                Templates
             </button>
             <button 
                onClick={handleNewProject}
                className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded border border-gray-700 transition-colors flex items-center gap-2"
                title="Reset Project"
             >
                <i className="fa-solid fa-arrows-rotate"></i>
             </button>
             <button 
               onClick={() => setShowArtifacts(!showArtifacts)}
               className={`md:hidden text-gray-400 hover:text-white transition-colors ${showArtifacts ? 'text-indigo-400' : ''}`}
             >
               <i className="fa-solid fa-code"></i>
             </button>
          </div>
        </header>

        {messages.length === 0 ? (
          <HeroSection 
            onTemplateClick={() => setIsTemplateModalOpen(true)}
            onIntegrationClick={() => setIsIntegrationModalOpen(true)}
            onPromptSelect={handleHeroPromptSelect}
          />
        ) : (
          <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 scroll-smooth">
            <div className="max-w-4xl mx-auto">
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              {status === 'thinking' && (
                  <div className="flex items-center gap-2 text-gray-500 text-xs ml-12 animate-pulse mt-4">
                      <i className="fa-solid fa-circle-notch fa-spin"></i> Analyzing SOPs & assigning agents...
                  </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        <div className="p-4 border-t border-gray-800 bg-gray-950">
          <div className="max-w-4xl mx-auto relative">
            {selectedAgent && (
                <div className="absolute -top-10 left-0 bg-gray-800 text-xs text-gray-300 px-3 py-1 rounded-t-md flex items-center border border-gray-700 border-b-0">
                    <span className="mr-1 text-gray-500">Direct to:</span> 
                    <span className={`font-bold ${selectedAgent.textColor}`}>{selectedAgent.name}</span>
                    <button onClick={() => setSelectedAgentId(null)} className="ml-2 hover:text-white">
                        <i className="fa-solid fa-times"></i>
                    </button>
                </div>
            )}
            <div className={`relative bg-gray-900 rounded-xl border transition-colors focus-within:ring-2 focus-within:ring-indigo-500/50
                ${selectedAgent ? 'border-t-0 rounded-tl-none border-gray-700' : 'border-gray-800'}
            `}>
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={selectedAgent ? `Message ${selectedAgent.name}...` : "Describe your software idea or select a template..."}
                className="w-full bg-transparent text-white p-4 pr-12 outline-none resize-none h-14 max-h-32 min-h-[56px] overflow-hidden"
                style={{ height: inputValue.split('\n').length > 1 ? 'auto' : '3.5rem' }}
                disabled={status !== 'idle' && status !== 'error'}
              />
              <button 
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || (status !== 'idle' && status !== 'error')}
                className="absolute right-2 bottom-2 w-10 h-10 flex items-center justify-center rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-all"
              >
                <i className="fa-solid fa-paper-plane text-sm"></i>
              </button>
            </div>
            <p className="text-[10px] text-gray-600 mt-2 text-center">
              DevSquad follows real-world software SOPs. Generated code should be reviewed.
            </p>
          </div>
        </div>
      </main>

      <ArtifactPanel 
        artifacts={artifacts} 
        isOpen={showArtifacts} 
        onToggle={() => setShowArtifacts(!showArtifacts)} 
        onPreview={handleOpenPreview}
      />

      <TemplateLibrary 
        isOpen={isTemplateModalOpen} 
        onClose={() => setIsTemplateModalOpen(false)} 
        onSelect={handleTemplateSelect} 
      />

      <IntegrationModal
        isOpen={isIntegrationModalOpen}
        onClose={() => setIsIntegrationModalOpen(false)}
        activeToolIds={activeToolIds}
        onToggleTool={handleToggleTool}
      />

      <PreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        artifact={previewArtifact}
      />
    </div>
  );
};

export default App;
