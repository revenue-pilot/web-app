"use client";
import React, { useState, useEffect } from "react";
import { Settings, Globe, Bell, Sparkles, CreditCard, Key, Users, ShieldAlert, Trash2, CheckCircle2, Download, Trash, Plus, Copy, Check, EyeOff, Eye, AlertCircle } from "lucide-react";
import Link from "next/link";

interface PreferenceDetails {
  language: string;
  timezone: string;
  dateFormat: string;
  currency: string;
  theme: string;
  density: string;
  sidebarMode: string;
  emailProductUpdates: boolean;
  emailBillingAlerts: boolean;
  emailSecurityAlerts: boolean;
  emailMarketing: boolean;
  emailWeeklyReports: boolean;
  inAppActivity: boolean;
  inAppAiUpdates: boolean;
  inAppBillingEvents: boolean;
  inAppSupportUpdates: boolean;
  aiModel: string;
  aiResponseLength: string;
  aiCreativityLevel: number;
  aiDefaultLanguage: string;
}

export default function SettingsDeckPage() {
  const [activeTab, setActiveTab] = useState("general");
  
  // Settings values state
  const [prefs, setPrefs] = useState<PreferenceDetails | null>(null);
  const [loading, setLoading] = useState(true);
  
  // General feedback
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  // API Keys state
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [createdKeySecret, setCreatedKeySecret] = useState("");
  const [creatingKey, setCreatingKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  
  // Team members list
  const [team, setTeam] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("MEMBER");
  const [inviting, setInviting] = useState(false);
  
  // Deletion modals state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Plan Details (read-only billing limits)
  const [billingInfo, setBillingInfo] = useState<any>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const email = localStorage.getItem("user_email") || "arjun@Revenuepilot.com";
      
      // Fetch user profile and preferences
      const profileRes = await fetch("/api/user/profile", {
        headers: { "x-user-email": email }
      });
      const profileData = await profileRes.json();
      if (profileData) {
        setPrefs(profileData.preferences);
      }

      // Fetch API Keys
      const apiKeysRes = await fetch("/api/user/api-keys", {
        headers: { "x-user-email": email }
      });
      const apiKeysData = await apiKeysRes.json();
      setApiKeys(apiKeysData || []);

      // Fetch Team Crew Roster
      const teamRes = await fetch("/api/team", {
        headers: { "x-user-email": email }
      });
      const teamData = await teamRes.json();
      setTeam(teamData || []);

      // Fetch Billing plan info
      const billingRes = await fetch("/api/billing/subscriptions", {
        headers: { "x-user-email": email }
      });
      const billingData = await billingRes.json();
      setBillingInfo(billingData || null);

    } catch (e) {
      console.error("Failed to load settings data", e);
    } finally {
      setLoading(false);
    }
  };

  // Preference updates (Auto Save / Instant Toggle helper)
  const handlePreferenceUpdate = async (field: keyof PreferenceDetails, value: any) => {
    if (!prefs) return;
    const nextPrefs = { ...prefs, [field]: value };
    setPrefs(nextPrefs);
    setErrorMsg("");

    // If changing theme, update class stylesheet immediately
    if (field === "theme") {
      localStorage.setItem("theme", value);
      if (value === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }

    try {
      const email = localStorage.getItem("user_email") || "arjun@Revenuepilot.com";
      const res = await fetch("/api/user/preferences", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": email
        },
        body: JSON.stringify({ [field]: value })
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 1500);
      }
    } catch (err) {
      setErrorMsg("Failed to auto-save preference changes.");
    }
  };

  // API Token Operations
  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    setCreatingKey(true);
    setCreatedKeySecret("");

    try {
      const email = localStorage.getItem("user_email") || "arjun@Revenuepilot.com";
      const res = await fetch("/api/user/api-keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": email
        },
        body: JSON.stringify({ name: newKeyName })
      });
      const data = await res.json();
      if (data.success) {
        setCreatedKeySecret(data.key.token);
        setNewKeyName("");
        fetchSettings();
      }
    } catch (e) {
      console.error("Create API Key error", e);
    } finally {
      setCreatingKey(false);
    }
  };

  const handleRevokeApiKey = async (id: string) => {
    if (!confirm("Are you sure you want to revoke this API token? Any applications using this key will immediately fail to authenticate.")) return;
    try {
      const email = localStorage.getItem("user_email") || "arjun@Revenuepilot.com";
      const res = await fetch(`/api/user/api-keys/${id}`, {
        method: "DELETE",
        headers: { "x-user-email": email }
      });
      const data = await res.json();
      if (data.success) {
        fetchSettings();
      }
    } catch (e) {
      console.error("Revoke API Key error", e);
    }
  };

  const copyApiKey = () => {
    navigator.clipboard.writeText(createdKeySecret);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  // Team Invite Operations
  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);

    try {
      const email = localStorage.getItem("user_email") || "arjun@Revenuepilot.com";
      const res = await fetch("/api/team/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": email
        },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole })
      });
      const data = await res.json();
      if (data.success) {
        setInviteEmail("");
        fetchSettings();
      }
    } catch (e) {
      console.error("Invite team error", e);
    } finally {
      setInviting(false);
    }
  };

  // Export User Data
  const handleExportData = async () => {
    try {
      const email = localStorage.getItem("user_email") || "arjun@Revenuepilot.com";
      const res = await fetch("/api/user/export-data", {
        headers: { "x-user-email": email }
      });
      const data = await res.json();
      
      // Trigger browser file download of JSON dump
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Revenuepilot_export_${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error("Data export failed", e);
    }
  };

  // Delete Account Operations
  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleting(true);
    setDeleteError("");

    try {
      const email = localStorage.getItem("user_email") || "arjun@Revenuepilot.com";
      const res = await fetch("/api/user/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": email
        },
        body: JSON.stringify({ passwordConfirm: deletePassword })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.clear();
        window.location.href = "/login";
      } else {
        setDeleteError(data.message || "Password verification failed. Unable to delete account.");
      }
    } catch (e) {
      setDeleteError("Network error during deletion attempt.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading || !prefs) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const tabs = [
    { id: "general", label: "General & Localization", icon: <Globe size={16} /> },
    { id: "notifications", label: "Notification Setup", icon: <Bell size={16} /> },
    { id: "ai", label: "AI Config Deck", icon: <Sparkles size={16} /> },
    { id: "billing", label: "Billing Control", icon: <CreditCard size={16} /> },
    { id: "api", label: "API Credentials", icon: <Key size={16} /> },
    { id: "team", label: "Crew Registry", icon: <Users size={16} /> },
    { id: "privacy", label: "Privacy & Deletion", icon: <ShieldAlert size={16} className="text-red-500" /> }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 font-sans">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Settings size={24} className="text-emerald-500" />
            <span>Control Deck (Settings)</span>
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Configure platform modules, localization parameters, API keys, and workspace preferences.</p>
        </div>
        
        {saveSuccess && (
          <span className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-lg font-bold flex items-center gap-1">
            <CheckCircle2 size={12} />
            <span>Saved!</span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Navigation Sidebar */}
        <div className="bg-white border border-gray-200/80 rounded-3xl p-4 shadow-sm h-fit">
          <div className="flex flex-col space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setCreatedKeySecret("");
                }}
                className={`text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 ${
                  activeTab === tab.id
                    ? "bg-emerald-50 text-emerald-600 shadow-inner"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Configurations Panel (Takes 3 Columns) */}
        <div className="md:col-span-3 bg-white border border-gray-200/80 rounded-3xl p-6 shadow-sm min-h-[400px]">
          
          {/* TAB 1: GENERAL & LOCALIZATION */}
          {activeTab === "general" && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-gray-900">General Preferences</h3>
                <p className="text-xs text-gray-400">Configure global currency indices, time formats, language properties, and dashboard layouts.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">Language</label>
                  <select
                    value={prefs.language}
                    onChange={(e) => handlePreferenceUpdate("language", e.target.value)}
                    className="w-full bg-[#F4F6F5] border border-transparent focus:bg-white focus:border-emerald-500 text-sm rounded-xl px-3.5 py-2.5 text-gray-700 focus:outline-none transition-all font-semibold"
                  >
                    <option value="en">English (Default)</option>
                    <option value="ta">Tamil (தமிழ்)</option>
                    <option value="hi">Hindi (हिन्दी)</option>
                    <option value="de">German (Deutsch)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">Time Zone</label>
                  <select
                    value={prefs.timezone}
                    onChange={(e) => handlePreferenceUpdate("timezone", e.target.value)}
                    className="w-full bg-[#F4F6F5] border border-transparent focus:bg-white focus:border-emerald-500 text-sm rounded-xl px-3.5 py-2.5 text-gray-700 focus:outline-none transition-all font-semibold"
                  >
                    <option value="Asia/Kolkata">GMT+05:30 (Asia/Kolkata)</option>
                    <option value="UTC">GMT+00:00 (UTC)</option>
                    <option value="America/New_York">GMT-05:00 (America/New_York)</option>
                    <option value="Europe/London">GMT+00:00 (Europe/London)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">Date Format</label>
                  <select
                    value={prefs.dateFormat}
                    onChange={(e) => handlePreferenceUpdate("dateFormat", e.target.value)}
                    className="w-full bg-[#F4F6F5] border border-transparent focus:bg-white focus:border-emerald-500 text-sm rounded-xl px-3.5 py-2.5 text-gray-700 focus:outline-none transition-all font-semibold"
                  >
                    <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-06-05)</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 05/06/2026)</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 06/05/2026)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">Currency Index</label>
                  <select
                    value={prefs.currency}
                    onChange={(e) => handlePreferenceUpdate("currency", e.target.value)}
                    className="w-full bg-[#F4F6F5] border border-transparent focus:bg-white focus:border-emerald-500 text-sm rounded-xl px-3.5 py-2.5 text-gray-700 focus:outline-none transition-all font-semibold"
                  >
                    <option value="INR">INR (₹) - Indian Rupee</option>
                    <option value="USD">USD ($) - US Dollar</option>
                    <option value="GBP">GBP (£) - British Pound</option>
                    <option value="EUR">EUR (€) - Euro</option>
                  </select>
                </div>
              </div>

              {/* Theme & Appearance Config */}
              <div className="space-y-4 pt-6 border-t border-gray-100">
                <h4 className="text-sm font-bold text-gray-900">Appearance preferences</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5">Theme mode</label>
                    <select
                      value={prefs.theme}
                      onChange={(e) => handlePreferenceUpdate("theme", e.target.value)}
                      className="w-full bg-[#F4F6F5] border border-transparent focus:bg-white focus:border-emerald-500 text-sm rounded-xl px-3.5 py-2.5 text-gray-700 focus:outline-none transition-all font-semibold"
                    >
                      <option value="light">Light Mode</option>
                      <option value="dark">Dark Mode</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5">Dashboard Density</label>
                    <select
                      value={prefs.density}
                      onChange={(e) => handlePreferenceUpdate("density", e.target.value)}
                      className="w-full bg-[#F4F6F5] border border-transparent focus:bg-white focus:border-emerald-500 text-sm rounded-xl px-3.5 py-2.5 text-gray-700 focus:outline-none transition-all font-semibold"
                    >
                      <option value="comfortable">Comfortable Layout</option>
                      <option value="compact">Compact Layout</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5">Sidebar mode</label>
                    <select
                      value={prefs.sidebarMode}
                      onChange={(e) => handlePreferenceUpdate("sidebarMode", e.target.value)}
                      className="w-full bg-[#F4F6F5] border border-transparent focus:bg-white focus:border-emerald-500 text-sm rounded-xl px-3.5 py-2.5 text-gray-700 focus:outline-none transition-all font-semibold"
                    >
                      <option value="expanded">Expanded Mode</option>
                      <option value="collapsed">Collapsed Mode</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: NOTIFICATIONS */}
          {activeTab === "notifications" && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-gray-900">Notification Channels</h3>
                <p className="text-xs text-gray-400">Toggle alerting flags on email updates, campaign logs, billing, and support responses.</p>
              </div>

              <div className="space-y-4 pt-2">
                
                {/* Email Toggles */}
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold uppercase text-gray-400 tracking-wider">Email Channels</h4>
                  
                  <div className="space-y-2.5">
                    <label className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-2xl cursor-pointer">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-gray-800">Product updates</span>
                        <p className="text-[10px] text-gray-400 font-medium">New features, optimization updates, and general newsletters.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={prefs.emailProductUpdates}
                        onChange={(e) => handlePreferenceUpdate("emailProductUpdates", e.target.checked)}
                        className="w-4 h-4 text-emerald-500 border-gray-300 rounded focus:ring-emerald-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-2xl cursor-pointer">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-gray-800">Billing Alerts</span>
                        <p className="text-[10px] text-gray-400 font-medium">Subscription renewals, transaction notifications, and Razorpay receipts.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={prefs.emailBillingAlerts}
                        onChange={(e) => handlePreferenceUpdate("emailBillingAlerts", e.target.checked)}
                        className="w-4 h-4 text-emerald-500 border-gray-300 rounded focus:ring-emerald-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-2xl cursor-pointer">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-gray-800">Security Alerts</span>
                        <p className="text-[10px] text-gray-400 font-medium">Login alerts from unknown devices, password updates, and 2FA changes.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={prefs.emailSecurityAlerts}
                        onChange={(e) => handlePreferenceUpdate("emailSecurityAlerts", e.target.checked)}
                        className="w-4 h-4 text-emerald-500 border-gray-300 rounded focus:ring-emerald-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-2xl cursor-pointer">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-gray-800">Weekly Performance Reports</span>
                        <p className="text-[10px] text-gray-400 font-medium">Summarized campaign analytics, ROAS statistics, and AI recommendations digests.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={prefs.emailWeeklyReports}
                        onChange={(e) => handlePreferenceUpdate("emailWeeklyReports", e.target.checked)}
                        className="w-4 h-4 text-emerald-500 border-gray-300 rounded focus:ring-emerald-500"
                      />
                    </label>
                  </div>
                </div>

                {/* In-App Toggles */}
                <div className="space-y-3 pt-4 border-t border-gray-100">
                  <h4 className="text-xs font-extrabold uppercase text-gray-400 tracking-wider">In-App Vault Toggles</h4>

                  <div className="space-y-2.5">
                    <label className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-2xl cursor-pointer">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-gray-800">New Activity Alerts</span>
                        <p className="text-[10px] text-gray-400 font-medium">Notify when team members launch campaigns or add clients.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={prefs.inAppActivity}
                        onChange={(e) => handlePreferenceUpdate("inAppActivity", e.target.checked)}
                        className="w-4 h-4 text-emerald-500 border-gray-300 rounded focus:ring-emerald-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-2xl cursor-pointer">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-gray-800">AI Processing Updates</span>
                        <p className="text-[10px] text-gray-400 font-medium">Alert when crop ratio generations or ad copies finish loading.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={prefs.inAppAiUpdates}
                        onChange={(e) => handlePreferenceUpdate("inAppAiUpdates", e.target.checked)}
                        className="w-4 h-4 text-emerald-500 border-gray-300 rounded focus:ring-emerald-500"
                      />
                    </label>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: AI CONFIG DECK */}
          {activeTab === "ai" && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-gray-900">AI Configuration preferences</h3>
                <p className="text-xs text-gray-400">Configure parameters directing the AI recommendations engines and crop generation models.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">Preferred LLM Model</label>
                  <select
                    value={prefs.aiModel}
                    onChange={(e) => handlePreferenceUpdate("aiModel", e.target.value)}
                    className="w-full bg-[#F4F6F5] border border-transparent focus:bg-white focus:border-emerald-500 text-sm rounded-xl px-3.5 py-2.5 text-gray-700 focus:outline-none transition-all font-semibold"
                  >
                    <option value="gpt-4o">GPT-4o (Recommended)</option>
                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">Default Generation Language</label>
                  <select
                    value={prefs.aiDefaultLanguage}
                    onChange={(e) => handlePreferenceUpdate("aiDefaultLanguage", e.target.value)}
                    className="w-full bg-[#F4F6F5] border border-transparent focus:bg-white focus:border-emerald-500 text-sm rounded-xl px-3.5 py-2.5 text-gray-700 focus:outline-none transition-all font-semibold"
                  >
                    <option value="en">English (Default)</option>
                    <option value="ta">Tamil (தமிழ்)</option>
                    <option value="hi">Hindi (हिन्दी)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">Response Verbosity (Length)</label>
                  <select
                    value={prefs.aiResponseLength}
                    onChange={(e) => handlePreferenceUpdate("aiResponseLength", e.target.value)}
                    className="w-full bg-[#F4F6F5] border border-transparent focus:bg-white focus:border-emerald-500 text-sm rounded-xl px-3.5 py-2.5 text-gray-700 focus:outline-none transition-all font-semibold"
                  >
                    <option value="short">Short (Bullet Points)</option>
                    <option value="medium">Medium (Standard Paragraphs)</option>
                    <option value="long">Long (Detailed Reports)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-gray-500">
                    <span>Creativity Level (Temperature)</span>
                    <span className="font-mono">{prefs.aiCreativityLevel}</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.1"
                    value={prefs.aiCreativityLevel}
                    onChange={(e) => handlePreferenceUpdate("aiCreativityLevel", parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 font-bold">
                    <span>Strict Logic</span>
                    <span>More Creative</span>
                  </div>
                </div>
              </div>

              {/* Usage Credits Tracker */}
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl space-y-3">
                <div className="flex justify-between text-xs font-bold text-emerald-800">
                  <span>Monthly AI Credit Usage</span>
                  <span>420 / 1000 Credits</span>
                </div>
                <div className="w-full h-2 bg-emerald-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: "42%" }}></div>
                </div>
                <p className="text-[10px] text-emerald-600 font-semibold leading-relaxed">
                  Usage resets on July 19, 2026. Upgrade your plan at any time to double your total monthly credits allocation.
                </p>
              </div>

            </div>
          )}

          {/* TAB 4: BILLING CONTROL */}
          {activeTab === "billing" && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-gray-900">Billing & Subscription Details</h3>
                <p className="text-xs text-gray-400">View renewal structures, manage invoices, download logs, and adjust active plan tiers.</p>
              </div>

              {billingInfo && (
                <div className="bg-[#F4F6F5] border border-gray-200 rounded-2xl p-5 space-y-4">
                  <div className="flex justify-between items-start flex-col sm:flex-row gap-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full capitalize">
                        {billingInfo.plan} Plan
                      </span>
                      <h4 className="text-xl font-bold mt-2 text-gray-900">
                        {billingInfo.plan === "starter" ? "₹999" : billingInfo.plan === "Revenue" ? "₹1,999" : billingInfo.plan === "pro" ? "₹4,999" : "Custom Pricing"}
                        <span className="text-xs text-gray-400 font-normal"> / month</span>
                      </h4>
                      <p className="text-[10px] text-gray-400 font-semibold mt-1">Next Renewal Date: July 19, 2026 via Razorpay Automatic Transfer</p>
                    </div>
                    <Link
                      href="/dashboard/billing"
                      className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-emerald-500/10 transition-colors shrink-0"
                    >
                      Manage Plan / Upgrade
                    </Link>
                  </div>
                  
                  {/* Plan Features Cap Matrix */}
                  <div className="pt-4 border-t border-gray-200/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <p className="text-gray-400 font-bold">Active Campaigns</p>
                      <p className="font-extrabold text-gray-800 mt-0.5">3 / {billingInfo.plan === "starter" ? 3 : billingInfo.plan === "Revenue" ? 15 : "Unlimited"}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 font-bold">Crew Seats</p>
                      <p className="font-extrabold text-gray-800 mt-0.5">2 / {billingInfo.plan === "starter" ? 1 : billingInfo.plan === "Revenue" ? 3 : "Unlimited"}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 font-bold">Orbit Workspaces</p>
                      <p className="font-extrabold text-gray-800 mt-0.5">1 / {billingInfo.plan === "starter" ? 1 : billingInfo.plan === "Revenue" ? 3 : "Unlimited"}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 font-bold">Storage Cap</p>
                      <p className="font-extrabold text-gray-800 mt-0.5">1.2GB / {billingInfo.plan === "starter" ? "5GB" : billingInfo.plan === "Revenue" ? "50GB" : "Unlimited"}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Invoices List */}
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <h4 className="text-xs font-bold text-gray-900">Recent Invoices</h4>
                
                <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold">
                        <th className="p-3">Invoice ID</th>
                        <th className="p-3">Amount Paid</th>
                        <th className="p-3">Billing Date</th>
                        <th className="p-3">Method</th>
                        <th className="p-3 text-right">Download</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-700">
                      {billingInfo && billingInfo.invoices && billingInfo.invoices.length > 0 ? (
                        billingInfo.invoices.map((inv: any) => (
                          <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="p-3 font-semibold text-gray-800">{inv.id}</td>
                            <td className="p-3 font-extrabold">₹{inv.amount}</td>
                            <td className="p-3 text-gray-400 font-medium">{inv.date}</td>
                            <td className="p-3 font-semibold">{inv.method}</td>
                            <td className="p-3 text-right">
                              <a
                                href="#"
                                onClick={(e) => { e.preventDefault(); alert(`Downloading Invoice PDF: ${inv.id}`); }}
                                className="text-emerald-500 hover:text-emerald-600 font-bold flex items-center justify-end gap-1"
                              >
                                <Download size={14} />
                                <span>PDF</span>
                              </a>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-gray-400 font-semibold">No transactions available yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: API KEYS */}
          {activeTab === "api" && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-gray-900">API Access keys</h3>
                <p className="text-xs text-gray-400">Generate authorization tokens to securely hook external reporting services and workflows.</p>
              </div>

              {/* API Key Form */}
              <form onSubmit={handleCreateApiKey} className="pt-2 flex gap-3 max-w-md">
                <input
                  type="text"
                  required
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g. LeadSync Integration Key"
                  className="flex-1 bg-[#F4F6F5] border border-transparent focus:bg-white focus:border-emerald-500 text-xs rounded-xl px-3.5 py-2.5 text-gray-700 focus:outline-none transition-all font-semibold"
                />
                <button
                  type="submit"
                  disabled={creatingKey || !newKeyName.trim()}
                  className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-200 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-emerald-500/10 transition-all flex items-center gap-1.5 shrink-0"
                >
                  <Plus size={14} />
                  <span>{creatingKey ? "Creating..." : "Create Key"}</span>
                </button>
              </form>

              {/* Renders New Key Secret ONCE */}
              {createdKeySecret && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 space-y-3 max-w-lg animate-scale-up">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-emerald-800">Copy your API token secret:</span>
                    <button
                      onClick={copyApiKey}
                      className="bg-white hover:bg-zinc-50 border border-emerald-200 text-emerald-600 font-bold text-xs px-3 py-1.5 rounded-xl transition-all flex items-center gap-1"
                    >
                      {copiedKey ? <Check size={12} /> : <Copy size={12} />}
                      <span>{copiedKey ? "Copied!" : "Copy Token"}</span>
                    </button>
                  </div>
                  <div className="bg-white border border-emerald-100 rounded-xl px-3 py-2 text-xs font-mono font-bold text-gray-700 break-all select-all">
                    {createdKeySecret}
                  </div>
                  <p className="text-[10px] text-red-500 font-extrabold flex items-center gap-1">
                    <ShieldAlert size={12} />
                    <span>Warning: For safety, this secret token will never be displayed again after you leave this tab.</span>
                  </p>
                </div>
              )}

              {/* Tokens Table */}
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <h4 className="text-xs font-bold text-gray-900">Active Access Tokens</h4>
                
                <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold">
                        <th className="p-3">Token Nickname</th>
                        <th className="p-3">Secret Key Value</th>
                        <th className="p-3">Created Date</th>
                        <th className="p-3 text-right">Revoke</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-700">
                      {apiKeys.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-gray-400 font-semibold">No API tokens generated yet.</td>
                        </tr>
                      ) : (
                        apiKeys.map((key) => (
                          <tr key={key.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="p-3 font-semibold text-gray-800">{key.name}</td>
                            <td className="p-3 font-mono text-gray-400 font-semibold">{key.token}</td>
                            <td className="p-3 text-gray-400 font-medium">{new Date(key.createdAt).toLocaleDateString()}</td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => handleRevokeApiKey(key.id)}
                                className="text-red-500 hover:text-red-600 font-bold flex items-center justify-end gap-1.5 ml-auto"
                              >
                                <Trash size={14} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: TEAM REGISTRY */}
          {activeTab === "team" && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-gray-900">Crew Registry (Team Access)</h3>
                <p className="text-xs text-gray-400">Invite agency administrators or managers, and assign RBAC role permissions.</p>
              </div>

              {/* Invite Form */}
              <form onSubmit={handleInviteMember} className="pt-2 flex gap-3 flex-col sm:flex-row max-w-xl">
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="collaborator@agency.com"
                  className="flex-1 bg-[#F4F6F5] border border-transparent focus:bg-white focus:border-emerald-500 text-xs rounded-xl px-3.5 py-2.5 text-gray-700 focus:outline-none transition-all font-semibold"
                />
                
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="bg-[#F4F6F5] border border-transparent focus:bg-white focus:border-emerald-500 text-xs rounded-xl px-3.5 py-2.5 text-gray-700 focus:outline-none transition-all font-semibold w-32"
                >
                  <option value="ADMIN">Admin</option>
                  <option value="MANAGER">Manager</option>
                  <option value="MEMBER">Member</option>
                </select>

                <button
                  type="submit"
                  disabled={inviting || !inviteEmail.trim()}
                  className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-200 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-emerald-500/10 transition-all flex items-center gap-1.5 shrink-0"
                >
                  <Plus size={14} />
                  <span>{inviting ? "Inviting..." : "Send Invite"}</span>
                </button>
              </form>

              {/* Crew Table */}
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <h4 className="text-xs font-bold text-gray-900">Team Roster</h4>
                
                <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold">
                        <th className="p-3">Email Address</th>
                        <th className="p-3">Role</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-700">
                      {team.map((member) => (
                        <tr key={member.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="p-3 font-semibold text-gray-800">{member.email}</td>
                          <td className="p-3">
                            <span className="font-extrabold uppercase tracking-wide text-[9px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md border border-gray-200/50">
                              {member.role}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="text-emerald-500 font-bold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                              <span>{member.status || "Active"}</span>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: PRIVACY & DELETION */}
          {activeTab === "privacy" && (
            <div className="space-y-8">
              
              {/* GDPR Data Export */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-gray-900">GDPR Compliance & Data Export</h3>
                  <p className="text-xs text-gray-400">Download a full records backup of your personal credentials, workspace logs, and configuration matrices in standard JSON format.</p>
                </div>
                
                <button
                  onClick={handleExportData}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-100 font-bold text-xs px-5 py-2.5 rounded-xl transition-all flex items-center gap-1.5"
                >
                  <Download size={14} />
                  <span>Download Account Backup (JSON)</span>
                </button>
              </div>

              {/* Danger Zone */}
              <div className="pt-8 border-t border-red-100 space-y-4">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-red-600 flex items-center gap-2">
                    <ShieldAlert size={18} />
                    <span>Danger Zone</span>
                  </h3>
                  <p className="text-xs text-gray-400">These actions are permanent. Terminating or deleting your account removes all workspaces, ad connections, and data assets instantly.</p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      if (confirm("Are you sure you want to deactivate your workspace? You will be signed out, but your configurations will be preserved for recovery.")) {
                        alert("Account deactivated. Signing out.");
                        localStorage.clear();
                        window.location.href = "/login";
                      }
                    }}
                    className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs px-5 py-2.5 rounded-xl transition-all"
                  >
                    Deactivate Workspace
                  </button>
                  
                  <button
                    onClick={() => {
                      setDeleteConfirmOpen(true);
                      setDeletePassword("");
                      setDeleteError("");
                    }}
                    className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 font-bold text-xs px-5 py-2.5 rounded-xl transition-all flex items-center gap-1.5"
                  >
                    <Trash2 size={14} />
                    <span>Delete Account Permanently</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Delete Account Modal Dialog Overlay */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6 animate-scale-up text-left">
            <div className="flex gap-3 items-center text-red-600">
              <ShieldAlert size={24} />
              <h3 className="text-lg font-bold">Delete Account & Tenant</h3>
            </div>
            
            <p className="text-xs text-gray-500 font-medium leading-relaxed">
              This action is <strong className="text-red-600">irreversible</strong>. By verifying your credentials, you will permanently purge your login profile, organization memberships, workflows, campaigns history, and API configurations.
            </p>

            {deleteError && (
              <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl p-3 text-xs font-semibold flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{deleteError}</span>
              </div>
            )}

            <form onSubmit={handleDeleteAccount} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Verify Password</label>
                <input
                  type="password"
                  required
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Enter password to confirm deletion"
                  className="w-full bg-[#F4F6F5] border border-transparent focus:bg-white focus:border-red-500 text-xs rounded-xl px-3.5 py-2.5 text-gray-700 focus:outline-none transition-all font-semibold"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmOpen(false)}
                  className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deleting || !deletePassword}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex-1 flex items-center justify-center gap-1"
                >
                  <Trash2 size={14} />
                  <span>{deleting ? "Deleting Account..." : "Confirm Purge"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
