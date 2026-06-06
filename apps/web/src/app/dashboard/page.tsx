"use client";
import React from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Plus,
  TrendingUp,
  Percent,
  CircleDot,
  MousePointerClick,
  CheckCircle,
  HelpCircle,
  PlusCircle,
  FileText,
  UserPlus,
  Sparkles,
  Zap,
  DollarSign,
  AlertCircle
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from "recharts";
import { useAnalytics, useCampaigns } from "@/hooks/useApi";

// Formatting utility for Indian Rupees (Lakhs/Crores grouping)
function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value);
}

export default function CommandNexusPage() {
  const { data: analyticsData, loading: analyticsLoading, error: analyticsError } = useAnalytics();
  const { data: campaignsData, loading: campaignsLoading } = useCampaigns();

  // Platform Spend donut colors
  const PLATFORM_COLORS = ["#10B981", "#3B82F6", "#F59E0B"];

  // Campaign Status donut colors
  const STATUS_COLORS = ["#10B981", "#F59E0B", "#9CA3AF", "#EF4444"];

  // Calculate aggregated data from campaigns if available
  let platformSpendData = [
    { name: "Google Ads", value: 152317, percent: "62%" },
    { name: "Meta Ads", value: 73820, percent: "30%" },
    { name: "Others", value: 19541, percent: "8%" },
  ];

  let campaignStatusData = [
    { name: "Active", value: 14, percent: "58%" },
    { name: "Paused", value: 6, percent: "25%" },
    { name: "Draft", value: 3, percent: "13%" },
    { name: "Ended", value: 1, percent: "4%" },
  ];

  if (campaignsData && Array.isArray(campaignsData)) {
    // Calculate platform spend breakdown
    const platformSpend: Record<string, number> = {};
    const statusCount: Record<string, number> = { Active: 0, Paused: 0, Draft: 0, Ended: 0 };

    campaignsData.forEach((campaign: any) => {
      // Count by status
      if (statusCount.hasOwnProperty(campaign.status)) {
        statusCount[campaign.status]++;
      }

      // Count by platform
      const platform = campaign.platform || "Others";
      platformSpend[platform] = (platformSpend[platform] || 0) + (parseFloat(campaign.spend) || 0);
    });

    const totalSpend = Object.values(platformSpend).reduce((a: any, b: any) => a + b, 0);

    platformSpendData = Object.entries(platformSpend).map(([name, value]: any) => ({
      name,
      value,
      percent: totalSpend > 0 ? `${Math.round((value / totalSpend) * 100)}%` : "0%"
    }));

    const totalCampaigns = Object.values(statusCount).reduce((a: any, b: any) => a + b, 0);
    campaignStatusData = Object.entries(statusCount).map(([name, value]: any) => ({
      name,
      value,
      percent: totalCampaigns > 0 ? `${Math.round((value / totalCampaigns) * 100)}%` : "0%"
    }));
  }

  // 30-Day performance chart dataset (from analytics)
  const performanceOverviewData = analyticsData?.chartData || [
    { name: "May 20", Spend: 35000, Revenue: 180000, Conversions: 1800 },
    { name: "May 25", Spend: 62000, Revenue: 290000, Conversions: 3200 },
    { name: "May 30", Spend: 48000, Revenue: 220000, Conversions: 2900 },
    { name: "Jun 4", Spend: 95000, Revenue: 490000, Conversions: 5100 },
    { name: "Jun 9", Spend: 72000, Revenue: 340000, Conversions: 4300 },
    { name: "Jun 14", Spend: 110000, Revenue: 580000, Conversions: 5900 },
    { name: "Jun 19", Spend: 85000, Revenue: 440000, Conversions: 5200 },
  ];

  const displayData = analyticsData || {
    spend: 0,
    conversions: 0,
    revenue: 0,
    roas: 0
  };

  // Spark data for KPI cards (mini sparkline charts)
  const spendSpark = [12, 19, 3, 5, 2, 3, 18, 8, 15, 22, 18, 25];
  const convSpark = [10, 15, 8, 12, 5, 18, 20, 15, 22, 25, 18, 28];
  const revSpark = [8, 12, 5, 16, 10, 20, 18, 14, 25, 22, 20, 30];
  const roasSpark = [14, 10, 18, 12, 15, 22, 20, 16, 24, 26, 22, 28];

  if (analyticsError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="font-bold text-red-900 mb-2">Error Loading Dashboard</h3>
          <p className="text-red-700 text-sm mb-4">{analyticsError}</p>
          <button onClick={() => window.location.reload()} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* Top Welcome Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            Welcome back! 👋
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Here&apos;s what&apos;s happening with your campaigns today.</p>
        </div>

        {/* Date Filter & Create Button */}
        <div className="flex items-center gap-3">
          <div className="bg-white border border-gray-200/80 rounded-xl px-4 py-2 flex items-center gap-2 text-sm font-semibold text-gray-600 shadow-sm cursor-pointer hover:bg-gray-50 transition-colors">
            <Calendar size={16} className="text-gray-400" />
            <span>Last 30 Days</span>
          </div>
          <Link
            href="/dashboard/campaign-wizard"
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-emerald-500/10 transition-all text-sm flex items-center gap-2"
          >
            <Plus size={16} />
            <span>Create Campaign</span>
          </Link>
        </div>
      </div>

      {/* Main KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          title="Total Spend"
          value={formatINR(displayData?.spend || 245678)}
          change="+18.6%"
          sparkData={spendSpark}
          sparkColor="#10B981"
          isPositive={true}
          icon={<span className="text-emerald-500 font-semibold text-sm">₹</span>}
        />
        <KpiCard
          title="Total Conversions"
          value={(displayData?.conversions || 9876).toLocaleString("en-IN")}
          change="+24.1%"
          sparkData={convSpark}
          sparkColor="#10B981"
          isPositive={true}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-emerald-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
            </svg>
          }
        />
        <KpiCard
          title="Total Revenue"
          value={formatINR(displayData?.revenue || 1245678)}
          change="+28.4%"
          sparkData={revSpark}
          sparkColor="#8B5CF6"
          isPositive={true}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-violet-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
            </svg>
          }
        />
        <KpiCard
          title="Average ROAS"
          value={`${displayData?.roas || "5.07"}x`}
          change="+19.3%"
          sparkData={roasSpark}
          sparkColor="#F59E0B"
          isPositive={true}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-amber-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" />
            </svg>
          }
        />
      </div>

      {/* Charts & Recharts Overview Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Overview Chart Panel */}
        <div className="lg:col-span-2 bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-900 text-lg">Performance Overview</h3>
              <button className="text-gray-400 hover:text-gray-600">
                <HelpCircle size={16} />
              </button>
            </div>
            <select className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-500 focus:outline-none shadow-sm">
              <option>Last 30 Days</option>
              <option>Last 90 Days</option>
              <option>Year to Date</option>
            </select>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceOverviewData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="name" stroke="#9CA3AF" fontSize={11} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" stroke="#9CA3AF" fontSize={11} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v/1000}k`} />
                <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" fontSize={11} axisLine={false} tickLine={false} tickFormatter={(v) => `${v/1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #E5E7EB", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
                  labelStyle={{ fontWeight: "bold", color: "#111827" }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "12px", paddingBottom: "10px" }} />
                <Line yAxisId="left" type="monotone" dataKey="Spend" stroke="#10B981" strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
                <Line yAxisId="left" type="monotone" dataKey="Revenue" stroke="#3B82F6" strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
                <Line yAxisId="right" type="monotone" dataKey="Conversions" stroke="#8B5CF6" strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Columns: Connections & AI Recommendations */}
        <div className="space-y-6">
          {/* Accounts Overview Connections */}
          <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-gray-900">Accounts Overview</h3>
              <Link href="/dashboard/integrations" className="text-xs font-semibold text-emerald-500 hover:text-emerald-600">
                View All
              </Link>
            </div>
            <div className="space-y-3.5">
              <AccountRow logo="/google.png" name="Google Ads" accountsCount="5 Accounts" isConnected={true} brandColor="bg-red-500" />
              <AccountRow logo="/meta.png" name="Meta Ads" accountsCount="4 Accounts" isConnected={true} brandColor="bg-blue-600" />
              <AccountRow logo="/ga4.png" name="Google Analytics 4" accountsCount="2 Accounts" isConnected={true} brandColor="bg-orange-500" />
            </div>
          </div>

          {/* AI Recommendations */}
          <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <span className="p-1 bg-violet-50 text-violet-600 rounded">
                <Sparkles size={16} />
              </span>
              <h3 className="font-bold text-gray-900 text-sm">Today&apos;s AI Recommendations</h3>
            </div>
            <div className="space-y-3">
              <RecommendationCard
                title="Increase budget for 3 high-performing campaigns"
                subtitle="Potential ROAS increase: 18–24%"
                impact="High Impact"
                impactColor="bg-emerald-50 text-emerald-600 border-emerald-100"
              />
              <RecommendationCard
                title="Pause 7 underperforming ad sets"
                subtitle="Potential spend saving: ₹18,430"
                impact="Medium Impact"
                impactColor="bg-amber-50 text-amber-600 border-amber-100"
              />
              <RecommendationCard
                title="Add new audience segment for campaign"
                subtitle="Potential conversion increase: 12–16%"
                impact="High Impact"
                impactColor="bg-blue-50 text-blue-600 border-blue-100"
              />
            </div>
            <Link
              href="/dashboard/neural-ops"
              className="block text-center text-xs font-bold text-emerald-500 hover:text-emerald-600 mt-2"
            >
              View All Recommendations →
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Campaign List & Donut Breakdown Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Campaigns Table */}
        <div className="lg:col-span-2 bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-900 text-lg">Top Campaigns</h3>
            <Link href="/dashboard/campaigns" className="text-xs font-semibold text-emerald-500 hover:text-emerald-600">
              View All
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Campaign</th>
                  <th className="pb-3 font-semibold text-right">Spend</th>
                  <th className="pb-3 font-semibold text-right">Conversions</th>
                  <th className="pb-3 font-semibold text-right">ROAS</th>
                </tr>
              </thead>
              <tbody className="text-sm font-medium text-gray-700">
                <CampaignRow name="Summer Sale – Search" platform="google" spend={45678} conversions={1987} roas="6.45" />
                <CampaignRow name="Brand Awareness – Meta" platform="meta" spend={32124} conversions={1256} roas="4.21" />
                <CampaignRow name="PMax – Electronics" platform="google" spend={28987} conversions={1025} roas="5.08" />
                <CampaignRow name="Retargeting – Meta" platform="meta" spend={19832} conversions={875} roas="3.84" isWarning={true} />
                <CampaignRow name="Leads – Google Ads" platform="google" spend={15734} conversions={654} roas="4.15" />
              </tbody>
            </table>
          </div>
        </div>

        {/* Spend by Platform & Campaign Status Donut Charts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
          {/* Spend by Platform */}
          <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <h3 className="font-bold text-gray-900 mb-4">Spend by Platform</h3>
            <div className="flex items-center justify-between gap-2">
              <div className="relative w-32 h-32 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={platformSpendData} innerRadius={38} outerRadius={50} dataKey="value">
                      {platformSpendData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PLATFORM_COLORS[index]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Total</span>
                  <span className="text-xs font-bold text-gray-800">₹2.45L</span>
                </div>
              </div>
              {/* Legend */}
              <div className="flex-1 space-y-2 text-xs font-semibold text-gray-600 pl-4">
                {platformSpendData.map((entry, index) => (
                  <div key={entry.name} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PLATFORM_COLORS[index] }}></div>
                      <span>{entry.name}</span>
                    </div>
                    <span className="text-gray-400">{entry.percent}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Campaign Status */}
          <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-900">Campaign Status</h3>
              <Link href="/dashboard/campaigns" className="text-xs font-semibold text-emerald-500 hover:text-emerald-600">
                View All
              </Link>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="relative w-32 h-32 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={campaignStatusData} innerRadius={38} outerRadius={50} dataKey="value">
                      {campaignStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[index]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-bold text-gray-800">24</span>
                  <span className="text-[9px] font-bold text-gray-400 uppercase leading-none">Total</span>
                </div>
              </div>
              {/* Legend */}
              <div className="flex-1 space-y-1.5 text-xs font-semibold text-gray-600 pl-4">
                {campaignStatusData.map((entry, index) => (
                  <div key={entry.name} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[index] }}></div>
                      <span>{entry.name}</span>
                    </div>
                    <span className="text-gray-400">{entry.value} ({entry.percent})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Widgets: Activity log, Health indexes, Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="font-bold text-gray-900 text-base">Recent Activity</h3>
          </div>
          <div className="space-y-4">
            <ActivityRow
              platform="meta"
              text="New ad set 'Summer – Interest 2' created"
              actor="Arjun Mehta"
              time="2 mins ago"
              status="Success"
            />
            <ActivityRow
              platform="google"
              text="Budget increased for 2 campaigns"
              actor="Neural Ops"
              time="10 mins ago"
              status="Success"
            />
          </div>
        </div>

        {/* Client Health Scores */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-900 text-base">Client Health Score</h3>
            <Link href="/dashboard/clients" className="text-xs font-semibold text-emerald-500 hover:text-emerald-600">
              View All
            </Link>
          </div>
          <div className="space-y-3.5">
            <HealthRow client="EcoMart India" score={92} change="+12%" isPositive={true} />
            <HealthRow client="FitLife Gyms" score={68} change="-8%" isPositive={false} />
            <HealthRow client="UrbanStays Hotel" score={88} change="+5%" isPositive={true} />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="font-bold text-gray-900 text-base">Quick Actions</h3>
          </div>
          <div className="grid grid-cols-5 gap-2">
            <ActionIcon href="/dashboard/campaign-wizard" icon={<PlusCircle size={20} />} label="Create Campaign" color="text-emerald-500 bg-emerald-50 hover:bg-emerald-100" />
            <ActionIcon href="/dashboard/reports" icon={<FileText size={20} />} label="Generate Report" color="text-cyan-500 bg-cyan-50 hover:bg-cyan-100" />
            <ActionIcon href="/dashboard/clients" icon={<UserPlus size={20} />} label="Add Client" color="text-blue-500 bg-blue-50 hover:bg-blue-100" />
            <ActionIcon href="/dashboard/ai-insights" icon={<Sparkles size={20} />} label="AI Insights" color="text-purple-500 bg-purple-50 hover:bg-purple-100" />
            <ActionIcon href="/dashboard/automations" icon={<Zap size={20} />} label="Automation Rule" color="text-teal-500 bg-teal-50 hover:bg-teal-100" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Sparkline Mini AreaChart
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const chartData = data.map((val, i) => ({ name: i, value: val }));
  return (
    <div className="h-6 w-20">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, bottom: 2, left: 2, right: 2 }}>
          <Area type="monotone" dataKey="value" stroke={color} fill={`${color}12`} strokeWidth={1.5} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Metric Card Component
function KpiCard({ title, value, change, sparkData, sparkColor, isPositive, icon }: any) {
  return (
    <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
      <div className="flex justify-between items-start">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{title}</span>
        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100">
          {icon}
        </div>
      </div>
      <div className="mt-4 flex items-end justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 tracking-tight leading-none">{value}</h3>
          <span className={`inline-flex items-center gap-0.5 text-xs font-bold mt-2 ${isPositive ? "text-emerald-500" : "text-red-500"}`}>
            {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {change} <span className="text-gray-400 font-normal">vs last 30d</span>
          </span>
        </div>
        <Sparkline data={sparkData} color={sparkColor} />
      </div>
    </div>
  );
}

// Account connection status row
function AccountRow({ name, accountsCount, isConnected, brandColor }: any) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50/50 border border-gray-100 rounded-xl">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold ${brandColor}`}>
          {name.charAt(0)}
        </div>
        <div>
          <p className="text-sm font-bold text-gray-800">{name}</p>
          <p className="text-xs text-gray-400">{accountsCount}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100/60 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Connected
        </span>
      </div>
    </div>
  );
}

// Recommendations Card
function RecommendationCard({ title, subtitle, impact, impactColor }: any) {
  return (
    <div className="p-3 border border-gray-100 bg-gray-50/30 rounded-xl space-y-1">
      <div className="flex justify-between items-start gap-2">
        <p className="text-xs font-bold text-gray-800 leading-tight">{title}</p>
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${impactColor}`}>
          {impact}
        </span>
      </div>
      <p className="text-[10px] text-gray-400 font-medium">{subtitle}</p>
    </div>
  );
}

// Top Campaigns row
function CampaignRow({ name, platform, spend, conversions, roas, isWarning = false }: any) {
  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
      <td className="py-3.5 pr-4">
        <div className="flex items-center gap-3">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0 ${
            platform === "google" ? "bg-red-500" : "bg-blue-600"
          }`}>
            {platform.charAt(0).toUpperCase()}
          </div>
          <span className="font-bold text-gray-800">{name}</span>
        </div>
      </td>
      <td className="py-3.5 text-right font-semibold text-gray-600">{formatINR(spend)}</td>
      <td className="py-3.5 text-right font-semibold text-gray-600">{conversions.toLocaleString("en-IN")}</td>
      <td className="py-3.5 text-right">
        <span className={`text-xs font-bold px-2 py-1 rounded-md ${
          isWarning ? "bg-amber-50 text-amber-600 border border-amber-100" : "bg-emerald-50 text-emerald-600 border border-emerald-100"
        }`}>
          {roas}x
        </span>
      </td>
    </tr>
  );
}

// Activity row
function ActivityRow({ platform, text, actor, time, status }: any) {
  return (
    <div className="flex items-center justify-between gap-2 p-2">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0 ${
          platform === "google" ? "bg-red-500" : "bg-blue-600"
        }`}>
          {platform.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-xs font-bold text-gray-800 leading-tight">{text}</p>
          <p className="text-[10px] text-gray-400 font-medium mt-0.5">{actor} • {time}</p>
        </div>
      </div>
      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100/50">
        {status}
      </span>
    </div>
  );
}

// Health index score row
function HealthRow({ client, score, change, isPositive }: any) {
  return (
    <div className="flex items-center justify-between p-2.5 border border-gray-100 rounded-xl">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-600 text-xs shadow-sm">
          {client.charAt(0)}
        </div>
        <span className="text-xs font-bold text-gray-800">{client}</span>
      </div>
      <div className="flex items-center gap-4">
        <span className={`text-xs font-bold flex items-center gap-0.5 ${isPositive ? "text-emerald-500" : "text-red-500"}`}>
          {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {change}
        </span>
        <span className={`text-sm font-bold w-7 text-right ${
          score >= 80 ? "text-emerald-500" : "text-amber-500"
        }`}>
          {score}
        </span>
      </div>
    </div>
  );
}

// Quick Actions item
function ActionIcon({ href, icon, label, color }: any) {
  return (
    <Link href={href} className="flex flex-col items-center text-center space-y-1.5 group shrink-0">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${color} border border-gray-100/50 shadow-sm group-hover:scale-105`}>
        {icon}
      </div>
      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide group-hover:text-gray-700 transition-colors w-16 truncate">
        {label}
      </span>
    </Link>
  );
}
