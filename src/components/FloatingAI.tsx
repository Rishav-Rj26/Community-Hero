import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Bot, Sparkles, Mic, MicOff } from 'lucide-react';
import { useApp } from '../context/AppContext';

export function FloatingAI() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  const { chatMessages, sendChatMessage, setActiveTab } = useApp();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Voice recognition setup
  const recognition = React.useMemo(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    return SpeechRecognition ? new SpeechRecognition() : null;
  }, []);
  
  useEffect(() => {
    if (recognition) {
      recognition.continuous = false;
      recognition.interimResults = false;
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev + (prev ? ' ' : '') + transcript);
        setIsListening(false);
      };
      
      recognition.onerror = () => {
        setIsListening(false);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListen = () => {
    if (!recognition) return;
    
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      try {
        recognition.start();
        setIsListening(true);
      } catch (e) {
        setIsListening(false);
      }
    }
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isTyping, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;
    
    const msg = input.trim();
    setInput('');
    setIsTyping(true);
    
    await sendChatMessage(msg);
    setIsTyping(false);
  };
  
  const handleActionClick = (action: string) => {
    setIsOpen(false);
    switch (action) {
      case 'report': setActiveTab('report'); break;
      case 'map': setActiveTab('map'); break;
      case 'stats': setActiveTab('dashboard'); break;
    }
  };

  const displayMessages = chatMessages.slice(-5); // Show last 5

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="mb-4 w-[340px] sm:w-[380px] h-[500px] max-h-[calc(100vh-120px)] glass-panel border border-indigo-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden pointer-events-auto"
          >
            {/* Header */}
            <div className="p-4 bg-slate-900/80 backdrop-blur border-b border-slate-700 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center relative">
                  <Bot size={18} className="text-white" />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-slate-900 rounded-full"></span>
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Community Assistant</h3>
                  <p className="text-[10px] text-indigo-300 flex items-center gap-1">
                    <Sparkles size={10} /> Powered by Gemini
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide bg-slate-900/40">
              {displayMessages.length === 0 ? (
                <div className="text-center text-slate-400 mt-10 text-sm">
                  <Bot size={40} className="mx-auto text-slate-600 mb-3 opacity-50" />
                  <p>Hi! I'm your AI civic assistant.</p>
                  <p className="mt-1">Ask me about community issues, how to report, or your points.</p>
                </div>
              ) : (
                displayMessages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div 
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                        msg.role === 'user' 
                          ? 'bg-indigo-600 text-white rounded-br-sm' 
                          : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-sm'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))
              )}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1 items-center h-10">
                    <motion.div className="w-2 h-2 bg-indigo-400 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} />
                    <motion.div className="w-2 h-2 bg-indigo-400 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} />
                    <motion.div className="w-2 h-2 bg-indigo-400 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            {displayMessages.length === 0 && (
              <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-hide whitespace-nowrap">
                <button onClick={() => handleActionClick('report')} className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-3 py-1.5 rounded-full transition-colors">Report Issue</button>
                <button onClick={() => handleActionClick('map')} className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-3 py-1.5 rounded-full transition-colors">View Map</button>
                <button onClick={() => handleActionClick('stats')} className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-3 py-1.5 rounded-full transition-colors">My Stats</button>
              </div>
            )}

            {/* Input */}
            <div className="p-3 bg-slate-900 border-t border-slate-700">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask AI assistant..."
                    className="w-full bg-slate-800 border border-slate-700 text-sm text-white rounded-full pl-4 pr-10 py-2.5 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                  {recognition && (
                    <button
                      type="button"
                      onClick={toggleListen}
                      className={`absolute right-3 top-2.5 ${isListening ? 'text-rose-400' : 'text-slate-400 hover:text-indigo-400'} transition-colors`}
                    >
                      {isListening ? <Mic size={18} className="animate-pulse" /> : <MicOff size={18} />}
                    </button>
                  )}
                </div>
                <button 
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white w-10 h-10 rounded-full flex items-center justify-center transition-colors shrink-0"
                >
                  <Send size={16} className="ml-1" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-[0_0_20px_rgba(99,102,241,0.5)] flex items-center justify-center hover:shadow-[0_0_30px_rgba(99,102,241,0.7)] transition-shadow pointer-events-auto z-50 relative"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
        
        {/* Notification dot when closed */}
        {!isOpen && chatMessages.length > 0 && chatMessages[chatMessages.length - 1].role === 'assistant' && (
           <span className="absolute top-0 right-0 w-3 h-3 bg-rose-500 border-2 border-slate-900 rounded-full"></span>
        )}
      </motion.button>
    </div>
  );
}
