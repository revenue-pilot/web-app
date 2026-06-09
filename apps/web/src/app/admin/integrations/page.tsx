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
  const [integrations, setIntegrations] = useState<IntegrationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    async function fetchIntegrations() {
      try {
        const token = localStorage.getItem("token") || localStorage.getItem("auth_token");
        const res = await fetch("/api/v1/admin/integrations", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          // We map the counts we got from the backend into the UI format
          setIntegrations([
            { id: "int_1", name: "Google Ads API", category: "Ads", status: data.googleAds > 0 ? "Connected" : "Disconnected", connectedAccounts: data.googleAds, errorRate: "0.00%", lastChecked: "Live" },
            { id: "int_2", name: "Meta Marketing API", category: "Ads", status: data.metaAds > 0 ? "Connected" : "Disconnected", connectedAccounts: data.metaAds, errorRate: "0.00%", lastChecked: "Live" },
            { id: "int_3", name: "Google Analytics 4", category: "Analytics", status: data.ga4 > 0 ? "Connected" : "Disconnected", connectedAccounts: data.ga4, errorRate: "0.00%", lastChecked: "Live" },
            { id: "int_4", name: "Stripe Gateway", category: "Payments", status: "Disconnected", connectedAccounts: 0, errorRate: "0.00%", lastChecked: "Not Configured" },
            { id: "int_5", name: "Razorpay Gateway", category: "Payments", status: "Disconnected", connectedAccounts: 0, errorRate: "0.00%", lastChecked: "Not Configured" },
            { id: "int_6", name: "OpenAI Engine", category: "AI", status: "Connected", connectedAccounts: 1, errorRate: "0.00%", lastChecked: "Live" },
            { id: "int_7", name: "Anthropic API", category: "AI", status: "Connected", connectedAccounts: 1, errorRate: "0.00%", lastChecked: "Live" }
          ]);
        }
      } catch (err) {
        console.error("Failed to fetch integrations", err);
      } finally {
        setLoading(false);
      }
    }
    fetchIntegrations();
  }, []);

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
              {loading ? (
                <tr><td colSpan={6} className="py-4 text-center">Loading integrations...</td></tr>
              ) : filteredIntegrations.length === 0 ? (
                <tr><td colSpan={6} className="py-4 text-center">No integrations found.</td></tr>
              ) : filteredIntegrations.map((item) => (
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
