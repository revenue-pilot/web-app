"use client";
import React, { useState } from "react";
import { HelpCircle, Search, ArrowRight, CheckCircle2, History, AlertTriangle, UserCheck } from "lucide-react";

interface SupportCustomer {
  id: string;
  name: string;
  email: string;
  org: string;
  plan: string;
  campaignsCount: number;
  integrationsCount: number;
}

export default function AdminSupportMissionControlPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<SupportCustomer | null>(null);

  const [customers, setCustomers] = useState<SupportCustomer[]>([
    { id: "cust_1", name: "Arjun Mehta", email: "arjun@Revenuepilot.com", org: "Arjun Mehta Agency", plan: "Revenue", campaignsCount: 24, integrationsCount: 4 },
    { id: "cust_2", name: "Sonia Roy", email: "sonia@Revenuepilot.com", org: "FitLife Gyms", plan: "Standard", campaignsCount: 5, integrationsCount: 2 },
    { id: "cust_3", name: "Karan Singh", email: "karan@Revenuepilot.com", org: "UrbanStays Hotel", plan: "Premium", campaignsCount: 12, integrationsCount: 3 }
  ]);

  const handleImpersonate = (tenantName: string, userName: string) => {
    // Audit impersonation logs
    const auditLogs = JSON.parse(localStorage.getItem("impersonation_audit_logs") || "[]");
    auditLogs.push({
      operator: "Super Admin",
      targetTenant: tenantName,
      targetUser: userName,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem("impersonation_audit_logs", JSON.stringify(auditLogs));

    localStorage.setItem("impersonate_tenant", tenantName);
    window.location.href = "/dashboard";
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.org.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12 font-sans">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <HelpCircle size={24} className="text-[#50BB8F]" />
          <span>Support Mission Control</span>
        </h1>
        <p className="text-zinc-400 text-xs mt-0.5">Search tenant databases profiles, inspect client activity logs, and log impersonation audits.</p>
      </div>

      {/* Customer Lookup Search bar */}
      <div className="bg-[#0D121F] border border-[#1B2438] p-4 rounded-xl">
        <div className="relative">
          <span className="absolute inset-y-0 left-3 flex items-center text-zinc-500">
            <Search size={14} />
          </span>
          <input
            type="text"
            placeholder="Lookup customer email or tenant organization name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0A0F1D] border border-[#1C283F] rounded-xl pl-9 pr-4 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500 transition-all font-semibold"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Customer list results (7 cols) */}
        <div className="lg:col-span-7 bg-[#0D121F] border border-[#1B2438] p-5 rounded-2xl shadow-sm">
          <h3 className="font-bold text-white text-xs uppercase tracking-wider pb-2 border-b border-[#1B2438] mb-4">
            Search Results
          </h3>

          <div className="space-y-2">
            {filteredCustomers.map((c) => (
              <div 
                key={c.id}
                onClick={() => setSelectedUser(c)}
                className={`p-3 bg-[#0A0F1D] border rounded-xl flex justify-between items-center cursor-pointer transition-all ${
                  selectedUser?.id === c.id ? "border-emerald-500/50 bg-[#151D2F]" : "border-[#1C283F] hover:bg-[#151D2F]"
                }`}
              >
                <div>
                  <span className="font-bold text-white text-xs block">{c.name}</span>
                  <span className="text-[8px] text-zinc-400 font-bold block uppercase mt-0.5">{c.org} • {c.email}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-[8px] font-bold text-zinc-400 border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 rounded">
                    {c.plan}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleImpersonate(c.org, c.name);
                    }}
                    className="bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold text-[9px] px-2 py-1 rounded transition-all flex items-center gap-1 shadow-sm shadow-emerald-500/10"
                  >
                    <span>Impersonate</span>
                    <ArrowRight size={10} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Customer detail profile (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {selectedUser ? (
            <div className="bg-[#0D121F] border border-[#1B2438] p-5 rounded-2xl space-y-5">
              <h3 className="font-bold text-white text-xs uppercase tracking-wider pb-2 border-b border-[#1B2438] flex items-center gap-1.5">
                <UserCheck size={14} className="text-emerald-400" />
                <span>Customer Profile</span>
              </h3>

              <div className="space-y-4 text-xs font-semibold text-zinc-400">
                <div className="flex justify-between py-1 border-b border-[#1C283F]">
                  <span>Billing Plan</span>
                  <span className="text-white font-bold">{selectedUser.plan}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#1C283F]">
                  <span>Campaigns Connected</span>
                  <span className="text-white font-bold">{selectedUser.campaignsCount} Live</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#1C283F]">
                  <span>Integrations Connects</span>
                  <span className="text-white font-bold">{selectedUser.integrationsCount} API Gateways</span>
                </div>
                
                <div className="bg-[#0A0F1D] border border-[#1C283F] rounded-xl p-3 flex gap-2">
                  <History size={14} className="text-zinc-500 mt-0.5" />
                  <div className="text-[10px]">
                    <span className="text-zinc-400 block font-bold">Latest Action logged</span>
                    <p className="text-zinc-500 mt-0.5">Updated aspect ratio ratios configuration inside RatioForge Vault.</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#0D121F] border border-[#1B2438] p-8 text-center text-zinc-500 text-xs font-bold rounded-2xl">
              Select a support profile from the lookup list to inspect campaign assets and credentials history.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
