"use client";
import React, { useState } from "react";
import { Sliders, CheckCircle2, Clock, XCircle, Search, Edit2, ShieldCheck } from "lucide-react";

interface TenantSubscription {
  id: string;
  tenant: string;
  plan: string;
  amount: number;
  status: string; // active, past_due, canceled
  nextBilling: string;
}

export default function AdminSubscriptionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeNotification, setActiveNotification] = useState("");

  const [subscriptions, setSubscriptions] = useState<TenantSubscription[]>([]);
  const [stats, setStats] = useState({ totalActive: 0, mrr: 0, pastDue: 0 });
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    async function fetchData() {
      try {
        const token = localStorage.getItem("token") || localStorage.getItem("auth_token");
        const headers = { Authorization: `Bearer ${token}` };
        
        // Fetch subscriptions
        const subRes = await fetch("/api/v1/admin/subscriptions", { headers });
        if (subRes.ok) {
          const subData = await subRes.json();
          let mrr = 0;
          let active = 0;
          let pastDue = 0;
          
          const mapped = subData.map((s: any) => {
            const tier = s.tier?.toUpperCase() || 'UNKNOWN';
            let amount = 0;
            if (tier === 'STARTER') amount = 999;
            else if (tier === 'REVENUE') amount = 1999;
            else if (tier === 'PRO') amount = 4999;
            else if (tier === 'ENTERPRISE') amount = 9999;
            
            if (s.status === 'ACTIVE') {
              active++;
              mrr += amount;
            } else if (s.status === 'PAST_DUE') {
              pastDue++;
            }
            
            return {
              id: s.id,
              tenant: s.organization?.name || 'Unknown',
              plan: s.tier,
              amount,
              status: s.status?.toLowerCase() || 'active',
              nextBilling: s.endDate ? new Date(s.endDate).toLocaleDateString() : 'N/A'
            };
          });
          
          setSubscriptions(mapped);
          setStats({ totalActive: active, mrr, pastDue });
        }
      } catch (err) {
        console.error("Failed to fetch subscriptions", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const triggerNotification = (msg: string) => {
    setActiveNotification(msg);
    setTimeout(() => setActiveNotification(""), 3000);
  };

  const handleUpdatePlan = (id: string, nextPlan: string) => {
    setSubscriptions(prev => prev.map(s => {
      if (s.id === id) {
        triggerNotification(`Plan for ${s.tenant} updated to ${nextPlan}.`);
        return { ...s, plan: nextPlan, amount: nextPlan === "Premium" ? 2499 : nextPlan === "Revenue" ? 1999 : 1199 };
      }
      return s;
    }));
  };

  const filteredSubs = subscriptions.filter(s =>
    s.tenant.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12 font-sans">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Sliders size={24} className="text-[#50BB8F]" />
          <span>Subscription Command</span>
        </h1>
        <p className="text-zinc-400 text-xs mt-0.5">Configure billing tiers limits, audit tenant plan thresholds, and trigger manual renewals.</p>
      </div>

      {activeNotification && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2">
          <ShieldCheck size={14} />
          <span>{activeNotification}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-[#0D121F] border border-[#1B2438] p-4 rounded-xl">
          <span className="text-[9px] font-bold text-zinc-500 uppercase block">Total Active Subs</span>
          <span className="text-lg font-bold text-white block mt-1">{stats.totalActive}</span>
        </div>
        <div className="bg-[#0D121F] border border-[#1B2438] p-4 rounded-xl border-amber-500/20 bg-amber-500/5">
          <span className="text-[9px] font-bold text-amber-500 uppercase block">Past Due Accounts</span>
          <span className="text-lg font-bold text-amber-400 block mt-1">{stats.pastDue}</span>
        </div>
        <div className="bg-[#0D121F] border border-[#1B2438] p-4 rounded-xl">
          <span className="text-[9px] font-bold text-zinc-500 uppercase block">Monthly Run Rate</span>
          <span className="text-lg font-bold text-white block mt-1">₹{stats.mrr.toLocaleString()}</span>
        </div>
        <div className="bg-[#0D121F] border border-[#1B2438] p-4 rounded-xl">
          <span className="text-[9px] font-bold text-zinc-500 uppercase block">Avg Rev Per User (ARPU)</span>
          <span className="text-lg font-bold text-emerald-400 block mt-1">₹{stats.totalActive > 0 ? Math.floor(stats.mrr / stats.totalActive).toLocaleString() : 0}</span>
        </div>
      </div>

      {/* Subscriptions Table Card */}
      <div className="bg-[#0D121F] border border-[#1B2438] p-5 rounded-2xl shadow-sm">
        <h3 className="font-bold text-white text-xs uppercase tracking-wider pb-2 border-b border-[#1B2438] mb-4">
          Recent Billing Statuses
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#1B2438] text-zinc-500 font-bold uppercase tracking-wider">
                <th className="pb-3">Tenant Name</th>
                <th className="pb-3">Plan Tier</th>
                <th className="pb-3 text-right">Amount</th>
                <th className="pb-3 text-center">Status</th>
                <th className="pb-3 text-right">Next Invoice Date</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="font-semibold text-zinc-300">
              {loading ? (
                <tr><td colSpan={6} className="py-4 text-center">Loading subscriptions...</td></tr>
              ) : filteredSubs.length === 0 ? (
                <tr><td colSpan={6} className="py-4 text-center">No subscriptions found.</td></tr>
              ) : filteredSubs.map((sub) => (
                <tr key={sub.id} className="border-b border-[#1C283F] hover:bg-[#151D2F] transition-colors">
                  <td className="py-3 font-bold text-white">{sub.tenant}</td>
                  <td className="py-3 text-zinc-300">{sub.plan}</td>
                  <td className="py-3 text-right font-mono font-bold text-zinc-200">
                    ₹{sub.amount.toLocaleString("en-IN")}
                  </td>
                  <td className="py-3">
                    <div className="flex justify-center">
                      <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 w-fit ${
                        sub.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        sub.status === 'past_due' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        {sub.status === 'active' ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                        {sub.status.toUpperCase()}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 text-right text-zinc-500">{sub.nextBilling}</td>
                  <td className="py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleUpdatePlan(sub.id, sub.plan === "Premium" ? "Revenue" : "Premium")}
                        className="text-emerald-400 hover:text-emerald-300 text-[9px] font-bold"
                      >
                        Toggle Plan
                      </button>
                    </div>
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
