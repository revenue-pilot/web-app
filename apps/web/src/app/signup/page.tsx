"use client";
import React, { useState } from "react";
import { ArrowRight, Mail, Lock, ShieldAlert, CheckCircle2, User, Building2 } from "lucide-react";
import { GoogleLogin } from '@react-oauth/google';
import { useMutation } from "@/hooks/useApi";
import { signup } from "@/lib/apiClient";

export default function SignupPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  
  const { mutate: doSignup, loading, error } = useMutation(signup);

  const handleGoogleSuccess = async (credentialResponse: any) => {
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
        setTimeout(() => {
          window.location.href = data.user.role === "ADMIN" ? "/admin" : "/dashboard";
        }, 800);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleGoogleError = () => {
    console.error("Google Sign-In was unsuccessful.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await doSignup({ firstName, lastName, email, password, companyName });
      if (res.message) {
        setSuccessMsg(res.message);
      } else if (res.access_token) {
        localStorage.setItem("access_token", res.access_token);
        window.location.href = "/dashboard";
      }
    } catch (err) {
      console.error(err);
    }
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
          <p className="text-gray-400 text-xs mt-1 font-semibold">Create your enterprise command center</p>
        </div>

        <div className="bg-white border border-gray-200/80 rounded-3xl p-8 shadow-xl space-y-6">
          
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl p-3.5 text-xs font-semibold flex items-start gap-2 animate-shake">
              <ShieldAlert size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl p-3.5 text-xs font-semibold flex items-start gap-2 animate-fade-in">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-500" />
              <span>{successMsg}</span>
            </div>
          )}

          {!successMsg && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">First Name</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
                      <User size={16} />
                    </span>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Jane"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-3 py-2.5 text-sm text-gray-750 focus:outline-none focus:bg-white focus:border-emerald-500 transition-all font-semibold"
                    />
                  </div>
                </div>
                <div className="w-1/2">
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">Last Name</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
                      <User size={16} />
                    </span>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Doe"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-3 py-2.5 text-sm text-gray-750 focus:outline-none focus:bg-white focus:border-emerald-500 transition-all font-semibold"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">Company Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
                    <Building2 size={16} />
                  </span>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Acme Corp"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-3 py-2.5 text-sm text-gray-750 focus:outline-none focus:bg-white focus:border-emerald-500 transition-all font-semibold"
                  />
                </div>
              </div>

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
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-3 py-2.5 text-sm text-gray-750 focus:outline-none focus:bg-white focus:border-emerald-500 transition-all font-semibold"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 text-white py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-500/10 text-xs mt-2"
              >
                <span>{loading ? "Creating Account..." : "Sign Up"}</span>
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

          <div className="w-full flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap
              theme="outline"
              shape="rectangular"
              size="large"
              text="signup_with"
            />
          </div>

        </div>

        <p className="mt-6 text-center text-sm text-gray-600 font-medium">
          Already have an account? <a href="/login" className="text-emerald-600 hover:text-emerald-700 font-bold hover:underline transition-colors">Log in</a>
        </p>

        <p className="mt-6 text-center text-xs text-gray-400 font-semibold leading-relaxed">
          By signing up, you agree to our <a href="#" className="text-gray-500 hover:text-gray-700 underline underline-offset-4 font-bold">Terms of Service</a> and <a href="#" className="text-gray-500 hover:text-gray-700 underline underline-offset-4 font-bold">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}
