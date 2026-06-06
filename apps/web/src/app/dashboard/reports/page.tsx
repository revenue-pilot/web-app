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
