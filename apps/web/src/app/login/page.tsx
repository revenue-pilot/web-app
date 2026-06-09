"use client";
import React, { useState, useEffect } from "react";
import { ArrowRight, Mail, Lock, ShieldAlert, CheckCircle2, Chrome, KeyRound } from "lucide-react";
import { GoogleLogin } from '@react-oauth/google';

export default function LoginPage() {
  const [loginMode, setLoginMode] = useState<"password" | "magic">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Handle URL verification query token if user clicked a magic link
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const token = query.get("token");
    if (token) {
      handleVerifyMagicLink(token);
    }
  }, []);

  const handleVerifyMagicLink = async (token: string) => {
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("Verifying secure token...");

    try {
      const res = await fetch("/api/auth/magic-link-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
      });
      const data = await res.json();
      if (res.ok && data.success && data.user) {
        setSuccessMsg("Verification success! Redirecting...");
        localStorage.setItem("user_email", data.user.email);
        localStorage.setItem("user_role", data.user.role === "ADMIN" ? "Platform Admin" : "Agency Owner");
        localStorage.removeItem("impersonate_tenant");
        setTimeout(() => {
          window.location.href = data.user.role === "ADMIN" ? "/admin" : "/dashboard";
        }, 800);
      } else {
        setErrorMsg(data.message || "The login link is invalid or has expired. Please request a new one.");
        setSuccessMsg("");
      }
    } catch (e) {
      setErrorMsg("Failed to verify login token. Please check your network connection.");
      setSuccessMsg("");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg("Please provide both your email and password.");
      return;
    }
    
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password: password.trim() })
      });
      
      const data = await res.json();
      
      if (data.success) {
        localStorage.setItem("user_email", data.user.email);
        localStorage.setItem("user_role", data.user.role === "ADMIN" ? "Platform Admin" : "Agency Owner");
        localStorage.removeItem("impersonate_tenant");
        
        window.location.href = data.user.role === "ADMIN" ? "/admin" : "/dashboard";
      } else {
        setErrorMsg(data.message || "Failed to authenticate. Please check your credentials.");
      }
    } catch (err) {
      setErrorMsg("Unable to connect to authentication server. Please verify your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLinkRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg("Please enter your email address.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/auth/magic-link-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg("A magic login link has been dispatched to your email address.");
      } else {
        setErrorMsg(data.message || "Failed to dispatch magic link. Please retry.");
      }
    } catch (e) {
      setErrorMsg("Unable to connect to authentication server. Please verify your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("Authenticating with Google...");

    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: credentialResponse.credential })
      });
      const data = await res.json();
      if (res.ok && data.access_token) {
        setSuccessMsg("Google sign-in complete. Redirecting...");
        localStorage.setItem("user_email", data.user.email);
        localStorage.setItem("user_role", data.user.role === "ADMIN" ? "Platform Admin" : "Agency Owner");
        localStorage.removeItem("impersonate_tenant");
        setTimeout(() => {
          window.location.href = data.user.role === "ADMIN" ? "/admin" : "/dashboard";
        }, 800);
      } else {
        setErrorMsg("Failed to authenticate with Google.");
        setSuccessMsg("");
      }
    } catch (e) {
      setErrorMsg("Unable to complete Google sign-in.");
      setSuccessMsg("");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setErrorMsg("Google Sign-In was unsuccessful.");
  };

  return (
    <div className="min-h-screen bg-[#F4F6F5] text-gray-900 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-600/10 blur-[120px]" />
      
      <div className="z-10 w-full max-w-md">
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-500/20 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path d="M3.478 2.405a.75.75 0 0 0-.926.94l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.405Z" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">RevenuePilot</h1>
          <p className="text-gray-400 text-xs mt-1 font-semibold">Log in to your enterprise command center</p>
        </div>

        <div className="bg-white border border-gray-200/80 rounded-3xl p-8 shadow-xl space-y-6">
          {/* Tab Selector */}
          <div className="flex bg-gray-50 border border-gray-200/50 p-1 rounded-xl">
            <button
              onClick={() => { setLoginMode("password"); setErrorMsg(""); setSuccessMsg(""); }}
              className={`flex-1 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                loginMode === "password" ? "bg-white text-gray-800 shadow-sm" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <KeyRound size={14} />
              <span>Password Sign In</span>
            </button>
            <button
              onClick={() => { setLoginMode("magic"); setErrorMsg(""); setSuccessMsg(""); }}
              className={`flex-1 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                loginMode === "magic" ? "bg-white text-gray-800 shadow-sm" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <Mail size={14} />
              <span>Magic Link</span>
            </button>
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl p-3.5 text-xs font-semibold flex items-start gap-2 animate-shake">
              <ShieldAlert size={16} className="shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl p-3.5 text-xs font-semibold flex items-start gap-2 animate-fade-in">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-500" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Credentials / Magic Link Form */}
          {loginMode === "password" ? (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-3 py-2.5 text-sm text-gray-750 focus:outline-none focus:bg-white focus:border-emerald-500 transition-all font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
                    <Lock size={16} />
                  </span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-3 py-2.5 text-sm text-gray-755 focus:outline-none focus:bg-white focus:border-emerald-500 transition-all font-semibold"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 text-white py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-500/10 text-xs mt-2"
              >
                <span>{loading ? "Signing in..." : "Continue to Account"}</span>
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          ) : (
            <form onSubmit={handleMagicLinkRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-3 py-2.5 text-sm text-gray-750 focus:outline-none focus:bg-white focus:border-emerald-500 transition-all font-semibold"
                  />
                </div>
              </div>

              <div className="text-[10px] text-gray-450 font-semibold leading-relaxed py-1">
                A verification email will be dispatched containing a secure token. Clicking it will automatically log you in on this device.
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 text-white py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-500/10 text-xs"
              >
                <span>{loading ? "Sending link..." : "Send Magic Login Link"}</span>
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          )}

          {/* Social login divider */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-100"></div>
            <span className="flex-shrink mx-4 text-gray-400 text-[10px] font-bold uppercase tracking-wider">Or continue with</span>
            <div className="flex-grow border-t border-gray-100"></div>
          </div>

          {/* Social login buttons */}
          <div className="w-full flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap
              theme="outline"
              shape="rectangular"
              size="large"
              text="signin_with"
            />
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-gray-600 font-medium">
          Don't have an account? <a href="/signup" className="text-emerald-600 hover:text-emerald-700 font-bold hover:underline transition-colors">Sign up</a>
        </p>

        <p className="mt-6 text-center text-xs text-gray-400 font-semibold leading-relaxed">
          By clicking continue, you agree to our <a href="#" className="text-gray-500 hover:text-gray-700 underline underline-offset-4 font-bold">Terms of Service</a> and <a href="#" className="text-gray-500 hover:text-gray-700 underline underline-offset-4 font-bold">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}
