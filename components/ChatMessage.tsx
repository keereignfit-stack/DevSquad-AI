
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Message, Agent } from '../types';
import { AGENTS } from '../constants';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  
  const renderContent = () => {
    if (isUser) {
      return (
        <div className="flex justify-end mb-6">
          <div className="max-w-3xl bg-indigo-600 text-white px-5 py-3.5 rounded-2xl rounded-tr-sm shadow-md">
            <p className="whitespace-pre-wrap leading-relaxed text-sm">{message.content}</p>
          </div>
        </div>
      );
    }

    // Enhanced split logic to handle various LLM outputs like:
    // [Atlas]: Text
    // **[Atlas]**: Text
    // Atlas: Text
    // The regex looks for a name pattern followed by a colon at the start of a line/string
    const splitRegex = /(?=(?:^|\n)\s*(?:\*\*|__)?(?:\[.*?\]|[\w\s]+)(?:\*\*|__)?\s*:)/g;
    const rawParts = message.content.split(splitRegex);
    
    // Check if splitting actually worked; if not, treat the whole thing as one block (fallback)
    const partsToRender = rawParts.length > 1 ? rawParts : [message.content];

    return (
      <div className="mb-6 space-y-4">
        {partsToRender.map((part, index) => {
           if (!part.trim()) return null;

           // Extract name: matches "[Name]:", "**[Name]**:", "Name:"
           // Group 1: Name inside brackets or just name
           // Group 2: Content
           const match = part.match(/(?:^|\n)\s*(?:\*\*|__)?(?:\[\s*(.*?)\s*\]|([\w\s]+))(?:\*\*|__)?\s*:\s*([\s\S]*)/);
           
           let agentName = 'DevSquad';
           let content = part;
           
           if (match) {
             // If Group 1 matches (brackets), use it. Else use Group 2 (no brackets).
             agentName = match[1] || match[2];
             
             // Clean up
             agentName = agentName.trim().replace(/\*/g, '').replace(/_/g, '');
             
             // If content group exists, use it. Otherwise, the regex might have failed to separate content cleanly.
             if (match[3]) {
                content = match[3];
             }
           } else if (index === 0 && !part.match(/^\s*\[/)) {
               // This is intro text before any agent starts speaking, or failed parsing
               // If it's the only part and parsing failed, we leave agentName as DevSquad
           }

           // Find agent object
           const agent = AGENTS.find(a => 
             a.name.toLowerCase() === agentName.toLowerCase() || 
             a.role.toLowerCase() === agentName.toLowerCase()
           );

           const agentColor = agent ? agent.textColor : 'text-gray-400';
           const borderColor = agent ? agent.borderColor : 'border-gray-700';
           const icon = agent ? agent.icon : 'fa-robot';
           const bgBadge = agent ? agent.bgColor : 'bg-gray-800';
           
           // Fallback for unknown agent names (e.g., "System")
           const displayName = agent ? agent.name : agentName;
           const displayRole = agent ? agent.role : 'System / Assistant';

           return (
            <div key={index} className="flex justify-start animate-fade-in group">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 mt-1 shrink-0 border ${borderColor} ${bgBadge} shadow-sm`}>
                <i className={`fa-solid ${icon} ${agentColor} text-xs`}></i>
              </div>
              <div className="max-w-3xl flex-1">
                <div className="flex items-baseline mb-1">
                  <span className={`text-xs font-bold mr-2 ${agentColor} uppercase tracking-wider`}>
                    {displayName}
                  </span>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wide">
                    {displayRole}
                  </span>
                </div>
                <div className="bg-gray-800/50 border border-gray-800/50 text-gray-200 px-5 py-3.5 rounded-2xl rounded-tl-sm shadow-sm hover:border-gray-700 transition-colors">
                  <div className="prose prose-invert prose-sm max-w-none break-words leading-relaxed">
                    <ReactMarkdown
                      components={{
                        code({node, inline, className, children, ...props} : any) {
                          const match = /language-(\w+)/.exec(className || '')
                          return !inline && match ? (
                            <div className="relative group my-4 rounded-lg overflow-hidden border border-gray-700/50 shadow-lg">
                                <div className="flex items-center justify-between px-3 py-1.5 bg-gray-900 border-b border-gray-700/50">
                                   <span className="text-[10px] font-mono text-gray-400 uppercase">{match[1]}</span>
                                   <div className="flex gap-1.5">
                                      <span className="w-2 h-2 rounded-full bg-red-500/20"></span>
                                      <span className="w-2 h-2 rounded-full bg-yellow-500/20"></span>
                                      <span className="w-2 h-2 rounded-full bg-green-500/20"></span>
                                   </div>
                                </div>
                                <code className={`${className} block bg-gray-950 p-4 text-sm overflow-x-auto`} {...props}>
                                  {children}
                                </code>
                            </div>
                          ) : (
                            <code className="bg-gray-700/50 px-1.5 py-0.5 rounded text-indigo-300 font-mono text-xs border border-gray-600/30" {...props}>
                              {children}
                            </code>
                          )
                        }
                      }}
                    >
                      {content}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            </div>
           );
        })}
      </div>
    );
  };

  return renderContent();
};

export default ChatMessage;
