"use client";

import React, { useEffect, useState } from "react";
import { Users, Briefcase, Activity } from "lucide-react";

export default function AgencyDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/reports/dashboards/agency', {
      headers: { 'x-organization-id': 'system-org' }
    })
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="p-8 text-gray-500">Loading agency dashboard...</div>;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">Agency Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-2">
            <Users className="text-emerald-500" size={20} />
            <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Clients</span>
          </div>
          <h3 className="text-3xl font-bold text-gray-900">{data?.clientsCount || 0}</h3>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-2">
            <Briefcase className="text-blue-500" size={20} />
            <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Active Campaigns</span>
          </div>
          <h3 className="text-3xl font-bold text-gray-900">{data?.activeCampaigns || 0}</h3>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="text-purple-500" size={20} />
            <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Aggregate Health Score</span>
          </div>
          <h3 className="text-3xl font-bold text-gray-900">{data?.healthScore || 0}%</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Monthly Spend Trend</h3>
          <div className="h-64 flex items-end justify-around gap-2">
            {data?.spendTrend?.map((item: any, idx: number) => (
              <div key={idx} className="flex flex-col items-center flex-1">
                <div 
                  className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t"
                  style={{ height: `${Math.max(20, (item.value / (Math.max(...(data?.spendTrend?.map((t: any) => t.value) || [1])) || 1)) * 100)}%` }}
                  title={`$${item.value.toLocaleString()}`}
                />
                <span className="text-xs text-gray-600 mt-2">{item.month}</span>
              </div>
            )) || <p className="text-gray-400">No data available</p>}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Monthly Revenue Trend</h3>
          <div className="h-64 flex items-end justify-around gap-2">
            {data?.revenueTrend?.map((item: any, idx: number) => (
              <div key={idx} className="flex flex-col items-center flex-1">
                <div 
                  className="w-full bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t"
                  style={{ height: `${Math.max(20, (item.value / (Math.max(...(data?.revenueTrend?.map((t: any) => t.value) || [1])) || 1)) * 100)}%` }}
                  title={`$${item.value.toLocaleString()}`}
                />
                <span className="text-xs text-gray-600 mt-2">{item.month}</span>
              </div>
            )) || <p className="text-gray-400">No data available</p>}
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mt-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Client Performance Matrix</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-bold text-gray-900">Client</th>
                <th className="text-right py-3 px-4 font-bold text-gray-900">Active Campaigns</th>
                <th className="text-right py-3 px-4 font-bold text-gray-900">Monthly Spend</th>
                <th className="text-right py-3 px-4 font-bold text-gray-900">Health Score</th>
              </tr>
            </thead>
            <tbody>
              {data?.clientsPerformance?.map((client: any, idx: number) => (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-900">{client.name}</td>
                  <td className="text-right py-3 px-4 text-gray-600">{client.activeCampaigns}</td>
                  <td className="text-right py-3 px-4 text-gray-600">${client.spend.toLocaleString()}</td>
                  <td className="text-right py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      client.healthScore >= 80 ? 'bg-emerald-100 text-emerald-700' :
                      client.healthScore >= 60 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {client.healthScore}%
                    </span>
                  </td>
                </tr>
              )) || (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-400">No client data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
