'use client';
import { useEffect, useState } from 'react';
import apiClient from '@/lib/apiClient';

export default function CRMDashboardWidgets() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/api/crm/dashboard/metrics')
      .then(res => {
        setMetrics(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading metrics...</div>;
  if (!metrics) return null;

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
        <dt className="truncate text-sm font-medium text-neutral-500">Total Leads</dt>
        <dd className="mt-1 text-3xl font-semibold tracking-tight text-neutral-900">{metrics.totalLeads}</dd>
      </div>
      <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
        <dt className="truncate text-sm font-medium text-neutral-500">New Leads</dt>
        <dd className="mt-1 text-3xl font-semibold tracking-tight text-neutral-900">{metrics.newLeads}</dd>
      </div>
      <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
        <dt className="truncate text-sm font-medium text-neutral-500">Forecast Value</dt>
        <dd className="mt-1 text-3xl font-semibold tracking-tight text-neutral-900">${metrics.pipelineValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</dd>
      </div>
      <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
        <dt className="truncate text-sm font-medium text-neutral-500">Conversion Rate</dt>
        <dd className="mt-1 text-3xl font-semibold tracking-tight text-neutral-900">{metrics.conversionRate}%</dd>
      </div>
    </div>
  );
}
