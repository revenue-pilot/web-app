"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  Sparkles, Zap, Check, X, ChevronRight, ChevronDown, Play, ArrowRight, 
  Lock, Shield, Activity, Terminal, LayoutDashboard, Layers, Users, 
  Tv, Eye, Send, CheckCircle2, ShieldAlert, Cpu, HeartPulse, RefreshCw,
  FolderSync, Database, DatabaseZap, HelpCircle, Flame, Star, ExternalLink, Globe
} from "lucide-react";

// Types for tracking
interface AnalyticsEvent {
  id: string;
  timestamp: string;
  category: string;
  action: string;
  label: string;
}

export default function LandingPage() {
  // Navigation active tab
  const [activeNav, setActiveNav] = useState("Home");
  
  // Demo modal open
  const [demoOpen, setDemoOpen] = useState(false);
  
  // Pricing toggle (monthly/annual)
  const [isAnnual, setIsAnnual] = useState(false);
  
  // Interactive steppers & selectors state
  const [activeWorkflowStep, setActiveWorkflowStep] = useState(1);
  const [vaultDemoImage, setVaultDemoImage] = useState("Meta Feed (1:1)");
  const [activeAIModule, setActiveAIModule] = useState("AI Campaign Creator");
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  
  // Live user logs for the analytics HUD
  const [analyticsEvents, setAnalyticsEvents] = useState<AnalyticsEvent[]>([]);
  const [hudMinimized, setHudMinimized] = useState(false);

  // Tracking log function
  const trackEvent = (category: string, action: string, label: string) => {
    const newEvent: AnalyticsEvent = {
      id: crypto.randomUUID().substring(0, 9),
      timestamp: new Date().toLocaleTimeString(),
      category,
      action,
      label
    };
    setAnalyticsEvents((prev) => [newEvent, ...prev].slice(0, 8)); // keep last 8
    console.log(`[RevenuePilot Analytics] ${category} | ${action} | ${label}`);
  };

  // Scroll depth tracking
  const scrollTracker = useRef<{ [key: string]: boolean }>({
    "25%": false,
    "50%": false,
    "75%": false,
    "100%": false
  });

  useEffect(() => {
    trackEvent("Page Lifecycle", "Load", "Landing Page Initialized");

    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight <= 0) return;
      const scrollPct = Math.round((window.scrollY / scrollHeight) * 100);

      let matchedPct = "";
      if (scrollPct >= 25 && !scrollTracker.current["25%"]) matchedPct = "25%";
      if (scrollPct >= 50 && !scrollTracker.current["50%"]) matchedPct = "50%";
      if (scrollPct >= 75 && !scrollTracker.current["75%"]) matchedPct = "75%";
      if (scrollPct >= 99 && !scrollTracker.current["100%"]) matchedPct = "100%";

      if (matchedPct) {
        scrollTracker.current[matchedPct] = true;
        trackEvent("Scroll Depth", "Progress", `User scrolled past ${matchedPct}`);
      }
    };

    // Exit Intent detection
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY < 20) {
        trackEvent("Exit Intent", "Trigger", "Mouse left viewport window bounds");
      }
    };

    window.addEventListener("scroll", handleScroll);
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  const handleCTA = (ctaName: string) => {
    trackEvent("CTA Interaction", "Click", ctaName);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-emerald-500 selection:text-white dark:bg-[#070A13] dark:text-zinc-100 transition-colors duration-300">
      
      {/* SECTION 1 — Sticky Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#070A13]/80 backdrop-blur-md border-b border-gray-100 dark:border-zinc-800/60 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group" onClick={() => trackEvent("Nav Click", "Brand", "RevenuePilot Logo")}>
            <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-[1.05] transition-transform">
              <Sparkles size={20} className="animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-base tracking-tight text-gray-900 dark:text-white leading-none">RevenuePilot</span>
              <span className="text-[9px] text-emerald-600 dark:text-emerald-500 font-bold uppercase tracking-wider mt-0.5">Command Core</span>
            </div>
          </Link>

          {/* Center items */}
          <nav className="hidden md:flex items-center gap-8">
            {[
              { label: "Features", anchor: "#features" },
              { label: "Workflow", anchor: "#workflow" },
              { label: "Pricing", anchor: "#pricing" },
              { label: "Integrations", anchor: "#integrations" },
              { label: "Security", anchor: "#security" }
            ].map((nav) => (
              <a
                key={nav.label}
                href={nav.anchor}
                onClick={() => {
                  setActiveNav(nav.label);
                  trackEvent("Navigation", "Click Anchor", nav.label);
                }}
                className={`text-xs font-bold transition-colors ${
                  activeNav === nav.label 
                    ? "text-emerald-600 dark:text-emerald-400" 
                    : "text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white"
                }`}
              >
                {nav.label}
              </a>
            ))}
          </nav>

          {/* Right items */}
          <div className="flex items-center gap-4">
            <Link 
              href="/login"
              onClick={() => handleCTA("Login link in header")}
              className="text-xs font-bold text-gray-600 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              Login
            </Link>
            <Link
              href="/login"
              onClick={() => handleCTA("Start Free Trial in header")}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-1"
            >
              <span>Start Free Trial</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </header>

      {/* SECTION 2 — Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-32 border-b border-gray-100 dark:border-zinc-800/40">
        {/* Glow gradients backgrounds */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[350px] h-[350px] bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 relative z-10">
          {/* Tag */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold uppercase tracking-widest animate-fade-in mx-auto">
            <Sparkles size={11} className="animate-spin" style={{ animationDuration: "3s" }} />
            <span>AI Advertising Operating System</span>
          </div>

          {/* Main Titles */}
          <h1 className="text-4xl sm:text-6xl font-black text-gray-900 dark:text-white tracking-tight max-w-4xl mx-auto leading-[1.1]">
            Run Google & Meta Ads From <span className="bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">One AI-Powered</span> Command Center.
          </h1>

          <p className="text-sm sm:text-lg text-gray-500 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Launch campaigns, manage creatives, optimize budgets, generate reports, and automate Revenue without switching between platforms.
          </p>

          {/* Dual CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              onClick={() => handleCTA("Start 15-Day Free Trial - Primary Hero")}
              className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-sm px-8 py-4 rounded-2xl shadow-lg shadow-emerald-500/15 hover:shadow-emerald-500/25 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Zap size={16} fill="currentColor" />
              <span>Start 15-Day Free Trial</span>
            </Link>
            <button
              onClick={() => {
                setDemoOpen(true);
                trackEvent("CTA Interaction", "Play Video", "Hero Watch Demo");
              }}
              className="w-full sm:w-auto bg-white hover:bg-gray-50 text-gray-700 dark:bg-zinc-900/60 dark:hover:bg-zinc-800 dark:text-zinc-200 font-bold text-sm px-8 py-4 rounded-2xl border border-gray-200 dark:border-zinc-800 transition-all flex items-center justify-center gap-2"
            >
              <Play size={14} className="fill-current text-emerald-500" />
              <span>Watch Demo</span>
            </button>
          </div>

          {/* Interactive Dashboard Preview Wrapper */}
          <div className="pt-10 max-w-5xl mx-auto" onClick={() => trackEvent("Engagement", "Click Visual", "Hero Preview Dashboard")}>
            <div className="bg-white dark:bg-[#0D121F] border border-gray-200 dark:border-zinc-800/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col transition-all">
              {/* Header Bar */}
              <div className="px-5 py-3.5 border-b border-gray-100 dark:border-zinc-800/80 bg-gray-50/50 dark:bg-[#090D17] flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-400" />
                    <span className="w-3 h-3 rounded-full bg-amber-400" />
                    <span className="w-3 h-3 rounded-full bg-emerald-400" />
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest ml-2">Platform Preview: RevenuePilot</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">LIVE ENGINE STATUS</span>
              </div>

              {/* Internal Dash Area */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 text-left">
                {/* Stats Cards (4 cols) */}
                <div className="md:col-span-4 space-y-4">
                  {/* Card 1 */}
                  <div className="bg-gray-50/60 dark:bg-zinc-900/40 border border-gray-100 dark:border-zinc-800/60 p-4 rounded-2xl relative overflow-hidden group">
                    <span className="text-[9px] font-bold text-gray-400 dark:text-zinc-500 uppercase block tracking-wider">Total Ad Spend</span>
                    <span className="text-xl font-black text-gray-900 dark:text-white mt-1 block">₹2,45,678</span>
                    <span className="text-[9px] text-emerald-500 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded absolute top-4 right-4">Meta & Google</span>
                  </div>
                  {/* Card 2 */}
                  <div className="bg-gray-50/60 dark:bg-zinc-900/40 border border-gray-100 dark:border-zinc-800/60 p-4 rounded-2xl relative overflow-hidden">
                    <span className="text-[9px] font-bold text-gray-400 dark:text-zinc-500 uppercase block tracking-wider">Generated Revenue</span>
                    <span className="text-xl font-black text-gray-900 dark:text-white mt-1 block">₹12,45,678</span>
                    <span className="text-[9px] text-blue-500 font-bold bg-blue-500/10 px-1.5 py-0.5 rounded absolute top-4 right-4">ROAS: 5.07x</span>
                  </div>
                  {/* Card 3 */}
                  <div className="bg-gray-50/60 dark:bg-zinc-900/40 border border-gray-100 dark:border-zinc-800/60 p-4 rounded-2xl relative overflow-hidden">
                    <span className="text-[9px] font-bold text-gray-400 dark:text-zinc-500 uppercase block tracking-wider">Total Conversions</span>
                    <span className="text-xl font-black text-gray-900 dark:text-white mt-1 block">9,876</span>
                    <span className="text-[9px] text-purple-500 font-bold bg-purple-500/10 px-1.5 py-0.5 rounded absolute top-4 right-4">CPA: ₹24.8</span>
                  </div>
                </div>

                {/* Main Graph Performance (8 cols) */}
                <div className="md:col-span-8 bg-gray-50/40 dark:bg-zinc-900/20 border border-gray-100 dark:border-zinc-800/40 p-5 rounded-2xl flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white">Unified Campaigns Performance</h4>
                      <p className="text-[9px] text-gray-400">Aggregated real-time metrics overview</p>
                    </div>
                    <div className="flex gap-2 text-[9px] font-extrabold">
                      <span className="text-emerald-500 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Google Ads</span>
                      <span className="text-blue-500 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full" /> Meta Ads</span>
                    </div>
                  </div>
                  
                  {/* Beautiful crisp SVG chart */}
                  <div className="w-full h-36">
                    <svg viewBox="0 0 500 150" className="w-full h-full">
                      {/* Grid lines */}
                      <line x1="0" y1="30" x2="500" y2="30" stroke="rgba(156,163,175,0.08)" strokeDasharray="3" />
                      <line x1="0" y1="75" x2="500" y2="75" stroke="rgba(156,163,175,0.08)" strokeDasharray="3" />
                      <line x1="0" y1="120" x2="500" y2="120" stroke="rgba(156,163,175,0.08)" strokeDasharray="3" />
                      
                      {/* Google Path */}
                      <path 
                        d="M 0 100 Q 100 80 200 40 T 400 90 T 500 20" 
                        fill="none" 
                        stroke="#10B981" 
                        strokeWidth="3.5" 
                        strokeLinecap="round" 
                        className="opacity-90"
                      />
                      {/* Meta Path */}
                      <path 
                        d="M 0 130 Q 120 70 220 95 T 420 30 T 500 60" 
                        fill="none" 
                        stroke="#3B82F6" 
                        strokeWidth="3.5" 
                        strokeLinecap="round" 
                        className="opacity-90"
                      />
                      {/* Tooltip Dot */}
                      <circle cx="200" cy="40" r="5" fill="#10B981" />
                      <circle cx="220" cy="95" r="5" fill="#3B82F6" />
                    </svg>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-gray-100/60 dark:border-zinc-800/40 text-[9px] font-bold text-gray-400 uppercase">
                    <span>Jun 01</span>
                    <span>Jun 02</span>
                    <span>Jun 03</span>
                    <span>Jun 04</span>
                    <span>Jun 05</span>
                  </div>
                </div>

                {/* AI Opportunity Box (12 cols footer) */}
                <div className="col-span-12 border-t border-gray-100 dark:border-zinc-800/80 pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs font-bold">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-500/20">
                      <Cpu size={14} className="animate-pulse" />
                    </div>
                    <div>
                      <span className="text-gray-800 dark:text-zinc-200 text-[10px] uppercase font-extrabold tracking-wider">RevenuePilot AI Recommendation</span>
                      <p className="text-[10px] text-gray-400 mt-0.5">Google PMax search CPA is 24% lower. Reallocating ₹12,500 daily budget.</p>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => trackEvent("UI Action", "Trigger AI Rec", "Hero dashboard apply")}
                    className="text-[9px] bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold uppercase px-3 py-1.5 rounded-lg shadow-sm"
                  >
                    Apply Optimization
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="pt-14 space-y-4">
            <span className="text-[9px] text-gray-400 dark:text-zinc-500 font-extrabold uppercase tracking-widest block">INTEGRATED POWERHOUSE ECOSYSTEM</span>
            <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-60 hover:opacity-85 transition-opacity py-2">
              {["Google Ads", "Meta Ads", "GA4", "Razorpay", "AWS", "OpenAI", "Anthropic"].map((partner) => (
                <span key={partner} className="text-xs font-black tracking-tighter text-gray-700 dark:text-zinc-300">{partner}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 — Problem Statement */}
      <section id="features" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-gray-100 dark:border-zinc-800/40">
        <div className="text-center space-y-4">
          <h2 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
            Marketing Shouldn&apos;t Feel Like Managing Five Different Platforms.
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 max-w-xl mx-auto">
            Ads managers are designed to keep you trapped in their specific ecosystem. RevenuePilot breaks down the walls.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-16">
          {/* Without RevenuePilot */}
          <div 
            onClick={() => trackEvent("Card Engagement", "Pain View", "Without RevenuePilot")}
            className="bg-white dark:bg-[#0D121F] border border-red-500/10 dark:border-red-500/5 rounded-3xl p-8 space-y-6 hover:shadow-md transition-all relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 blur-2xl rounded-full" />
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-red-500 flex items-center gap-1.5">
              <ShieldAlert size={16} />
              <span>Without RevenuePilot</span>
            </h3>
            
            <ul className="space-y-4">
              {[
                { title: "Google Ads Dashboard", desc: "Forced login and manually reviewing CPC search volumes." },
                { title: "Meta Ads Manager", desc: "Clunky pixel updates and creative fatigue debugging." },
                { title: "Google Analytics", desc: "Tracking sessions and bouncing visitors outside channels." },
                { title: "Reporting Tools", desc: "Exporting raw CSV sheets and coding visual pivot tables." },
                { title: "Creative Storage", desc: "Searching Drive paths for 1:1 and 9:16 banner crops." },
                { title: "Manual Optimizations", desc: "Adjusting bid budgets at 2 AM to avoid campaign leaks." }
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-3 text-xs leading-normal">
                  <span className="text-red-500 font-extrabold shrink-0 mt-0.5">❌</span>
                  <div>
                    <span className="font-extrabold text-gray-800 dark:text-zinc-200">{item.title}</span>
                    <p className="text-[11px] text-gray-400 mt-0.5">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* With RevenuePilot */}
          <div 
            onClick={() => trackEvent("Card Engagement", "Solution View", "With RevenuePilot")}
            className="bg-white dark:bg-[#0D121F] border border-emerald-500/20 dark:border-emerald-500/10 rounded-3xl p-8 space-y-6 shadow-xl shadow-emerald-500/5 hover:scale-[1.01] transition-all relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-2xl rounded-full" />
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-emerald-500 flex items-center gap-1.5">
              <CheckCircle2 size={16} />
              <span>With RevenuePilot Solutions</span>
            </h3>

            <ul className="space-y-4">
              {[
                { title: "One Integrated Dashboard", desc: "Google and Meta campaigns unified in a single visual center." },
                { title: "One Asset Library", desc: "Upload base files; the platform handles cropping, face-detects, and cataloging." },
                { title: "One Analytics Center", desc: "Attributions, CPA averages, and direct Razorpay ROI maps mapped." },
                { title: "One AI Engine Co-Pilot", desc: "Constant budget sweeps looking for campaign leaks and target optimizations." },
                { title: "One Coordinated Workflow", desc: "Deploy changes instantly to multiple networks via standard secure cloud APIs." }
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-3 text-xs leading-normal">
                  <span className="text-emerald-500 font-extrabold shrink-0 mt-0.5">✅</span>
                  <div>
                    <span className="font-extrabold text-gray-800 dark:text-zinc-200">{item.title}</span>
                    <p className="text-[11px] text-gray-400 mt-0.5">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-center gap-3 mt-6">
              <Flame size={20} className="text-emerald-500 animate-bounce" />
              <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-400 leading-tight">
                Users achieve up to 67% faster campaign deployment times and reduce budget waste.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 — Platform Overview (6 cards) */}
      <section className="py-20 bg-gray-50/50 dark:bg-[#0A0D16] border-b border-gray-100 dark:border-zinc-800/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center space-y-4">
            <span className="text-[9px] text-emerald-500 font-extrabold uppercase tracking-widest block">ENTERPRISE READY CAPABILITIES</span>
            <h2 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
              Everything Required To Run High-Performance Advertising.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: "Command Nexus",
                desc: "Business Intelligence Center providing aggregated, multi-channel view maps.",
                metrics: ["Unified Spend", "ROAS Aggregates", "CPA Benchmarks", "Lead Audits"],
                icon: <LayoutDashboard className="text-emerald-500" size={20} />
              },
              {
                title: "RevenuePilot Studio",
                desc: "Unified editor deploying campaigns to Google and Meta from a single wizard window.",
                metrics: ["PMax Launchers", "Meta Stories Wizard", "Platform Copy Syncer", "Budget Mapping"],
                icon: <Tv className="text-blue-500" size={20} />
              },
              {
                title: "Creative Vault",
                desc: "Single-upload asset manager deploying crops dynamically via OpenCV scanner models.",
                metrics: ["1:1 & 9:16 Autofit", "Face Bounds Scanner", "Focal Targets Sync", "Format Compressors"],
                icon: <Layers className="text-amber-500" size={20} />
              },
              {
                title: "Neural Ops",
                desc: "Continuous opportunity scanner monitoring real-time conversion rates and budget allocations.",
                metrics: ["AI Spending Sweeps", "Budget Forecasters", "Trend Spotting Engine", "Platform Shifts"],
                icon: <Cpu className="text-indigo-500" size={20} />
              },
              {
                title: "Automation Forge",
                desc: "Build custom workflow rules that trigger alert notifications or auto-pause budgets.",
                metrics: ["Budget Guardrails", "Underperform Rules", "Alert Tickers", "Meters Check"],
                icon: <HeartPulse className="text-red-500" size={20} />
              },
              {
                title: "Pulse Matrix",
                desc: "Attribution models tracking conversions from link click down to active Razorpay payments.",
                metrics: ["Linear Attributions", "Cohort Analysis", "Channel ROI maps", "Traffic Ledger"],
                icon: <Activity className="text-purple-500" size={20} />
              }
            ].map((card, idx) => (
              <div 
                key={idx}
                onClick={() => trackEvent("Platform Overview", "Card Click", card.title)}
                className="bg-white dark:bg-[#0D121F] border border-gray-200/80 dark:border-zinc-800/80 p-6 rounded-3xl hover:shadow-lg hover:border-emerald-500/40 dark:hover:border-emerald-500/20 hover:scale-[1.02] cursor-pointer transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-55 dark:bg-zinc-900/60 flex items-center justify-center border border-gray-100 dark:border-zinc-800">
                    {card.icon}
                  </div>
                  <h3 className="font-extrabold text-sm text-gray-900 dark:text-white uppercase tracking-wider">{card.title}</h3>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed">{card.desc}</p>
                </div>

                <div className="pt-4 mt-6 border-t border-gray-50 dark:border-zinc-800/60 grid grid-cols-2 gap-2 text-[10px] font-bold text-gray-400">
                  {card.metrics.map((m, i) => (
                    <span key={i} className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5 — Workflow Section (Interactive Step Simulator) */}
      <section id="workflow" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-gray-100 dark:border-zinc-800/40">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Stepper details (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <span className="text-[9px] text-emerald-500 font-extrabold uppercase tracking-widest block">STEP-BY-STEP OPERATION</span>
            <h2 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-none">
              How RevenuePilot Works
            </h2>
            <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed">
              We streamlined multi-channel setup into five sequential automation layers. Click each step to preview the workflow.
            </p>

            <div className="space-y-3">
              {[
                { stepNum: 1, title: "Connect Accounts", sub: "Google Ads & Meta Ads credential handshakes" },
                { stepNum: 2, title: "Upload Creatives", sub: "Drag images, videos, and logos to the vault" },
                { stepNum: 3, title: "Launch Campaigns", sub: "Configure structure and push dynamic ads live" },
                { stepNum: 4, title: "Optimize Automatically", sub: "Let AI adjust bid allocations dynamically" },
                { stepNum: 5, title: "Track Revenue", sub: "Review consolidated ROAS and CPA attributions" }
              ].map((stepItem) => (
                <div
                  key={stepItem.stepNum}
                  onClick={() => {
                    setActiveWorkflowStep(stepItem.stepNum);
                    trackEvent("Workflow Stepper", "Step Select", `Step ${stepItem.stepNum}: ${stepItem.title}`);
                  }}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3.5 ${
                    activeWorkflowStep === stepItem.stepNum
                      ? "border-emerald-500/60 bg-emerald-500/5 shadow-sm"
                      : "border-gray-200 hover:bg-gray-50 dark:border-zinc-800/60 dark:hover:bg-zinc-800/20"
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg font-black text-xs flex items-center justify-center shrink-0 border ${
                    activeWorkflowStep === stepItem.stepNum
                      ? "bg-emerald-500 text-white border-transparent"
                      : "bg-gray-50 dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 text-gray-500"
                  }`}>
                    {stepItem.stepNum}
                  </div>
                  <div>
                    <span className="font-extrabold text-xs text-gray-900 dark:text-white block leading-tight">{stepItem.title}</span>
                    <span className="text-[10px] text-gray-400 block mt-0.5">{stepItem.sub}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stepper visual (7 cols) */}
          <div className="lg:col-span-7 bg-white dark:bg-[#0D121F] border border-gray-200 dark:border-zinc-800/80 p-8 rounded-3xl shadow-xl min-h-[350px] flex items-center justify-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-2xl rounded-full" />
            
            {activeWorkflowStep === 1 && (
              <div className="space-y-6 w-full animate-in fade-in">
                <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-zinc-800">
                  <span className="font-extrabold text-xs text-gray-900 dark:text-white">API INTEGRATION BRIDGE</span>
                  <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded uppercase border border-emerald-500/10">OAuth 2.0 Secure</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 dark:bg-zinc-900/40 border border-gray-200 dark:border-zinc-800 rounded-2xl flex flex-col justify-between h-28">
                    <span className="text-xs font-black text-gray-900 dark:text-white">Google Ads Connect</span>
                    <button 
                      type="button" 
                      onClick={() => trackEvent("UI Action", "Connect Mock", "Google Ads")}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-[10px] uppercase py-2 rounded-xl transition-all shadow-sm shadow-emerald-500/10"
                    >
                      OAuth Handshake
                    </button>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-zinc-900/40 border border-gray-200 dark:border-zinc-800 rounded-2xl flex flex-col justify-between h-28">
                    <span className="text-xs font-black text-gray-900 dark:text-white">Meta Ads Connect</span>
                    <button 
                      type="button" 
                      onClick={() => trackEvent("UI Action", "Connect Mock", "Meta Ads")}
                      className="bg-blue-500 hover:bg-blue-600 text-white font-extrabold text-[10px] uppercase py-2 rounded-xl transition-all shadow-sm shadow-blue-500/10"
                    >
                      OAuth Handshake
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeWorkflowStep === 2 && (
              <div className="space-y-6 w-full animate-in fade-in">
                <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-zinc-800">
                  <span className="font-extrabold text-xs text-gray-900 dark:text-white">CREATIVE INGESTION ENGINE</span>
                  <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded uppercase border border-amber-500/10">Focal Scanner Active</span>
                </div>
                <div className="border-2 border-dashed border-gray-200 dark:border-zinc-800 hover:border-emerald-500 hover:bg-emerald-500/5 transition-all p-8 rounded-2xl text-center cursor-pointer flex flex-col items-center justify-center">
                  <FolderSync size={32} className="text-gray-400 mb-2 animate-bounce" />
                  <span className="text-xs font-extrabold text-gray-800 dark:text-zinc-200">Drag Assets to Ingest</span>
                  <p className="text-[10px] text-gray-400 mt-1 max-w-[240px]">AI scans for dominant focal shapes and outputs required ratios automatically.</p>
                </div>
              </div>
            )}

            {activeWorkflowStep === 3 && (
              <div className="space-y-6 w-full animate-in fade-in">
                <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-zinc-800">
                  <span className="font-extrabold text-xs text-gray-900 dark:text-white">CAMPAIGN DEPLOYMENT MODULE</span>
                  <span className="text-[9px] font-bold text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded uppercase border border-indigo-500/10">Multi-Channel Push</span>
                </div>
                <div className="bg-gray-55 dark:bg-zinc-900/60 border border-gray-100 dark:border-zinc-800 rounded-2xl p-4 space-y-4">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span>Google Campaign: Search - Competitor Brand</span>
                    <span className="text-emerald-500">₹1,500/day</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span>Meta Campaign: Retargeting Lookalikes</span>
                    <span className="text-blue-500">₹2,500/day</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => trackEvent("UI Action", "Launch Mock", "Workflow launch campaign")}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs py-2.5 rounded-xl transition-all shadow-md shadow-emerald-500/10 uppercase flex items-center justify-center gap-1.5"
                  >
                    <Send size={12} />
                    <span>Push to Ad Networks</span>
                  </button>
                </div>
              </div>
            )}

            {activeWorkflowStep === 4 && (
              <div className="space-y-6 w-full animate-in fade-in">
                <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-zinc-800">
                  <span className="font-extrabold text-xs text-gray-900 dark:text-white">Continuous AI Auditing</span>
                  <span className="text-[9px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded uppercase border border-red-500/10">Budgets Guard Active</span>
                </div>
                <div className="bg-red-50/50 dark:bg-red-950/10 border border-red-150 dark:border-red-900/40 p-4 rounded-2xl flex gap-3 text-left">
                  <ShieldAlert className="text-red-500 shrink-0 mt-0.5" size={16} />
                  <div>
                    <span className="text-xs font-extrabold text-red-800 dark:text-red-400 block leading-tight">Wasted Spend Blocked</span>
                    <p className="text-[10px] text-red-600 dark:text-red-500/80 mt-1 leading-relaxed">
                      Rule triggered: Meta campaign CPC rose above target threshold limit. Spending paused. Dynamic budget re-allocated to active Google PMax engine.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeWorkflowStep === 5 && (
              <div className="space-y-6 w-full animate-in fade-in">
                <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-zinc-800">
                  <span className="font-extrabold text-xs text-gray-900 dark:text-white">UNIFIED LEDGER CONSOLE</span>
                  <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded uppercase border border-emerald-500/10">ROI Synchronized</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-zinc-900 p-4 rounded-xl text-center">
                    <span className="text-[9px] text-gray-400 block font-bold uppercase">Consolidated ROAS</span>
                    <span className="text-2xl font-black text-emerald-500 mt-1 block">5.07x</span>
                  </div>
                  <div className="bg-gray-50 dark:bg-zinc-900 p-4 rounded-xl text-center">
                    <span className="text-[9px] text-gray-400 block font-bold uppercase">CPA Average</span>
                    <span className="text-2xl font-black text-gray-900 dark:text-white mt-1 block">₹24.80</span>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </section>

      {/* SECTION 6 — Creative Vault Showcase */}
      <section className="py-20 bg-white dark:bg-[#090C14] border-b border-gray-100 dark:border-zinc-800/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center space-y-4">
            <span className="text-[9px] text-emerald-500 font-extrabold uppercase tracking-widest block">CREATIVE ASSET ENGINE</span>
            <h2 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
              Upload Once. Publish Everywhere.
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Interactive Visualizer crops (7 cols) */}
            <div 
              onClick={() => trackEvent("Engagement", "Crop Visualizer Toggle", vaultDemoImage)}
              className="lg:col-span-7 bg-gray-50 dark:bg-zinc-900/30 border border-gray-200 dark:border-zinc-800/80 p-8 rounded-3xl flex flex-col items-center gap-6"
            >
              {/* Canvas Box */}
              <div className="relative w-full max-w-sm aspect-square bg-white dark:bg-[#0D121F] border border-gray-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-lg flex items-center justify-center">
                <img 
                  src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80" 
                  alt="RatioForge Demo"
                  className="object-cover w-full h-full"
                  style={{
                    objectPosition: "50% 50%"
                  }}
                />
                
                {/* Crop guides */}
                <div 
                  className={`absolute inset-0 border-2 border-dashed border-emerald-500 transition-all ${
                    vaultDemoImage === "Meta Feed (1:1)" ? "aspect-square max-w-[180px] max-h-[180px] m-auto" :
                    vaultDemoImage === "Meta Story (9:16)" ? "aspect-[9/16] max-w-[120px] max-h-[220px] m-auto" :
                    vaultDemoImage === "Google Landscape (1.91:1)" ? "aspect-[1.91/1] max-w-[260px] max-h-[136px] m-auto" :
                    "aspect-[16/9] max-w-[280px] max-h-[157px] m-auto"
                  }`}
                >
                  <span className="absolute -top-5 left-0 bg-emerald-500 text-white text-[7px] font-black uppercase px-2 py-0.5 rounded shadow-sm">
                    {vaultDemoImage} Aspect Bounds
                  </span>
                </div>
              </div>

              {/* Aspect selector pills */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                {[
                  "Meta Feed (1:1)",
                  "Meta Story (9:16)",
                  "Google Landscape (1.91:1)",
                  "YouTube Display (16:9)"
                ].map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => {
                      setVaultDemoImage(ratio);
                      trackEvent("Crop Simulator", "Ratio Select", ratio);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase border transition-all ${
                      vaultDemoImage === ratio
                        ? "bg-emerald-50 border-emerald-200 text-emerald-600 shadow-sm"
                        : "bg-white border-gray-100 text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            {/* Feature lists (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              <h3 className="text-xl font-extrabold text-gray-900 dark:text-white uppercase tracking-wider">Automated Aspect Ratio Generation</h3>
              <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed">
                Google Ads demands horizontal landscape cards. Meta Stories need vertical 9:16 templates. RevenuePilot’s RatioForge utilizes face-detection metrics to anchor focal targets and crops.
              </p>

              <div className="space-y-4">
                {[
                  { title: "RatioForge Engine", desc: "OpenCV algorithms automatically position crop anchors around primary visual subjects." },
                  { title: "CreativePilot AI", desc: "Scans images for text overlaps, density constraints, and safety guidelines." },
                  { title: "Creative Validation", desc: "Verifies resolutions meet minimum upload standards before pushing to APIs." },
                  { title: "Asset Versioning", desc: "Edits visual copies inside the vault without breaking historical performance logs." }
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-3 text-xs leading-normal">
                    <span className="p-0.5 rounded bg-emerald-500/10 text-emerald-500 shrink-0 mt-0.5">
                      <Check size={12} strokeWidth={3} />
                    </span>
                    <div>
                      <span className="font-extrabold text-gray-800 dark:text-zinc-200">{item.title}</span>
                      <p className="text-[11px] text-gray-400 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7 — AI Ecosystem */}
      <section className="py-20 bg-gray-50/50 dark:bg-[#0A0D16] border-b border-gray-100 dark:border-zinc-800/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center space-y-4">
            <span className="text-[9px] text-emerald-500 font-extrabold uppercase tracking-widest block">INTELLIGENCE PLATFORM CORNERSTONE</span>
            <h2 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
              Built-In Marketing Intelligence
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Tabs Selector (5 cols) */}
            <div className="lg:col-span-5 space-y-2">
              {[
                { name: "AI Campaign Creator", sub: "Generate targets and keywords structure" },
                { name: "AI Budget Optimizer", sub: "Continuous reallocations based on CPA performance" },
                { name: "AI Revenue Advisor", sub: "Opportunity alerts highlighting target gaps" },
                { name: "AI Forecast Engine", sub: "Estimate revenue returns based on historical limits" },
                { name: "AI Opportunity Scanner", sub: "Scrapes accounts to detect and pause wasted ad spend" }
              ].map((module) => (
                <div
                  key={module.name}
                  onClick={() => {
                    setActiveAIModule(module.name);
                    trackEvent("AI Modules", "Module Select", module.name);
                  }}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex justify-between items-center ${
                    activeAIModule === module.name
                      ? "border-emerald-500/60 bg-emerald-500/5 font-extrabold shadow-sm"
                      : "border-gray-200 hover:bg-gray-50 dark:border-zinc-800/60 dark:hover:bg-zinc-800/20"
                  }`}
                >
                  <div>
                    <span className="text-xs text-gray-900 dark:text-white block leading-tight">{module.name}</span>
                    <span className="text-[10px] text-gray-400 block mt-0.5">{module.sub}</span>
                  </div>
                  <ChevronRight size={14} className={activeAIModule === module.name ? "text-emerald-500" : "text-gray-300"} />
                </div>
              ))}
            </div>

            {/* Output Visual Panel (7 cols) */}
            <div className="lg:col-span-7 bg-white dark:bg-[#0D121F] border border-gray-200 dark:border-zinc-800/80 p-8 rounded-3xl shadow-xl min-h-[350px]">
              {activeAIModule === "AI Campaign Creator" && (
                <div className="space-y-4 animate-in fade-in text-left">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-zinc-800">
                    <span className="text-xs font-black text-gray-900 dark:text-white">AI CAMPAIGN CREATION PREVIEW</span>
                    <span className="text-[9px] text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">READY TO DEPLOY</span>
                  </div>
                  <div className="space-y-3 font-mono text-[10px]">
                    <div className="bg-gray-50 dark:bg-zinc-900 p-3 rounded-lg border border-gray-150 dark:border-zinc-800">
                      <span className="text-purple-500 dark:text-purple-400">Ad Group Name:</span> Search - competitor terms
                    </div>
                    <div className="bg-gray-50 dark:bg-zinc-900 p-3 rounded-lg border border-gray-150 dark:border-zinc-800 space-y-1">
                      <span className="text-emerald-500 dark:text-emerald-400 block">Suggested Headline copies:</span>
                      <p>• Switch to RevenuePilot - 67% Faster Launch</p>
                      <p>• Unified Ad Center - Run Google & Meta Campaigns</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-zinc-900 p-3 rounded-lg border border-gray-150 dark:border-zinc-800">
                      <span className="text-blue-500 dark:text-blue-400">Target Keywords:</span> &quot;ads manager alternatives&quot;, &quot;unified ads tool&quot;, &quot;Google and Meta syncer&quot;
                    </div>
                  </div>
                </div>
              )}

              {activeAIModule === "AI Budget Optimizer" && (
                <div className="space-y-4 animate-in fade-in text-left">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-zinc-800">
                    <span className="text-xs font-black text-gray-900 dark:text-white">BUDGET REALLOCATION METRICS</span>
                    <span className="text-[9px] text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">AUTO ACTION ENGAGED</span>
                  </div>
                  <div className="space-y-3 font-sans text-xs">
                    <p className="text-gray-500">Continuous sweeps monitor active ad sets every 15 minutes, moving budgets to the highest ROAS performer.</p>
                    <div className="bg-gray-55 dark:bg-zinc-900/60 p-4 rounded-xl border border-gray-100 dark:border-zinc-800 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Google Search ROAS:</span>
                        <span className="font-extrabold text-emerald-500">6.12x</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Meta Feed ROAS:</span>
                        <span className="font-extrabold text-red-400">1.80x</span>
                      </div>
                      <div className="border-t border-gray-100 dark:border-zinc-800 pt-2 text-[10px] font-bold text-gray-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                        <span>Action: Shifted ₹15,000 to Google Search ad group limits.</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeAIModule === "AI Revenue Advisor" && (
                <div className="space-y-4 animate-in fade-in text-left">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-zinc-800">
                    <span className="text-xs font-black text-gray-900 dark:text-white">Revenue POTENTIAL INSIGHTS</span>
                    <span className="text-[9px] text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 font-bold">OPPORTUNITY</span>
                  </div>
                  <div className="bg-gray-50 dark:bg-zinc-900/40 p-4 rounded-xl border border-gray-100 dark:border-zinc-800 flex gap-3 text-xs leading-normal">
                    <Sparkles size={20} className="text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-gray-800 dark:text-zinc-200">Competitor Spend Leak Spotted</span>
                      <p className="text-[10px] text-gray-400 mt-1">
                        Competitor spend index on search term &quot;RevenuePilot alternatives&quot; increased by 42%. We recommend launching an immediate Brand Defensive search campaign with a ₹5,000 daily budget.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeAIModule === "AI Forecast Engine" && (
                <div className="space-y-4 animate-in fade-in text-left">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-zinc-800">
                    <span className="text-xs font-black text-gray-900 dark:text-white">REVENUE MODEL PROJECTIONS</span>
                    <span className="text-[9px] text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 font-bold">Q3 MODEL PREVIEW</span>
                  </div>
                  <div className="space-y-3 font-sans text-xs">
                    <p className="text-gray-500">Dynamic forecast projections based on campaign spend scaling parameters.</p>
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="bg-gray-55 dark:bg-zinc-900 p-4 rounded-xl text-center border border-gray-100 dark:border-zinc-800">
                        <span className="text-[9px] text-gray-400 block uppercase font-bold">Spend: ₹1,00,000</span>
                        <span className="text-lg font-black text-emerald-500 block mt-1">Est. Revenue: ₹5,00,000</span>
                      </div>
                      <div className="bg-gray-55 dark:bg-zinc-900 p-4 rounded-xl text-center border border-gray-100 dark:border-zinc-800">
                        <span className="text-[9px] text-gray-400 block uppercase font-bold">Spend: ₹2,00,000</span>
                        <span className="text-lg font-black text-emerald-500 block mt-1">Est. Revenue: ₹9,80,000</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeAIModule === "AI Opportunity Scanner" && (
                <div className="space-y-4 animate-in fade-in text-left">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-zinc-800">
                    <span className="text-xs font-black text-gray-900 dark:text-white">AUDITING METADATA INVENTORY</span>
                    <span className="text-[9px] text-red-500 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 font-bold">ACTIVE SCANNER</span>
                  </div>
                  <div className="bg-red-50/40 dark:bg-red-950/10 border border-red-100 dark:border-red-900/40 p-4 rounded-2xl flex gap-3 text-xs leading-normal">
                    <ShieldAlert size={20} className="text-red-500 shrink-0 mt-0.5 animate-bounce" />
                    <div>
                      <span className="font-extrabold text-red-800 dark:text-red-400">Paused Ad Group Waste Detected</span>
                      <p className="text-[10px] text-red-600 dark:text-red-500/80 mt-1 leading-relaxed">
                        Meta Ad Group &quot;Broad Interests - US&quot; has spent ₹8,400 with 0 conversion returns in the last 72 hours. We paused the ad group to save ₹2,800 daily waste.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 8 — Integrations */}
      <section id="integrations" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-gray-100 dark:border-zinc-800/40">
        <div className="text-center space-y-4 mb-16">
          <span className="text-[9px] text-emerald-500 font-extrabold uppercase tracking-widest block">DYNAMIC COMPATIBILITY MATRIX</span>
          <h2 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
            Works With Your Existing Stack
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[
            { name: "Google Ads", tag: "API Push" },
            { name: "Meta Ads", tag: "API Push" },
            { name: "Google Analytics", tag: "Pixel Sync" },
            { name: "Google Tag Manager", tag: "Pixel Sync" },
            { name: "Search Console", tag: "Index Sync" },
            { name: "Slack", tag: "Alert Sync" },
            { name: "WhatsApp", tag: "Alert Sync" },
            { name: "Shopify", tag: "Order Sync" },
            { name: "WooCommerce", tag: "Order Sync" },
            { name: "HubSpot", tag: "CRM Sync" },
            { name: "Zapier", tag: "Webhook" },
            { name: "Stripe", tag: "Billing Sync" },
            { name: "Razorpay", tag: "Billing Sync" },
            { name: "OpenAI", tag: "LLM Copilot" },
            { name: "Anthropic", tag: "LLM Copilot" }
          ].map((partner) => (
            <div 
              key={partner.name}
              onClick={() => trackEvent("Integrations Grid", "Logo Hover", partner.name)}
              className="bg-white dark:bg-[#0D121F] border border-gray-200 dark:border-zinc-800/80 p-5 rounded-2xl text-center hover:border-emerald-500/40 dark:hover:border-emerald-500/20 hover:scale-[1.02] cursor-pointer transition-all flex flex-col items-center justify-center h-24 relative group overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-400 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              <span className="text-xs font-black text-gray-950 dark:text-white">{partner.name}</span>
              <span className="text-[8px] font-bold text-gray-400 dark:text-zinc-500 mt-1 uppercase tracking-wider">{partner.tag}</span>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 9 — Security Section */}
      <section id="security" className="py-20 bg-gray-50/50 dark:bg-[#0A0D16] border-b border-gray-100 dark:border-zinc-800/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center space-y-4">
            <span className="text-[9px] text-emerald-500 font-extrabold uppercase tracking-widest block">MILITARY-GRADE SAFEGUARDS</span>
            <h2 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
              Enterprise Security By Design
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                title: "Authentication",
                details: ["Secure OAuth 2.0 Connect", "JSON Web Tokens (JWT)", "Forced Two-Factor Auth (2FA)"],
                icon: <Lock className="text-emerald-500" size={18} />
              },
              {
                title: "Infrastructure",
                details: ["Hosted on AWS Secure Cloud", "Cloudflare DNS Proxies", "Fast Global CDN Placements"],
                icon: <Shield className="text-blue-500" size={18} />
              },
              {
                title: "Compliance",
                details: ["GDPR Ready Data Structures", "SOC2 Compliance Audited", "Impersonation Audit Logs"],
                icon: <CheckCircle2 className="text-indigo-500" size={18} />
              },
              {
                title: "Data Protection",
                details: ["AES-256 Bit Data Encryptions", "Automated Daily Database Backups", "Symmetrical Disaster Recovery"],
                icon: <DatabaseZap className="text-purple-500" size={18} />
              }
            ].map((card, idx) => (
              <div 
                key={idx}
                className="bg-white dark:bg-[#0D121F] border border-gray-200 dark:border-zinc-800/80 p-6 rounded-2xl space-y-4 hover:shadow-md transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-zinc-900/60 flex items-center justify-center border border-gray-100 dark:border-zinc-800">
                  {card.icon}
                </div>
                <h3 className="font-extrabold text-xs text-gray-950 dark:text-white uppercase tracking-wider">{card.title}</h3>
                
                <ul className="space-y-2 text-[10px] font-bold text-gray-400">
                  {card.details.map((detail, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <span className="w-1 h-1 bg-emerald-500 rounded-full" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 10 — Feature Comparison Table */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-gray-100 dark:border-zinc-800/40">
        <div className="text-center space-y-4 mb-16">
          <span className="text-[9px] text-emerald-500 font-extrabold uppercase tracking-widest block">HEAD-TO-HEAD BATTLECARD</span>
          <h2 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tight font-sans">
            Why RevenuePilot Wins
          </h2>
        </div>

        <div className="overflow-x-auto border border-gray-200 dark:border-zinc-800/80 rounded-3xl bg-white dark:bg-[#0D121F] shadow-lg">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 dark:bg-[#090D17] border-b border-gray-100 dark:border-zinc-800/80 text-[10px] font-extrabold uppercase text-gray-400 tracking-wider">
                <th className="p-6">Feature Details</th>
                <th className="p-6 text-emerald-600 dark:text-emerald-400">RevenuePilot</th>
                <th className="p-6">Google Ads Manager</th>
                <th className="p-6">Meta Ads Manager</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/60 font-bold text-gray-500">
              {[
                { feature: "Unified Ads Dashboard", gp: "✅ Full Integration", g: "❌ Disabled", m: "❌ Disabled" },
                { feature: "AI Spend Optimization Engine", gp: "✅ Real-time reallocates", g: "Limited parameters", m: "Limited parameters" },
                { feature: "Aspect Ratio Crop Studio (Vault)", gp: "✅ RatioForge In-app", g: "❌ Disabled", m: "❌ Disabled" },
                { feature: "Multi-Platform Deploy Wizard", gp: "✅ Dual API push", g: "❌ Disabled", m: "❌ Disabled" },
                { feature: "Automated Reporting Ledgers", gp: "✅ Attributions unified", g: "❌ Disabled", m: "❌ Disabled" },
                { feature: "Continuous Automations Forge", gp: "✅ Auto-pauses rules", g: "Partial scripts only", m: "Partial triggers only" }
              ].map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/10 transition-colors">
                  <td className="p-6 text-gray-950 dark:text-white font-extrabold">{row.feature}</td>
                  <td className="p-6 text-emerald-500">{row.gp}</td>
                  <td className="p-6 text-gray-400">{row.g}</td>
                  <td className="p-6 text-gray-400">{row.m}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* SECTION 11 — Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50/50 dark:bg-[#0A0D16] border-b border-gray-100 dark:border-zinc-800/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center space-y-6">
            <span className="text-[9px] text-emerald-500 font-extrabold uppercase tracking-widest block">TRANSPARENT VALUE SCALES</span>
            <h2 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-none">
              Choose Your Revenue Engine
            </h2>
            
            {/* Toggle monthly/annual */}
            <div className="flex items-center justify-center gap-3">
              <span className={`text-xs font-bold ${!isAnnual ? "text-gray-900 dark:text-white" : "text-gray-400"}`}>Monthly billing</span>
              <button
                type="button"
                onClick={() => {
                  setIsAnnual(!isAnnual);
                  trackEvent("Pricing Switcher", "Toggle Billing Mode", !isAnnual ? "Annual" : "Monthly");
                }}
                className="w-12 h-6 bg-emerald-500/20 rounded-full p-1 relative transition-colors focus:outline-none"
              >
                <div className={`w-4 h-4 bg-emerald-500 rounded-full transition-transform ${isAnnual ? "translate-x-6" : ""}`} />
              </button>
              <span className={`text-xs font-bold flex items-center gap-1.5 ${isAnnual ? "text-emerald-500 font-extrabold" : "text-gray-400"}`}>
                <span>Annual billing</span>
                <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[8px] font-black uppercase px-2 py-0.5 rounded border border-emerald-500/25">Save 20%</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                name: "Starter",
                price: 499,
                desc: "For beginners launching initial ad assets.",
                cta: "Start Trial",
                features: ["3 Active Campaigns Limit", "1 Workspace Sync", "5GB Media Ingestion Limits"]
              },
              {
                name: "Revenue",
                price: 999,
                desc: "Most Popular tier for growing active advertisers.",
                cta: "Start Trial",
                popular: true,
                features: ["15 Active Campaigns Limit", "3 Workspaces Sync", "50GB Media Ingestion Limits", "10 Active Automation Forge Rules"]
              },
              {
                name: "Pro",
                price: 1999,
                desc: "Scale capabilities for agencies and spend limits.",
                cta: "Start Trial",
                features: ["Unlimited Campaigns Limit", "10 Workspaces Sync", "200GB Media Ingestion Limits", "100 Active Automation Forge Rules", "Advanced attributions center"]
              },
              {
                name: "Enterprise",
                price: 9999,
                desc: "Agencies requiring multi-tenant configurations.",
                cta: "Book Demo",
                features: ["Unlimited Sync limits", "Whitelabel custom domains", "SSO Infrastructure keys", "Multi-tenant Agency Portals"]
              }
            ].map((planItem) => {
              const discountedPrice = isAnnual ? Math.round(planItem.price * 0.8) : planItem.price;
              return (
                <div 
                  key={planItem.name}
                  onClick={() => trackEvent("Pricing Card", "Interact", planItem.name)}
                  className={`bg-white dark:bg-[#0D121F] border rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between transition-all hover:scale-[1.01] ${
                    planItem.popular 
                      ? "border-emerald-500 shadow-xl shadow-emerald-500/5 ring-1 ring-emerald-500" 
                      : "border-gray-200/80 dark:border-zinc-800/80 hover:shadow-md"
                  }`}
                >
                  {planItem.popular && (
                    <span className="absolute top-4 right-4 bg-emerald-500 text-white text-[8px] font-black uppercase px-2.5 py-1 rounded-full tracking-wider shadow-sm">
                      Most Popular
                    </span>
                  )}
                  
                  <div>
                    <h3 className="font-extrabold text-sm text-gray-900 dark:text-white uppercase tracking-wider">{planItem.name}</h3>
                    <p className="text-[10px] text-gray-400 mt-1 leading-relaxed min-h-[30px]">{planItem.desc}</p>
                    
                    <div className="my-6">
                      <span className="text-[10px] text-gray-400 uppercase font-bold block">Monthly Equivalent</span>
                      <span className="text-3xl font-black text-gray-950 dark:text-white leading-none">
                        ₹{discountedPrice.toLocaleString("en-IN")}
                      </span>
                      <span className="text-[10px] text-gray-400">/mo</span>
                    </div>

                    <ul className="space-y-3 text-[10px] font-bold text-gray-500 border-t border-gray-50 dark:border-zinc-800/60 pt-5">
                      {planItem.features.map((f, i) => (
                        <li key={i} className="flex gap-2 items-start leading-normal">
                          <span className="p-0.5 rounded-full bg-emerald-500/10 text-emerald-500 mt-0.5">
                            <Check size={10} strokeWidth={3} />
                          </span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-6 mt-6 border-t border-gray-50 dark:border-zinc-800/60">
                    <Link
                      href="/login"
                      onClick={() => handleCTA(`Pricing signup card: ${planItem.name}`)}
                      className={`w-full font-extrabold text-xs py-3 rounded-2xl transition-all uppercase flex items-center justify-center gap-1.5 ${
                        planItem.popular 
                          ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/15" 
                          : "bg-gray-100 hover:bg-gray-250 text-gray-800 dark:bg-zinc-800/80 dark:hover:bg-zinc-800 dark:text-zinc-200"
                      }`}
                    >
                      <Zap size={12} fill="currentColor" />
                      <span>{planItem.cta}</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 12 — Social Proof */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-gray-100 dark:border-zinc-800/40">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Key Stats metrics (5 cols) */}
          <div className="lg:col-span-5 space-y-8">
            <span className="text-[9px] text-emerald-500 font-extrabold uppercase tracking-widest block">VALIDATED PROOF SHEETS</span>
            <h2 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-none">
              Trusted By Revenue-Focused Businesses
            </h2>
            <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed">
              Here is how digital-first organizations scale client accounts and optimize spend budgets efficiently.
            </p>

            <div className="space-y-4">
              {[
                { val: "3x", stat: "ROAS Increase", detail: "Consolidated average cross-channel return returns boost." },
                { val: "42%", stat: "Lower CPA Costs", detail: "Continuous AI bid sweeps pause budget waste leaks." },
                { val: "67%", stat: "Faster Deployments", detail: "Create aspect ratios once inside vault structures." }
              ].map((statItem, idx) => (
                <div key={idx} className="flex gap-4 items-center">
                  <span className="text-3xl sm:text-4xl font-black text-emerald-500 shrink-0">{statItem.val}</span>
                  <div>
                    <span className="font-extrabold text-xs text-gray-950 dark:text-white block">{statItem.stat}</span>
                    <span className="text-[10px] text-gray-400 block mt-0.5">{statItem.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Testimonial grid (7 cols) */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              {
                quote: "Before RevenuePilot, we logged into Google Ads and Meta Ads four times a day. Budget leaks are gone now; our attribution ROAS sync is flawless.",
                author: "Arjun Mehta",
                title: "Ad Operations Lead, PeakScale Agency"
              },
              {
                quote: "Ingesting media once inside the Creative Vault changed the game. Slicing aspect ratios is completely automatic; saves our design division hours.",
                author: "Sarah D'Souza",
                title: "Creative Director, VibeMarketing"
              }
            ].map((tItem, idx) => (
              <div 
                key={idx}
                className="bg-white dark:bg-[#0D121F] border border-gray-200/80 dark:border-zinc-800/80 p-6 rounded-3xl shadow-sm relative overflow-hidden"
              >
                <div className="flex gap-1 text-amber-400 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={12} fill="currentColor" />
                  ))}
                </div>
                <p className="text-xs text-gray-600 dark:text-zinc-300 leading-relaxed font-semibold">&quot;{tItem.quote}&quot;</p>
                
                <div className="pt-4 mt-6 border-t border-gray-50 dark:border-zinc-800/60 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 font-black text-xs flex items-center justify-center border border-emerald-500/20">
                    {tItem.author[0]}
                  </div>
                  <div>
                    <span className="font-extrabold text-[10px] text-gray-950 dark:text-white block leading-none">{tItem.author}</span>
                    <span className="text-[9px] text-gray-400 block mt-0.5 leading-none">{tItem.title}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 13 — FAQ Section */}
      <section className="py-20 bg-gray-50/50 dark:bg-[#0A0D16] border-b border-gray-100 dark:border-zinc-800/40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center space-y-4">
            <span className="text-[9px] text-emerald-500 font-extrabold uppercase tracking-widest block">FREQUENTLY ASKED QUESTIONS</span>
            <h2 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
              Got Questions? We Have Answers.
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "What ad network platforms are supported?",
                a: "RevenuePilot fully supports both Google Ads (including Search, Display, Performance Max, and YouTube placements) and Meta Ads (including Facebook Feed, Instagram Stories, and Reels)."
              },
              {
                q: "Can I run Google and Meta campaigns together?",
                a: "Yes! In fact, that is the primary operating objective. RevenuePilot coordinates budgets across networks, reallocating spend daily to maximize overall ROAS outcomes."
              },
              {
                q: "Do I need technical software development knowledge?",
                a: "Not at all. The Setup Wizard connects your ad network channels using standard, secure OAuth sign-ins. Zero coding is required."
              },
              {
                q: "Can I cancel my subscription anytime?",
                a: "Absolutely. RevenuePilot operates on a monthly rolling contract basis. You can cancel, downgrade, or upgrade your plan directly from the billing tab in your settings."
              },
              {
                q: "How secure is my ad spend account data?",
                a: "We implement AES-256 databases and secure cloud tokens. Symmetrical OAuth protocols guarantee RevenuePilot never directly stores your master passwords."
              }
            ].map((faq, idx) => (
              <div 
                key={idx}
                onClick={() => {
                  setOpenFAQ(openFAQ === idx ? null : idx);
                  trackEvent("FAQ Accordion", "Toggle Question", faq.q);
                }}
                className="bg-white dark:bg-[#0D121F] border border-gray-200 dark:border-zinc-800/80 rounded-2xl overflow-hidden cursor-pointer transition-all"
              >
                <div className="p-5 flex justify-between items-center text-xs font-extrabold text-gray-950 dark:text-white">
                  <span>{faq.q}</span>
                  <ChevronDown size={14} className={`transform transition-transform ${openFAQ === idx ? "rotate-180 text-emerald-500" : "text-gray-400"}`} />
                </div>
                
                {openFAQ === idx && (
                  <div className="px-5 pb-5 text-[11px] text-gray-400 leading-relaxed border-t border-gray-50 dark:border-zinc-800/60 pt-3 animate-in slide-in-from-top-1">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 14 — Final CTA */}
      <section className="py-20 relative overflow-hidden bg-[#0D121F] text-white border-b border-zinc-800/40 text-center">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 blur-3xl rounded-full" />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 relative z-10">
          <h2 className="text-3xl sm:text-6xl font-black tracking-tight leading-[1.1]">
            Your Next Best Campaign Starts Here.
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto">
            Get setup and connect ad network accounts in less than three minutes. Scale your conversions dynamically.
          </p>

          <div className="flex justify-center pt-4">
            <Link
              href="/login"
              onClick={() => handleCTA("Start Your Free 15-Day Trial - Final CTA")}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-sm px-8 py-4 rounded-2xl shadow-xl shadow-emerald-500/10 hover:shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
            >
              <Zap size={16} fill="currentColor" />
              <span>Start Your Free 15-Day Trial</span>
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-[10px] text-zinc-500 font-extrabold uppercase tracking-widest pt-2">
            <span>No Hidden Fees</span>
            <span>No Long-Term Contracts</span>
            <span>Cancel Anytime</span>
          </div>
        </div>
      </section>

      {/* SECTION 15 — Corporate Footer */}
      <footer className="bg-white dark:bg-[#070A13] border-t border-gray-100 dark:border-zinc-800/40 py-16 text-xs transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-5 gap-8">
          
          {/* Logo & Legal block */}
          <div className="col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white shadow-sm">
                <Sparkles size={16} />
              </div>
              <span className="font-black text-sm tracking-tight text-gray-900 dark:text-white">RevenuePilot</span>
            </Link>
            <p className="text-gray-400 dark:text-zinc-500 max-w-xs leading-relaxed text-[11px]">
              Unified Operating System managing campaigns, budgets, and creative assets under single secure APIs.
            </p>
            <span className="text-[10px] text-gray-400 dark:text-zinc-600 block">
              © {new Date().getFullYear()} RevenuePilot Inc. All rights reserved.
            </span>
          </div>

          {/* Links Column 1 */}
          <div className="space-y-4">
            <h4 className="font-extrabold text-[10px] text-gray-400 uppercase tracking-widest">Product</h4>
            <ul className="space-y-2 text-gray-500 font-semibold text-[11px]">
              <li><a href="#features" className="hover:text-emerald-500 transition-colors">Features</a></li>
              <li><a href="#pricing" className="hover:text-emerald-500 transition-colors">Pricing Plans</a></li>
              <li><a href="#integrations" className="hover:text-emerald-500 transition-colors">Integrations</a></li>
              <li><Link href="/dashboard" className="hover:text-emerald-500 transition-colors">Client Nexus</Link></li>
            </ul>
          </div>

          {/* Links Column 2 */}
          <div className="space-y-4">
            <h4 className="font-extrabold text-[10px] text-gray-400 uppercase tracking-widest">Resources</h4>
            <ul className="space-y-2 text-gray-500 font-semibold text-[11px]">
              <li><Link href="/docs" className="hover:text-emerald-500 transition-colors">Documentation</Link></li>
              <li><Link href="/help" className="hover:text-emerald-500 transition-colors">Help Center</Link></li>
              <li><Link href="/api-docs" className="hover:text-emerald-500 transition-colors">API Docs</Link></li>
              <li><Link href="/blog" className="hover:text-emerald-500 transition-colors">Blog Insights</Link></li>
            </ul>
          </div>

          {/* Links Column 3 */}
          <div className="space-y-4">
            <h4 className="font-extrabold text-[10px] text-gray-400 uppercase tracking-widest">Company</h4>
            <ul className="space-y-2 text-gray-500 font-semibold text-[11px]">
              <li><Link href="/about" className="hover:text-emerald-500 transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-emerald-500 transition-colors">Contact sales</Link></li>
              <li><Link href="/privacy" className="hover:text-emerald-500 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-emerald-500 transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
      </footer>

      {/* Watch Demo Modal */}
      {demoOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0D121F] border border-gray-200 dark:border-zinc-800/80 w-full max-w-2xl rounded-3xl shadow-2xl relative overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-100 dark:border-[#1C283F] flex justify-between items-center">
              <span className="font-extrabold text-xs text-gray-900 dark:text-white uppercase tracking-wider">Product Demo Video Walkthrough</span>
              <button 
                onClick={() => setDemoOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 rounded-lg hover:bg-gray-150 dark:hover:bg-[#151D2F] transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            
            {/* Mock Video Canvas */}
            <div className="aspect-video bg-zinc-950 flex flex-col items-center justify-center text-center p-8 relative">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 mb-4 animate-pulse">
                <Play size={24} fill="currentColor" />
              </div>
              <span className="text-sm font-black text-white block">Playing RevenuePilot Engine Walkthrough...</span>
              <p className="text-xs text-zinc-500 mt-1 max-w-xs leading-relaxed">
                Learn how to hook ad networks, deploy dynamic copy, run focal scans, and optimize budgets automatically in under 90 seconds.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* HEADING HUD: Live Analytics Tracker Debug Console */}
      <div className="fixed bottom-4 right-4 z-50 max-w-xs w-full">
        <div className="bg-[#090C15]/95 border border-zinc-800/80 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden flex flex-col font-mono text-[9px] text-zinc-300">
          {/* Header */}
          <div className="p-3 border-b border-zinc-800 flex justify-between items-center bg-[#070A10]">
            <div className="flex items-center gap-1.5 font-bold text-emerald-500 uppercase tracking-wider">
              <Terminal size={12} className="animate-pulse" />
              <span>Analytics HUD Console</span>
            </div>
            <button 
              onClick={() => setHudMinimized(!hudMinimized)}
              className="text-zinc-500 hover:text-zinc-300 uppercase tracking-widest text-[8px]"
            >
              {hudMinimized ? "Maximize" : "Minimize"}
            </button>
          </div>

          {!hudMinimized && (
            <div className="p-3.5 space-y-2 max-h-56 overflow-y-auto">
              <span className="text-zinc-500 font-bold block text-[8px] uppercase tracking-wider">Real-time Ingest logs:</span>
              <div className="space-y-1.5 divide-y divide-zinc-800/40">
                {analyticsEvents.length === 0 ? (
                  <span className="text-zinc-600 italic block py-2">Waiting for interaction triggers...</span>
                ) : (
                  analyticsEvents.map((evt) => (
                    <div key={evt.id} className="pt-1.5 flex gap-1.5 text-[8.5px] leading-snug">
                      <span className="text-emerald-500 shrink-0">[{evt.timestamp}]</span>
                      <div>
                        <span className="text-zinc-400 font-extrabold uppercase">[{evt.category}]</span>{" "}
                        <span className="text-zinc-200">{evt.action}:</span>{" "}
                        <span className="text-zinc-500">{evt.label}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
