"use client";
import React, { useState } from "react";
import { Link2, ShieldCheck, RefreshCw, AlertTriangle, CheckCircle, Search, ToggleLeft, ToggleRight } from "lucide-react";

interface IntegrationRecord {
  id: string;
  name: string;
  category: string; // Ads, Analytics, Payments, Communication, AI
  status: string; // Connected, Degraded, Disconnected
  connectedAccounts: number;
  errorRate: string;
  lastChecked: string;
}

export default function AdminIntegrationCommandPage() {
  const [integrations, setIntegrations] = useState<IntegrationRecord[]>([
    { id: "int_1", name: "Google Ads API", category: "Ads", status: "Connected", connectedAccounts: 120, errorRate: "0.02%", lastChecked: "5 mins ago" },
    { id: "int_2", name: "Meta Marketing API", category: "Ads", status: "Connected", connectedAccounts: 88, errorRate: "0.14%", lastChecked: "12 mins ago" },
    { id: "int_3", name: "Google Analytics 4", category: "Analytics", status: "Connected", connectedAccounts: 114, errorRate: "0.00%", lastChecked: "1 hr ago" },
    { id: "int_4", name: "Stripe Gateway", category: "Payments", status: "Connected", connectedAccounts: 1, errorRate: "0.00%", lastChecked: "2 mins ago" },
    { id: "int_5", name: "Razorpay Gateway", category: "Payments", status: "Connected", connectedAccounts: 1, errorRate: "0.01%", lastChecked: "4 mins ago" },
    { id: "int_6", name: "OpenAI Engine", category: "AI", status: "Degraded", connectedAccounts: 4, errorRate: "4.82%", lastChecked: "30s ago" },
    { id: "int_7", name: "Anthropic API", category: "AI", status: "Connected", connectedAccounts: 4, errorRate: "0.05%", lastChecked: "10 mins ago" },
    { id: "int_8", name: "Slack Alerts App", category: "Communication", status: "Connected", connectedAccounts: 45, errorRate: "0.10%", lastChecked: "4 hrs ago" },
    { id: "int_9", name: "WhatsApp Business API", category: "Communication", status: "Disconnected", connectedAccounts: 0, errorRate: "100%", lastChecked: "1 day ago" }
  ]);

  const [activeFilter, setActiveFilter] = useState("All");
  const categories = ["All", "Ads", "Analytics", "Payments", "AI", "Communication"];

  const filteredIntegrations = activeFilter === "All"
    ? integrations
    : integrations.filter(i => i.category === activeFilter);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Connected": return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      case "Degraded": return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      default: return "bg-red-500/10 text-red-400 border border-red-500/20";
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Link2 size={24} className="text-[#50BB8F]" />
          <span>Integration Command</span>
        </h1>
        <p className="text-zinc-400 text-xs mt-0.5">Manage global API gateway connections, monitor webhook health, and audit client account auth statuses.</p>
      </div>

      {/* Categories Switcher */}
      <div className="flex flex-wrap gap-2 border-b border-[#1B2438] pb-3">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setActiveFilter(c)}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
              activeFilter === c
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400 shadow-inner"
                : "bg-[#0D121F] border-[#1B2438] text-zinc-400 hover:text-white"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Integrations Table Grid */}
      <div className="bg-[#0D121F] border border-[#1B2438] p-5 rounded-2xl shadow-sm">
        <h3 className="font-bold text-white text-xs uppercase tracking-wider pb-2 border-b border-[#1B2438] mb-4">
          API Connection Matrix
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#1B2438] text-zinc-500 font-bold uppercase tracking-wider">
                <th className="pb-3">Integration Gateway</th>
                <th className="pb-3">Category</th>
                <th className="pb-3 text-right">Connected Accounts</th>
                <th className="pb-3 text-right">Error Rate</th>
                <th className="pb-3 text-center">Status</th>
                <th className="pb-3 text-right">Last Checked</th>
              </tr>
            </thead>
            <tbody className="font-semibold text-zinc-300">
              {filteredIntegrations.map((item) => (
                <tr key={item.id} className="border-b border-[#1C283F] hover:bg-[#151D2F] transition-colors">
                  <td className="py-3">
                    <span className="font-bold text-white block">{item.name}</span>
                    <span className="text-[8px] text-zinc-500 font-semibold block mt-0.5">ID: {item.id}</span>
                  </td>
                  <td className="py-3">
                    <span className="text-[9px] font-bold text-zinc-300 bg-zinc-850 border border-zinc-700 px-2 py-0.5 rounded">
                      {item.category}
                    </span>
                  </td>
                  <td className="py-3 text-right text-zinc-200">
                    {item.connectedAccounts} accounts
                  </td>
                  <td className={`py-3 text-right font-mono ${parseFloat(item.errorRate) > 1.0 ? "text-red-400" : "text-zinc-400"}`}>
                    {item.errorRate}
                  </td>
                  <td className="py-3">
                    <div className="flex justify-center">
                      <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${getStatusStyle(item.status)}`}>
                        {item.status}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 text-right text-zinc-500 font-mono">
                    {item.lastChecked}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
