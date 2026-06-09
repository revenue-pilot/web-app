"use client";
import React, { useState } from "react";
import { Lock, Sparkles, ArrowRight, Check } from "lucide-react";
import { PlanTier, useSubscription } from "./SubscriptionContext";
import { UpgradeModal } from "./UpgradeModal";

interface FeatureGateProps {
  moduleKey: string;
  requiredPlan: PlanTier;
  featureName: string;
  description: string;
  benefits?: string[];
  mockComponent?: React.ReactNode;
  children: React.ReactNode;
}

export function FeatureGate({
  moduleKey,
  requiredPlan,
  featureName,
  description,
  benefits = [],
  mockComponent,
  children
}: FeatureGateProps) {
  const { plan, changePlan, canAccess } = useSubscription();
  const [modalOpen, setModalOpen] = useState(false);

  const hasAccess = canAccess(moduleKey);

  if (hasAccess) {
    return <>{children}</>;
  }

  const planTitles: Record<PlanTier, string> = {
    starter: "Starter Plan",
    Revenue: "Revenue Plan",
    pro: "Pro Plan",
    enterprise: "Enterprise Plan"
  };

  const defaultBenefits: Record<PlanTier, string[]> = {
    starter: [],
    Revenue: [
      "Access basic campaign creation and optimization tools",
      "Manage up to 15 active ad campaigns simultaneously",
      "Upload up to 50GB of creative assets to your Vault"
    ],
    pro: [
      "Full AI Opportunity Scanner & Optimization Advisor",
      "Advanced attribution models & cohort analysis graphs",
      "Up to 100 active automation rules in Automation Forge"
    ],
    enterprise: [
      "Multi-tenant Client Constellation (Agency Portal)",
      "Fully customized Whitelabel custom domains & support email",
      "Enterprise security compliance controls & SSO integration",
      "Unlimited Campaigns, Workspaces, and team user seats"
    ]
  };

  const displayBenefits = benefits.length > 0 ? benefits : defaultBenefits[requiredPlan];

  // Gate mockComponent behind development environment for security
  const isDevelopment = typeof window !== 'undefined' && process.env.NODE_ENV === 'development';
  const safeMockComponent = isDevelopment ? mockComponent : undefined;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12 relative">
      {/* Background Teaser Component (Blurred out) */}
      <div className="relative pointer-events-none select-none filter blur-[6px] opacity-25">
        {safeMockComponent ? (
          safeMockComponent
        ) : (
          <div className="bg-white dark:bg-[#0D121F] border border-gray-200 dark:border-[#1B2438] rounded-2xl p-8 space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-zinc-800 rounded w-1/4 animate-pulse"></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="h-32 bg-gray-200 dark:bg-zinc-800 rounded animate-pulse"></div>
              <div className="h-32 bg-gray-200 dark:bg-zinc-800 rounded animate-pulse"></div>
              <div className="h-32 bg-gray-200 dark:bg-zinc-800 rounded animate-pulse"></div>
            </div>
            <div className="h-64 bg-gray-200 dark:bg-zinc-800 rounded w-full animate-pulse"></div>
          </div>
        )}
      </div>

      {/* Lock Overlay Panel */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="bg-white/80 dark:bg-[#0D121F]/85 border border-gray-200/80 dark:border-[#1B2438]/80 backdrop-blur-md max-w-2xl w-full p-8 rounded-2xl shadow-2xl flex flex-col items-center text-center space-y-6">
          {/* Lock Icon */}
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 text-emerald-500 flex items-center justify-center relative">
            <Lock size={26} className="relative z-10" />
            <span className="absolute inset-0 rounded-2xl bg-emerald-500/10 animate-ping opacity-75"></span>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-extrabold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 uppercase tracking-widest">
              Available in {planTitles[requiredPlan]}
            </span>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Unlock {featureName}</h2>
            <p className="text-sm text-gray-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
              {description}
            </p>
          </div>

          {/* Benefits Bullet Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left border-y border-gray-100 dark:border-[#1B2438] py-6 w-full max-w-lg">
            {displayBenefits.map((benefit, idx) => (
              <div key={idx} className="flex gap-2.5 items-start">
                <span className="p-0.5 rounded-full bg-emerald-500/15 text-emerald-500 mt-0.5">
                  <Check size={12} strokeWidth={3} />
                </span>
                <span className="text-xs font-semibold text-gray-700 dark:text-zinc-300 leading-snug">
                  {benefit}
                </span>
              </div>
            ))}
          </div>

          {/* CTA Trigger */}
          <button
            onClick={() => setModalOpen(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all text-xs flex items-center gap-1.5"
          >
            <span>Upgrade to {planTitles[requiredPlan]}</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      <UpgradeModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        requiredPlan={requiredPlan}
        featureName={featureName}
        benefits={displayBenefits}
        onUpgrade={changePlan}
      />
    </div>
  );
}
