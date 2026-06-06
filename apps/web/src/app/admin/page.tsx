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
const revenueTrend = {
  Daily: [
    { name: 'Mon', revenue: 45000 },
    { name: 'Tue', revenue: 52000 },
    { name: 'Wed', revenue: 68000 },
    { name: 'Thu', revenue: 85000 },
    { name: 'Fri', revenue: 110000 },
    { name: 'Sat', revenue: 95000 },
    { name: 'Sun', revenue: 120000 },
  ],
  Weekly: [
    { name: 'Week 1', revenue: 350000 },
    { name: 'Week 2', revenue: 420000 },
    { name: 'Week 3', revenue: 380000 },
    { name: 'Week 4', revenue: 510000 },
  ],
  Monthly: [
    { name: 'Jan', revenue: 450000 },
    { name: 'Feb', revenue: 520000 },
    { name: 'Mar', revenue: 680000 },
    { name: 'Apr', revenue: 850000 },
    { name: 'May', revenue: 1100000 },
    { name: 'Jun', revenue: 1450000 },
  ],
  Yearly: [
    { name: '2023', revenue: 4500000 },
    { name: '2024', revenue: 7800000 },
    { name: '2025', revenue: 12400000 },
    { name: '2026', revenue: 16800000 },
  ]
};

const subscriptionRevenue = [
  { name: 'Jan', Standard: 120, Revenue: 80, Premium: 30 },
  { name: 'Feb', Standard: 150, Revenue: 110, Premium: 45 },
  { name: 'Mar', Standard: 190, Revenue: 150, Premium: 60 },
  { name: 'Apr', Standard: 240, Revenue: 210, Premium: 85 },
  { name: 'May', Standard: 310, Revenue: 290, Premium: 110 },
  { name: 'Jun', Standard: 380, Revenue: 390, Premium: 148 },
];

const clientRevenue = [
  { name: 'Jan', New: 45, Churned: 5 },
  { name: 'Feb', New: 58, Churned: 8 },
  { name: 'Mar', New: 72, Churned: 6 },
  { name: 'Apr', New: 88, Churned: 12 },
  { name: 'May', New: 110, Churned: 14 },
  { name: 'Jun', New: 145, Churned: 10 },
];

const platformActivity = [
  { name: 'Jan', Logins: 12000, Launches: 240, Reports: 1100 },
  { name: 'Feb', Logins: 15400, Launches: 310, Reports: 1450 },
  { name: 'Mar', Logins: 19800, Launches: 420, Reports: 1900 },
  { name: 'Apr', Logins: 24500, Launches: 580, Reports: 2500 },
  { name: 'May', Logins: 32000, Launches: 790, Reports: 3200 },
  { name: 'Jun', Logins: 45000, Launches: 1100, Reports: 4500 },
];

const aiCostTrend = [
  { name: 'Jan', OpenAI: 1200, Anthropic: 400, Requests: 45000 },
  { name: 'Feb', OpenAI: 1500, Anthropic: 600, Requests: 58000 },
  { name: 'Mar', OpenAI: 2100, Anthropic: 950, Requests: 82000 },
  { name: 'Apr', OpenAI: 2900, Anthropic: 1400, Requests: 110000 },
  { name: 'May', OpenAI: 3800, Anthropic: 1900, Requests: 165000 },
  { name: 'Jun', OpenAI: 5100, Anthropic: 2600, Requests: 240000 },
];

export default function AdminDashboardPage() {
  const [revenueFilter, setRevenueFilter] = useState<"Daily" | "Weekly" | "Monthly" | "Yearly">("Monthly");
  const [activeChartTab, setActiveChartTab] = useState("revenue"); // revenue, subscriptions, clients, activity, ai

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
            <span className="text-[9px] font-bold text-zinc-500 uppercase block">Total Revenue</span>
            <span className="text-xl font-bold text-white block mt-1">₹1,68,00,000</span>
            <div className="text-[9px] text-zinc-400 font-semibold mt-1 space-y-0.5">
              <p>Today: <span className="text-emerald-400">₹1,20,000</span></p>
              <p>Monthly: <span className="text-emerald-400">₹14,50,000</span></p>
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
            <span className="text-xl font-bold text-white block mt-1">₹14,50,000</span>
            <div className="text-[9px] text-emerald-400 font-bold flex items-center gap-1 mt-1.5">
              <ArrowUpRight size={12} />
              <span>+31.8% MRR Revenue</span>
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
            <span className="text-xl font-bold text-white block mt-1">₹1,74,00,000</span>
            <p className="text-[9px] text-zinc-500 font-bold mt-1.5">Forecast ARR: ₹1.82 Cr</p>
          </div>
          <div className="border-t border-[#1C283F] pt-2 mt-2">
            <span className="text-[9px] font-extrabold text-zinc-500 uppercase">Static Forecasted</span>
          </div>
        </div>

        {/* KPI 4: Active Customers */}
        <div className="bg-[#0D121F] border border-[#1B2438] p-4 rounded-xl flex flex-col justify-between h-32 relative group overflow-hidden">
          <div>
            <span className="text-[9px] font-bold text-zinc-500 uppercase block">Active Customers</span>
            <span className="text-xl font-bold text-white block mt-1">1,284 Clients</span>
            <div className="text-[9px] text-zinc-400 font-semibold mt-1 space-y-0.5">
              <p>New: <span className="text-emerald-400">+145</span></p>
              <p>Lost: <span className="text-red-400">-10</span></p>
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
            <span className="text-xl font-bold text-white block mt-1">324 Trials</span>
            <p className="text-[9px] text-amber-400 font-bold mt-1.5">42 Expiring within 48h</p>
          </div>
          <div className="border-t border-[#1C283F] pt-2 mt-2">
            <span className="text-[9px] font-extrabold text-zinc-500 uppercase">Billing pipeline</span>
          </div>
        </div>

        {/* KPI 6: Conversion Rate */}
        <div className="bg-[#0D121F] border border-[#1B2438] p-4 rounded-xl flex flex-col justify-between h-32 relative group overflow-hidden">
          <div>
            <span className="text-[9px] font-bold text-zinc-500 uppercase block">Conversion Rate</span>
            <span className="text-xl font-bold text-white block mt-1">28.4%</span>
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
            <span className="text-xl font-bold text-white block mt-1">1.2%</span>
            <p className="text-[9px] text-emerald-400 font-bold mt-1.5">-0.4% from last month</p>
          </div>
          <div className="border-t border-[#1C283F] pt-2 mt-2">
            <span className="text-[9px] font-extrabold text-zinc-500 uppercase">Annual churn: 14.4%</span>
          </div>
        </div>

        {/* KPI 8: Total Ad Spend */}
        <div className="bg-[#0D121F] border border-[#1B2438] p-4 rounded-xl flex flex-col justify-between h-32 relative group overflow-hidden">
          <div>
            <span className="text-[9px] font-bold text-zinc-500 uppercase block">Processed Spend</span>
            <span className="text-xl font-bold text-white block mt-1">₹8,40,00,000</span>
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
            <span className="text-xl font-bold text-white block mt-1">14,092 Live</span>
            <div className="text-[9px] text-zinc-400 font-semibold mt-1 space-y-0.5">
              <p>Meta: <span className="text-blue-400">8,204</span></p>
              <p>Google: <span className="text-red-400">5,888</span></p>
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
            <span className="text-xl font-bold text-white block mt-1">2.4M Req</span>
            <div className="text-[9px] text-zinc-400 font-semibold mt-1 space-y-0.5">
              <p>Tokens: <span className="text-zinc-300">14.8B</span></p>
              <p>Cost: <span className="text-red-400">₹6,40,000</span></p>
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
