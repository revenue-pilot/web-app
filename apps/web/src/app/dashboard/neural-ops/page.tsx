"use client";
import React, { useState } from "react";
import { Sparkles, Brain, ShieldAlert, Check, TrendingUp, Cpu, Gauge, Lock, Eye, AlertTriangle } from "lucide-react";
import { useGenerateAiCampaign } from "@/hooks/useApi";
import { useSubscription } from "@/components/SubscriptionContext";
import { FeatureGate } from "@/components/FeatureGate";
import { UpgradeModal } from "@/components/UpgradeModal";

export default function NeuralOpsPage() {
  const { mutate: generateAiCampaign } = useGenerateAiCampaign();
  const { plan, changePlan } = useSubscription();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [successIds, setSuccessIds] = useState<string[]>([]);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [proModalOpen, setProModalOpen] = useState(false);

  const [recommendations, setRecommendations] = useState([
    { id: "rec_1", title: "Increase budget for Summer Sale - Search by 15%", description: "Google Ads campaign shows high ROAS efficiency (6.45x). Shifting ₹25,000 will likely increase conversions.", impact: "High Impact", value: "+₹38,400 Revenue Potential", type: "Budget" },
    { id: "rec_2", title: "Pause 4 low-converting search terms", description: "Keywords like 'cheap saas platform' have high CPC but zero conversions. Pause to conserve daily spend.", impact: "Medium Impact", value: "₹4,200/mo Savings", type: "Keyword" },
    { id: "rec_3", title: "Refresh creative copy for Meta Retargeting", description: "Ad frequency has reached 4.8. Click-through rate dropped by 18%. Revise headlines to restore conversion levels.", impact: "High Impact", value: "+12% CTR recovery", type: "Creative" }
  ]);

  const handleApply = async (id: string) => {
    setLoadingId(id);
    try {
      await generateAiCampaign({ recommendationId: id });
      setLoadingId(null);
      setSuccessIds([...successIds, id]);
    } catch (err) {
      setLoadingId(null);
      console.error("Error applying recommendation", err);
    }
  };

  const isRevenue = plan === "Revenue";

  const pageContent = (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            <Brain size={24} className="text-emerald-500" />
            <span>Neural Ops (AI Control)</span>
          </h1>
          <p className="text-gray-500 dark:text-zinc-400 text-sm mt-0.5">Control the AI optimization engine, forecast models, and recommendation pipelines.</p>
        </div>
        <div className="flex items-center gap-3 bg-white dark:bg-[#0D121F] border border-gray-200/80 dark:border-[#1B2438] rounded-xl px-4 py-2.5 shadow-sm">
          <span className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wide">AI Autopilot Status</span>
          <button
            onClick={() => setAiEnabled(!aiEnabled)}
            className={`w-12 h-6 rounded-full transition-all relative flex items-center ${
              aiEnabled ? "bg-emerald-500 justify-end" : "bg-gray-200 dark:bg-zinc-800 justify-start"
            } px-0.5`}
          >
            <span className="w-5 h-5 rounded-full bg-white shadow-sm block"></span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Core Controls */}
        <div className="md:col-span-2 bg-white dark:bg-[#0D121F] border border-gray-200/80 dark:border-[#1B2438] rounded-2xl p-6 shadow-sm space-y-6">
          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles size={18} className="text-emerald-500" />
            <span>Pending AI Recommendations</span>
          </h3>

          <div className="space-y-4">
            {recommendations.map((rec) => {
              const isApplied = successIds.includes(rec.id);
              return (
                <div
                  key={rec.id}
                  className={`p-5 border rounded-2xl transition-all ${
                    isApplied
                      ? "bg-emerald-50/20 dark:bg-emerald-500/5 border-emerald-100 dark:border-emerald-500/10 opacity-60"
                      : "bg-gray-50/30 dark:bg-[#0A0F1D]/30 border-gray-100 dark:border-[#1C283F] hover:border-gray-200 dark:hover:border-[#1B2438]"
                  }`}
                >
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <div>
                      <span className="text-[10px] font-bold text-violet-600 bg-violet-50 dark:bg-violet-500/10 px-2 py-0.5 rounded-full border border-violet-100/60 uppercase">
                        {rec.type}
                      </span>
                      <h4 className="font-bold text-gray-900 dark:text-white text-sm mt-1">{rec.title}</h4>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      rec.impact === "High Impact" ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20" : "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20"
                    }`}>
                      {rec.impact}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium leading-relaxed my-3">{rec.description}</p>

                  <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-[#1B2438]">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{rec.value}</span>
                    {isApplied ? (
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Check size={14} />
                        <span>Applied</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleApply(rec.id)}
                        disabled={loadingId === rec.id || !aiEnabled}
                        className={`font-semibold text-xs px-4 py-2 rounded-xl transition-all ${
                          !aiEnabled
                            ? "bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-zinc-600 cursor-not-allowed"
                            : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm shadow-emerald-500/10"
                        }`}
                      >
                        {loadingId === rec.id ? "Applying AI..." : "Apply Adjustment"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar Ops Status */}
        <div className="space-y-6">
          {/* Engine Parameters */}
          <div className="bg-white dark:bg-[#0D121F] border border-gray-200/80 dark:border-[#1B2438] rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 dark:text-white">Optimization Channels</h3>
            
            <ChannelToggle label="Bid Cap Operations" desc="Dynamic pacing updates" active={true} />
            <ChannelToggle label="Creative Copilot" desc="AI Copy adjustments" active={true} />
            <ChannelToggle label="Budget Fluid Allocation" desc="Cross-network spend shifting" active={false} />
            <ChannelToggle label="Audience Exhaustion Watch" desc="Auto-expands lookalikes" active={true} />
          </div>

          {/* Model Status */}
          <div className="bg-white dark:bg-[#0D121F] border border-gray-200/80 dark:border-[#1B2438] rounded-2xl p-6 shadow-sm space-y-4 relative overflow-hidden">
            <h3 className="font-bold text-gray-900 dark:text-white">Models Connected</h3>
            <div className="space-y-3 text-xs font-semibold text-gray-500 dark:text-zinc-400">
              <ModelRow name="GPT-4o (Structured Bids)" status="Operational" />
              <ModelRow name="Claude 3.5 (Creative Copy)" status="Operational" />
              
              {/* Pro Forecasting Model */}
              <div className="relative">
                <ModelRow name="AI Forecast Engine" status={isRevenue ? "LOCKED" : "Synchronized"} isLocked={isRevenue} />
                {isRevenue && (
                  <div className="absolute inset-0 bg-white/40 dark:bg-[#0D121F]/60 flex items-center justify-end pr-2 pointer-events-auto">
                    <button
                      onClick={() => setProModalOpen(true)}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-sm flex items-center gap-0.5 hover:scale-105 transition-all"
                    >
                      <Lock size={8} />
                      <span>Unlock Pro</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pro Locked Strategy Center */}
      <div className="bg-white dark:bg-[#0D121F] border border-gray-200 dark:border-[#1B2438] rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <TrendingUp size={18} className="text-emerald-500" />
          <span>Predictive Revenue Strategy</span>
        </h3>
        
        {/* Blurred Content */}
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${isRevenue ? "filter blur-[4px] opacity-40 pointer-events-none select-none" : ""}`}>
          <div className="p-4 border border-gray-100 dark:border-[#1C283F] bg-gray-50/20 dark:bg-[#0A0F1D]/20 rounded-xl space-y-2">
            <span className="text-[9px] font-extrabold uppercase text-gray-400 block">ROAS Trend Prediction</span>
            <p className="text-2xl font-black text-gray-900 dark:text-white">5.82x</p>
            <p className="text-[10px] text-emerald-500 font-bold">Estimated for next 14 days (+14.8%)</p>
          </div>
          <div className="p-4 border border-gray-100 dark:border-[#1C283F] bg-gray-50/20 dark:bg-[#0A0F1D]/20 rounded-xl space-y-2">
            <span className="text-[9px] font-extrabold uppercase text-gray-400 block">Opportunity Scanner</span>
            <p className="text-xs font-bold text-gray-800 dark:text-zinc-200">High efficiency gap detected in &quot;SaaS workflow&quot; keywords in EU markets.</p>
          </div>
          <div className="p-4 border border-gray-100 dark:border-[#1C283F] bg-gray-50/20 dark:bg-[#0A0F1D]/20 rounded-xl space-y-2">
            <span className="text-[9px] font-extrabold uppercase text-gray-400 block">AI Revenue Advisor</span>
            <p className="text-xs text-gray-500 dark:text-zinc-400">Weekly strategic recommendation reports generated for EcoMart India.</p>
          </div>
        </div>

        {/* Lock Overlay for Revenue users */}
        {isRevenue && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/40 dark:bg-[#0D121F]/60 backdrop-blur-[2px] p-6 text-center">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mb-2">
              <Lock size={18} />
            </div>
            <h4 className="font-bold text-sm text-gray-900 dark:text-white">Unlock Predictive Analytics & Forecasting</h4>
            <p className="text-xs text-gray-400 max-w-xs mt-1 mb-3">AI Forecast Engine, Opportunity Scanner, and strategy recommendations are available on Pro.</p>
            <button
              onClick={() => setProModalOpen(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-1.5 rounded-xl shadow-md transition-all hover:scale-105"
            >
              Upgrade to Pro Plan
            </button>
          </div>
        )}
      </div>

      <UpgradeModal
        isOpen={proModalOpen}
        onClose={() => setProModalOpen(false)}
        requiredPlan="pro"
        featureName="Predictive Analytics & Forecasting"
        benefits={[
          "AI Forecast Engine (predict future campaign ROAS)",
          "AI Opportunity Scanner (find untapped high-conversion keywords)",
          "AI Revenue Advisor (weekly custom strategy recommendations)",
          "Support for up to 100 Automation Forge rules"
        ]}
        onUpgrade={changePlan}
      />
    </div>
  );

  return (
    <FeatureGate
      moduleKey="neural-ops"
      requiredPlan="Revenue"
      featureName="Neural Ops (AI Control)"
      description="Unlock automated AI optimization, budget allocation adjustments, creative copy scanning, and dynamic autopiloting tools."
      benefits={[
        "AI Campaign Builder & Copy Creator",
        "Audience Builder optimizations",
        "Budget allocation recommendations",
        "Real-time optimization channel controls"
      ]}
    >
      {pageContent}
    </FeatureGate>
  );
}

function ChannelToggle({ label, desc, active }: { label: string; desc: string; active: boolean }) {
  const [isEnabled, setIsEnabled] = useState(active);
  return (
    <div className="flex justify-between items-center p-3 bg-gray-50/50 dark:bg-[#0A0F1D]/20 border border-gray-100 dark:border-[#1C283F] rounded-xl">
      <div>
        <p className="text-xs font-bold text-gray-800 dark:text-zinc-200">{label}</p>
        <p className="text-[10px] text-gray-400 dark:text-zinc-500 font-medium">{desc}</p>
      </div>
      <button
        onClick={() => setIsEnabled(!isEnabled)}
        className={`w-10 h-5 rounded-full transition-all relative flex items-center ${
          isEnabled ? "bg-emerald-500 justify-end" : "bg-gray-200 dark:bg-zinc-800 justify-start"
        } px-0.5`}
      >
        <span className="w-4 h-4 rounded-full bg-white shadow-sm block"></span>
      </button>
    </div>
  );
}

function ModelRow({ name, status, isLocked = false }: { name: string; status: string; isLocked?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className={isLocked ? "opacity-40" : ""}>{name}</span>
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
        isLocked ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400" : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      }`}>
        {status}
      </span>
    </div>
  );
}
