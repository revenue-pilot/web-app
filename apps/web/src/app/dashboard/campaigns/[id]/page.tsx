"use client";
import React, { use } from "react";
import { ArrowLeft, Target, Settings, Activity, BarChart3, Pause, Play } from "lucide-react";
import Link from "next/link";

export default function CampaignDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  // In a real app, we would fetch data based on id

  
  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard" className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-white">Q3 B2B Lead Gen</h1>
            <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs rounded-full font-medium tracking-wide">
              ACTIVE
            </span>
          </div>
          <p className="text-gray-400 mt-1 flex items-center gap-2">
            <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" className="w-4 h-4" alt="Google" />
            Google Ads • Search Network
          </p>
        </div>
        <div className="ml-auto flex gap-3">
          <button className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
            <Settings size={16} /> Edit Settings
          </button>
          <button className="px-4 py-2 bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
            <Pause size={16} /> Pause Campaign
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 p-5 rounded-2xl">
          <p className="text-gray-400 text-sm font-medium">Spend</p>
          <p className="text-3xl font-bold text-white mt-1">$4,250.00</p>
          <p className="text-emerald-400 text-sm mt-2 flex items-center gap-1"><Activity size={14} /> on pace</p>
        </div>
        <div className="bg-white/5 border border-white/10 p-5 rounded-2xl">
          <p className="text-gray-400 text-sm font-medium">Conversions</p>
          <p className="text-3xl font-bold text-white mt-1">142</p>
          <p className="text-emerald-400 text-sm mt-2 flex items-center gap-1">+12% vs last week</p>
        </div>
        <div className="bg-white/5 border border-white/10 p-5 rounded-2xl">
          <p className="text-gray-400 text-sm font-medium">Cost per Conv.</p>
          <p className="text-3xl font-bold text-white mt-1">$29.92</p>
          <p className="text-red-400 text-sm mt-2 flex items-center gap-1">-4% vs target</p>
        </div>
        <div className="bg-purple-600/20 border border-purple-500/30 p-5 rounded-2xl">
          <p className="text-purple-300 text-sm font-medium">ROAS</p>
          <p className="text-3xl font-bold text-purple-400 mt-1">3.2x</p>
          <p className="text-purple-300 text-sm mt-2 flex items-center gap-1">Highly Profitable</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Ad Groups Table */}
        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-white/10 flex justify-between items-center bg-black/40">
            <h2 className="font-semibold text-lg flex items-center gap-2"><Target className="text-blue-400" /> Ad Groups</h2>
          </div>
          <table className="w-full text-left">
            <thead className="bg-white/5 text-gray-400 text-sm border-b border-white/10">
              <tr>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Clicks</th>
                <th className="px-6 py-4 font-medium">Conv.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <tr className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 font-medium text-white">Competitor Keywords</td>
                <td className="px-6 py-4"><span className="text-emerald-400 text-xs bg-emerald-400/10 px-2 py-1 rounded">Enabled</span></td>
                <td className="px-6 py-4 text-gray-300">1,245</td>
                <td className="px-6 py-4 text-gray-300">84</td>
              </tr>
              <tr className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 font-medium text-white">Generic SaaS terms</td>
                <td className="px-6 py-4"><span className="text-emerald-400 text-xs bg-emerald-400/10 px-2 py-1 rounded">Enabled</span></td>
                <td className="px-6 py-4 text-gray-300">890</td>
                <td className="px-6 py-4 text-gray-300">58</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* AI Insights Panel */}
        <div className="bg-gradient-to-b from-purple-900/40 to-black/40 border border-purple-500/20 rounded-2xl p-6">
          <h2 className="font-semibold text-lg flex items-center gap-2 mb-6">
            <BarChart3 className="text-purple-400" /> AI Insights
          </h2>
          <div className="space-y-4">
            <div className="bg-black/50 p-4 rounded-xl border border-white/5">
              <p className="text-sm text-gray-300 leading-relaxed">
                The <span className="text-white font-medium">&quot;Competitor Keywords&quot;</span> ad group is driving 60% of conversions but consuming 80% of budget. 
              </p>
              <button className="mt-3 text-xs bg-purple-600/30 text-purple-300 border border-purple-500/50 px-3 py-1.5 rounded-lg font-medium hover:bg-purple-600/50 transition-colors">
                Lower Max CPC
              </button>
            </div>
            <div className="bg-black/50 p-4 rounded-xl border border-white/5">
              <p className="text-sm text-gray-300 leading-relaxed">
                Ad copy variation B has a <span className="text-emerald-400 font-medium">45% higher CTR</span>. We recommend pausing variation A.
              </p>
              <button className="mt-3 text-xs bg-purple-600/30 text-purple-300 border border-purple-500/50 px-3 py-1.5 rounded-lg font-medium hover:bg-purple-600/50 transition-colors">
                Pause Variation A
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
