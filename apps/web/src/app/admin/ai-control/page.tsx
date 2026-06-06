"use client";
import React, { useState } from "react";
import { BrainCircuit, DollarSign, Sparkles, ShieldCheck, ToggleLeft, ToggleRight, Edit2, Play } from "lucide-react";

interface PromptTemplate {
  id: string;
  name: string;
  category: string; // Campaign, Optimization, Reporting
  template: string;
}

export default function AdminAiControlPage() {
  const [activeNotification, setActiveNotification] = useState("");
  
  // Mock models toggle states
  const [models, setModels] = useState([
    { id: "gpt-4o", name: "OpenAI GPT-4o", provider: "OpenAI", enabled: true },
    { id: "gpt-3.5", name: "OpenAI GPT-3.5 Turbo", provider: "OpenAI", enabled: false },
    { id: "claude-3.5-sonnet", name: "Anthropic Claude 3.5 Sonnet", provider: "Anthropic", enabled: true },
    { id: "claude-3-haiku", name: "Anthropic Claude 3 Haiku", provider: "Anthropic", enabled: true }
  ]);

  // Prompt templates
  const [prompts, setPrompts] = useState<PromptTemplate[]>([
    { id: "pr_1", name: "PMax Campaign generator", category: "Campaign", template: "Create a campaign structure for {businessName} targeting {audience} with daily budget of {budget}..." },
    { id: "pr_2", name: "Auto ROAS Optimizer", category: "Optimization", template: "Evaluate metrics and shift budget from low performing platforms if ROAS falls below {threshold}..." },
    { id: "pr_3", name: "Weekly Executive Summary", category: "Reporting", template: "Draft a high level summary of ad spend, conversions, and target improvements for {clientName}..." }
  ]);

  const triggerNotification = (msg: string) => {
    setActiveNotification(msg);
    setTimeout(() => setActiveNotification(""), 3000);
  };

  const handleToggleModel = (id: string) => {
    setModels(prev => prev.map(m => {
      if (m.id === id) {
        const nextState = !m.enabled;
        triggerNotification(`Model ${m.name} has been ${nextState ? "ENABLED" : "DISABLED"}.`);
        return { ...m, enabled: nextState };
      }
      return m;
    }));
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <BrainCircuit size={24} className="text-[#50BB8F]" />
          <span>AI Control Grid</span>
        </h1>
        <p className="text-zinc-400 text-xs mt-0.5">Manage platform AI models availability, monitor token costs, and update optimization prompt templates.</p>
      </div>

      {activeNotification && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2">
          <ShieldCheck size={14} />
          <span>{activeNotification}</span>
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0D121F] border border-[#1B2438] p-4 rounded-xl">
          <span className="text-[9px] font-bold text-zinc-500 uppercase block">Total OpenAI Cost</span>
          <span className="text-lg font-bold text-white block mt-1">₹4,08,000</span>
          <span className="text-[8px] text-zinc-400 font-semibold block mt-0.5">This Month • 16.2M Tokens</span>
        </div>
        <div className="bg-[#0D121F] border border-[#1B2438] p-4 rounded-xl">
          <span className="text-[9px] font-bold text-zinc-500 uppercase block">Total Anthropic Cost</span>
          <span className="text-lg font-bold text-white block mt-1">₹2,08,000</span>
          <span className="text-[8px] text-zinc-400 font-semibold block mt-0.5">This Month • 8.4M Tokens</span>
        </div>
        <div className="bg-[#0D121F] border border-[#1B2438] p-4 rounded-xl">
          <span className="text-[9px] font-bold text-zinc-500 uppercase block">Average Prompt Latency</span>
          <span className="text-lg font-bold text-emerald-400 block mt-1">1.2s</span>
          <span className="text-[8px] text-zinc-400 font-semibold block mt-0.5">99.8% Prompt success rate</span>
        </div>
      </div>

      {/* Model toggle grid & Prompt library */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Model manager (5 cols) */}
        <div className="lg:col-span-5 bg-[#0D121F] border border-[#1B2438] p-5 rounded-2xl space-y-4">
          <h3 className="font-bold text-white text-xs uppercase tracking-wider pb-2 border-b border-[#1B2438]">
            AI LLM Providers & Models
          </h3>

          <div className="space-y-2.5">
            {models.map((m) => (
              <div 
                key={m.id}
                onClick={() => handleToggleModel(m.id)}
                className="p-3 bg-[#0A0F1D] border border-[#1C283F] hover:border-emerald-500/30 rounded-xl flex justify-between items-center cursor-pointer transition-all text-xs font-semibold"
              >
                <div>
                  <span className="font-bold text-white block">{m.name}</span>
                  <span className="text-[8px] text-zinc-500 font-bold block uppercase mt-0.5">{m.provider}</span>
                </div>
                <button type="button" className="text-zinc-400">
                  {m.enabled ? (
                    <ToggleRight size={24} className="text-emerald-500" />
                  ) : (
                    <ToggleLeft size={24} className="text-zinc-600" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Prompt Library (7 cols) */}
        <div className="lg:col-span-7 bg-[#0D121F] border border-[#1B2438] p-5 rounded-2xl space-y-4">
          <h3 className="font-bold text-white text-xs uppercase tracking-wider pb-2 border-b border-[#1B2438]">
            Prompt Library & Optimization Prompts
          </h3>

          <div className="space-y-3">
            {prompts.map((p) => (
              <div 
                key={p.id} 
                className="bg-[#0A0F1D] border border-[#1C283F] rounded-xl p-3.5 text-xs font-semibold text-zinc-400 space-y-2"
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white">{p.name}</span>
                  <span className="text-[8px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase">
                    {p.category}
                  </span>
                </div>
                <p className="text-[10px] bg-black/45 p-2 rounded border border-zinc-800/80 font-mono text-zinc-300 leading-normal">
                  {p.template}
                </p>
                <div className="flex justify-end gap-2 pt-1 border-t border-zinc-900">
                  <button className="text-[9px] font-bold text-zinc-400 hover:text-white flex items-center gap-1">
                    <Edit2 size={10} /> Edit Prompt
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
