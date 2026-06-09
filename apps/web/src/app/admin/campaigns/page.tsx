"use client";
import React, { useState } from "react";
import { 
  Tv, DollarSign, RefreshCw, AlertTriangle, AlertCircle, 
  TrendingUp, CheckCircle, BarChart2, MessageSquare
} from "lucide-react";

interface GlobalAlert {
  id: string;
  client: string;
  campaign: string;
  platform: string;
  type: string; // Budget Exhausted, High CPC, Disapproved Ad, Conversion Drop
  severity: "Critical" | "Warning" | "Info";
  date: string;
}

export default function AdminCampaignObservatoryPage() {
  const [alerts, setAlerts] = useState<GlobalAlert[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, paused: 0 });

  React.useEffect(() => {
    async function fetchCampaigns() {
      try {
        const token = localStorage.getItem("token") || localStorage.getItem("auth_token");
        const res = await fetch("/api/v1/admin/campaigns", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
          setAlerts(data.alerts || []);
        }
      } catch (err) {
        console.error("Failed to fetch campaigns", err);
      }
    }
    fetchCampaigns();
  }, []);

  const handleDismissAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Tv size={24} className="text-[#50BB8F]" />
          <span>Campaign Observatory</span>
        </h1>
        <p className="text-zinc-400 text-xs mt-0.5">Global monitoring of cross-network campaigns, target ROAS performance aggregates, and ad disapproval flags.</p>
      </div>

      {/* Global Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-[#0D121F] border border-[#1B2438] p-4 rounded-xl">
          <span className="text-[9px] font-bold text-zinc-500 uppercase block">Active Campaigns</span>
          <span className="text-lg font-bold text-white block mt-1">{stats.active.toLocaleString()}</span>
          <span className="text-[8px] text-zinc-400 font-semibold block mt-0.5">Google + Meta pools</span>
        </div>
        <div className="bg-[#0D121F] border border-[#1B2438] p-4 rounded-xl">
          <span className="text-[9px] font-bold text-zinc-500 uppercase block">Paused Campaigns</span>
          <span className="text-lg font-bold text-white block mt-1">{stats.paused.toLocaleString()}</span>
          <span className="text-[8px] text-zinc-400 font-semibold block mt-0.5">Under review / paused</span>
        </div>
        <div className="bg-[#0D121F] border border-[#1B2438] p-4 rounded-xl">
          <span className="text-[9px] font-bold text-zinc-500 uppercase block">Total Campaigns Tracked</span>
          <span className="text-lg font-bold text-emerald-400 block mt-1">{stats.total.toLocaleString()}</span>
          <span className="text-[8px] text-zinc-400 font-semibold block mt-0.5">Historical & Active</span>
        </div>
        <div className="bg-[#0D121F] border border-[#1B2438] p-4 rounded-xl">
          <span className="text-[9px] font-bold text-zinc-500 uppercase block">Managed ROAS Average</span>
          <span className="text-lg font-bold text-emerald-400 block mt-1">Pending</span>
          <span className="text-[8px] text-zinc-400 font-semibold block mt-0.5">Awaiting revenue attribution</span>
        </div>
      </div>

      {/* Performance Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Performance metrics breakdowns (7 cols) */}
        <div className="lg:col-span-7 bg-[#0D121F] border border-[#1B2438] p-5 rounded-2xl space-y-4">
          <h3 className="font-bold text-white text-xs uppercase tracking-wider pb-2 border-b border-[#1B2438]">
            Platform Performance Metrics
          </h3>

          <div className="space-y-3">
            <PlatformRow name="Combined Platforms" spend="Pending" revenue="Pending" roas="Pending" cpc="Pending" ctr="Pending" />
            <PlatformRow name="Google Ads Network" spend="Pending" revenue="Pending" roas="Pending" cpc="Pending" ctr="Pending" />
            <PlatformRow name="Meta Ads Network" spend="Pending" revenue="Pending" roas="Pending" cpc="Pending" ctr="Pending" />
          </div>
        </div>

        {/* Campaign Alerts (5 cols) */}
        <div className="lg:col-span-5 bg-[#0D121F] border border-[#1B2438] p-5 rounded-2xl space-y-4">
          <h3 className="font-bold text-white text-xs uppercase tracking-wider pb-2 border-b border-[#1B2438]">
            Campaign Critical Alerts ({alerts.length})
          </h3>

          <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
            {alerts.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-8 font-bold">No active campaign warnings.</p>
            ) : (
              alerts.map((a) => (
                <div 
                  key={a.id}
                  className={`p-3 bg-[#0A0F1D] border rounded-xl flex justify-between items-start text-xs font-semibold ${
                    a.severity === "Critical" ? "border-red-500/20 bg-red-500/5 text-zinc-300" : "border-amber-500/20 bg-amber-500/5 text-zinc-300"
                  }`}
                >
                  <div className="space-y-1">
                    <span className="font-bold text-white block">{a.client} – {a.type}</span>
                    <p className="text-[9px] text-zinc-400 font-semibold">{a.campaign} ({a.platform}) • {a.date}</p>
                  </div>
                  <button 
                    onClick={() => handleDismissAlert(a.id)}
                    className="text-[9px] font-extrabold text-zinc-500 hover:text-white uppercase shrink-0"
                  >
                    Dismiss
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}

function PlatformRow({ name, spend, revenue, roas, cpc, ctr }: any) {
  return (
    <div className="p-4 bg-[#0A0F1D] border border-[#1C283F] rounded-xl text-xs font-semibold text-zinc-400 space-y-3">
      <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
        <span className="font-bold text-white">{name}</span>
        <span className="text-emerald-400 font-bold">ROAS: {roas}</span>
      </div>
      <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
        <div>
          <span className="block text-[8px] text-zinc-500 uppercase tracking-wider">Spend</span>
          <span className="text-white font-bold block mt-0.5">{spend}</span>
        </div>
        <div>
          <span className="block text-[8px] text-zinc-500 uppercase tracking-wider">Revenue</span>
          <span className="text-white font-bold block mt-0.5">{revenue}</span>
        </div>
        <div>
          <span className="block text-[8px] text-zinc-500 uppercase tracking-wider">Avg CPC</span>
          <span className="text-white font-bold block mt-0.5">{cpc}</span>
        </div>
        <div>
          <span className="block text-[8px] text-zinc-500 uppercase tracking-wider">Avg CTR</span>
          <span className="text-white font-bold block mt-0.5">{ctr}</span>
        </div>
      </div>
    </div>
  );
}
