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
  
  // Realistic AI Models via aicredits.in
  const [models, setModels] = useState([
    { id: "gpt-5", name: "OpenAI GPT-5 (Ad Sets & Campaigns)", provider: "OpenAI", enabled: true },
    { id: "gpt-4o-mini", name: "OpenAI GPT-4o Mini (Default Tasks)", provider: "OpenAI", enabled: true },
    { id: "claude-3.5-sonnet", name: "Anthropic Claude 3.5 Sonnet", provider: "Anthropic", enabled: false },
    { id: "gemini-1.5-pro", name: "Google Gemini 1.5 Pro", provider: "Google", enabled: false }
  ]);

  // Prompt templates
  const [prompts, setPrompts] = useState<PromptTemplate[]>([
    { id: "pr_1", name: "High-End Ad Set Generator", category: "Campaign", template: "Using GPT-5: Generate highly persuasive ad copy and campaign structures targeting {audience} for {businessName}..." },
    { id: "pr_2", name: "Default Data Parser", category: "Reporting", template: "Using GPT-4o Mini: Extract key metrics from the following CSV blob and format it as JSON..." },
    { id: "pr_3", name: "Auto ROAS Optimizer", category: "Optimization", template: "Using GPT-4o Mini: Evaluate live ad metrics. Recommend budget shifts if ROAS falls below {threshold}..." }
  ]);

  const [aiStats, setAiStats] = useState({ totalInsights: 0, cost: 0, tokens: 0 });

  React.useEffect(() => {
    async function fetchAiStats() {
      try {
        const token = localStorage.getItem("token") || localStorage.getItem("auth_token");
        const res = await fetch("/api/v1/admin/ai-usage", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          // Simulate cost based on insights count for now, since tokens aren't stored in AiInsight table
          setAiStats({
            totalInsights: data.totalInsights,
            cost: data.totalInsights * 0.05, // Mock 5 cents per insight
            tokens: data.totalInsights * 400 // Mock 400 tokens per insight
          });
        }
      } catch (err) {
        console.error("Failed to fetch ai usage", err);
      }
    }
    fetchAiStats();
  }, []);

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
          <span className="text-[9px] font-bold text-zinc-500 uppercase block">Total Generated Insights</span>
          <span className="text-lg font-bold text-white block mt-1">{aiStats.totalInsights.toLocaleString()}</span>
          <span className="text-[8px] text-zinc-400 font-semibold block mt-0.5">Across all organizations</span>
        </div>
        <div className="bg-[#0D121F] border border-[#1B2438] p-4 rounded-xl">
          <span className="text-[9px] font-bold text-zinc-500 uppercase block">Estimated API Cost</span>
          <span className="text-lg font-bold text-white block mt-1">₹{Math.floor(aiStats.cost * 83).toLocaleString()}</span>
          <span className="text-[8px] text-zinc-400 font-semibold block mt-0.5">This Month • {aiStats.tokens.toLocaleString()} Tokens</span>
        </div>
        <div className="bg-[#0D121F] border border-[#1B2438] p-4 rounded-xl">
          <span className="text-[9px] font-bold text-zinc-500 uppercase block">Average Prompt Latency</span>
          <span className="text-lg font-bold text-emerald-400 block mt-1">Pending</span>
          <span className="text-[8px] text-zinc-400 font-semibold block mt-0.5">Awaiting telemetry data</span>
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
