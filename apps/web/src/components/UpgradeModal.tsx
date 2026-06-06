"use client";
import React from "react";
import { Sparkles, Shield, Zap, X, Check } from "lucide-react";
import { PlanTier } from "./SubscriptionContext";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  requiredPlan: PlanTier;
  featureName: string;
  benefits?: string[];
  onUpgrade: (plan: PlanTier) => void;
}

export function UpgradeModal({
  isOpen,
  onClose,
  requiredPlan,
  featureName,
  benefits = [],
  onUpgrade
}: UpgradeModalProps) {
  if (!isOpen) return null;

  const planTitles: Record<PlanTier, string> = {
    starter: "Starter Plan",
    Revenue: "Revenue Plan",
    pro: "Pro Plan",
    enterprise: "Enterprise Plan"
  };

  const planPricing: Record<PlanTier, string> = {
    starter: "₹999/mo",
    Revenue: "₹1,999/mo",
    pro: "₹4,999/mo",
    enterprise: "Custom Pricing"
  };

  const defaultBenefits: Record<PlanTier, string[]> = {
    starter: [
      "Access core campaign controls",
      "Manage 3 active campaigns",
      "Upload up to 5GB of media files"
    ],
    Revenue: [
      "AI Campaign Builder & Copy Creator",
      "Basic Automation Rules (up to 10 active)",
      "Manage up to 15 active campaigns",
      "Expand storage capacity to 50GB"
    ],
    pro: [
      "AI Opportunity Scanner & Revenue Advisor",
      "Unlock Advanced Analytics & cohort maps",
      "Increase automations to 100 active rules",
      "Expand storage to 200GB"
    ],
    enterprise: [
      "Client Constellation (Multi-tenant agency portals)",
      "Custom Whitelabel Domains & branding",
      "Unlimited Campaigns, Workspaces, and team users",
      "Dedicated Enterprise SSO & compliance controls"
    ]
  };

  const displayBenefits = benefits.length > 0 ? benefits : defaultBenefits[requiredPlan];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#0D121F] border border-gray-200 dark:border-[#1B2438] w-full max-w-lg rounded-2xl shadow-2xl relative overflow-hidden flex flex-col">
        {/* Header decoration */}
        <div className="h-2 bg-gradient-to-r from-emerald-400 to-teal-500 w-full" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-[#151D2F] transition-colors"
        >
          <X size={18} />
        </button>

        {/* Content */}
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-100/30">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">Unlock {featureName}</h3>
              <p className="text-xs text-gray-400">Expand your capabilities with {planTitles[requiredPlan]}</p>
            </div>
          </div>

          <div className="bg-gray-50/50 dark:bg-[#0A0F1D] border border-gray-100 dark:border-[#1C283F] p-4 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Features included in {planTitles[requiredPlan]}:</h4>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-zinc-200 font-medium">
              {displayBenefits.map((benefit, idx) => (
                <li key={idx} className="flex gap-2.5 items-start">
                  <span className="p-0.5 rounded-full bg-emerald-500/10 text-emerald-500 shrink-0 mt-0.5">
                    <Check size={12} strokeWidth={3} />
                  </span>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 dark:border-[#1B2438] pt-4 mt-6">
            <div>
              <span className="text-[10px] text-gray-400 uppercase block font-bold">Plan Price</span>
              <span className="text-2xl font-black text-gray-900 dark:text-white leading-none">{planPricing[requiredPlan]}</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="text-xs font-bold text-gray-500 hover:text-gray-700 dark:hover:text-white px-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#1B2438] hover:bg-gray-50 dark:hover:bg-[#151D2F] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onUpgrade(requiredPlan);
                  onClose();
                }}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all text-xs flex items-center gap-1.5"
              >
                <Zap size={14} fill="currentColor" />
                <span>Upgrade Now</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
