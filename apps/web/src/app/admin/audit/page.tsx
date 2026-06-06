"use client";
import React, { useState } from "react";
import { History, Search, Filter, ShieldCheck, Cpu, Terminal, RefreshCw } from "lucide-react";

interface AuditEvent {
  id: string;
  user: string;
  org: string;
  event: string; // Login, Campaign Creation, Payment, File Upload, AI Usage
  details: string;
  timestamp: string;
  status: "Success" | "Warning" | "Failure";
}

export default function AdminAuditMatrixPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterEvent, setFilterEvent] = useState("All");

  const [events, setEvents] = useState<AuditEvent[]>([
    { id: "evt_1", user: "Arjun Mehta", org: "Arjun Mehta Agency", event: "Campaign Launch", details: "Pushed 'Summer Sale - Search' to Google Ads API.", timestamp: "2 mins ago", status: "Success" },
    { id: "evt_2", user: "Sonia Roy", org: "FitLife Gyms", event: "File Upload", details: "Uploaded 'Promo_Video.mp4' (12.8 MB) to S3 vault.", timestamp: "12 mins ago", status: "Success" },
    { id: "evt_3", user: "System Scheduler", org: "EcoMart India", event: "Automation Trigger", details: "Shifted ₹25,000 budget from Meta to Google Search.", timestamp: "1 hr ago", status: "Success" },
    { id: "evt_4", user: "Karan Singh", org: "UrbanStays Hotel", event: "AI Usage", details: "Called Claude 3.5 Sonnet to draft ad copy matrix.", timestamp: "3 hrs ago", status: "Success" },
    { id: "evt_5", user: "Billing Worker", org: "Apex Logistics", event: "Payment Failure", details: "Razorpay webhook returned response: Insufficient Funds.", timestamp: "1 day ago", status: "Failure" },
    { id: "evt_6", user: "Super Admin", org: "Platform", event: "Impersonation", details: "Impersonated tenant organization Arjun Mehta Agency.", timestamp: "2 days ago", status: "Warning" }
  ]);

  const eventTypes = ["All", "Campaign Launch", "File Upload", "Automation Trigger", "AI Usage", "Payment Failure", "Impersonation"];

  const filteredEvents = events.filter(e => {
    const matchesSearch = e.details.toLowerCase().includes(searchQuery.toLowerCase()) || e.org.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEvent = filterEvent === "All" || e.event === filterEvent;
    return matchesSearch && matchesEvent;
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Success": return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      case "Warning": return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      default: return "bg-red-500/10 text-red-400 border border-red-500/20";
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <History size={24} className="text-[#50BB8F]" />
          <span>Audit Matrix</span>
        </h1>
        <p className="text-zinc-400 text-xs mt-0.5">Chronological system log timeline auditing campaign launches, payment notifications, and database updates.</p>
      </div>

      {/* Filters Row */}
      <div className="bg-[#0D121F] border border-[#1B2438] p-4 rounded-xl flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative flex-1 w-full">
          <span className="absolute inset-y-0 left-3 flex items-center text-zinc-500">
            <Search size={14} />
          </span>
          <input
            type="text"
            placeholder="Search details or tenant org..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0A0F1D] border border-[#1C283F] rounded-xl pl-9 pr-4 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500 transition-all font-semibold"
          />
        </div>

        <select
          value={filterEvent}
          onChange={(e) => setFilterEvent(e.target.value)}
          className="bg-[#0A0F1D] border border-[#1C283F] rounded-xl px-3 py-2 text-xs font-bold text-zinc-400 focus:outline-none shadow-sm w-full sm:w-48"
        >
          {eventTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Events Table List */}
      <div className="bg-[#0D121F] border border-[#1B2438] p-5 rounded-2xl shadow-sm">
        <h3 className="font-bold text-white text-xs uppercase tracking-wider pb-2 border-b border-[#1B2438] mb-4">
          Audit Activity Log
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#1B2438] text-zinc-500 font-bold uppercase tracking-wider">
                <th className="pb-3">Timestamp</th>
                <th className="pb-3">Actor / Org</th>
                <th className="pb-3">Event Action</th>
                <th className="pb-3">Details</th>
                <th className="pb-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="font-semibold text-zinc-300">
              {filteredEvents.map((evt) => (
                <tr key={evt.id} className="border-b border-[#1C283F] hover:bg-[#151D2F] transition-colors">
                  <td className="py-3 text-zinc-500 font-mono">
                    {evt.timestamp}
                  </td>
                  <td className="py-3">
                    <span className="font-bold text-white block">{evt.user}</span>
                    <span className="text-[8px] text-zinc-500 font-bold block uppercase mt-0.5">{evt.org}</span>
                  </td>
                  <td className="py-3 font-mono text-zinc-200">
                    {evt.event}
                  </td>
                  <td className="py-3 text-zinc-400">
                    {evt.details}
                  </td>
                  <td className="py-3">
                    <div className="flex justify-center">
                      <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${getStatusStyle(evt.status)}`}>
                        {evt.status}
                      </span>
                    </div>
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
