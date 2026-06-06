"use client";
import React, { useState } from "react";
import { Send, Bot, User } from "lucide-react";
import { useSubscription } from "@/components/SubscriptionContext";
import { FeatureGate } from "@/components/FeatureGate";

export default function AiChatPage() {
  const { plan } = useSubscription();
  const [messages, setMessages] = useState<{role: 'ai' | 'user', content: string}[]>([
    { role: 'ai', content: "Hello! I'm your Revenue Pilot AI Assistant. Ask me anything about your campaigns, budget optimization, or ad performance." }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      });
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'ai', content: data.response }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'ai', content: "Sorry, there was an error connecting to the AI Engine." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FeatureGate
      moduleKey="neural-ops"
      requiredPlan="Revenue"
      featureName="AI Executive Assistant"
      description="Unlock your personal AI campaign strategist. Analyze ad metrics, predict ROAS, and optimize budgets automatically."
    >
      <div className="flex flex-col h-[calc(100vh-10rem)] bg-white dark:bg-[#0D121F] border border-gray-200 dark:border-zinc-800/80 rounded-2xl shadow-xl overflow-hidden transition-all duration-300">
        {/* Header */}
        <div className="p-4 border-b border-gray-150 dark:border-zinc-800 bg-gray-50/50 dark:bg-[#090D17] text-gray-900 dark:text-white flex items-center justify-between">
          <h2 className="font-bold text-xs uppercase tracking-wider flex items-center gap-2">
            <Bot className="text-emerald-500" size={18} />
            <span>AI Executive Assistant</span>
          </h2>
          <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            Co-pilot Active
          </span>
        </div>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30 dark:bg-[#080B12]">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'ai' && (
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                  <Bot size={16} />
                </div>
              )}
              <div className={`px-4 py-3 rounded-2xl max-w-[70%] text-xs font-semibold leading-relaxed shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-emerald-500 text-white rounded-br-none' 
                  : 'bg-white dark:bg-[#151D30] text-gray-800 dark:text-zinc-200 rounded-bl-none border border-gray-200 dark:border-zinc-800/80'
              }`}>
                <p>{msg.content}</p>
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                  <User size={16} />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-4 justify-start">
               <div className="w-8 h-8 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                  <Bot size={16} />
               </div>
               <div className="px-4 py-3 rounded-2xl bg-white dark:bg-[#151D30] text-gray-400 rounded-bl-none border border-gray-200 dark:border-zinc-800/80 flex items-center gap-1">
                 <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                 <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                 <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
               </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 bg-white dark:bg-[#0A0D16] border-t border-gray-150 dark:border-zinc-800/80">
          <form onSubmit={sendMessage} className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your campaigns..."
              className="w-full bg-gray-50 dark:bg-zinc-900/40 border border-gray-200 dark:border-zinc-800 text-gray-900 dark:text-white rounded-full py-3 pl-4 pr-12 focus:outline-none focus:border-emerald-500 transition-colors text-xs font-semibold"
              disabled={isLoading}
            />
            <button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              className="absolute right-2 top-2 p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full disabled:opacity-50 transition-colors"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      </div>
    </FeatureGate>
  );
}

