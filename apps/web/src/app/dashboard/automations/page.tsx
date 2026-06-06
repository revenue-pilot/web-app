"use client";
import React, { useState } from "react";
import { Plus, Trash2, CheckCircle2, Play, Pause, Settings2 } from "lucide-react";
import { useSubscription } from "@/components/SubscriptionContext";
import { FeatureGate } from "@/components/FeatureGate";
import { UpgradeModal } from "@/components/UpgradeModal";

export default function AutomationsPage() {
  const { plan, changePlan } = useSubscription();
  const [modalOpen, setModalOpen] = useState(false);
  const [rules, setRules] = useState([
    { id: 1, name: "Stop Bleeding Ads", condition: "ROAS < 1.0 AND Spend > ₹40,000", action: "Pause Campaign", status: "Active" },
    { id: 2, name: "Scale Winners", condition: "ROAS > 3.0 AND CPA < ₹1,600", action: "Increase Budget 20%", status: "Active" }
  ]);

  const maxRules = plan === "Revenue" ? 10 : plan === "pro" ? 100 : 99999;
  const currentCount = rules.length;

  const handleCreateRule = () => {
    if (rules.length >= maxRules) {
      setModalOpen(true);
    } else {
      const newRuleId = rules.length + 1;
      const newRule = {
        id: newRuleId,
        name: `New Optimization Rule #${newRuleId}`,
        condition: "ROAS > 2.5 AND Spend > ₹10,000",
        action: "Adjust Bid +10%",
        status: "Active"
      };
      setRules([...rules, newRule]);
    }
  };

  const handleDeleteRule = (id: number) => {
    setRules(rules.filter(r => r.id !== id));
  };

  const pageContent = (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            <Settings2 size={24} className="text-emerald-500" />
            <span>Automation Forge</span>
          </h1>
          <p className="text-gray-500 dark:text-zinc-400 text-sm mt-0.5">Create &quot;If This Then That&quot; rules to manage your ad budgets and bids 24/7.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Plan Rules Limit Indicator */}
          {plan !== "enterprise" && (
            <div className="text-xs font-bold text-gray-500 dark:text-zinc-400 bg-white dark:bg-[#0D121F] px-3.5 py-2 rounded-xl border border-gray-200 dark:border-[#1B2438] flex items-center gap-2 shadow-sm">
              <span>Usage limits:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{currentCount} / {maxRules} rules active</span>
            </div>
          )}
          <button
            onClick={handleCreateRule}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md shadow-emerald-500/10 text-sm hover:scale-102 active:scale-95"
          >
            <Plus size={16} /> 
            <span>New Rule</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {rules.map((rule) => (
          <div key={rule.id} className="bg-white dark:bg-[#0D121F] border border-gray-200/80 dark:border-[#1B2438] rounded-2xl p-6 hover:shadow-md transition-all group flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-100/30 shrink-0">
                    <Settings2 size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-base">{rule.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="flex h-1.5 w-1.5 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                      </span>
                      <span className="text-xs text-gray-400 dark:text-zinc-500 font-semibold">{rule.status}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteRule(rule.id)}
                  className="text-gray-400 hover:text-red-500 p-1.5 hover:bg-gray-50 dark:hover:bg-[#151D2F] rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="space-y-3 mt-6">
                <div className="bg-[#F8FAFC] dark:bg-[#0A0F1D] rounded-xl p-4 border border-gray-100 dark:border-[#1C283F]">
                  <p className="text-[9px] text-gray-400 dark:text-zinc-500 uppercase font-extrabold tracking-wider mb-1">IF CONDITION</p>
                  <p className="font-mono text-xs text-purple-600 dark:text-purple-300 font-bold">{rule.condition}</p>
                </div>
                <div className="bg-[#F8FAFC] dark:bg-[#0A0F1D] rounded-xl p-4 border border-gray-100 dark:border-[#1C283F]">
                  <p className="text-[9px] text-gray-400 dark:text-zinc-500 uppercase font-extrabold tracking-wider mb-1">THEN ACTION</p>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 text-xs">
                    <CheckCircle2 size={14} /> 
                    <span>{rule.action}</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3 border-t border-gray-100 dark:border-[#1B2438] pt-4">
              <button className="flex-1 bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-[#151D2F] text-gray-600 dark:text-zinc-300 py-2 rounded-xl text-xs font-bold transition-all border border-gray-200 dark:border-[#1C283F] flex justify-center items-center gap-1.5">
                <Pause size={14} /> 
                <span>Pause Rule</span>
              </button>
              <button className="flex-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 py-2 rounded-xl text-xs font-bold transition-all border border-emerald-100 dark:border-emerald-500/20 flex justify-center items-center gap-1.5">
                <Play size={14} /> 
                <span>Run Now</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      <UpgradeModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        requiredPlan="pro"
        featureName="Additional Automation Rules"
        benefits={[
          "Scale up to 100 active automation rules",
          "Advanced automation conditions (attributions, cohorts)",
          "Access to AI Opportunity Scanner and weekly reports",
          "Dedicated Enterprise support controls"
        ]}
        onUpgrade={changePlan}
      />
    </div>
  );

  return (
    <FeatureGate
      moduleKey="automations"
      requiredPlan="Revenue"
      featureName="Automation Forge"
      description="Create powerful automated rules to manage campaign budgets, pause failing ad sets, and scale winners automatically 24/7."
      benefits={[
        "ROAS Safety Pacing Rules",
        "Automated Budget Caps",
        "AI Optimization triggers",
        "Up to 10 rules on Revenue tier"
      ]}
    >
      {pageContent}
    </FeatureGate>
  );
}
