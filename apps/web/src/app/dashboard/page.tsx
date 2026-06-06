"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  HelpCircle,
  Plus,
  AlertCircle
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { useActivityLogs, useAnalytics, useBilling, useCampaigns } from "@/hooks/useApi";

function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value);
}

function emptySummary() {
  return { spend: 0, revenue: 0, conversions: 0, roas: 0 };
}

function KPI({ title, value, change, positive, sparkData, sparkColor, icon }: any) {
  return (
    <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
      <div className="flex justify-between items-start gap-3">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{title}</span>
        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100">
          {icon}
        </div>
      </div>
      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 tracking-tight leading-none">{value}</h3>
          <span className={`inline-flex items-center gap-0.5 text-xs font-bold mt-2 ${positive ? "text-emerald-500" : "text-red-500"}`}>
            {positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {change} <span className="text-gray-400 font-normal">vs last 30d</span>
          </span>
        </div>
        <div className="h-6 w-20">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData.map((val: number, index: number) => ({ name: index, value: val }))} margin={{ top: 2, bottom: 2, left: 2, right: 2 }}>
              <Area type="monotone" dataKey="value" stroke={sparkColor} fill={`${sparkColor}12`} strokeWidth={1.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function LiveCard({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm">
      <div className="flex justify-between items-center gap-3 mb-5">
        <h3 className="font-bold text-gray-900">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

export default function CommandNexusPage() {
  const { data: analyticsData, loading: analyticsLoading, error: analyticsError } = useAnalytics();
  const { data: campaignsData, loading: campaignsLoading, error: campaignsError } = useCampaigns();
  const { data: billingData, loading: billingLoading } = useBilling();
  const { data: activityData, loading: activityLoading } = useActivityLogs(8);

  if (analyticsError || campaignsError) {
    const message = analyticsError || campaignsError || "Unable to load dashboard data.";
    return (
      <div className="flex items-center justify-center min-h-[70vh] px-4">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="font-bold text-red-900 mb-2">Error Loading Dashboard</h3>
          <p className="text-red-700 text-sm mb-4">{message}</p>
          <button onClick={() => window.location.reload()} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const campaigns = Array.isArray(campaignsData) ? campaignsData : [];
  const summary = analyticsData?.summary || emptySummary();
  const chartData = Array.isArray(analyticsData?.chartData) ? analyticsData.chartData : [];
  const platformSpendData = Array.isArray(analyticsData?.platformSpend) ? analyticsData.platformSpend : [];
  const campaignStatusData = Array.isArray(analyticsData?.campaignStatus) ? analyticsData.campaignStatus : [];
  const sortedCampaigns = [...campaigns]
    .sort((a: any, b: any) => Number(b.spendNum ?? b.spend ?? 0) - Number(a.spendNum ?? a.spend ?? 0))
    .slice(0, 5);
  const activities = Array.isArray(activityData) ? activityData.slice(0, 5) : [];
  const billing = billingData && typeof billingData === "object" ? billingData : null;

  const spendSpark = chartData.map((entry: any) => Number(entry.Spend || 0));
  const convSpark = chartData.map((entry: any) => Number(entry.Conversions || 0));
  const revSpark = chartData.map((entry: any) => Number(entry.Revenue || 0));
  const roasSpark = chartData.map((entry: any) => {
    const spend = Number(entry.Spend || 0);
    const revenue = Number(entry.Revenue || 0);
    return spend > 0 ? Number((revenue / spend).toFixed(2)) * 10 : 0;
  });

  const totalSpend = Number(summary.spend || 0);
  const totalCampaigns = sortedCampaigns.length;
  const usage = billing?.usage || { campaigns: 0, workspaces: 0, team: 0, storage: 0, adAccounts: 0, clients: 0 };

  if (analyticsLoading || campaignsLoading) {
    return (
      <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
        <div className="h-14 rounded-2xl bg-gray-100 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="h-28 rounded-2xl bg-gray-100 animate-pulse" />
          <div className="h-28 rounded-2xl bg-gray-100 animate-pulse" />
          <div className="h-28 rounded-2xl bg-gray-100 animate-pulse" />
          <div className="h-28 rounded-2xl bg-gray-100 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            Live Dashboard
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Only database-backed campaign, billing, and activity data are rendered here.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white border border-gray-200/80 rounded-xl px-4 py-2 flex items-center gap-2 text-sm font-semibold text-gray-600 shadow-sm cursor-default">
            <Calendar size={16} className="text-gray-400" />
            <span>Last 30 Days</span>
          </div>
          <Link href="/dashboard/campaign-wizard" className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-emerald-500/10 transition-all text-sm flex items-center gap-2">
            <Plus size={16} />
            <span>Create Campaign</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPI
          title="Total Spend"
          value={formatINR(totalSpend)}
          change="Live"
          positive={true}
          sparkData={spendSpark}
          sparkColor="#10B981"
          icon={<span className="text-emerald-500 font-semibold text-sm">₹</span>}
        />
        <KPI
          title="Total Conversions"
          value={Number(summary.conversions || 0).toLocaleString("en-IN")}
          change="Live"
          positive={true}
          sparkData={convSpark}
          sparkColor="#10B981"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-emerald-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
            </svg>
          }
        />
        <KPI
          title="Total Revenue"
          value={formatINR(Number(summary.revenue || 0))}
          change="Live"
          positive={true}
          sparkData={revSpark}
          sparkColor="#3B82F6"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-blue-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
            </svg>
          }
        />
        <KPI
          title="Average ROAS"
          value={`${Number(summary.roas || 0).toFixed(2)}x`}
          change="Live"
          positive={true}
          sparkData={roasSpark}
          sparkColor="#F59E0B"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-amber-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" />
            </svg>
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-900 text-lg">Performance Overview</h3>
              <button className="text-gray-400 hover:text-gray-600">
                <HelpCircle size={16} />
              </button>
            </div>
            <div className="text-xs font-semibold text-gray-400">Database-backed trend</div>
          </div>

          <div className="h-72 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                  <XAxis dataKey="name" stroke="#9CA3AF" fontSize={11} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" stroke="#9CA3AF" fontSize={11} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${Number(v) / 1000}k`} />
                  <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" fontSize={11} axisLine={false} tickLine={false} tickFormatter={(v) => `${Number(v) / 1000}k`} />
                  <Tooltip contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #E5E7EB", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }} labelStyle={{ fontWeight: "bold", color: "#111827" }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: "12px", paddingBottom: "10px" }} />
                  <Line yAxisId="left" type="monotone" dataKey="Spend" stroke="#10B981" strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
                  <Line yAxisId="left" type="monotone" dataKey="Revenue" stroke="#3B82F6" strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
                  <Line yAxisId="right" type="monotone" dataKey="Conversions" stroke="#8B5CF6" strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center rounded-2xl border border-dashed border-gray-200 text-sm text-gray-400 font-semibold">
                No metric rows found in the database yet.
              </div>
            )}
          </div>
        </div>

        <LiveCard
          title="Billing & Usage"
          action={<Link href="/dashboard/billing" className="text-xs font-semibold text-emerald-500 hover:text-emerald-600">View Billing</Link>}
        >
          <div className="space-y-4 text-sm text-gray-600">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-500">Plan</span>
              <span className="font-bold text-gray-900">{billing?.plan || "Starter"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-500">Campaigns</span>
              <span className="font-bold text-gray-900">{usage.campaigns}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-500">Workspaces</span>
              <span className="font-bold text-gray-900">{usage.workspaces}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-500">Team members</span>
              <span className="font-bold text-gray-900">{usage.team}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-500">Clients</span>
              <span className="font-bold text-gray-900">{usage.clients}</span>
            </div>
          </div>
        </LiveCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-900 text-lg">Top Campaigns</h3>
            <Link href="/dashboard/campaigns" className="text-xs font-semibold text-emerald-500 hover:text-emerald-600">View All</Link>
          </div>
          {sortedCampaigns.length > 0 ? (
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
                  {sortedCampaigns.map((campaign: any) => {
                    const spend = Number(campaign.spendNum ?? campaign.spend ?? 0);
                    const roas = Number(campaign.roasNum ?? campaign.roas ?? 0);
                    return (
                      <tr key={campaign.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="py-3.5 pr-4">
                          <div className="flex flex-col gap-1">
                            <Link href={`/dashboard/campaigns/${campaign.id}`} className="font-bold text-gray-900 hover:text-emerald-500 transition-colors">
                              {campaign.name}
                            </Link>
                            <span className="text-[10px] text-gray-400 font-semibold">{campaign.platform}</span>
                          </div>
                        </td>
                        <td className="py-3.5 text-right font-semibold text-gray-600">{formatINR(spend)}</td>
                        <td className="py-3.5 text-right font-semibold text-gray-600">{Number(campaign.conversions || 0).toLocaleString("en-IN")}</td>
                        <td className="py-3.5 text-right">
                          <span className={`text-xs font-bold px-2 py-1 rounded-md ${roas >= 4 ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-amber-50 text-amber-600 border border-amber-100"}`}>
                            {roas.toFixed(2)}x
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-200 p-10 text-center text-sm text-gray-400 font-semibold">
              No campaigns found in the database.
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
          <LiveCard title="Spend by Platform">
            {platformSpendData.length > 0 ? (
              <div className="flex items-center justify-between gap-4">
                <div className="relative w-32 h-32 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={platformSpendData} innerRadius={38} outerRadius={50} dataKey="value">
                        {platformSpendData.map((entry: any, index: number) => (
                          <Cell key={`${entry.name}-${index}`} fill={index === 0 ? "#10B981" : index === 1 ? "#3B82F6" : "#F59E0B"} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Total</span>
                    <span className="text-xs font-bold text-gray-800">{formatINR(totalSpend)}</span>
                  </div>
                </div>
                <div className="flex-1 space-y-2 text-xs font-semibold text-gray-600 pl-2">
                  {platformSpendData.map((entry: any) => (
                    <div key={entry.name} className="flex justify-between items-center gap-2">
                      <span>{entry.name}</span>
                      <span className="text-gray-400">{entry.percent}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-200 p-10 text-center text-sm text-gray-400 font-semibold">
                No platform spend data yet.
              </div>
            )}
          </LiveCard>

          <LiveCard title="Campaign Status">
            {campaignStatusData.length > 0 ? (
              <div className="flex items-center justify-between gap-4">
                <div className="relative w-32 h-32 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={campaignStatusData} innerRadius={38} outerRadius={50} dataKey="value">
                        {campaignStatusData.map((entry: any, index: number) => (
                          <Cell key={`${entry.name}-${index}`} fill={index === 0 ? "#10B981" : index === 1 ? "#F59E0B" : index === 2 ? "#9CA3AF" : "#EF4444"} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-bold text-gray-800">{campaignStatusData.reduce((sum: number, entry: any) => sum + Number(entry.value || 0), 0)}</span>
                    <span className="text-[9px] font-bold text-gray-400 uppercase leading-none">Total</span>
                  </div>
                </div>
                <div className="flex-1 space-y-1.5 text-xs font-semibold text-gray-600 pl-2">
                  {campaignStatusData.map((entry: any) => (
                    <div key={entry.name} className="flex justify-between items-center gap-2">
                      <span>{entry.name}</span>
                      <span className="text-gray-400">{entry.value} ({entry.percent})</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-200 p-10 text-center text-sm text-gray-400 font-semibold">
                No campaign status data yet.
              </div>
            )}
          </LiveCard>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <LiveCard title="Recent Activity" action={<Link href="/dashboard/activity" className="text-xs font-semibold text-emerald-500 hover:text-emerald-600">View All</Link>}>
          {activityLoading ? (
            <div className="text-sm text-gray-400 font-semibold">Loading activity...</div>
          ) : activities.length > 0 ? (
            <div className="space-y-3">
              {activities.map((activity: any) => (
                <div key={activity.id} className="p-3 rounded-xl border border-gray-100 bg-gray-50/40">
                  <p className="text-sm font-semibold text-gray-900">{activity.description || activity.message || "Activity recorded"}</p>
                  <p className="text-[11px] text-gray-400 mt-1">{activity.createdAt ? new Date(activity.createdAt).toLocaleString() : ""}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-200 p-10 text-center text-sm text-gray-400 font-semibold">
              No activity rows found in the database.
            </div>
          )}
        </LiveCard>

        <LiveCard title="Database Snapshot">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl border border-gray-100 bg-gray-50/40 p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Campaigns</div>
              <div className="mt-1 text-lg font-bold text-gray-900">{totalCampaigns}</div>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/40 p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Clients</div>
              <div className="mt-1 text-lg font-bold text-gray-900">{usage.clients}</div>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/40 p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Workspaces</div>
              <div className="mt-1 text-lg font-bold text-gray-900">{usage.workspaces}</div>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/40 p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Team</div>
              <div className="mt-1 text-lg font-bold text-gray-900">{usage.team}</div>
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-400">All counts above come from live API responses backed by the database.</div>
        </LiveCard>
      </div>
    </div>
  );
}
