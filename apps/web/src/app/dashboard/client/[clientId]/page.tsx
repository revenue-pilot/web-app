"use client";

import React, { useEffect, useState } from "react";
import { DollarSign, MousePointerClick, TrendingUp } from "lucide-react";
import { DynamicLineChart, DynamicBarChart } from "@/components/charts/DynamicCharts";

export default function ClientDashboardPage({ params }: { params: Promise<{ clientId: string }> }) {
  const resolvedParams = React.use(params);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/v1/reports/dashboards/client/${resolvedParams.clientId}`, {
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
  }, [resolvedParams.clientId]);

  if (loading) {
    return <div className="p-8 text-gray-500">Loading client dashboard...</div>;
  }

  const campaignChartData = data?.campaigns?.map((c: any) => ({
    name: c.name,
    spend: c.spend,
    leads: c.leads
  })) || [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">{data?.clientName || 'Client'} Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="text-emerald-500" size={20} />
            <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Spend</span>
          </div>
          <h3 className="text-3xl font-bold text-gray-900">${data?.totalSpend || 0}</h3>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-2">
            <MousePointerClick className="text-blue-500" size={20} />
            <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Leads</span>
          </div>
          <h3 className="text-3xl font-bold text-gray-900">{data?.totalLeads || 0}</h3>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="text-purple-500" size={20} />
            <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Average CPL</span>
          </div>
          <h3 className="text-3xl font-bold text-gray-900">${data?.averageCpl?.toFixed(2) || 0}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Spend vs Leads (By Campaign)</h3>
          <DynamicLineChart 
            data={campaignChartData} 
            lines={[
              { dataKey: 'spend', color: '#10b981', name: 'Spend ($)' },
              { dataKey: 'leads', color: '#8b5cf6', name: 'Leads' }
            ]} 
          />
        </div>
        
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Spend (By Campaign)</h3>
          <DynamicBarChart 
            data={campaignChartData} 
            bars={[
              { dataKey: 'spend', color: '#3b82f6', name: 'Spend ($)' }
            ]} 
          />
        </div>
      </div>
    </div>
  );
}
