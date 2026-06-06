"use client";
import React, { useState } from "react";
import { Activity, BarChart, TrendingUp, HelpCircle, Layers } from "lucide-react";
import { useAnalytics } from "@/hooks/useApi";
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function PulseMatrixPage() {
  const { data: analyticsData, loading, error, refetch } = useAnalytics();
  const [attributionModel, setAttributionModel] = useState("Last Click");

  const funnelData = [
    { stage: "Impressions", Google: 1500000, Meta: 1200000 },
    { stage: "Clicks", Google: 45000, Meta: 36000 },
    { stage: "Leads", Google: 4500, Meta: 2400 },
    { stage: "Customers", Google: 987, Meta: 654 }
  ];

  const attributionModels = [
    { name: "Last Click", Google: "62%", Meta: "30%", Others: "8%", description: "Attributes 100% of the conversion to the last ad clicked by the customer." },
    { name: "First Click", Google: "40%", Meta: "50%", Others: "10%", description: "Attributes 100% of the conversion to the first ad the user interacted with." },
    { name: "Linear", Google: "50%", Meta: "40%", Others: "10%", description: "Distributes conversion value equally across all ad touchpoints in the funnel." },
    { name: "Time Decay", Google: "55%", Meta: "37%", Others: "8%", description: "Gives more weight to touchpoints that occurred closer in time to the conversion." }
  ];

  const cohortData = [
    { month: "Jan 2026", size: 120, m1: "100%", m2: "92%", m3: "88%", m4: "85%", m5: "83%" },
    { month: "Feb 2026", size: 145, m1: "100%", m2: "94%", m3: "90%", m4: "87%", m5: "-" },
    { month: "Mar 2026", size: 160, m1: "100%", m2: "95%", m3: "89%", m4: "-", m5: "-" },
    { month: "Apr 2026", size: 190, m1: "100%", m2: "93%", m3: "-", m4: "-", m5: "-" }
  ];

  const currentModelDetails = attributionModels.find((m) => m.name === attributionModel) || attributionModels[0];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
          <Activity size={24} className="text-emerald-500" />
          <span>Pulse Matrix</span>
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">Attribution modeling, multi-channel funnel flows, and retention intelligence.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Funnel Chart Panel */}
        <div className="lg:col-span-2 bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-900">Conversion Funnel Breakdown</h3>
            <span className="text-xs text-gray-400 font-semibold uppercase">Multi-Channel Google vs Meta</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={funnelData} margin={{ top: 10, bottom: 0, left: -20, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="stage" stroke="#9CA3AF" fontSize={11} axisLine={false} tickLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={11} axisLine={false} tickLine={false} />
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
                <Bar dataKey="Google" fill="#F87171" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Meta" fill="#60A5FA" radius={[4, 4, 0, 0]} />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Attribution Selector Sidebar */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <h3 className="font-bold text-gray-900 text-sm mb-3">Select Attribution Model</h3>
            <div className="grid grid-cols-2 gap-2">
              {attributionModels.map((m) => (
                <button
                  key={m.name}
                  onClick={() => setAttributionModel(m.name)}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition-all ${
                    attributionModel === m.name
                      ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                      : "bg-white text-gray-500 hover:bg-gray-50 border-gray-200"
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <p className="text-xs font-bold text-gray-800 mb-1 flex items-center gap-1.5">
              <span>{currentModelDetails.name} Model</span>
              <HelpCircle size={14} className="text-gray-400" />
            </p>
            <p className="text-[10px] text-gray-400 font-medium leading-relaxed mb-3">
              {currentModelDetails.description}
            </p>

            <div className="space-y-2 text-xs font-semibold text-gray-600 pt-2 border-t border-gray-200/60">
              <div className="flex justify-between">
                <span>Google Ads weight</span>
                <span className="text-gray-900">{currentModelDetails.Google}</span>
              </div>
              <div className="flex justify-between">
                <span>Meta Ads weight</span>
                <span className="text-gray-900">{currentModelDetails.Meta}</span>
              </div>
              <div className="flex justify-between">
                <span>Other channels</span>
                <span className="text-gray-900">{currentModelDetails.Others}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cohorts Panel */}
      <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-gray-900 text-lg mb-6">Customer Cohort Retention Rate</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 text-xs font-semibold uppercase tracking-wider">
                <th className="pb-3 text-left font-semibold">Cohort Month</th>
                <th className="pb-3 font-semibold">Customers Size</th>
                <th className="pb-3 font-semibold">Month 1</th>
                <th className="pb-3 font-semibold">Month 2</th>
                <th className="pb-3 font-semibold">Month 3</th>
                <th className="pb-3 font-semibold">Month 4</th>
                <th className="pb-3 font-semibold">Month 5</th>
              </tr>
            </thead>
            <tbody className="text-xs font-semibold text-gray-600">
              {cohortData.map((row) => (
                <tr key={row.month} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 text-left font-bold text-gray-800">{row.month}</td>
                  <td className="py-4 font-bold text-gray-500">{row.size}</td>
                  <td className="py-4"><span className="bg-emerald-500/10 text-emerald-600 px-2 py-1 rounded font-bold border border-emerald-100/30">{row.m1}</span></td>
                  <td className="py-4"><span className="bg-emerald-500/10 text-emerald-600 px-2 py-1 rounded font-bold border border-emerald-100/30">{row.m2}</span></td>
                  <td className="py-4"><span className="bg-emerald-500/10 text-emerald-600 px-2 py-1 rounded font-bold border border-emerald-100/30">{row.m3}</span></td>
                  <td className="py-4">
                    {row.m4 !== "-" ? (
                      <span className="bg-emerald-500/10 text-emerald-600 px-2 py-1 rounded font-bold border border-emerald-100/30">{row.m4}</span>
                    ) : (
                      <span className="text-gray-300 font-medium">-</span>
                    )}
                  </td>
                  <td className="py-4">
                    {row.m5 !== "-" ? (
                      <span className="bg-emerald-500/10 text-emerald-600 px-2 py-1 rounded font-bold border border-emerald-100/30">{row.m5}</span>
                    ) : (
                      <span className="text-gray-300 font-medium">-</span>
                    )}
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
