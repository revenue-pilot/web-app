"use client";
import React, { useState } from "react";
import Link from "next/link";
import { 
  DollarSign, Users, Activity, TrendingUp, AlertTriangle, CheckCircle2, 
  BrainCircuit, Calendar, RefreshCw, BarChart2, Zap, ArrowUpRight, ArrowDownRight, Sparkles
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, LineChart, Line, Legend
} from 'recharts';

// Data stores
// Data stores (Empty until we connect historical timeseries backend)
const revenueTrend = {
  Daily: [],
  Weekly: [],
  Monthly: [],
  Yearly: []
};

const subscriptionRevenue: any[] = [];
const clientRevenue: any[] = [];
const platformActivity: any[] = [];
const aiCostTrend: any[] = [];

export default function AdminDashboardPage() {
  const [revenueFilter, setRevenueFilter] = useState<"Daily" | "Weekly" | "Monthly" | "Yearly">("Monthly");
  const [activeChartTab, setActiveChartTab] = useState("revenue"); // revenue, subscriptions, clients, activity, ai
  const [stats, setStats] = useState({
    totalOrganizations: 0,
    totalUsers: 0,
    totalCampaigns: 0,
    totalAiLogs: 0,
    mrr: 0,
    arr: 0,
    trialUsers: 0,
    conversionRate: "0.0",
    churnRate: "0.0",
    processedSpend: 0,
  });

  React.useEffect(() => {
    async function fetchStats() {
      try {
        const token = localStorage.getItem("token") || localStorage.getItem("auth_token");
        const res = await fetch("/api/v1/admin/dashboard", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error("Failed to load real-time admin stats", err);
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="space-y-6 pb-12 font-sans">
      
      {/* Top Banner Overview */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Command Core</h1>
          <p className="text-zinc-400 text-xs mt-0.5">30-second operating system status & company dashboard overview.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-zinc-500 uppercase">Live Operations Core</span>
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
        </div>
      </div>

      {/* KPI Cards Matrix (10 Cards requested) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* KPI 1: Total Revenue */}
        <div className="bg-[#0D121F] border border-[#1B2438] p-4 rounded-xl flex flex-col justify-between h-32 relative group overflow-hidden">
          <div>
            <span className="text-[9px] font-bold text-zinc-500 uppercase block">Total System Revenue</span>
            <span className="text-xl font-bold text-white block mt-1">₹{stats.arr.toLocaleString()}</span>
            <div className="text-[9px] text-zinc-400 font-semibold mt-1 space-y-0.5">
              <p>Projected based on active MRR</p>
            </div>
          </div>
          <Link href="/admin/revenue" className="text-[9px] font-extrabold text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-wider mt-2 block border-t border-[#1C283F] pt-2">
            View Revenue Details &rarr;
          </Link>
        </div>

        {/* KPI 2: MRR */}
        <div className="bg-[#0D121F] border border-[#1B2438] p-4 rounded-xl flex flex-col justify-between h-32 relative group overflow-hidden">
          <div>
            <span className="text-[9px] font-bold text-zinc-500 uppercase block">Monthly Run Rate</span>
            <span className="text-xl font-bold text-white block mt-1">₹{stats.mrr.toLocaleString()}</span>
            <div className="text-[9px] text-emerald-400 font-bold flex items-center gap-1 mt-1.5">
              <ArrowUpRight size={12} />
              <span>Real-time MRR</span>
            </div>
          </div>
          <Link href="/admin/revenue" className="text-[9px] font-extrabold text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-wider mt-2 block border-t border-[#1C283F] pt-2">
            Open Revenue Nexus &rarr;
          </Link>
        </div>

        {/* KPI 3: ARR */}
        <div className="bg-[#0D121F] border border-[#1B2438] p-4 rounded-xl flex flex-col justify-between h-32 relative group overflow-hidden">
          <div>
            <span className="text-[9px] font-bold text-zinc-500 uppercase block">Annual Run Rate</span>
            <span className="text-xl font-bold text-white block mt-1">₹{stats.arr.toLocaleString()}</span>
            <p className="text-[9px] text-zinc-500 font-bold mt-1.5">Based on Real-time MRR</p>
          </div>
          <div className="border-t border-[#1C283F] pt-2 mt-2">
            <span className="text-[9px] font-extrabold text-zinc-500 uppercase">Static Forecasted</span>
          </div>
        </div>

        {/* KPI 4: Active Customers */}
        <div className="bg-[#0D121F] border border-[#1B2438] p-4 rounded-xl flex flex-col justify-between h-32 relative group overflow-hidden">
          <div>
            <span className="text-[9px] font-bold text-zinc-500 uppercase block">Total Workspaces (Agencies)</span>
            <span className="text-xl font-bold text-white block mt-1">{stats.totalOrganizations.toLocaleString()}</span>
            <div className="text-[9px] text-zinc-400 font-semibold mt-1 space-y-0.5">
              <p>Registered users: <span className="text-emerald-400">{stats.totalUsers.toLocaleString()}</span></p>
            </div>
          </div>
          <Link href="/admin/clients" className="text-[9px] font-extrabold text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-wider mt-2 block border-t border-[#1C283F] pt-2">
            Open Client Universe &rarr;
          </Link>
        </div>

        {/* KPI 5: Trial Users */}
        <div className="bg-[#0D121F] border border-[#1B2438] p-4 rounded-xl flex flex-col justify-between h-32 relative group overflow-hidden">
          <div>
            <span className="text-[9px] font-bold text-zinc-500 uppercase block">Trial Users</span>
            <span className="text-xl font-bold text-white block mt-1">{stats.trialUsers} Trials</span>
            <p className="text-[9px] text-amber-400 font-bold mt-1.5">Expiring soon tracking disabled</p>
          </div>
          <div className="border-t border-[#1C283F] pt-2 mt-2">
            <span className="text-[9px] font-extrabold text-zinc-500 uppercase">Billing pipeline</span>
          </div>
        </div>

        {/* KPI 6: Conversion Rate */}
        <div className="bg-[#0D121F] border border-[#1B2438] p-4 rounded-xl flex flex-col justify-between h-32 relative group overflow-hidden">
          <div>
            <span className="text-[9px] font-bold text-zinc-500 uppercase block">Conversion Rate</span>
            <span className="text-xl font-bold text-white block mt-1">{stats.conversionRate}%</span>
            <p className="text-[9px] text-emerald-400 font-bold mt-1.5">Trial &rarr; Paid Upgrade</p>
          </div>
          <div className="border-t border-[#1C283F] pt-2 mt-2">
            <span className="text-[9px] font-extrabold text-zinc-500 uppercase">Revenue loop</span>
          </div>
        </div>

        {/* KPI 7: Churn Rate */}
        <div className="bg-[#0D121F] border border-[#1B2438] p-4 rounded-xl flex flex-col justify-between h-32 relative group overflow-hidden">
          <div>
            <span className="text-[9px] font-bold text-zinc-500 uppercase block">Churn Rate</span>
            <span className="text-xl font-bold text-white block mt-1">{stats.churnRate}%</span>
            <p className="text-[9px] text-emerald-400 font-bold mt-1.5">Based on total subscriptions</p>
          </div>
          <div className="border-t border-[#1C283F] pt-2 mt-2">
            <span className="text-[9px] font-extrabold text-zinc-500 uppercase">Annual churn: 14.4%</span>
          </div>
        </div>

        {/* KPI 8: Total Ad Spend */}
        <div className="bg-[#0D121F] border border-[#1B2438] p-4 rounded-xl flex flex-col justify-between h-32 relative group overflow-hidden">
          <div>
            <span className="text-[9px] font-bold text-zinc-500 uppercase block">Processed Spend</span>
            <span className="text-xl font-bold text-white block mt-1">₹{stats.processedSpend.toLocaleString()}</span>
            <p className="text-[9px] text-zinc-400 font-semibold mt-1">Managed across pipelines</p>
          </div>
          <Link href="/admin/campaigns" className="text-[9px] font-extrabold text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-wider mt-2 block border-t border-[#1C283F] pt-2">
            View Observatory &rarr;
          </Link>
        </div>

        {/* KPI 9: Total Campaigns */}
        <div className="bg-[#0D121F] border border-[#1B2438] p-4 rounded-xl flex flex-col justify-between h-32 relative group overflow-hidden">
          <div>
            <span className="text-[9px] font-bold text-zinc-500 uppercase block">Total Campaigns</span>
            <span className="text-xl font-bold text-white block mt-1">{stats.totalCampaigns.toLocaleString()}</span>
            <div className="text-[9px] text-zinc-400 font-semibold mt-1 space-y-0.5">
              <p>Tracking live DB objects</p>
            </div>
          </div>
          <Link href="/admin/campaigns" className="text-[9px] font-extrabold text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-wider mt-2 block border-t border-[#1C283F] pt-2">
            Inspect Ad Sets &rarr;
          </Link>
        </div>

        {/* KPI 10: AI Usage */}
        <div className="bg-[#0D121F] border border-[#1B2438] p-4 rounded-xl flex flex-col justify-between h-32 relative group overflow-hidden">
          <div>
            <span className="text-[9px] font-bold text-zinc-500 uppercase block">AI Usage Logs</span>
            <span className="text-xl font-bold text-white block mt-1">{stats.totalAiLogs.toLocaleString()}</span>
            <div className="text-[9px] text-zinc-400 font-semibold mt-1 space-y-0.5">
              <p>Insights requested globally</p>
            </div>
          </div>
          <Link href="/admin/ai-control" className="text-[9px] font-extrabold text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-wider mt-2 block border-t border-[#1C283F] pt-2">
            AI Control Grid &rarr;
          </Link>
        </div>

      </div>

      {/* Executive Charts Section (Tabs switcher) */}
      <div className="bg-[#0D121F] border border-[#1B2438] rounded-2xl p-6 shadow-sm space-y-6">
        
        {/* Navigation Tabs */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-[#1B2438] pb-4">
          <div className="flex flex-wrap gap-2">
            {[
              { key: "revenue", label: "Revenue Revenue" },
              { key: "subscriptions", label: "Subscription Revenue" },
              { key: "clients", label: "Client Analytics" },
              { key: "activity", label: "Platform Activity" },
              { key: "ai", label: "AI Usage Trend" }
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveChartTab(tab.key)}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                  activeChartTab === tab.key
                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400 shadow-inner"
                    : "bg-[#0A0F1D] border-[#1C283F] text-zinc-400 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Revenue Filters (Shown only on revenue tab) */}
          {activeChartTab === "revenue" && (
            <div className="flex gap-1.5 bg-[#0A0F1D] border border-[#1C283F] p-1 rounded-lg">
              {["Daily", "Weekly", "Monthly", "Yearly"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setRevenueFilter(filter as any)}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-md transition-all ${
                    revenueFilter === filter
                      ? "bg-emerald-500 text-black shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Charts Canvas */}
        <div className="h-[320px] w-full relative">
          
          {/* Revenue Revenue Line Chart */}
          {activeChartTab === "revenue" && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrend[revenueFilter]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1B2438" vertical={false} />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={11} axisLine={false} tickLine={false} />
                <YAxis stroke="#6b7280" fontSize={11} axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val.toLocaleString()}`} />
                <Tooltip contentStyle={{ backgroundColor: '#0D121F', border: '1px solid #1B2438', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" name="Gross Revenue" />
              </AreaChart>
            </ResponsiveContainer>
          )}

          {/* Subscription Revenue Stacked Area Chart */}
          {activeChartTab === "subscriptions" && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={subscriptionRevenue} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1B2438" vertical={false} />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={11} axisLine={false} tickLine={false} />
                <YAxis stroke="#6b7280" fontSize={11} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0D121F', border: '1px solid #1B2438', borderRadius: '8px' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="Standard" stroke="#3b82f6" fill="rgba(59, 130, 246, 0.1)" strokeWidth={2} name="Standard Tier" />
                <Area type="monotone" dataKey="Revenue" stroke="#10b981" fill="rgba(16, 185, 129, 0.1)" strokeWidth={2} name="Revenue Tier" />
                <Area type="monotone" dataKey="Premium" stroke="#8b5cf6" fill="rgba(139, 92, 246, 0.1)" strokeWidth={2} name="Premium Tier" />
              </AreaChart>
            </ResponsiveContainer>
          )}

          {/* Client Revenue Chart */}
          {activeChartTab === "clients" && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={clientRevenue} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1B2438" vertical={false} />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={11} axisLine={false} tickLine={false} />
                <YAxis stroke="#6b7280" fontSize={11} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0D121F', border: '1px solid #1B2438', borderRadius: '8px' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="New" fill="#10b981" radius={[4, 4, 0, 0]} name="New Onboarded" />
                <Bar dataKey="Churned" fill="#ef4444" radius={[4, 4, 0, 0]} name="Churned Clients" />
              </BarChart>
            </ResponsiveContainer>
          )}

          {/* Platform Activity Multi line Chart */}
          {activeChartTab === "activity" && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={platformActivity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1B2438" vertical={false} />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={11} axisLine={false} tickLine={false} />
                <YAxis stroke="#6b7280" fontSize={11} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0D121F', border: '1px solid #1B2438', borderRadius: '8px' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="Logins" stroke="#3b82f6" strokeWidth={2.5} name="Total User Logins" />
                <Line type="monotone" dataKey="Launches" stroke="#10b981" strokeWidth={2.5} name="Campaign Launches" />
                <Line type="monotone" dataKey="Reports" stroke="#eab308" strokeWidth={2.5} name="Insights Pulled" />
              </LineChart>
            </ResponsiveContainer>
          )}

          {/* AI Usage Cost & Requests Chart */}
          {activeChartTab === "ai" && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={aiCostTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1B2438" vertical={false} />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={11} axisLine={false} tickLine={false} />
                <YAxis stroke="#6b7280" fontSize={11} axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val}`} />
                <Tooltip contentStyle={{ backgroundColor: '#0D121F', border: '1px solid #1B2438', borderRadius: '8px' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="OpenAI" stroke="#10b981" fill="rgba(16, 185, 129, 0.05)" strokeWidth={2} name="OpenAI Cost (₹)" />
                <Area type="monotone" dataKey="Anthropic" stroke="#f97316" fill="rgba(249, 115, 22, 0.05)" strokeWidth={2} name="Anthropic Cost (₹)" />
              </AreaChart>
            </ResponsiveContainer>
          )}

        </div>

      </div>

    </div>
  );
}
