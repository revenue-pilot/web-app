"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSubscription, PlanTier } from "@/components/SubscriptionContext";
import {
  LayoutDashboard,
  Layers,
  Users,
  Tv,
  Sparkles,
  Activity,
  CreditCard,
  UserCheck,
  Zap,
  ImageIcon,
  Link2,
  FileBarChart,
  Bell,
  Settings,
  ShieldCheck,
  History,
  TrendingUp,
  ShoppingBag,
  Cpu,
  Search,
  Gift,
  HelpCircle,
  Menu,
  MessageSquare,
  Sun,
  Moon,
  Lock,
  User,
  LogOut
} from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { plan, changePlan, canAccess, getUsagePercentage } = useSubscription();

  const [userEmail, setUserEmail] = useState("arjun@Revenuepilot.com");
  const [userRole, setUserRole] = useState("Agency Owner");
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [impersonatedTenant, setImpersonatedTenant] = useState("");

  const [theme, setTheme] = useState("light");

  React.useEffect(() => {
    const val = localStorage.getItem("impersonate_tenant");
    if (val) {
      setIsImpersonating(true);
      setImpersonatedTenant(val);
    }
    const emailVal = localStorage.getItem("user_email");
    const roleVal = localStorage.getItem("user_role");
    if (emailVal) setUserEmail(emailVal);
    if (roleVal) setUserRole(roleVal);

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

  const handleStopImpersonating = () => {
    localStorage.removeItem("impersonate_tenant");
    setIsImpersonating(false);
    window.location.href = "/admin/users";
  };

  const navItems = [
    { href: "/dashboard", label: "Command Nexus", icon: <LayoutDashboard size={18} /> },
    { href: "/dashboard/workspaces", label: "Orbit Workspaces", icon: <Layers size={18} /> },
    { href: "/dashboard/clients", label: "Client Constellation", icon: <Users size={18} /> },
    { href: "/dashboard/campaigns", label: "RevenuePilot Studio", icon: <Tv size={18} /> },
    { href: "/dashboard/neural-ops", label: "Neural Ops (AI)", icon: <Sparkles size={18} className="text-emerald-500" /> },
    { href: "/dashboard/pulse-matrix", label: "Pulse Matrix", icon: <Activity size={18} /> },
    { href: "/dashboard/billing", label: "Revenue Command", icon: <CreditCard size={18} /> },
    { href: "/dashboard/team", label: "Crew Command", icon: <UserCheck size={18} /> },
    { href: "/dashboard/automations", label: "Automation Forge", icon: <Zap size={18} /> },
    { href: "/dashboard/creative-vault", label: "Creative Vault", icon: <ImageIcon size={18} /> },
    { href: "/dashboard/integrations", label: "Connection Hub", icon: <Link2 size={18} /> },
    { href: "/dashboard/reports", label: "Insight Archive", icon: <FileBarChart size={18} /> },
    { href: "/dashboard/notifications", label: "Signal Vault", icon: <Bell size={18} /> },
    { href: "/dashboard/profile", label: "My Profile", icon: <User size={18} /> },
    { href: "/dashboard/settings", label: "Control Deck", icon: <Settings size={18} /> },
    { href: "/dashboard/support", label: "Support Deck", icon: <HelpCircle size={18} /> },
    { href: "/dashboard/security", label: "Fortress", icon: <ShieldCheck size={18} /> },
    { href: "/dashboard/activity", label: "Timeline Engine", icon: <History size={18} /> },
    { href: "/dashboard/ai-insights", label: "Insight Engine", icon: <TrendingUp size={18} /> },
    { href: "/dashboard/marketplace", label: "Marketplace", icon: <ShoppingBag size={18} /> },
    { href: "/admin", label: "Command Core", icon: <Cpu size={18} /> },
  ];

  const getModuleKey = (href: string) => {
    if (href === "/dashboard") return "dashboard";
    return href.replace("/dashboard/", "");
  };

  const getDisplayName = (email: string) => {
    const localPart = email.split("@")[0];
    return localPart.charAt(0).toUpperCase() + localPart.slice(1);
  };

  return (
    <div className={`flex h-screen bg-[#F4F6F5] dark:bg-[#080B11] text-gray-900 dark:text-zinc-100 overflow-hidden font-sans ${isImpersonating ? "pt-9" : ""}`}>
      {/* Impersonation Banner */}
      {isImpersonating && (
        <div className="bg-amber-500 text-black px-4 py-2 text-center text-xs font-bold flex justify-center items-center gap-2 w-full absolute top-0 left-0 z-50 h-9">
          <span>You are currently impersonating <strong>{impersonatedTenant}</strong>.</span>
          <button
            onClick={handleStopImpersonating}
            className="bg-black text-white px-2 py-0.5 rounded text-[10px] hover:bg-zinc-800 transition-colors font-bold uppercase"
          >
            Return to Admin
          </button>
        </div>
      )}

      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-0 -translate-x-full"
        } transition-all duration-300 bg-white dark:bg-[#0D121F] border-r border-gray-200/80 dark:border-[#1B2438] flex flex-col shrink-0 z-20 h-full relative`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-gray-100 dark:border-[#1B2438] gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M3.478 2.405a.75.75 0 0 0-.926.94l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.405Z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">RevenuePilot</h2>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-[2px] custom-scrollbar">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const isLocked = !canAccess(getModuleKey(item.href)) && item.href !== "/admin";
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm font-medium ${
                  isActive
                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-sm font-bold"
                    : "text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-[#151D2F] hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <span className={isActive ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400 dark:text-zinc-500"}>{item.icon}</span>
                <span className="flex-1 flex justify-between items-center gap-2">
                  <span>{item.label}</span>
                  {isLocked && <Lock size={12} className="text-zinc-400/80 dark:text-zinc-500 shrink-0" />}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Revenue Plan Card */}
        <div className="p-4 border-t border-gray-100 dark:border-[#1B2438] bg-white dark:bg-[#0D121F]">
          <div className="bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10 rounded-xl p-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 px-2.5 py-0.5 rounded-full capitalize">
                {plan} Plan
              </span>
              <Link
                href="/dashboard/billing"
                className="text-xs font-semibold text-gray-500 dark:text-zinc-300 hover:text-gray-800 dark:hover:text-white border border-gray-200 dark:border-[#1B2438] bg-white dark:bg-[#0D121F] px-2 py-1 rounded-md transition-colors"
              >
                Manage
              </Link>
            </div>
            <p className="text-xs text-gray-400">Next billing: Jul 19, 2026</p>
            <h4 className="text-base font-bold text-gray-900 dark:text-white mt-2">
              {plan === "starter" ? "₹999" : plan === "Revenue" ? "₹1,999" : plan === "pro" ? "₹4,999" : "Custom"}
              <span className="text-xs text-gray-500 font-normal"> / month</span>
            </h4>
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Active Plan Campaigns</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  3 / {plan === "starter" ? 3 : plan === "Revenue" ? 15 : "Unlimited"}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${plan === "starter" ? "bg-red-500" : "bg-emerald-500"}`}
                  style={{ width: plan === "starter" ? "100%" : plan === "Revenue" ? "20%" : "5%" }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Sign Out Action */}
        <div className="px-4 pb-4 bg-white dark:bg-[#0D121F]">
          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = "/login";
            }}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all w-full text-left border border-transparent hover:border-red-100 dark:hover:border-red-500/20"
          >
            <LogOut size={18} className="text-red-400" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Panel */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Navbar */}
        <header className="h-16 border-b border-gray-200 dark:border-[#1B2438] bg-white dark:bg-[#0D121F] flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-[#151D2F] rounded-lg transition-colors"
            >
              <Menu size={20} />
            </button>

            {/* Search */}
            <div className="relative w-96 max-w-lg hidden sm:block">
              <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 pointer-events-none">
                <Search size={16} />
              </span>
              <input
                type="text"
                placeholder="Search anything..."
                className="w-full bg-[#F4F6F5] dark:bg-[#0A0F1D] text-sm text-gray-700 dark:text-zinc-100 pl-10 pr-12 py-2 rounded-lg border border-transparent focus:outline-none focus:bg-white dark:focus:bg-[#0D121F] focus:border-gray-200 dark:focus:border-[#1B2438] transition-all font-medium"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 border border-gray-300/60 dark:border-[#1B2438] bg-white dark:bg-[#0D121F] px-1.5 py-0.5 rounded-md shadow-sm pointer-events-none">
                ⌘ K
              </span>
            </div>
          </div>

          {/* Right Header Navigation */}
          <div className="flex items-center gap-5">
            {/* Plan Display Pill */}
            <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-[10px] uppercase tracking-wider font-extrabold px-3 py-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 capitalize">
              {plan} Plan
            </div>

            {/* Theme Toggle Button */}
            <button 
              onClick={toggleTheme}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-100 transition-colors"
              title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
            >
              {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-100 transition-colors relative">
              <Gift size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full"></span>
            </button>

            <Link href="/dashboard/notifications" className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-100 transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full"></span>
            </Link>

            <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-100 transition-colors">
              <HelpCircle size={20} />
            </button>

            <div className="h-8 w-px bg-gray-200 dark:bg-zinc-800"></div>

            {/* User Profile */}
            <div className="flex items-center gap-3">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80"
                alt={userEmail}
                className="w-9 h-9 rounded-full object-cover border border-gray-200 dark:border-[#1B2438] shadow-sm"
              />
              <div className="hidden lg:block text-left">
                <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">{getDisplayName(userEmail)}</p>
                <p className="text-xs text-gray-400 leading-none mt-0.5">{userRole}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content Viewport */}
        <div className="flex-1 overflow-y-auto relative bg-[#F4F6F5] dark:bg-[#080B11] flex flex-col">
          {(() => {
            const campaignUsagePct = getUsagePercentage("campaigns");
            const workspaceUsagePct = getUsagePercentage("workspaces");
            const teamUsagePct = getUsagePercentage("team");
            const maxUsagePct = Math.max(campaignUsagePct, workspaceUsagePct, teamUsagePct);

            if (maxUsagePct >= 100) {
              return (
                <div className="bg-red-500 text-white px-6 py-2 flex justify-between items-center text-xs font-bold w-full shrink-0 shadow-md">
                  <span>⚠️ Critical: You have reached 100% of your plan&apos;s limits. Upgrade now to unlock additional campaigns and team user seats.</span>
                  <Link href="/dashboard/billing" className="bg-black hover:bg-zinc-900 text-white px-2.5 py-1 rounded text-[10px] uppercase font-black tracking-wider transition-colors shrink-0">Upgrade</Link>
                </div>
              );
            } else if (maxUsagePct >= 90) {
              return (
                <div className="bg-amber-500 text-black px-6 py-2 flex justify-between items-center text-xs font-bold w-full shrink-0 shadow-md">
                  <span>⚠️ Warning: You are using {maxUsagePct}% of your subscription usage limits. Upgrade soon to prevent creation blocks.</span>
                  <Link href="/dashboard/billing" className="bg-black hover:bg-zinc-900 text-white px-2.5 py-1 rounded text-[10px] uppercase font-black tracking-wider transition-colors shrink-0">Upgrade</Link>
                </div>
              );
            } else if (maxUsagePct >= 75) {
              return (
                <div className="bg-blue-500 text-white px-6 py-2 flex justify-between items-center text-xs font-bold w-full shrink-0 shadow-md">
                  <span>ℹ️ Notice: You are approaching your plan&apos;s limits ({maxUsagePct}% used). Upgrade to expand campaigns and storage limits.</span>
                  <Link href="/dashboard/billing" className="bg-white hover:bg-gray-100 text-blue-600 px-2.5 py-1 rounded text-[10px] uppercase font-black tracking-wider transition-colors shrink-0">Upgrade</Link>
                </div>
              );
            }
            return null;
          })()}

          <div className="flex-1 p-8 relative">
            {children}
          </div>

          {/* Floating Chat Bubble */}
          <Link
            href="/dashboard/ai-chat"
            className="fixed bottom-6 right-6 w-14 h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all z-40"
          >
            <MessageSquare size={24} />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
              1
            </span>
          </Link>
        </div>
      </main>
    </div>
  );
}
