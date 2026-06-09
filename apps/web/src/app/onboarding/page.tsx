"use client";
import React, { useState, useEffect } from "react";
import { CheckCircle2, Building, Target, Zap, ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/apiClient";

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState("");
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    apiClient.get("/api/onboarding")
      .then((res) => {
        if (res.isOnboarded) {
          router.push('/dashboard');
        } else {
          setCompanyName(res.name || "");
          setSelectedIndustry(res.industry || "");
          setSelectedGoals(res.goals || []);
          setStep(res.onboardingStep || 1);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load onboarding status:", err);
        setLoading(false);
      });
  }, [router]);

  const handleNextWithData = async (data: any) => {
    try {
      let nextStep = step + 1;
      const payload: any = { onboardingStep: nextStep, ...data };

      if (step === 6 || nextStep > 6) {
        payload.isOnboarded = true;
      }

      await apiClient.put("/api/onboarding/step", payload);

      if (step < 6) {
        setStep(nextStep);
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      console.error("Failed to update onboarding step:", err);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      handleNextWithData({ name: companyName });
    } else if (step === 4) {
      handleNextWithData({ industry: selectedIndustry });
    } else if (step === 5) {
      handleNextWithData({ goals: selectedGoals });
    } else {
      handleNextWithData({});
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-black to-black">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        <p className="text-zinc-400 text-sm mt-4">Loading your setup progress...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-black to-black">
      <div className="w-full max-w-2xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl">
        
        {/* Progress Bar */}
        <div className="flex justify-between items-center mb-12 relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-white/10 -z-10"></div>
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-purple-500 -z-10 transition-all duration-500"
            style={{ width: `${((step - 1) / 5) * 100}%` }}
          ></div>
          
          {[1, 2, 3, 4, 5, 6].map((s) => (
            <div key={s} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-500 ${
              step >= s ? 'bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]' : 'bg-black border border-white/20 text-gray-500'
            }`}>
              {step > s ? <CheckCircle2 size={20} /> : s}
            </div>
          ))}
        </div>

        {/* Step 1: Account */}
        {step === 1 && (
          <div className="animate-in fade-in zoom-in-95 duration-300 text-center space-y-6">
            <h1 className="text-3xl font-bold">Welcome to Revenue Pilot</h1>
            <p className="text-gray-400">Let&apos;s set up your executive control center.</p>
            <div className="space-y-4 text-left mt-8">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Company Name</label>
                <input 
                  type="text" 
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 focus:border-purple-500 focus:outline-none" 
                  placeholder="Acme Corp" 
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Google Ads */}
        {step === 2 && (
          <div className="animate-in fade-in zoom-in-95 duration-300 text-center space-y-6">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
              <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" className="w-8 h-8" alt="Google" />
            </div>
            <h1 className="text-3xl font-bold">Connect Google Ads</h1>
            <p className="text-gray-400">One-click secure authorization to import your Search and PMax campaigns.</p>
            <button onClick={() => handleNextWithData({})} className="mt-8 bg-white text-black font-semibold py-3 px-8 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 mx-auto">
              Authorize Google OAuth
            </button>
            <button onClick={() => handleNextWithData({})} className="text-sm text-gray-500 hover:text-white transition-colors mt-4 block mx-auto">Skip for now</button>
          </div>
        )}

        {/* Step 3: Meta Ads */}
        {step === 3 && (
          <div className="animate-in fade-in zoom-in-95 duration-300 text-center space-y-6">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-3xl">
              f
            </div>
            <h1 className="text-3xl font-bold">Connect Meta Ads</h1>
            <p className="text-gray-400">Sync your Facebook and Instagram ad accounts instantly.</p>
            <button onClick={() => handleNextWithData({})} className="mt-8 bg-[#1877F2] text-white font-semibold py-3 px-8 rounded-xl hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 mx-auto">
              Authorize Meta OAuth
            </button>
            <button onClick={() => handleNextWithData({})} className="text-sm text-gray-500 hover:text-white transition-colors mt-4 block mx-auto">Skip for now</button>
          </div>
        )}

        {/* Step 4: Business Type */}
        {step === 4 && (
          <div className="animate-in fade-in zoom-in-95 duration-300 text-center space-y-6">
            <h1 className="text-3xl font-bold">What&apos;s your business type?</h1>
            <p className="text-gray-400">We optimize AI algorithms based on your industry.</p>
            <div className="grid grid-cols-2 gap-4 mt-8 text-left">
              {['B2B SaaS', 'E-commerce', 'Local Service', 'Agency'].map((type) => (
                <button 
                  key={type} 
                  onClick={() => {
                    setSelectedIndustry(type);
                    handleNextWithData({ industry: type });
                  }} 
                  className={`p-4 border rounded-xl bg-black/40 hover:border-purple-500 hover:bg-purple-900/20 transition-colors flex items-center gap-3 group ${
                    selectedIndustry === type ? 'border-purple-500 bg-purple-900/20' : 'border-white/10'
                  }`}
                >
                  <Building className="text-gray-500 group-hover:text-purple-400" />
                  <span className="font-medium text-gray-300 group-hover:text-white">{type}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 5: Goals */}
        {step === 5 && (
          <div className="animate-in fade-in zoom-in-95 duration-300 text-center space-y-6">
            <h1 className="text-3xl font-bold">Define your primary goal</h1>
            <p className="text-gray-400">What metric matters most to your business?</p>
            <div className="grid grid-cols-1 gap-4 mt-8 text-left max-w-md mx-auto">
              {['Maximize Lead Volume (CPA)', 'Maximize Revenue (ROAS)', 'Brand Awareness (CPM)'].map((goal) => (
                <button 
                  key={goal} 
                  onClick={() => {
                    const nextGoals = [goal];
                    setSelectedGoals(nextGoals);
                    handleNextWithData({ goals: nextGoals });
                  }} 
                  className={`p-4 border rounded-xl bg-black/40 hover:border-purple-500 hover:bg-purple-900/20 transition-colors flex items-center gap-3 group ${
                    selectedGoals.includes(goal) ? 'border-purple-500 bg-purple-900/20' : 'border-white/10'
                  }`}
                >
                  <Target className="text-gray-500 group-hover:text-purple-400" />
                  <span className="font-medium text-gray-300 group-hover:text-white">{goal}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 6: Create Campaign */}
        {step === 6 && (
          <div className="animate-in fade-in zoom-in-95 duration-300 text-center space-y-6">
            <div className="w-20 h-20 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-purple-500/30">
              <Zap className="w-10 h-10 text-purple-400" />
            </div>
            <h1 className="text-3xl font-bold">You&apos;re ready to scale.</h1>
            <p className="text-gray-400">Your accounts are connected and your AI engine is primed.</p>
            <button onClick={handleNext} className="mt-8 w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2">
              Enter Dashboard <ArrowRight size={20} />
            </button>
          </div>
        )}

        {step < 4 && step > 1 ? null : step < 6 && (
          <div className="mt-12 flex justify-end">
            <button onClick={handleNext} className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2.5 rounded-lg font-medium transition-colors">
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
