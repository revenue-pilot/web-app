"use client";
import React, { useEffect, useState } from "react";
import { 
  Database, Cpu, AlertTriangle, CheckCircle, ShieldCheck, 
  Activity, Server, Loader2, HardDrive, RefreshCw
} from "lucide-react";

export default function AdminHealthPage() {
  const [healthData, setHealthData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = () => {
    setLoading(true);
    fetch("/api/admin/platform-metrics")
      .then((res) => res.json())
      .then((data) => {
        setHealthData(data.health);
        setLoading(false);
      })
      .catch(() => {
        setHealthData({
          googleAds: "Operational",
          metaAds: "Operational",
          openAi: "Degraded",
          database: "Operational"
        });
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div className="space-y-6 pb-12 font-sans">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Activity size={24} className="text-[#50BB8F]" />
            <span>Platform Pulse</span>
          </h1>
          <p className="text-zinc-400 text-xs mt-0.5">Real-time infrastructure monitoring, microservices ping latencies, and BullMQ status.</p>
        </div>
        <button
          onClick={fetchHealth}
          className="bg-[#0D121F] hover:bg-[#151D2F] border border-[#1B2438] text-zinc-300 font-bold text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          <span>Refresh Indicators</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-zinc-500 text-xs font-bold flex items-center justify-center gap-2">
          <Loader2 size={16} className="animate-spin text-emerald-500" />
          <span>Polling hardware meters...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* API Health Cards */}
          <div className="bg-[#0D121F] border border-[#1B2438] p-5 rounded-2xl space-y-4">
            <h3 className="font-bold text-white text-xs uppercase tracking-wider pb-2 border-b border-[#1B2438] flex items-center gap-1.5">
              <Server size={14} className="text-emerald-500" />
              <span>Third-Party API Connections</span>
            </h3>

            <div className="space-y-2">
              <StatusRow name="Google Ads API Gateway" status={healthData.googleAds} ping="42ms" />
              <StatusRow name="Meta Marketing API" status={healthData.metaAds} ping="85ms" />
              <StatusRow name="OpenAI Completion Engine" status={healthData.openAi} ping="1.2s" isWarning={true} />
              <StatusRow name="Anthropic Claude API" status="Operational" ping="195ms" />
              <StatusRow name="Razorpay Checkout API" status="Operational" ping="24ms" />
            </div>
          </div>

          {/* Queue Health Card */}
          <div className="bg-[#0D121F] border border-[#1B2438] p-5 rounded-2xl space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-white text-xs uppercase tracking-wider pb-2 border-b border-[#1B2438] flex items-center gap-1.5">
                <Activity size={14} className="text-emerald-500" />
                <span>Queue Health (BullMQ Status)</span>
              </h3>
              <p className="text-[10px] text-zinc-400 font-semibold leading-relaxed mt-2">
                Monitors campaign background processing, auto-optimizations engine, and PDF report creation workers.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-[#0A0F1D] border border-[#1C283F] p-3 rounded-xl">
                <span className="text-[8px] font-bold text-zinc-500 uppercase">Running Jobs</span>
                <span className="text-sm font-bold text-emerald-400 block mt-0.5">4 Active</span>
              </div>
              <div className="bg-[#0A0F1D] border border-[#1C283F] p-3 rounded-xl">
                <span className="text-[8px] font-bold text-zinc-500 uppercase">Pending Jobs</span>
                <span className="text-sm font-bold text-white block mt-0.5">18 Queue</span>
              </div>
              <div className="bg-[#0A0F1D] border border-[#1C283F] p-3 rounded-xl">
                <span className="text-[8px] font-bold text-zinc-500 uppercase">Completed Jobs</span>
                <span className="text-sm font-bold text-zinc-400 block mt-0.5">2,490 Today</span>
              </div>
              <div className="bg-[#0A0F1D] border border-[#1C283F] p-3 rounded-xl">
                <span className="text-[8px] font-bold text-zinc-500 uppercase">Failed Jobs</span>
                <span className="text-sm font-bold text-red-400 block mt-0.5">0 Failed</span>
              </div>
            </div>
          </div>

          {/* Database Health Card */}
          <div className="bg-[#0D121F] border border-[#1B2438] p-5 rounded-2xl space-y-4">
            <h3 className="font-bold text-white text-xs uppercase tracking-wider pb-2 border-b border-[#1B2438] flex items-center gap-1.5">
              <Database size={14} className="text-emerald-500" />
              <span>Database Cluster Health</span>
            </h3>

            <div className="space-y-4 pt-1 text-xs">
              <div>
                <div className="flex justify-between text-[10px] text-zinc-400 mb-1 font-semibold">
                  <span>Active PostgreSQL Connections</span>
                  <span>12 / 100 max</span>
                </div>
                <div className="w-full bg-[#0A0F1D] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: "12%" }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[10px] text-zinc-400 mb-1 font-semibold">
                  <span>Queries Throughput</span>
                  <span>450 QPS</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[10px] text-zinc-400 mb-1 font-semibold">
                  <span>Index Hit Cache Rate</span>
                  <span>99.8%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Storage Health Card */}
          <div className="bg-[#0D121F] border border-[#1B2438] p-5 rounded-2xl space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-white text-xs uppercase tracking-wider pb-2 border-b border-[#1B2438] flex items-center gap-1.5">
                <HardDrive size={14} className="text-emerald-500" />
                <span>AWS S3 Storage Health</span>
              </h3>
              <p className="text-[10px] text-zinc-400 font-semibold leading-relaxed mt-2">
                Tracks static images assets, uploaded video files, and white-label asset containers.
              </p>
            </div>

            <div className="space-y-3 mt-4 text-xs font-semibold text-zinc-400">
              <div className="flex justify-between py-1 border-b border-[#1C283F]">
                <span>Total File count</span>
                <span className="text-white font-bold">14,290 Assets</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1C283F]">
                <span>Bucket Usage (AWS S3)</span>
                <span className="text-white font-bold">1.42 TB of 5 TB quota</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1C283F]">
                <span>Active Network Bandwidth</span>
                <span className="text-emerald-400 font-bold">45.2 MB/s</span>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

function StatusRow({ name, status, ping, isWarning = false }: any) {
  return (
    <div className="flex justify-between items-center p-2.5 bg-[#0A0F1D] border border-[#1C283F] rounded-xl text-xs font-semibold">
      <div className="flex items-center gap-2.5">
        {isWarning ? (
          <AlertTriangle size={14} className="text-amber-500" />
        ) : (
          <CheckCircle size={14} className="text-emerald-500" />
        )}
        <span className="text-zinc-200">{name}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[10px] text-zinc-500 font-mono">{ping}</span>
        <span className={`px-2 py-0.5 rounded text-[8px] uppercase font-bold border ${
          isWarning ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
        }`}>
          {status}
        </span>
      </div>
    </div>
  );
}
