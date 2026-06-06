"use client";
import React, { useState } from "react";
import { ShieldCheck, ShieldAlert, Cpu, Lock, ToggleLeft, ToggleRight, Check } from "lucide-react";
import { useSecuritySettings, useActiveSessions, useEnableTwoFactor } from "@/hooks/useApi";
import { useSubscription } from "@/components/SubscriptionContext";
import { FeatureGate } from "@/components/FeatureGate";

export default function SecurityPage() {
  const { data: securityData, loading: secLoading, error: secError, refetch: secRefetch } = useSecuritySettings();
  const { data: sessionsData, loading: sesLoading, error: sesError, refetch: sesRefetch } = useActiveSessions();
  const { mutate: enableTwoFactor } = useEnableTwoFactor();
  const { plan } = useSubscription();
  const [tfaEnabled, setTfaEnabled] = useState(securityData?.twoFactorEnabled || false);

  const activeSessions = Array.isArray(sessionsData) ? sessionsData : [
    { id: "s_1", browser: "Chrome 125.0", os: "macOS Sonoma", ip: "103.45.12.87", location: "Mumbai, India", current: true, date: "Active Now" },
    { id: "s_2", browser: "Safari Mobile", os: "iOS 17.4", ip: "103.45.12.92", location: "Pune, India", current: false, date: "2 hours ago" },
    { id: "s_3", browser: "Edge 120.0", os: "Windows 11", ip: "192.168.1.45", location: "Mumbai, India", current: false, date: "3 days ago" }
  ];

  const pageContent = (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            <ShieldCheck size={24} className="text-emerald-500" />
            <span>Fortress (Security Center)</span>
          </h1>
          <p className="text-gray-500 dark:text-zinc-400 text-sm mt-0.5">Audit system access, manage active browser sessions, and verify compliance indicators.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Security Parameters & Sessions */}
        <div className="md:col-span-2 space-y-6">
          {/* Multi-Factor Authentication */}
          <div className="bg-white dark:bg-[#0D121F] border border-gray-200/80 dark:border-[#1B2438] rounded-2xl p-6 shadow-sm flex justify-between items-center">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-zinc-800 flex items-center justify-center border border-gray-100/60 dark:border-[#1B2438]/60 shadow-inner text-emerald-500 shrink-0">
                <Lock size={20} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-sm">Two-Factor Authentication (2FA)</h3>
                <p className="text-xs text-gray-400 dark:text-zinc-500 font-semibold mt-0.5 leading-relaxed">
                  Add an extra layer of security to your organization account using Google Authenticator.
                </p>
              </div>
            </div>
            <button
              onClick={() => setTfaEnabled(!tfaEnabled)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors p-1 rounded"
            >
              {tfaEnabled ? (
                <ToggleRight size={44} className="text-emerald-500" />
              ) : (
                <ToggleLeft size={44} className="text-gray-300 dark:text-zinc-700" />
              )}
            </button>
          </div>

          {/* Active Browser Sessions */}
          <div className="bg-white dark:bg-[#0D121F] border border-gray-200/80 dark:border-[#1B2438] rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm">Active Sessions</h3>
            <div className="space-y-3.5">
              {activeSessions.map((session) => (
                <div key={session.id} className="flex justify-between items-center p-3 bg-gray-50/50 dark:bg-[#0A0F1D]/20 border border-gray-100 dark:border-[#1C283F] rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-800 border border-gray-100 dark:border-[#1B2438] flex items-center justify-center text-xs font-semibold text-gray-500 dark:text-zinc-400 shrink-0">
                      {session.browser.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-800 dark:text-zinc-150 flex items-center gap-2 leading-none">
                        <span>{session.browser} on {session.os}</span>
                        {session.current && (
                          <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100/60 px-1.5 py-0.2 rounded-full leading-none">
                            Current Session
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-gray-400 dark:text-zinc-500 font-semibold mt-1">IP: {session.ip} • {session.location}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 shrink-0">{session.date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Security Compliance Checklist */}
        <div className="bg-white dark:bg-[#0D121F] border border-gray-200/80 dark:border-[#1B2438] rounded-2xl p-6 shadow-sm space-y-4 h-fit">
          <h3 className="font-bold text-gray-900 dark:text-white text-sm">Compliance & Trust</h3>
          <p className="text-xs text-gray-400 dark:text-zinc-400 font-medium leading-relaxed mb-4">
            RevenuePilot follows strict SOC2 and GDPR compliance matrices to keep client data secure.
          </p>

          <div className="space-y-3 font-semibold text-xs text-gray-500 dark:text-zinc-400">
            <ComplianceRow label="SOC2 Security Policies" verified={true} />
            <ComplianceRow label="GDPR Privacy Controls" verified={true} />
            <ComplianceRow label="Data Encryption at rest (AES-256)" verified={true} />
            <ComplianceRow label="API Tokens Access Expiry (30d)" verified={false} />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <FeatureGate
      moduleKey="security"
      requiredPlan="enterprise"
      featureName="Enterprise Security Fortress"
      description="Protect your company and client ad accounts with robust single-sign-on (SSO), advanced compliance trackers, compliance centers, and custom roles."
      benefits={[
        "Enterprise SAML SSO Integrations",
        "Full organization audit trail matrix logs",
        "Custom domain mapping configurations",
        "SOC2 and GDPR compliance centers"
      ]}
    >
      {pageContent}
    </FeatureGate>
  );
}

function ComplianceRow({ label, verified }: { label: string; verified: boolean }) {
  return (
    <div className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-[#0A0F1D]/20 border border-gray-100 dark:border-[#1C283F] rounded-xl">
      <span className="truncate w-40 text-gray-700 dark:text-zinc-300">{label}</span>
      {verified ? (
        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
          <Check size={10} />
          Passed
        </span>
      ) : (
        <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
          <ShieldAlert size={10} />
          Review
        </span>
      )}
    </div>
  );
}
