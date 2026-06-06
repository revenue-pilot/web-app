"use client";
import React, { useEffect, useState } from "react";
import { ShoppingBag, Star, Download, Search, Check } from "lucide-react";
import { useMarketplaceApps, useInstallMarketplaceApp } from "@/hooks/useApi";

export default function MarketplacePage() {
  const { data: appsData, loading, error, refetch } = useMarketplaceApps();
  const { mutate: installApp } = useInstallMarketplaceApp();
  const [localApps, setLocalApps] = useState<any[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    if (appsData && Array.isArray(appsData)) {
      setLocalApps(appsData);
    }
  }, [appsData]);

  const handleInstall = async (id: string) => {
    setLoadingId(id);
    try {
      await installApp(id);
      setLocalApps(
        localApps.map((app) =>
          app.id === id ? { ...app, installed: !app.installed } : app
        )
      );
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
          <ShoppingBag size={24} className="text-emerald-500" />
          <span>App Bazaar</span>
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">Discover and install integrations to supercharge your RevenuePilot workspace.</p>
      </div>

      {error ? (
        <div className="bg-red-50 p-4 rounded-2xl">
          <p className="text-red-600">Error: {error}</p>
          <button onClick={() => refetch()} className="mt-2 px-4 py-2 bg-red-500 text-white rounded">Retry</button>
        </div>
      ) : loading ? (
        <div className="py-20 text-center text-gray-400">Loading marketplace...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {localApps.length === 0 ? (
            <div className="col-span-full py-10 text-center text-gray-400">No apps available</div>
          ) : (
            localApps.map((app) => {
              const isInstalled = app.installed;
              const isLoading = loadingId === app.id;

              return (
                <div
                  key={app.id}
                  className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">{app.name}</h3>
                    <p className="text-xs text-gray-500 font-medium mt-2 leading-relaxed">{app.description}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-[10px] font-semibold text-gray-600">Price: {app.price}</span>
                      {app.category && (
                        <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{app.category}</span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleInstall(app.id)}
                    disabled={isLoading}
                    className={`mt-4 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                      isInstalled
                        ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        : "bg-emerald-500 text-white hover:bg-emerald-600"
                    }`}
                  >
                    {isLoading ? "Loading..." : isInstalled ? (
                      <span className="flex items-center gap-2 justify-center">
                        <Check size={16} />
                        Installed
                      </span>
                    ) : (
                      "Install"
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
