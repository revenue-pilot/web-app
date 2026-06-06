"use client";
import React, { useState, useEffect } from "react";
import { User, Shield, KeyRound, Monitor, AlertCircle, CheckCircle2, ShieldCheck, Copy, Check, Upload, Trash2, Key } from "lucide-react";

interface ProfileDetails {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  phone: string;
  jobTitle: string;
  websiteUrl: string;
  country: string;
  timezone: string;
  avatarUrl: string;
  twoFactorEnabled: boolean;
  twoFactorRecoveryCodes: string;
  createdAt: string;
  plan: string;
  loginHistory: any[];
  organizationId: string;
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [profile, setProfile] = useState<ProfileDetails | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  
  // Profile Update Fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [country, setCountry] = useState("India");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [displayName, setDisplayName] = useState("");
  
  // Feedback alerts
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdStrength, setPwdStrength] = useState({ pct: 0, text: "Weak", color: "bg-red-500" });
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  // 2FA variables
  const [twoFaLoading, setTwoFaLoading] = useState(false);
  const [twoFaSecret, setTwoFaSecret] = useState("");
  const [twoFaQrUrl, setTwoFaQrUrl] = useState("");
  const [twoFaSetupActive, setTwoFaSetupActive] = useState(false);
  const [twoFaCode, setTwoFaCode] = useState("");
  const [twoFaSuccessCodes, setTwoFaSuccessCodes] = useState<string[]>([]);
  const [twoFaError, setTwoFaError] = useState("");
  const [copiedCodes, setCopiedCodes] = useState(false);

  // Session termination
  const [terminatingSessions, setTerminatingSessions] = useState(false);
  const [sessionSuccess, setSessionSuccess] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const email = localStorage.getItem("user_email") || "arjun@Revenuepilot.com";
      const res = await fetch("/api/user/profile", {
        headers: { "x-user-email": email }
      });
      const data = await res.json();
      if (data) {
        setProfile(data);
        setFirstName(data.firstName || "");
        setLastName(data.lastName || "");
        setPhone(data.phone || "");
        setJobTitle(data.jobTitle || "");
        setWebsiteUrl(data.websiteUrl || "");
        setCountry(data.country || "India");
        setTimezone(data.timezone || "Asia/Kolkata");
        setDisplayName(data.name || "");
      }
    } catch (e) {
      console.error("Failed to load user profile", e);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError("");
    setSaveSuccess(false);

    try {
      const email = localStorage.getItem("user_email") || "arjun@Revenuepilot.com";
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": email
        },
        body: JSON.stringify({
          firstName,
          lastName,
          phone,
          jobTitle,
          websiteUrl,
          country,
          timezone,
          name: displayName
        })
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        if (profile) {
          setProfile({
            ...profile,
            firstName,
            lastName,
            phone,
            jobTitle,
            websiteUrl,
            country,
            timezone,
            name: displayName
          });
        }
        localStorage.setItem("user_email", email);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setSaveError(data.message || "Failed to update profile changes.");
      }
    } catch (e) {
      setSaveError("Failed to update profile due to network errors.");
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    // Simulate image cropping/compression and base64 upload
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        const email = localStorage.getItem("user_email") || "arjun@Revenuepilot.com";
        const res = await fetch("/api/user/profile/avatar", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-email": email
          },
          body: JSON.stringify({ avatarUrl: base64 })
        });
        const data = await res.json();
        if (data.success) {
          if (profile) setProfile({ ...profile, avatarUrl: data.avatarUrl });
          fetchProfile();
        }
      } catch (err) {
        console.error("Avatar upload failed", err);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = async () => {
    try {
      const email = localStorage.getItem("user_email") || "arjun@Revenuepilot.com";
      const res = await fetch("/api/user/profile/avatar", {
        method: "DELETE",
        headers: { "x-user-email": email }
      });
      const data = await res.json();
      if (data.success) {
        if (profile) setProfile({ ...profile, avatarUrl: data.avatarUrl });
        fetchProfile();
      }
    } catch (err) {
      console.error("Avatar remove failed", err);
    }
  };

  const checkPasswordStrength = (pwd: string) => {
    setNewPassword(pwd);
    if (!pwd) {
      setPwdStrength({ pct: 0, text: "Weak", color: "bg-red-500" });
      return;
    }
    let score = 0;
    if (pwd.length >= 8) score += 25;
    if (/[A-Z]/.test(pwd)) score += 25;
    if (/[a-z]/.test(pwd)) score += 25;
    if (/[0-9]/.test(pwd)) score += 25;

    let text = "Weak";
    let color = "bg-red-500";
    if (score >= 100) {
      text = "Excellent";
      color = "bg-emerald-500";
    } else if (score >= 75) {
      text = "Strong";
      color = "bg-teal-500";
    } else if (score >= 50) {
      text = "Medium";
      color = "bg-amber-500";
    }
    setPwdStrength({ pct: score, text, color });
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError("Confirm password does not match new password.");
      return;
    }
    if (pwdStrength.pct < 75) {
      setPasswordError("Your new password does not meet security strength guidelines.");
      return;
    }

    setPasswordSaving(true);
    try {
      const email = localStorage.getItem("user_email") || "arjun@Revenuepilot.com";
      const res = await fetch("/api/user/profile/password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": email
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (data.success) {
        setPasswordSuccess(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setPwdStrength({ pct: 0, text: "Weak", color: "bg-red-500" });
      } else {
        setPasswordError(data.message || "Failed to update your credentials.");
      }
    } catch (err) {
      setPasswordError("Password change failed due to network errors.");
    } finally {
      setPasswordSaving(false);
    }
  };

  const start2FaSetup = async () => {
    setTwoFaLoading(true);
    setTwoFaError("");
    try {
      const email = localStorage.getItem("user_email") || "arjun@Revenuepilot.com";
      const res = await fetch("/api/user/profile/2fa/setup", {
        method: "POST",
        headers: { "x-user-email": email }
      });
      const data = await res.json();
      if (data.success) {
        setTwoFaSecret(data.secret);
        setTwoFaQrUrl(data.qrCode);
        setTwoFaSetupActive(true);
      }
    } catch (e) {
      setTwoFaError("Failed to initiate authenticator setup.");
    } finally {
      setTwoFaLoading(false);
    }
  };

  const handleVerify2Fa = async (e: React.FormEvent) => {
    e.preventDefault();
    setTwoFaLoading(true);
    setTwoFaError("");
    try {
      const email = localStorage.getItem("user_email") || "arjun@Revenuepilot.com";
      const res = await fetch("/api/user/profile/2fa/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": email
        },
        body: JSON.stringify({ code: twoFaCode, secret: twoFaSecret })
      });
      const data = await res.json();
      if (data.success) {
        setTwoFaSuccessCodes(data.recoveryCodes);
        setTwoFaSetupActive(false);
        setTwoFaCode("");
        if (profile) setProfile({ ...profile, twoFactorEnabled: true });
      } else {
        setTwoFaError(data.message || "Invalid 2FA authorization token. Please check and try again.");
      }
    } catch (err) {
      setTwoFaError("Verification failed due to network issues.");
    } finally {
      setTwoFaLoading(false);
    }
  };

  const handleDisable2Fa = async () => {
    if (!confirm("Are you sure you want to turn off Two-Factor Authentication? Your account will be less secure.")) return;
    setTwoFaLoading(true);
    try {
      const email = localStorage.getItem("user_email") || "arjun@Revenuepilot.com";
      const res = await fetch("/api/user/profile/2fa/disable", {
        method: "POST",
        headers: { "x-user-email": email }
      });
      const data = await res.json();
      if (data.success) {
        if (profile) setProfile({ ...profile, twoFactorEnabled: false });
        setTwoFaSuccessCodes([]);
      }
    } catch (e) {
      console.error("Disable 2FA failed", e);
    } finally {
      setTwoFaLoading(false);
    }
  };

  const copyRecoveryCodes = () => {
    navigator.clipboard.writeText(twoFaSuccessCodes.join("\n"));
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2000);
  };

  const handleTerminateOtherSessions = async () => {
    setTerminatingSessions(true);
    setSessionSuccess(false);
    try {
      const email = localStorage.getItem("user_email") || "arjun@Revenuepilot.com";
      const res = await fetch("/api/user/login-history/terminate", {
        method: "POST",
        headers: { "x-user-email": email }
      });
      const data = await res.json();
      if (data.success) {
        setSessionSuccess(true);
        fetchProfile();
        setTimeout(() => setSessionSuccess(false), 3000);
      }
    } catch (e) {
      console.error("Terminate other sessions failed", e);
    } finally {
      setTerminatingSessions(false);
    }
  };

  if (loadingProfile || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const tabs = [
    { id: "profile", label: "My Profile", icon: <User size={16} /> },
    { id: "security", label: "Security & Credentials", icon: <Shield size={16} /> },
    { id: "sessions", label: "Session Control", icon: <Monitor size={16} /> }
  ];

    const getDisplayName = (email: string) => {
    const localPart = email.split("@")[0];
    return localPart.charAt(0).toUpperCase() + localPart.slice(1);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 font-sans">
      
      {/* Header Widget */}
      <div className="bg-white dark:bg-[#0D121F] border border-gray-200/80 dark:border-[#1B2438] rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5 flex-col md:flex-row text-center md:text-left">
          <div className="relative group">
          
            <div className="flex items-center justify-center w-20 h-20 rounded-full object-cover border-2 border-emerald-500 shadow-lg">
                <h1 style={{"fontSize":"2rem"}}>{getDisplayName(profile.email).charAt(0)}</h1>
              </div>
            <label className="absolute bottom-0 right-0 w-7 h-7 bg-emerald-500 hover:bg-emerald-600 rounded-full flex items-center justify-center text-white cursor-pointer shadow-md shadow-emerald-500/10">
              <Upload size={14} />
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </label>
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center justify-center md:justify-start gap-2">
              <span>{profile.name || `${profile.firstName} ${profile.lastName}`}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 px-2 py-0.5 rounded-md capitalize">
                {profile.plan} Plan
              </span>
            </h2>
            <p className="text-xs text-gray-400 font-semibold">{profile.email} • {profile.jobTitle || "Workspace Member"}</p>
            <p className="text-[10px] text-gray-400 font-semibold">Registered: {new Date(profile.createdAt).toLocaleDateString()} • Account: Active</p>
          </div>
        </div>

        <div className="flex gap-2">
          {profile.avatarUrl && (
            <button
              onClick={handleRemovePhoto}
              className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 dark:bg-red-500/10 dark:border-red-500/20 font-bold text-xs px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Trash2 size={14} />
              <span>Remove Photo</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200/80 dark:border-[#1B2438] gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-xs font-bold transition-all flex items-center gap-2 border-b-2 -mb-[2px] ${
              activeTab === tab.id
                ? "border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold"
                : "border-transparent text-gray-400 dark:text-zinc-500 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content Panels */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Main Form Fields (Takes 3 columns) */}
        <div className="md:col-span-3 bg-white dark:bg-[#0D121F] border border-gray-200/80 dark:border-[#1B2438] rounded-3xl p-6 shadow-sm">
          
          {/* TAB 1: PROFILE INFORMATION */}
          {activeTab === "profile" && (
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Personal Information</h3>
                <p className="text-xs text-gray-400">Manage your profile identities, contact parameters, and local parameters.</p>
              </div>

              {saveSuccess && (
                <div className="bg-emerald-50 border border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl p-3 text-xs font-semibold flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 size={16} />
                  <span>Profile changes updated successfully.</span>
                </div>
              )}

              {saveError && (
                <div className="bg-red-50 border border-red-100 dark:bg-red-500/10 dark:border-red-500/20 text-red-600 dark:text-red-400 rounded-xl p-3 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span>{saveError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-[#F4F6F5] dark:bg-[#0A0F1D] border border-transparent focus:bg-white dark:focus:bg-[#0D121F] focus:border-emerald-500 text-sm rounded-xl px-3.5 py-2.5 text-gray-700 dark:text-zinc-100 focus:outline-none transition-all font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-[#F4F6F5] dark:bg-[#0A0F1D] border border-transparent focus:bg-white dark:focus:bg-[#0D121F] focus:border-emerald-500 text-sm rounded-xl px-3.5 py-2.5 text-gray-700 dark:text-zinc-100 focus:outline-none transition-all font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">Display Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Arjun M."
                    className="w-full bg-[#F4F6F5] dark:bg-[#0A0F1D] border border-transparent focus:bg-white dark:focus:bg-[#0D121F] focus:border-emerald-500 text-sm rounded-xl px-3.5 py-2.5 text-gray-700 dark:text-zinc-100 focus:outline-none transition-all font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    disabled
                    value={profile.email}
                    className="w-full bg-gray-100 dark:bg-zinc-800/50 border border-gray-200 dark:border-transparent text-sm rounded-xl px-3.5 py-2.5 text-gray-400 dark:text-zinc-500 cursor-not-allowed font-semibold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full bg-[#F4F6F5] dark:bg-[#0A0F1D] border border-transparent focus:bg-white dark:focus:bg-[#0D121F] focus:border-emerald-500 text-sm rounded-xl px-3.5 py-2.5 text-gray-700 dark:text-zinc-100 focus:outline-none transition-all font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">Job Title</label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g. Media Buying Director"
                    className="w-full bg-[#F4F6F5] dark:bg-[#0A0F1D] border border-transparent focus:bg-white dark:focus:bg-[#0D121F] focus:border-emerald-500 text-sm rounded-xl px-3.5 py-2.5 text-gray-700 dark:text-zinc-100 focus:outline-none transition-all font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">Website URL</label>
                  <input
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://company.com"
                    className="w-full bg-[#F4F6F5] dark:bg-[#0A0F1D] border border-transparent focus:bg-white dark:focus:bg-[#0D121F] focus:border-emerald-500 text-sm rounded-xl px-3.5 py-2.5 text-gray-700 dark:text-zinc-100 focus:outline-none transition-all font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">Country</label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full bg-[#F4F6F5] dark:bg-[#0A0F1D] border border-transparent focus:bg-white dark:focus:bg-[#0D121F] focus:border-emerald-500 text-sm rounded-xl px-3.5 py-2.5 text-gray-700 dark:text-zinc-100 focus:outline-none transition-all font-semibold"
                  >
                    <option value="India">India</option>
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Singapore">Singapore</option>
                    <option value="United Arab Emirates">United Arab Emirates</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">Time Zone</label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full bg-[#F4F6F5] dark:bg-[#0A0F1D] border border-transparent focus:bg-white dark:focus:bg-[#0D121F] focus:border-emerald-500 text-sm rounded-xl px-3.5 py-2.5 text-gray-700 dark:text-zinc-100 focus:outline-none transition-all font-semibold"
                  >
                    <option value="Asia/Kolkata">GMT+05:30 (Asia/Kolkata)</option>
                    <option value="UTC">GMT+00:00 (UTC)</option>
                    <option value="America/New_York">GMT-05:00 (America/New_York)</option>
                    <option value="Europe/London">GMT+00:00 (Europe/London)</option>
                    <option value="Asia/Singapore">GMT+08:00 (Asia/Singapore)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 dark:border-[#1B2438]">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md shadow-emerald-500/10 transition-colors"
                >
                  {saving ? "Saving Changes..." : "Save Changes"}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: CREDENTIALS & SECURITY */}
          {activeTab === "security" && (
            <div className="space-y-8">
              
              {/* CHANGE PASSWORD */}
              <form onSubmit={handleChangePassword} className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <KeyRound size={18} className="text-emerald-500" />
                    <span>Change Credentials Password</span>
                  </h3>
                  <p className="text-xs text-gray-400">Regularly update your password to secure campaign structures and assets vaults.</p>
                </div>

                {passwordSuccess && (
                  <div className="bg-emerald-50 border border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl p-3 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 size={16} />
                    <span>Account credentials updated successfully.</span>
                  </div>
                )}

                {passwordError && (
                  <div className="bg-red-50 border border-red-100 dark:bg-red-500/10 dark:border-red-500/20 text-red-600 dark:text-red-400 rounded-xl p-3 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle size={16} />
                    <span>{passwordError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5">Current Password</label>
                    <input
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#F4F6F5] dark:bg-[#0A0F1D] border border-transparent focus:bg-white dark:focus:bg-[#0D121F] focus:border-emerald-500 text-sm rounded-xl px-3.5 py-2.5 text-gray-700 dark:text-zinc-100 focus:outline-none transition-all font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5">New Password</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => checkPasswordStrength(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#F4F6F5] dark:bg-[#0A0F1D] border border-transparent focus:bg-white dark:focus:bg-[#0D121F] focus:border-emerald-500 text-sm rounded-xl px-3.5 py-2.5 text-gray-700 dark:text-zinc-100 focus:outline-none transition-all font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5">Confirm Password</label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#F4F6F5] dark:bg-[#0A0F1D] border border-transparent focus:bg-white dark:focus:bg-[#0D121F] focus:border-emerald-500 text-sm rounded-xl px-3.5 py-2.5 text-gray-700 dark:text-zinc-100 focus:outline-none transition-all font-semibold"
                    />
                  </div>
                </div>

                {/* Password Strength Meter */}
                {newPassword && (
                  <div className="space-y-1.5 max-w-sm">
                    <div className="flex justify-between text-[10px] font-bold text-gray-400">
                      <span>Password Security Strength:</span>
                      <span className="font-extrabold uppercase tracking-wide">{pwdStrength.text}</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-300 ${pwdStrength.color}`} style={{ width: `${pwdStrength.pct}%` }} />
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-[#1B2438]">
                  <button
                    type="submit"
                    disabled={passwordSaving || !currentPassword || !newPassword || !confirmPassword}
                    className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md shadow-emerald-500/10 transition-colors"
                  >
                    {passwordSaving ? "Updating Password..." : "Update Password"}
                  </button>
                </div>
              </form>

              {/* TWO FACTOR AUTHENTICATION */}
              <div className="space-y-6 pt-8 border-t border-gray-100 dark:border-[#1B2438]">
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <ShieldCheck size={18} className="text-emerald-500" />
                    <span>Two-Factor Authentication (2FA)</span>
                  </h3>
                  <p className="text-xs text-gray-400">Enforce secondary authenticator validation code challenges upon sign in attempts.</p>
                </div>

                {twoFaError && (
                  <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl p-3 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle size={16} />
                    <span>{twoFaError}</span>
                  </div>
                )}

                {/* Authenticator setup wizard */}
                {twoFaSetupActive && (
                  <div className="bg-gray-50 dark:bg-[#0A0F1D] border border-gray-200/80 dark:border-[#1B2438] rounded-2xl p-5 max-w-lg space-y-4 animate-fade-in">
                    <p className="text-xs text-gray-500 font-semibold leading-relaxed">
                      Scan this QR code with Google Authenticator or Microsoft Authenticator, then enter the generated 6-digit confirmation code.
                    </p>
                    <div className="flex gap-5 items-center flex-col sm:flex-row">
                      <div className="bg-white p-3 border border-gray-200 rounded-xl">
                        {/* Simulated QR Code Canvas Representation */}
                        <div className="w-36 h-36 border-4 border-dashed border-emerald-500/30 flex items-center justify-center text-center p-2 relative bg-emerald-50/10">
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold uppercase tracking-wide">Scan QR Code</span>
                        </div>
                      </div>
                      <div className="space-y-2 flex-1 w-full">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Manual Setup Secret Key</p>
                        <div className="bg-white dark:bg-[#0D121F] border border-gray-200 dark:border-[#1B2438] rounded-xl px-3 py-2 text-xs font-mono font-bold flex justify-between items-center text-gray-700 dark:text-zinc-200 select-all">
                          <span>{twoFaSecret}</span>
                        </div>
                        
                        <form onSubmit={handleVerify2Fa} className="pt-2 flex gap-2 w-full">
                          <input
                            type="text"
                            required
                            maxLength={6}
                            value={twoFaCode}
                            onChange={(e) => setTwoFaCode(e.target.value.replace(/\D/g, ''))}
                            placeholder="e.g. 123456"
                            className="bg-[#F4F6F5] dark:bg-[#0A0F1D] border border-gray-200 dark:border-[#1B2438] focus:border-emerald-500 text-xs rounded-xl px-3 py-2 text-gray-700 dark:text-zinc-100 focus:outline-none transition-all font-mono font-bold w-32"
                          />
                          <button
                            type="submit"
                            disabled={twoFaCode.length < 6 || twoFaLoading}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-4 py-2 rounded-xl flex-1 transition-colors"
                          >
                            Verify & Enable
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                )}

                {/* Show success recovery codes */}
                {twoFaSuccessCodes.length > 0 && (
                  <div className="bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10 rounded-2xl p-5 max-w-lg space-y-4 animate-scale-up">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-emerald-800 dark:text-emerald-400 text-sm">2FA Activated Successfully!</h4>
                        <p className="text-xs text-gray-500 mt-0.5">Please save these recovery backup codes in a secure vault. They can be used to log in if you lose authenticator device access.</p>
                      </div>
                      <button
                        onClick={copyRecoveryCodes}
                        className="bg-white dark:bg-[#0D121F] hover:bg-zinc-50 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 shrink-0"
                      >
                        {copiedCodes ? <Check size={12} /> : <Copy size={12} />}
                        <span>{copiedCodes ? "Copied!" : "Copy"}</span>
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 bg-white dark:bg-[#0D121F] border border-emerald-100 dark:border-emerald-500/10 rounded-xl p-3 font-mono text-xs font-bold text-gray-700 dark:text-zinc-300">
                      {twoFaSuccessCodes.map((code, i) => (
                        <div key={i} className="flex gap-2">
                          <span className="text-[10px] text-gray-400">{i + 1}.</span>
                          <span>{code}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#0A0F1D] border border-gray-100 dark:border-[#1B2438] rounded-2xl">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-gray-900 dark:text-white">Authenticator Authentication</p>
                    <p className="text-[10px] text-gray-400 font-medium">
                      Status: {profile.twoFactorEnabled ? "Active (Security Enforced)" : "Inactive"}
                    </p>
                  </div>
                  {profile.twoFactorEnabled ? (
                    <button
                      onClick={handleDisable2Fa}
                      disabled={twoFaLoading}
                      className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 dark:bg-red-500/10 dark:border-red-500/20 font-bold text-xs px-4 py-2 rounded-xl transition-colors"
                    >
                      Disable 2FA
                    </button>
                  ) : (
                    !twoFaSetupActive && (
                      <button
                        onClick={start2FaSetup}
                        disabled={twoFaLoading}
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20 font-bold text-xs px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5"
                      >
                        <ShieldCheck size={14} />
                        <span>Enable 2FA</span>
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LOGIN HISTORY */}
          {activeTab === "sessions" && (
            <div className="space-y-6">
              <div className="flex justify-between items-start flex-col sm:flex-row gap-4">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">Active Sessions & Login History</h3>
                  <p className="text-xs text-gray-400">View authorized browser devices accessing this account. Revoke session tokens immediately if suspect logins are spotted.</p>
                </div>
                <button
                  onClick={handleTerminateOtherSessions}
                  disabled={terminatingSessions || profile.loginHistory.length <= 1}
                  className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 dark:bg-red-500/10 dark:border-red-500/20 font-bold text-xs px-4 py-2.5 rounded-xl transition-colors shrink-0"
                >
                  {terminatingSessions ? "Terminating..." : "Sign Out of Other Devices"}
                </button>
              </div>

              {sessionSuccess && (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl p-3 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  <span>Other sessions terminated. Only this device remains signed in.</span>
                </div>
              )}

              {/* Login history table */}
              <div className="border border-gray-100 dark:border-[#1B2438] rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-[#0A0F1D] border-b border-gray-100 dark:border-[#1B2438] text-gray-500 dark:text-zinc-400 font-bold">
                      <th className="p-3">Device / Browser</th>
                      <th className="p-3">IP Address</th>
                      <th className="p-3">Location</th>
                      <th className="p-3">Login Time</th>
                      <th className="p-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-[#1B2438] text-gray-700 dark:text-zinc-300">
                    {profile.loginHistory.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-gray-400 font-semibold">No login records found.</td>
                      </tr>
                    ) : (
                      profile.loginHistory.map((lh: any, index: number) => (
                        <tr key={lh.id || index} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/10 transition-colors">
                          <td className="p-3 font-semibold text-gray-800 dark:text-zinc-200">
                            {lh.device} • {lh.browser}
                          </td>
                          <td className="p-3 font-mono font-semibold">{lh.ipAddress}</td>
                          <td className="p-3 font-semibold">{lh.location}</td>
                          <td className="p-3 text-gray-400 font-medium">{new Date(lh.loginTime).toLocaleString()}</td>
                          <td className="p-3 text-right">
                            {index === 0 ? (
                              <span className="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 px-2 py-0.5 border border-emerald-100 dark:border-emerald-500/20 rounded-md font-bold text-[10px]">
                                Current Session
                              </span>
                            ) : (
                              <span className="text-gray-400 font-semibold text-[10px]">Active</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Read-Only Account Details Column (1 column) */}
        <div className="bg-white dark:bg-[#0D121F] border border-gray-200/80 dark:border-[#1B2438] rounded-3xl p-6 shadow-sm h-fit space-y-5">
          <h4 className="font-bold text-gray-900 dark:text-white text-sm">Account Metadata</h4>
          
          <div className="space-y-4 text-xs font-semibold text-gray-500 dark:text-zinc-400">
            <div>
              <p className="text-[10px] text-gray-400 uppercase">User ID</p>
              <p className="font-mono text-gray-700 dark:text-zinc-300 truncate mt-0.5 select-all" title={profile.id}>{profile.id}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase">Registered Date</p>
              <p className="text-gray-700 dark:text-zinc-300 mt-0.5">{new Date(profile.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase">Current Subscribed Tier</p>
              <p className="text-gray-700 dark:text-zinc-300 mt-0.5 uppercase">{profile.plan}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase">Subscription Status</p>
              <p className="text-emerald-500 mt-0.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                <span>Active</span>
              </p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase">Organization ID</p>
              <p className="font-mono text-gray-700 dark:text-zinc-300 truncate mt-0.5 select-all" title={profile.organizationId}>{profile.organizationId}</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
