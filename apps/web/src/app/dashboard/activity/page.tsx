"use client";
import React, { useState } from "react";
import { History, Search, Filter, Cpu, User, ArrowUpRight } from "lucide-react";
import { useActivityLogs } from "@/hooks/useApi";

export default function ActivityTimelinePage() {
  const { data: logs, loading, error, refetch } = useActivityLogs(100);
  const [categoryFilter, setCategoryFilter] = useState("All");

  const categories = ["All", "Campaign", "AI Automations", "API Connections"];
  const logArray = Array.isArray(logs) ? logs : [];

  const filteredLogs = categoryFilter === "All"
    ? logArray
    : logArray.filter((log) => log.category === categoryFilter);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <History size={24} className="text-emerald-500" />
            <span>Timeline Engine</span>
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Audit log listing all campaign operations, system automated rule runs, and login records.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-sm h-fit">
          <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
            <Filter size={14} className="text-emerald-500" />
            <span>Filters</span>
          </h3>
          <div className="flex flex-col space-y-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`text-left px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                  categoryFilter === cat
                    ? "bg-emerald-50 text-emerald-600 shadow-inner"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Timeline Stack */}
        <div className="lg:col-span-3 bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm">
          {error ? (
            <div className="py-20 text-center">
              <p className="text-red-600 mb-4">Error: {error}</p>
              <button onClick={() => refetch()} className="px-4 py-2 bg-red-500 text-white rounded">
                Retry
              </button>
            </div>
          ) : loading ? (
            <div className="py-20 text-center text-gray-400">Loading timeline data...</div>
          ) : (
            <div className="relative pl-6 border-l border-gray-100 space-y-6">
              {filteredLogs.length === 0 ? (
                <div className="py-10 text-center text-gray-400">No activity logs found</div>
              ) : (
                filteredLogs.map((log) => {
                  const isAI = log.user === "Neural Ops";
                  return (
                    <div key={log.id} className="relative">
                      {/* Circle Indicator */}
                      <span className={`absolute -left-[31px] top-1 w-4.5 h-4.5 rounded-full border bg-white flex items-center justify-center shadow-sm ${
                        isAI ? "text-violet-500 border-violet-200" : "text-emerald-500 border-emerald-200"
                      }`}>
                        {isAI ? <Cpu size={10} /> : <User size={10} />}
                      </span>

                      {/* Log Details */}
                      <div>
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <p className="text-xs font-bold text-gray-800 flex items-center gap-2">
                              <span>{log.user}</span>
                              <span className="font-semibold text-gray-500">{log.action}</span>
                            </p>
                            <p className="text-xs text-gray-500 font-medium leading-relaxed mt-1">
                              {log.details}
                            </p>
                          </div>
                          <span className="text-[10px] font-semibold text-gray-400 shrink-0">
                            {log.timestamp}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
