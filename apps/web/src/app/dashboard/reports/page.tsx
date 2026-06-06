"use client";
import React, { useState } from "react";
import { FileText, Download, Clock, Filter, CheckCircle2, AlertCircle, RefreshCw, Lock } from "lucide-react";
import { useReports, useGenerateReport } from "@/hooks/useApi";
import { useSubscription } from "@/components/SubscriptionContext";
import { FeatureGate } from "@/components/FeatureGate";
import { UpgradeModal } from "@/components/UpgradeModal";

export default function ReportsPage() {
  const { data: reports, loading, error, refetch } = useReports();
  const { mutate: generateReport } = useGenerateReport();
  const { plan, changePlan } = useSubscription();
  const [isGenerating, setIsGenerating] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const reportList = Array.isArray(reports) ? reports : [];

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await generateReport({ name: "Custom Report", format: "PDF" });
      refetch();
    } catch (err) {
      console.error("Error generating report", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const pageContent = (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <FileText size={24} className="text-emerald-500" />
            <span>Report Studio</span>
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Generate custom marketing performance reports, schedule deliveries, and export analytics.</p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={isGenerating || loading}
          className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw size={16} />
          {isGenerating ? "Generating..." : "Generate New"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded-2xl text-red-600">
          Error: {error}
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-gray-400">Loading reports...</div>
      ) : (
        <div className="bg-white border border-gray-200/80 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200/60">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Report Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Type</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Schedule</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Last Run</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Size</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reportList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                    No reports yet
                  </td>
                </tr>
              ) : (
                reportList.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{report.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{report.type}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{report.schedule}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{report.lastRun}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold ${
                        report.status === "Success"
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-red-50 text-red-600"
                      }`}>
                        {report.status === "Success" ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                        {report.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{report.size}</td>
                    <td className="px-6 py-4 text-sm">
                      <button className="text-emerald-500 hover:text-emerald-600 font-semibold flex items-center gap-1">
                        <Download size={14} />
                        Download
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            <FileText size={24} className="text-emerald-500" />
            <span>Automated Reporting</span>
          </h1>
          <p className="text-gray-500 dark:text-zinc-400 text-sm mt-0.5">Enterprise-grade custom report generation and scheduling.</p>
        </div>
        <button 
          onClick={handleGenerate}
          disabled={isGenerating}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-bold transition-all shadow-md shadow-emerald-500/10 text-xs flex items-center gap-1.5 disabled:opacity-70"
        >
          {isGenerating ? <RefreshCw className="animate-spin" size={14} /> : <FileText size={14} />}
          <span>{isGenerating ? "Generating..." : "Generate New Report"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Builder */}
        <div className="bg-white dark:bg-[#0D121F] border border-gray-200/80 dark:border-[#1B2438] rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
            <Filter size={18} className="text-emerald-500" /> 
            <span>Configuration</span>
          </h3>
          
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-2">Report Template</label>
              <select className="w-full bg-gray-50 dark:bg-[#0A0F1D] border border-gray-200 dark:border-[#1B2438] rounded-xl px-3 py-2.5 text-xs text-gray-700 dark:text-zinc-200 focus:outline-none focus:bg-white transition-all font-semibold">
                <option>Executive Performance Summary</option>
                <option>Detailed Campaign Metrics</option>
                <option>Cross-Channel Attribution</option>
                <option>White-label Client Presentation</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-2">Export Format</label>
              <div className="flex gap-2">
                {['PDF', 'CSV', 'Excel'].map(format => (
                  <button key={format} className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all ${
                    format === 'PDF' ? 'bg-emerald-550/10 border-emerald-500/30 text-emerald-500 dark:text-emerald-400' : 'bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-[#1B2438] text-gray-500 dark:text-zinc-400 hover:border-gray-300'
                  }`}>
                    {format}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-2">Automation Schedule</label>
              <select className="w-full bg-gray-50 dark:bg-[#0A0F1D] border border-gray-200 dark:border-[#1B2438] rounded-xl px-3 py-2.5 text-xs text-gray-700 dark:text-zinc-200 focus:outline-none focus:bg-white transition-all font-semibold">
                <option>Run Once (Now)</option>
                <option>Daily at 8:00 AM</option>
                <option>Weekly (Monday)</option>
                <option>Monthly (1st)</option>
              </select>
            </div>

            {/* Whitelabel Toggle (Locked for non-enterprise unless on Pro which is reports-only) */}
            <div className="pt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-white" />
                <span className="text-xs font-bold text-gray-600 dark:text-zinc-300">Apply White-Label Branding</span>
              </label>
            </div>
          </div>
        </div>

        {/* Scheduled Reports List */}
        <div className="lg:col-span-2 bg-white dark:bg-[#0D121F] border border-gray-200/80 dark:border-[#1B2438] rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
            <Clock size={18} className="text-emerald-500" /> 
            <span>Recent Archives</span>
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-gray-400 dark:text-zinc-500 text-xs border-b border-gray-100 dark:border-[#1B2438] pb-3 uppercase tracking-wider font-semibold">
                  <th className="pb-3 font-semibold">Report Name</th>
                  <th className="pb-3 font-semibold">Format</th>
                  <th className="pb-3 font-semibold">Schedule</th>
                  <th className="pb-3 font-semibold">Last Run</th>
                  <th className="pb-3 font-semibold text-right">Status</th>
                  <th className="pb-3 font-semibold text-right">Download</th>
                </tr>
              </thead>
              <tbody className="text-xs font-semibold text-gray-700 dark:text-zinc-200">
                {reports.map((report) => (
                  <tr key={report.id} className="border-b border-gray-50 dark:border-[#1B2438]/50 hover:bg-gray-50/50 dark:hover:bg-[#151D2F]/50 transition-colors group">
                    <td className="py-4 font-bold text-gray-800 dark:text-zinc-150">{report.name}</td>
                    <td className="py-4">
                      <span className="px-2 py-0.5 bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-[#1B2438] rounded text-[10px] font-bold text-gray-500 dark:text-zinc-400">{report.type}</span>
                    </td>
                    <td className="py-4 text-gray-400 dark:text-zinc-500">{report.schedule}</td>
                    <td className="py-4 text-gray-400 dark:text-zinc-500">{report.lastRun}</td>
                    <td className="py-4">
                      <div className="flex items-center justify-end gap-1">
                        {report.status === 'Success' ? (
                          <><CheckCircle2 size={12} className="text-emerald-500" /><span className="text-emerald-500 text-xs font-bold">Success</span></>
                        ) : (
                          <><AlertCircle size={12} className="text-red-500" /><span className="text-red-500 text-xs font-bold">Failed</span></>
                        )}
                      </div>
                    </td>
                    <td className="py-4 text-right">
                      {report.status === 'Success' ? (
                        <button className="text-gray-400 hover:text-emerald-500 transition-colors p-1.5 bg-gray-50 dark:bg-zinc-800 rounded-lg opacity-0 group-hover:opacity-100">
                          <Download size={14} />
                        </button>
                      ) : (
                        <span className="text-[10px] text-gray-400 font-bold">Unavailable</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <FeatureGate
      moduleKey="reports"
      requiredPlan="pro"
      featureName="Automated Report Builder"
      description="Create automated performance reports, schedule exports to CSV/Excel/PDF, and enable whitelabel layouts to send directly to client channels."
      benefits={[
        "Export custom reports to PDF, CSV, Excel",
        "Schedule daily, weekly, or monthly reports",
        "Apply Whitelabel layouts (Pro Plan only)",
        "Direct email/webhook notifications integration"
      ]}
    >
      {pageContent}
    </FeatureGate>
  );
}
