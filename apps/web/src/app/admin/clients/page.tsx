"use client";
import React, { useState } from "react";
import { 
  UserCheck, ShieldAlert, Cpu, Check, AlertTriangle, ArrowRight, 
  Search, Ban, Trash2, Edit2, ShieldAlert as HealthIcon, Sparkles
} from "lucide-react";

interface TenantClient {
  id: string;
  name: string;
  owner: string;
  email: string;
  plan: string;
  status: string; // Active, Suspended
  revenue: number;
  adSpend: number;
  joinedDate: string;
  health: "Excellent" | "Healthy" | "Warning" | "Critical";
  healthDetails: { logins: string; campaigns: string; spend: string; churn: string };
}

export default function AdminClientsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<TenantClient | null>(null);

  const [clients, setClients] = useState<TenantClient[]>([
    { 
      id: "client_1", 
      name: "EcoMart India", 
      owner: "Arjun Mehta", 
      email: "contact@ecomart.in", 
      plan: "Revenue", 
      status: "Active", 
      revenue: 1247376, 
      adSpend: 1523170, 
      joinedDate: "2025-10-15",
      health: "Excellent",
      healthDetails: { logins: "Daily (24h)", campaigns: "Active (24 live)", spend: "Steady", churn: "Low Risk" }
    },
    { 
      id: "client_2", 
      name: "FitLife Gyms", 
      owner: "Sonia Roy", 
      email: "billing@fitlifegyms.com", 
      plan: "Standard", 
      status: "Active", 
      revenue: 613888, 
      adSpend: 738200, 
      joinedDate: "2025-12-01",
      health: "Warning",
      healthDetails: { logins: "Inactive 7d", campaigns: "4 Paused adsets", spend: "Decreased 20%", churn: "Medium Risk" }
    },
    { 
      id: "client_3", 
      name: "UrbanStays Hotel", 
      owner: "Karan Singh", 
      email: "concierge@urbanstays.com", 
      plan: "Premium", 
      status: "Active", 
      revenue: 369852, 
      adSpend: 195410, 
      joinedDate: "2026-02-18",
      health: "Healthy",
      healthDetails: { logins: "Weekly", campaigns: "12 Live", spend: "Steady", churn: "Low Risk" }
    },
    { 
      id: "client_4", 
      name: "Apex Logistics", 
      owner: "Delinquent Ops", 
      email: "ops@apex.com", 
      plan: "Premium", 
      status: "Suspended", 
      revenue: 2499, 
      adSpend: 0, 
      joinedDate: "2026-04-12",
      health: "Critical",
      healthDetails: { logins: "No logins 30d", campaigns: "No active campaigns", spend: "Zero spend", churn: "High Churn Risk" }
    }
  ]);

  const handleToggleSuspend = (id: string) => {
    setClients(prev => prev.map(c => {
      if (c.id === id) {
        return {
          ...c,
          status: c.status === "Active" ? "Suspended" : "Active"
        };
      }
      return c;
    }));
  };

  const handleDeleteClient = (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
    if (selectedClient?.id === id) setSelectedClient(null);
  };

  const handleImpersonate = (tenantName: string) => {
    localStorage.setItem("impersonate_tenant", tenantName);
    window.location.href = "/dashboard";
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.owner.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getHealthColor = (health: string) => {
    switch (health) {
      case "Excellent": return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      case "Healthy": return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      case "Warning": return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      default: return "bg-red-500/10 text-red-400 border border-red-500/20";
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <UserCheck size={24} className="text-[#50BB8F]" />
            <span>Client Universe</span>
          </h1>
          <p className="text-zinc-400 text-xs mt-0.5">Manage customer directory accounts, track metrics spend, and audit AI Health Scores.</p>
        </div>
      </div>

      {/* Search Filter bar */}
      <div className="bg-[#0D121F] border border-[#1B2438] p-4 rounded-xl flex gap-4 items-center">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-3 flex items-center text-zinc-500">
            <Search size={14} />
          </span>
          <input
            type="text"
            placeholder="Search company or owner name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0A0F1D] border border-[#1C283F] rounded-xl pl-9 pr-4 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500 transition-all font-semibold"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Clients list table (8 cols) */}
        <div className="lg:col-span-8 bg-[#0D121F] border border-[#1B2438] p-5 rounded-2xl shadow-sm">
          <h3 className="font-bold text-white text-xs uppercase tracking-wider pb-2 border-b border-[#1B2438] mb-4">
            Customer Directory
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#1B2438] text-zinc-500 font-bold uppercase tracking-wider">
                  <th className="pb-3">Company</th>
                  <th className="pb-3">Owner</th>
                  <th className="pb-3">Plan</th>
                  <th className="pb-3 text-right">Ad Spend</th>
                  <th className="pb-3 text-center">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="font-semibold text-zinc-300">
                {filteredClients.map((c) => (
                  <tr 
                    key={c.id} 
                    onClick={() => setSelectedClient(c)}
                    className={`border-b border-[#1C283F] hover:bg-[#151D2F] transition-colors cursor-pointer ${
                      selectedClient?.id === c.id ? "bg-[#151D2F]" : ""
                    }`}
                  >
                    <td className="py-3">
                      <span className="font-bold text-white block">{c.name}</span>
                      <span className="text-[8px] text-zinc-500 font-semibold block mt-0.5">Joined {c.joinedDate}</span>
                    </td>
                    <td className="py-3">
                      <span className="block">{c.owner}</span>
                      <span className="text-[8px] text-zinc-500 font-semibold block mt-0.5">{c.email}</span>
                    </td>
                    <td className="py-3">
                      <span className="text-[10px] font-bold text-zinc-300 bg-zinc-800 border border-zinc-700/60 px-2 py-0.5 rounded-full">
                        {c.plan}
                      </span>
                    </td>
                    <td className="py-3 text-right font-mono font-bold text-zinc-200">
                      ₹{c.adSpend.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3">
                      <div className="flex justify-center">
                        <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full border ${
                          c.status === "Active"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-red-500/10 text-red-400 border-red-500/20"
                        }`}>
                          {c.status}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleImpersonate(c.name)}
                          className="bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold text-[9px] px-2 py-1 rounded transition-all flex items-center gap-1 shadow-sm shadow-emerald-500/10"
                        >
                          <span>Impersonate</span>
                          <ArrowRight size={10} />
                        </button>
                        <button
                          onClick={() => handleToggleSuspend(c.id)}
                          className="text-zinc-400 hover:text-amber-500 p-1 rounded"
                          title="Suspend Client"
                        >
                          <Ban size={12} />
                        </button>
                        <button
                          onClick={() => handleDeleteClient(c.id)}
                          className="text-zinc-400 hover:text-red-500 p-1 rounded"
                          title="Delete Client"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Client Health scorecard (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {selectedClient ? (
            <div className="bg-[#0D121F] border border-[#1B2438] p-5 rounded-2xl space-y-5">
              <div className="flex justify-between items-center pb-2 border-b border-[#1B2438]">
                <h3 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <HealthIcon size={14} className="text-emerald-400" />
                  <span>AI Health scorecard</span>
                </h3>
                <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${getHealthColor(selectedClient.health)}`}>
                  {selectedClient.health}
                </span>
              </div>

              <div className="space-y-4 text-xs font-semibold text-zinc-400">
                <div className="flex justify-between py-1 border-b border-[#1C283F]">
                  <span>Logins Frequency</span>
                  <span className="text-white font-bold">{selectedClient.healthDetails.logins}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#1C283F]">
                  <span>Campaign Activity</span>
                  <span className="text-white font-bold">{selectedClient.healthDetails.campaigns}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#1C283F]">
                  <span>Spend Trends</span>
                  <span className="text-white font-bold">{selectedClient.healthDetails.spend}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#1C283F]">
                  <span>Churn Risk</span>
                  <span className={`font-bold ${selectedClient.health === "Critical" ? "text-red-400 animate-pulse" : "text-emerald-400"}`}>
                    {selectedClient.healthDetails.churn}
                  </span>
                </div>

                <div className="bg-[#0A0F1D] border border-[#1C283F] rounded-xl p-3.5 space-y-1">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase block">Total MRR Contribution</span>
                  <span className="text-lg font-bold text-emerald-400 block">₹{selectedClient.revenue.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#0D121F] border border-[#1B2438] p-8 text-center text-zinc-500 text-xs font-bold rounded-2xl">
              Select a customer from the directory to review their AI Health score and active stats.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
