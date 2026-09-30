import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, MessageSquare, HelpCircle, ShieldAlert } from 'lucide-react';
import { assistantAPI } from '../services/api';

const AIAssistantWidget = ({ currentCaseId = null, currentPage = null }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMsg, setInputMsg] = useState('');
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: 'Hello! I am RuralFracture-AI Assistant. I can help you navigate the system, explain AI predictions, interpret Grad-CAM heatmaps, explain image quality metrics, or query case statistics.\n\n*How can I assist you today?*',
    },
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend = null) => {
    const text = textToSend || inputMsg;
    if (!text.trim() || loading) return;

    // Add user message
    const newMsgs = [...messages, { sender: 'user', text }];
    setMessages(newMsgs);
    if (!textToSend) setInputMsg('');
    setLoading(true);

    try {
      const res = await assistantAPI.chat(text, currentCaseId, currentPage);
      setMessages([...newMsgs, { sender: 'ai', text: res.data.response }]);
    } catch (err) {
      setMessages([
        ...newMsgs,
        {
          sender: 'ai',
          text: 'I am currently operating in offline mode. For AI-assisted screening predictions, please inspect the main result dashboard.\n\n⚠️ *AI-assisted screening only. Final interpretation and clinical decision must be made by a qualified healthcare professional.*',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    'Explain this result',
    'Explain Grad-CAM',
    'Explain Image Quality',
    'Summarize Case',
    'How do I upload an X-ray?',
    'How many high-priority cases?',
  ];

  return (
    <>
      {/* Floating Action Button (Bottom Right) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold px-4 py-3 rounded-full shadow-2xl glow-cyan transition-all transform hover:scale-105"
        >
          <Bot className="w-5 h-5" />
          <span>Ask AI Assistant</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
        </button>
      )}

      {/* Floating Chat Modal Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] h-[560px] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden glow-cyan">
          
          {/* Header */}
          <div className="bg-slate-950 border-b border-slate-800 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                  RuralFracture AI Assistant
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                </h4>
                <p className="text-[10px] text-emerald-400 font-medium">
                  {currentCaseId ? `Context: ${currentCaseId}` : 'Application & Workflow Helper'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-950/60">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-cyan-600 text-white rounded-br-none shadow-md'
                      : 'bg-slate-800 text-slate-200 border border-slate-700/80 rounded-bl-none shadow'
                  }`}
                  style={{ whiteSpace: 'pre-line' }}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-cyan-400 bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50 w-32">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>AI processing...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Action Chips */}
          <div className="p-2 border-t border-slate-800/80 bg-slate-900 overflow-x-auto flex gap-1.5 shrink-0 no-scrollbar">
            {quickActions.map((action, i) => (
              <button
                key={i}
                onClick={() => handleSend(action)}
                className="bg-slate-800 hover:bg-cyan-950 text-cyan-300 border border-slate-700 hover:border-cyan-500/50 text-[11px] px-2.5 py-1 rounded-full whitespace-nowrap transition-all"
              >
                {action}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask AI Assistant..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !inputMsg.trim()}
              className="bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-bold p-2 rounded-xl disabled:opacity-40 transition-all hover:scale-105"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AIAssistantWidget;
