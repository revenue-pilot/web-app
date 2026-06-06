"use client";
import React from "react";
import { LineChart as RevenueIcon, Sparkles, TrendingUp, BarChart2, Zap, Clock, ShieldCheck } from "lucide-react";

interface FeatureUsage {
  name: string;
  adoption: string;
  usageCount: number;
  duration: string;
}

export default function AdminRevenueLabPage() {
  const usageStats: FeatureUsage[] = [
    { name: "RatioForge Vision Cropper", adoption: "84%", usageCount: 12400, duration: "1.2 mins avg" },
    { name: "Automation Forge", adoption: "72%", usageCount: 9200, duration: "4.5 mins avg" },
    { name: "Pulse Matrix Attributions", adoption: "55%", usageCount: 4100, duration: "2.8 mins avg" },
    { name: "AI Insights Chatbot", adoption: "48%", usageCount: 2900, duration: "30s avg" },
    { name: "Manual PDF reports export", adoption: "12%", usageCount: 450, duration: "15s avg" }
  ];

  return (
    <div className="space-y-6 pb-12 font-sans">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <RevenueIcon size={24} className="text-[#50BB8F]" />
          <span>Revenue Lab</span>
        </h1>
        <p className="text-zinc-400 text-xs mt-0.5">Product intelligence center, feature adoption tracking, and cohort user retention logs.</p>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0D121F] border border-[#1B2438] p-4 rounded-xl">
          <span className="text-[9px] font-bold text-zinc-500 uppercase block">Weekly Active Users (WAU)</span>
          <span className="text-lg font-bold text-white block mt-1">4,290 Users</span>
          <span className="text-[8px] text-emerald-400 font-bold block mt-0.5">+12.4% vs last week</span>
        </div>
        <div className="bg-[#0D121F] border border-[#1B2438] p-4 rounded-xl">
          <span className="text-[9px] font-bold text-zinc-500 uppercase block">Average Session Duration</span>
          <span className="text-lg font-bold text-white block mt-1">14.8 mins</span>
          <span className="text-[8px] text-zinc-400 font-semibold block mt-0.5">High task completion rate</span>
        </div>
        <div className="bg-[#0D121F] border border-[#1B2438] p-4 rounded-xl">
          <span className="text-[9px] font-bold text-zinc-500 uppercase block">30-Day Cohort Retention</span>
          <span className="text-lg font-bold text-emerald-400 block mt-1">83.5%</span>
          <span className="text-[8px] text-zinc-400 font-semibold block mt-0.5">Premium SaaS benchmark: 78%</span>
        </div>
      </div>

      {/* Features Adoption Ledger Card */}
      <div className="bg-[#0D121F] border border-[#1B2438] p-5 rounded-2xl shadow-sm">
        <h3 className="font-bold text-white text-xs uppercase tracking-wider pb-2 border-b border-[#1B2438] mb-4">
          Feature Adoption Ledger
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#1B2438] text-zinc-500 font-bold uppercase tracking-wider">
                <th className="pb-3">SaaS Feature</th>
                <th className="pb-3 text-right">Adoption Rate</th>
                <th className="pb-3 text-right">Monthly Clicks / Usage</th>
                <th className="pb-3 text-right">Session Interaction</th>
              </tr>
            </thead>
            <tbody className="font-semibold text-zinc-300">
              {usageStats.map((item, idx) => (
                <tr key={idx} className="border-b border-[#1C283F] hover:bg-[#151D2F] transition-colors">
                  <td className="py-3 font-bold text-white">
                    {item.name}
                  </td>
                  <td className="py-3 text-right font-mono font-bold text-emerald-400">
                    {item.adoption}
                  </td>
                  <td className="py-3 text-right text-zinc-200">
                    {item.usageCount.toLocaleString()} uses
                  </td>
                  <td className="py-3 text-right text-zinc-500">
                    {item.duration}
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
