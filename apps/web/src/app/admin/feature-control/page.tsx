"use client";
import React, { useState } from "react";
import { Key, ShieldCheck, ToggleLeft, ToggleRight, Sliders, Play, Trash2, Plus } from "lucide-react";

interface FeatureFlag {
  id: string;
  name: string;
  key: string;
  enabled: boolean;
  rollout: number; // 0-100%
  tier: "Beta" | "Experimental" | "General Availability";
}

export default function AdminFeatureControlPage() {
  const [activeNotification, setActiveNotification] = useState("");
  const [flags, setFlags] = useState<FeatureFlag[]>([]);

  const [newFlagName, setNewFlagName] = useState("");
  const [newFlagKey, setNewFlagKey] = useState("");

  const triggerNotification = (msg: string) => {
    setActiveNotification(msg);
    setTimeout(() => setActiveNotification(""), 3000);
  };

  const handleToggleFlag = (id: string) => {
    setFlags(prev => prev.map(f => {
      if (f.id === id) {
        const nextState = !f.enabled;
        triggerNotification(`Feature ${f.name} toggled to ${nextState ? "ON" : "OFF"}.`);
        return { ...f, enabled: nextState, rollout: nextState ? 100 : 0 };
      }
      return f;
    }));
  };

  const handleRolloutChange = (id: string, val: number) => {
    setFlags(prev => prev.map(f => {
      if (f.id === id) {
        return { ...f, rollout: val, enabled: val > 0 };
      }
      return f;
    }));
  };

  const handleAddFlag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFlagName || !newFlagKey) return;
    const newF = {
      id: `ff_${Date.now()}`,
      name: newFlagName,
      key: newFlagKey.toLowerCase().replace(/\s+/g, "-"),
      enabled: false,
      rollout: 0,
      tier: "Beta" as any
    };
    setFlags([newF, ...flags]);
    setNewFlagName("");
    setNewFlagKey("");
    triggerNotification(`Created feature flag: ${newFlagName}`);
  };

  const handleDeleteFlag = (id: string) => {
    setFlags(prev => prev.filter(f => f.id !== id));
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Key size={24} className="text-[#50BB8F]" />
          <span>Feature Control</span>
        </h1>
        <p className="text-zinc-400 text-xs mt-0.5">Control live platform updates, toggle beta releases, and manage rolling rollout percentages.</p>
      </div>

      {activeNotification && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2">
          <ShieldCheck size={14} />
          <span>{activeNotification}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Flags list (8 cols) */}
        <div className="lg:col-span-8 bg-[#0D121F] border border-[#1B2438] p-5 rounded-2xl space-y-4">
          <h3 className="font-bold text-white text-xs uppercase tracking-wider pb-2 border-b border-[#1B2438]">
            Platform Feature Toggles
          </h3>

          <div className="space-y-3">
            {flags.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-8 font-bold">No feature flags configured.</p>
            ) : flags.map((f) => (
              <div 
                key={f.id}
                className="p-4 bg-[#0A0F1D] border border-[#1C283F] rounded-xl text-xs font-semibold text-zinc-400 space-y-3"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-bold text-white text-sm block">{f.name}</span>
                    <span className="text-[9px] text-zinc-500 font-mono mt-0.5">Key: {f.key}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded border ${
                      f.tier === "General Availability" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                      f.tier === "Beta" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                      "bg-purple-500/10 text-purple-400 border-purple-500/20"
                    }`}>
                      {f.tier}
                    </span>
                    <button type="button" onClick={() => handleToggleFlag(f.id)}>
                      {f.enabled ? (
                        <ToggleRight size={24} className="text-emerald-500" />
                      ) : (
                        <ToggleLeft size={24} className="text-zinc-600" />
                      )}
                    </button>
                    <button 
                      onClick={() => handleDeleteFlag(f.id)}
                      className="text-zinc-500 hover:text-red-500 transition-colors ml-2"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-zinc-500 font-bold uppercase">
                    <span>Rollout Target</span>
                    <span>{f.rollout}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={f.rollout}
                    onChange={(e) => handleRolloutChange(f.id, parseInt(e.target.value))}
                    className="w-full h-1 bg-[#1C283F] rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Create Flag Panel (4 cols) */}
        <div className="lg:col-span-4 bg-[#0D121F] border border-[#1B2438] p-5 rounded-2xl space-y-4">
          <h3 className="font-bold text-white text-xs uppercase tracking-wider pb-2 border-b border-[#1B2438]">
            Create Feature Flag
          </h3>

          <form onSubmit={handleAddFlag} className="space-y-3">
            <div>
              <label className="text-[9px] font-bold text-zinc-500 uppercase">Flag Name</label>
              <input 
                type="text"
                required
                placeholder="AI Insights Module"
                value={newFlagName}
                onChange={(e) => setNewFlagName(e.target.value)}
                className="w-full bg-[#0A0F1D] border border-[#1C283F] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-[9px] font-bold text-zinc-500 uppercase">System Key</label>
              <input 
                type="text"
                required
                placeholder="ai-insights-core"
                value={newFlagKey}
                onChange={(e) => setNewFlagKey(e.target.value)}
                className="w-full bg-[#0A0F1D] border border-[#1C283F] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold text-[10px] py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              <Plus size={12} /> Add Feature Flag
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
