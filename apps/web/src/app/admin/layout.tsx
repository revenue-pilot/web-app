"use client";
import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, CreditCard, Users, UserCheck, Database, BrainCircuit, 
  Tv, Link2, Key, HelpCircle, ShieldCheck, History, Sliders, LineChart, 
  ArrowLeft, Bell, Cpu, Sparkles, Sun, Moon
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSubscription, PlanTier } from "@/components/SubscriptionContext";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [theme, setTheme] = useState("light");
  const { plan, changePlan } = useSubscription();

  useEffect(() => {
    // Initial theme setup (Default is light mode)
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const navGroups = [
    {
      title: "Core Capabilities",
      items: [
        { href: "/admin", icon: <LayoutDashboard size={16} />, label: "Command Core" },
        { href: "/admin/revenue", icon: <CreditCard size={16} />, label: "Revenue Nexus" },
        { href: "/admin/clients", icon: <UserCheck size={16} />, label: "Client Universe" },
        { href: "/admin/users", icon: <Users size={16} />, label: "Account Nexus" },
        { href: "/admin/campaigns", icon: <Tv size={16} />, label: "Campaign Observatory" }
      ]
    },
    {
      title: "Operational Grids",
      items: [
        { href: "/admin/health", icon: <Database size={16} />, label: "Platform Pulse" },
        { href: "/admin/ai-control", icon: <BrainCircuit size={16} />, label: "AI Control Grid" },
        { href: "/admin/integrations", icon: <Link2 size={16} />, label: "Integration Command" },
        { href: "/admin/subscriptions", icon: <Sliders size={16} />, label: "Subscription Command" },
        { href: "/admin/feature-control", icon: <Key size={16} />, label: "Feature Control" }
      ]
    },
    {
      title: "Missions & Threats",
      items: [
        { href: "/admin/support", icon: <HelpCircle size={16} />, label: "Support Mission Control" },
        { href: "/admin/fortress", icon: <ShieldCheck size={16} />, label: "Fortress (Security)" },
        { href: "/admin/audit", icon: <History size={16} />, label: "Audit Matrix" },
        { href: "/admin/Revenue-lab", icon: <LineChart size={16} />, label: "Revenue Lab" }
      ]
    }
  ];

  return (
    <div className="flex h-screen bg-[#F4F6F5] dark:bg-[#080B11] text-gray-900 dark:text-zinc-100 font-sans overflow-hidden">
      
      {/* Admin Sidebar */}
      <aside className="w-64 bg-[#EBEFEF] dark:bg-[#0D121F] border-r border-gray-200 dark:border-[#1B2438] flex flex-col shrink-0">
        <div className="p-5 border-b border-gray-200 dark:border-[#1B2438] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center font-extrabold text-black shadow-lg shadow-emerald-500/10">
              C
            </div>
            <div>
              <h2 className="font-bold text-xs tracking-tight text-gray-800 dark:text-white uppercase">Command Core</h2>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">RevenuePilot Ops</p>
            </div>
          </div>
        </div>
        
        {/* Navigation items list */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5 scrollbar-thin">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              <span className="block px-3 text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                {group.title}
              </span>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-all text-xs font-bold ${
                        isActive
                          ? "bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-inner"
                          : "border border-transparent text-gray-500 dark:text-zinc-400 hover:bg-white/50 dark:hover:bg-[#151D2F] hover:text-gray-900 dark:hover:text-white"
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Command Workspace */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-gradient-to-br from-[#F4F6F5] via-[#EBEFEF] to-[#F4F6F5] dark:from-[#080B11] dark:via-[#0E1424] dark:to-[#080B11]">
        
        {/* Admin Header */}
        <header className="h-14 bg-white dark:bg-[#0D121F] border-b border-gray-200 dark:border-[#1B2438] flex items-center justify-between px-8 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="font-bold text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              All Systems Operational
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Plan Display Pill */}
            <div className="bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-100/30 dark:border-emerald-500/10 text-[10px] uppercase tracking-wider font-extrabold px-3 py-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 capitalize">
              {plan} Plan
            </div>

            {/* Theme Toggle Button */}
            <button 
              onClick={toggleTheme}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-100 transition-colors"
              title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
            >
              {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            <Link 
              href="/dashboard" 
              className="text-xs font-bold text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-1 border border-gray-200 dark:border-[#1B2438] bg-white dark:bg-[#0E1424] px-3 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-[#151D2F]"
            >
              <ArrowLeft size={12} />
              <span>Client Dashboard</span>
            </Link>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-500 text-black font-extrabold flex items-center justify-center text-xs shadow-inner">
              OP
            </div>
          </div>
        </header>

        {/* Content Portal */}
        <div className="flex-1 overflow-y-auto p-8 scrollbar-thin">
          {children}
        </div>
      </main>
    </div>
  );
}
