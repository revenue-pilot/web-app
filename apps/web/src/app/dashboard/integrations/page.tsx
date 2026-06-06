"use client";
import React, { useState } from "react";
import { Link2, Unlink, Check, AlertCircle } from "lucide-react";
import { useIntegrations } from "@/hooks/useApi";

export default function IntegrationsPage() {
  const { data: integrationsData, loading, error, refetch } = useIntegrations();
  const [localConnections, setLocalConnections] = useState<any[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  React.useEffect(() => {
    if (integrationsData && Array.isArray(integrationsData)) {
      setLocalConnections(integrationsData);
    } else if (integrationsData && !Array.isArray(integrationsData)) {
      // If API returns object, try to convert it to array
      setLocalConnections([integrationsData]);
    }
  }, [integrationsData]);

  const toggleConnection = (id: string, currentStatus: string) => {
    setLoadingId(id);
    setTimeout(() => {
      setLocalConnections(
        localConnections.map((c) => {
          if (c.id === id) {
            return {
              ...c,
              status: currentStatus === "Connected" ? "Disconnected" : "Connected"
            };
          }
          return c;
        })
      );
      setLoadingId(null);
    }, 1000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
          <Link2 size={24} className="text-emerald-500" />
          <span>Connection Hub</span>
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">Connect advertising networks, attribution tools, CRM hubs, and communication triggers.</p>
      </div>

      {error ? (
        <div className="bg-red-50 p-6 rounded-2xl text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button onClick={() => refetch()} className="px-4 py-2 bg-red-500 text-white rounded">
            Retry
          </button>
        </div>
      ) : loading ? (
        <div className="py-20 text-center text-gray-400">Loading integrations...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {localConnections.length === 0 ? (
            <div className="col-span-full py-10 text-center text-gray-400">No integrations available</div>
          ) : (
            localConnections.map((conn) => {
              const isConnected = conn.status === "Connected";
              const isLoading = loadingId === conn.id;

              return (
                <div
                  key={conn.id}
                  className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-base font-bold shadow-inner ${conn.color || "bg-emerald-600"}`}>
                        {conn.logo}
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                        isConnected
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100/60"
                          : "bg-gray-50 text-gray-400 border-gray-200/60"
                      }`}>
                        {conn.status}
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm">{conn.name}</h3>
                    <p className="text-xs text-gray-400 font-medium leading-relaxed mt-2">
                      {conn.description}
                    </p>
                  </div>

                  <div className="flex justify-between items-center mt-5 pt-3 border-t border-gray-100">
                    <span className="text-[10px] text-gray-400 font-semibold">API Status: Operational</span>
                    <button
                      onClick={() => toggleConnection(conn.id, conn.status)}
                      disabled={isLoading}
                      className={`text-xs font-semibold px-4 py-2 rounded-xl transition-all border shadow-sm ${
                        isConnected
                          ? "bg-white hover:bg-gray-50 text-red-500 border-gray-200"
                          : "bg-emerald-500 hover:bg-emerald-600 text-white border-transparent"
                      }`}
                    >
                      {isLoading ? (
                        "Syncing..."
                      ) : isConnected ? (
                        <span className="flex items-center gap-1">
                          <Unlink size={12} />
                          Disconnect
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Link2 size={12} />
                          Connect
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
}
