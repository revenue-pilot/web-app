"use client";
import React, { useState } from "react";
import { ShieldCheck, ShieldAlert, AlertTriangle, Key, Search, Ban, Play, Trash2 } from "lucide-react";

interface ThreatLog {
  id: string;
  ip: string;
  location: string;
  user: string;
  action: string;
  severity: "Critical" | "High" | "Medium";
  date: string;
}

export default function AdminFortressPage() {
  const [activeNotification, setActiveNotification] = useState("");
  const [threats, setThreats] = useState<ThreatLog[]>([]);

  const triggerNotification = (msg: string) => {
    setActiveNotification(msg);
    setTimeout(() => setActiveNotification(""), 3000);
  };

  const handleBlockIP = (ip: string) => {
    triggerNotification(`Blocked IP ${ip} across platform firewall.`);
  };

  const handleForceMFA = () => {
    triggerNotification(`Enforced compulsory MFA enrollment for all administrative roles.`);
  };

  const handleResetSessions = () => {
    triggerNotification(`Invalidated all active platform OAuth sessions.`);
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <ShieldCheck size={24} className="text-[#50BB8F]" />
            <span>Fortress Security Operations</span>
          </h1>
          <p className="text-zinc-400 text-xs mt-0.5">Audit global logins threat vectors, monitor MFA enrollment metrics, and lock suspicious accounts.</p>
        </div>
      </div>

      {activeNotification && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2">
          <ShieldCheck size={14} />
          <span>{activeNotification}</span>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-[#0D121F] border border-[#1B2438] p-4 rounded-xl">
          <span className="text-[9px] font-bold text-zinc-500 uppercase block">Failed Logins (24h)</span>
          <span className="text-lg font-bold text-white block mt-1">0 Attempts</span>
        </div>
        <div className="bg-[#0D121F] border border-[#1B2438] p-4 rounded-xl">
          <span className="text-[9px] font-bold text-zinc-500 uppercase block">MFA Enrollment Rate</span>
          <span className="text-lg font-bold text-emerald-400 block mt-1">0%</span>
        </div>
        <div className="bg-[#0D121F] border border-[#1B2438] p-4 rounded-xl">
          <span className="text-[9px] font-bold text-zinc-500 uppercase block">Active Sessions</span>
          <span className="text-lg font-bold text-white block mt-1">0 sessions</span>
        </div>
        <div className="bg-[#0D121F] border border-[#1B2438] p-4 rounded-xl border-red-500/20 bg-red-500/5">
          <span className="text-[9px] font-bold text-red-500 uppercase block">Blocked Threat IPs</span>
          <span className="text-lg font-bold text-red-400 block mt-1">0 IPs</span>
        </div>
      </div>

      {/* Operations Ledger Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Threat incidents (8 cols) */}
        <div className="lg:col-span-8 bg-[#0D121F] border border-[#1B2438] p-5 rounded-2xl space-y-4">
          <h3 className="font-bold text-white text-xs uppercase tracking-wider pb-2 border-b border-[#1B2438]">
            Threat Incidents Activity Ledger
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#1B2438] text-zinc-500 font-bold uppercase tracking-wider">
                  <th className="pb-3">Threat Vector / IP</th>
                  <th className="pb-3">Affected Account</th>
                  <th className="pb-3 text-center">Threat Level</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="font-semibold text-zinc-300">
                {threats.length === 0 ? (
                  <tr><td colSpan={4} className="py-4 text-center">No threats detected.</td></tr>
                ) : threats.map((t) => (
                  <tr key={t.id} className="border-b border-[#1C283F] hover:bg-[#151D2F] transition-colors">
                    <td className="py-3">
                      <span className="font-bold text-white block">{t.action}</span>
                      <span className="text-[8px] text-zinc-500 font-semibold block mt-0.5">{t.ip} • {t.location}</span>
                    </td>
                    <td className="py-3 text-zinc-400">{t.user}</td>
                    <td className="py-3">
                      <div className="flex justify-center">
                        <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full border ${
                          t.severity === "Critical" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                          t.severity === "High" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                          "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        }`}>
                          {t.severity}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => handleBlockIP(t.ip)}
                        className="bg-zinc-800 hover:bg-zinc-700 text-red-400 border border-red-500/10 px-2 py-1 rounded text-[9px] transition-all font-bold"
                      >
                        Block IP
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Global Security Controls (4 cols) */}
        <div className="lg:col-span-4 bg-[#0D121F] border border-[#1B2438] p-5 rounded-2xl space-y-4">
          <h3 className="font-bold text-white text-xs uppercase tracking-wider pb-2 border-b border-[#1B2438]">
            Threat Action Command
          </h3>

          <div className="space-y-3">
            <button
              onClick={handleForceMFA}
              className="w-full bg-[#0A0F1D] hover:bg-[#151D2F] border border-[#1C283F] text-xs font-bold text-white py-3 px-4 rounded-xl text-left flex justify-between items-center transition-all"
            >
              <span>Enforce MFA globally</span>
              <span className="text-[9px] text-emerald-400 font-extrabold">&rarr;</span>
            </button>
            <button
              onClick={handleResetSessions}
              className="w-full bg-[#0A0F1D] hover:bg-[#151D2F] border border-[#1C283F] text-xs font-bold text-white py-3 px-4 rounded-xl text-left flex justify-between items-center transition-all"
            >
              <span>Reset OAuth Sessions</span>
              <span className="text-[9px] text-emerald-400 font-extrabold">&rarr;</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
