"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

export type PlanTier = "starter" | "Revenue" | "pro" | "enterprise";

export interface PlanLimits {
  campaigns: number;
  workspaces: number;
  team: number;
  storage: number; // in GB
  adAccounts: number; // per channel
  clients: number;
}

export interface Usage {
  campaigns: number;
  workspaces: number;
  team: number;
  storage: number; // in GB
  adAccounts: number;
  clients: number;
}

interface SubscriptionContextProps {
  plan: PlanTier;
  changePlan: (newPlan: PlanTier) => void;
  limits: PlanLimits;
  usage: Usage;
  canAccess: (module: string) => boolean;
  getUsagePercentage: (key: keyof Usage) => number;
  isNearingLimit: (key: keyof Usage) => boolean; // > 75%
  isAtLimit: (key: keyof Usage) => boolean; // >= 100%
}

const planLimitsMap: Record<PlanTier, PlanLimits> = {
  starter: { campaigns: 3, workspaces: 1, team: 1, storage: 5, adAccounts: 1, clients: 0 },
  Revenue: { campaigns: 15, workspaces: 3, team: 3, storage: 50, adAccounts: 5, clients: 0 },
  pro: { campaigns: 9999, workspaces: 10, team: 10, storage: 200, adAccounts: 9999, clients: 0 },
  enterprise: { campaigns: 9999, workspaces: 9999, team: 9999, storage: 9999, adAccounts: 9999, clients: 9999 }
};

// Mock current usage state (simulate starting values)
const mockUsage: Usage = {
  campaigns: 3,   // 3 campaigns created (Starter: 100%, Revenue: 20%)
  workspaces: 1,  // 1 workspace created (Starter: 100%, Revenue: 33%)
  team: 2,        // 2 members (Starter: 200%, Revenue: 66%)
  storage: 1.2,   // 1.2GB used (Starter: 24%)
  adAccounts: 1,  // 1 ad account (Starter: 100%)
  clients: 4      // 4 client accounts (Visible only on Enterprise)
};

const SubscriptionContext = createContext<SubscriptionContextProps | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [plan, setPlan] = useState<PlanTier>("starter");
  const [limits, setLimits] = useState<PlanLimits>(planLimitsMap.starter);
  const [usage, setUsage] = useState<Usage>({ campaigns: 0, workspaces: 0, team: 0, storage: 0, adAccounts: 0, clients: 0 });

  const refreshSubscription = async () => {
    try {
      const email = typeof window !== "undefined" ? localStorage.getItem("user_email") : null;
      const res = await fetch("/api/billing/subscriptions");
      const data = await res.json();
      if (data && data.plan) {
        const normalizedPlan = data.plan.toLowerCase() as PlanTier;
        setPlan(normalizedPlan);
        setLimits(data.limits || planLimitsMap[normalizedPlan]);
        setUsage(data.usage || { campaigns: 0, workspaces: 0, team: 0, storage: 0, adAccounts: 0, clients: 0 });
      }
    } catch (e) {
      console.warn("Failed to sync subscription details from API. Running in local state.");
    }
  };

  useEffect(() => {
    refreshSubscription();

    // Sync across tabs/windows
    const handleStorage = () => {
      refreshSubscription();
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const changePlan = async (newPlan: PlanTier) => {
    try {
      const priceMap: Record<PlanTier, number> = {
        starter: 999,
        Revenue: 1999,
        pro: 4999,
        enterprise: 15000
      };
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planName: newPlan, amount: priceMap[newPlan] })
      });
      const data = await res.json();
      if (data.success) {
        await refreshSubscription();
        window.dispatchEvent(new Event("storage"));
      }
    } catch (e) {
      console.error("Upgrade checkout transaction failed", e);
    }
  };

  const canAccess = (module: string): boolean => {
    switch (module.toLowerCase()) {
      case "neural-ops":
      case "automations":
      case "marketplace":
        return plan !== "starter";
      case "reports":
        return plan === "pro" || plan === "enterprise";
      case "clients":
      case "security":
        return plan === "enterprise";
      default:
        return true;
    }
  };

  const getUsagePercentage = (key: keyof Usage): number => {
    const limit = limits[key];
    const current = usage[key];
    if (limit >= 9999) return 0;
    return Math.round((current / limit) * 100);
  };

  const isNearingLimit = (key: keyof Usage): boolean => {
    const pct = getUsagePercentage(key);
    return pct >= 75 && pct < 100;
  };

  const isAtLimit = (key: keyof Usage): boolean => {
    const limit = limits[key];
    const current = usage[key];
    return current >= limit;
  };

  return (
    <SubscriptionContext.Provider
      value={{
        plan,
        changePlan,
        limits,
        usage,
        canAccess,
        getUsagePercentage,
        isNearingLimit,
        isAtLimit
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return context;
}
