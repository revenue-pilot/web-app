"use client";
import React, { useState } from "react";
import { Bell, Sparkles, AlertTriangle, ShieldCheck, Mail, CheckCheck } from "lucide-react";
import { useNotifications } from "@/hooks/useApi";

export default function NotificationsPage() {
  const { data: notificationsData, loading, error, refetch } = useNotifications(50);
  const [localNotifications, setLocalNotifications] = useState<any[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Initialize local state from API data
  React.useEffect(() => {
    if (notificationsData && !initialized) {
      const deduplicate = (list: any[]) => {
        const seen = new Set();
        return list.filter(item => {
          if (!item || !item.id) return false;
          const duplicate = seen.has(item.id);
          seen.add(item.id);
          return !duplicate;
        });
      };
      setLocalNotifications(deduplicate(notificationsData));
      setInitialized(true);
    }
  }, [notificationsData, initialized]);

  const handleMarkAllRead = () => {
    setLocalNotifications(localNotifications.map((n) => ({ ...n, isRead: true })));
  };

  const toggleRead = (id: string) => {
    setLocalNotifications(
      localNotifications.map((n) => {
        if (n.id === id) {
          return { ...n, isRead: !n.isRead };
        }
        return n;
      })
    );
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "Warning": return <AlertTriangle size={18} className="text-amber-500" />;
      case "Alert": return <AlertTriangle size={18} className="text-red-500" />;
      case "AI Insight": return <Sparkles size={18} className="text-violet-500" />;
      default: return <ShieldCheck size={18} className="text-emerald-500" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Bell size={24} className="text-emerald-500" />
            <span>Signal Vault</span>
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Notification alerts feed detailing AI insights, billing cycles, and network configurations.</p>
        </div>
        <button
          onClick={handleMarkAllRead}
          className="text-xs font-semibold text-emerald-500 hover:text-emerald-600 flex items-center gap-1 border border-emerald-100 bg-emerald-50/50 px-3.5 py-2 rounded-xl transition-all shadow-sm"
        >
          <CheckCheck size={14} />
          <span>Mark All Read</span>
        </button>
      </div>

      {error ? (
        <div className="py-20 text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button onClick={() => refetch()} className="px-4 py-2 bg-red-500 text-white rounded">
            Retry
          </button>
        </div>
      ) : loading ? (
        <div className="py-20 text-center text-gray-400">Loading signals...</div>
      ) : (
        <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm space-y-4">
          {localNotifications.length === 0 ? (
            <div className="py-10 text-center text-gray-400">No notifications</div>
          ) : (
            localNotifications.map((n) => (
              <div
                key={n.id}
                onClick={() => toggleRead(n.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex justify-between items-start gap-4 ${
                  n.isRead
                    ? "bg-gray-50/20 border-gray-100 opacity-60"
                    : "bg-white border-gray-200/80 shadow-sm hover:border-emerald-500/30"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100/60 shadow-inner shrink-0">
                    {getIcon(n.type)}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm leading-tight">{n.title}</h4>
                    <p className="text-xs text-gray-500 font-medium leading-relaxed mt-1">{n.message}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end shrink-0 gap-2">
                  <span className="text-[9px] font-bold text-gray-400">{n.time}</span>
                  {!n.isRead && (
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
