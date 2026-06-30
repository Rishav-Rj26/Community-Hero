import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import { AI_SUGGESTED_PROMPTS } from '../data/mockData';
import { getPredictiveInsights } from '../services/geminiService';
import { Bot, Send, Sparkles, User as UserIcon, Loader2, ArrowRight, TrendingUp, ChevronDown, ChevronUp, AlertTriangle, CheckCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export function AIAssistantPage() {
  const { chatMessages, sendChatMessage, clearChat, user, navigateToIssue, issues } = useApp();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [insightsPanelOpen, setInsightsPanelOpen] = useState(false);
  const [insights, setInsights] = useState<{title: string, description: string, type: string}[] | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (issues.length > 0 && !insights) {
      getPredictiveInsights(issues).then(res => setInsights(res.insights));
    }
  }, [issues, insights]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping]);

  const handleSubmit = async (e: React.FormEvent | string) => {
    if (typeof e !== 'string') e.preventDefault();
    const msg = typeof e === 'string' ? e : input;
    
    if (!msg.trim() || isTyping) return;
    
    setInput('');
    setIsTyping(true);
    try {
      await sendChatMessage(msg);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-100px)] flex flex-col pb-6">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Bot size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              Civic AI Assistant <Sparkles size={18} className="text-purple-400" />
            </h1>
            <p className="text-sm text-slate-400">Powered by Google Gemini</p>
          </div>
        </div>
        
        {chatMessages.length > 0 && (
          <button 
            onClick={clearChat}
            className="text-sm font-medium text-slate-400 hover:text-white px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            Clear History
          </button>
        )}
      </div>

      {/* Quick Insights Panel */}
      <div className="mb-6 glass-panel rounded-2xl overflow-hidden border border-slate-700 shadow-lg transition-all duration-300">
        <button 
          onClick={() => setInsightsPanelOpen(!insightsPanelOpen)}
          className="w-full flex items-center justify-between p-4 bg-slate-800/80 hover:bg-slate-700/80 transition-colors"
        >
          <div className="flex items-center gap-2 text-indigo-300 font-semibold">
            <TrendingUp size={18} /> Quick Predictive Insights
          </div>
          {insightsPanelOpen ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
        </button>
        {insightsPanelOpen && (
          <div className="p-4 grid md:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-900/50">
            {insights ? insights.map((insight, idx) => (
              <div key={idx} className="bg-slate-800 border border-slate-700 rounded-xl p-3 shadow-inner">
                <div className="flex items-center gap-2 mb-2">
                  {insight.type === 'hotspot' || insight.type === 'severity' ? <AlertTriangle size={16} className="text-rose-400" /> : 
                   insight.type === 'trend' ? <TrendingUp size={16} className="text-blue-400" /> : 
                   <CheckCircle size={16} className="text-emerald-400" />}
                  <h4 className="text-sm font-bold text-white leading-tight">{insight.title}</h4>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{insight.description}</p>
              </div>
            )) : (
              <div className="col-span-full flex justify-center py-4 text-slate-400"><Loader2 className="animate-spin mr-2" size={18} /> Loading insights...</div>
            )}
          </div>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 glass-panel rounded-3xl overflow-hidden flex flex-col border border-slate-700/50 shadow-2xl relative">
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
          {chatMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto">
              <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center mb-6 border border-slate-700">
                <Bot size={40} className="text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">How can I help you today?</h2>
              <p className="text-slate-400 mb-10 text-lg">
                I can provide information about community issues, help you understand local policies, or guide you through reporting problems.
              </p>
              
              <div className="grid sm:grid-cols-2 gap-4 w-full">
                {AI_SUGGESTED_PROMPTS.slice(0, 4).map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSubmit(prompt)}
                    className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-indigo-500 hover:bg-slate-800 transition-all text-left flex items-start gap-3 group"
                  >
                    <ArrowRight size={16} className="text-indigo-400 mt-0.5 shrink-0 group-hover:translate-x-1 transition-transform" />
                    <span className="text-sm text-slate-300 group-hover:text-white">{prompt}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {chatMessages.map((msg) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={msg.id} 
                  className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    msg.role === 'user' ? 'bg-indigo-600' : 'bg-purple-600'
                  }`}>
                    {msg.role === 'user' ? (
                      user?.avatar ? <img src={user.avatar} className="w-full h-full rounded-full" alt="You" /> : <UserIcon size={20} className="text-white" />
                    ) : (
                      <Bot size={20} className="text-white" />
                    )}
                  </div>
                  
                  <div className={`max-w-[80%] rounded-2xl p-5 ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600/20 border border-indigo-500/30 text-white rounded-tr-sm' 
                      : 'bg-slate-800/80 border border-slate-700 text-slate-200 rounded-tl-sm'
                  }`}>
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-700">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-[15px] leading-relaxed">{msg.content}</p>
                    )}
                  </div>
                </motion.div>
              ))}
              
              {isTyping && (
                <div className="flex gap-4">
                  <div className="shrink-0 w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center">
                    <Bot size={20} className="text-white" />
                  </div>
                  <div className="bg-slate-800/80 border border-slate-700 rounded-2xl rounded-tl-sm p-5 flex items-center gap-2">
                    <motion.div className="w-2 h-2 bg-indigo-400 rounded-full" animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} />
                    <motion.div className="w-2 h-2 bg-indigo-400 rounded-full" animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} />
                    <motion.div className="w-2 h-2 bg-indigo-400 rounded-full" animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} />
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 shrink-0">
          <form onSubmit={handleSubmit} className="relative max-w-4xl mx-auto">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask anything about the community..."
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-2xl pl-5 pr-14 py-4 focus:outline-none focus:border-indigo-500 transition-colors shadow-inner"
              disabled={isTyping}
            />
            <button 
              type="submit"
              disabled={!input.trim() || isTyping}
              className="absolute right-2 top-2 bottom-2 w-10 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl flex items-center justify-center transition-colors"
            >
              {isTyping ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </form>
          <div className="text-center mt-3">
             <span className="text-xs text-slate-500 flex items-center justify-center gap-1">
               <Sparkles size={12} /> AI can make mistakes. Verify important information.
             </span>
          </div>
        </div>
        
      </div>
    </div>
  );
}
