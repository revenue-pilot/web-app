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
          
          const query = new URLSearchParams(window.location.search);
          const googleCode = query.get("googleCode");
          const metaCode = query.get("metaCode");

          let currentStep = res.onboardingStep || 1;

          if (googleCode) {
            currentStep = 4; // Advance past Google step
            apiClient.post("/api/v1/integrations/google-ads/callback", { code: googleCode })
              .catch(e => console.error("Failed to connect Google Ads", e));
            // Remove from URL
            window.history.replaceState({}, document.title, "/onboarding");
            apiClient.put("/api/onboarding/step", { onboardingStep: currentStep });
          } else if (metaCode) {
            currentStep = 5; // Advance past Meta step
            apiClient.post("/api/v1/integrations/meta-ads/callback", { code: metaCode })
              .catch(e => console.error("Failed to connect Meta Ads", e));
            window.history.replaceState({}, document.title, "/onboarding");
            apiClient.put("/api/onboarding/step", { onboardingStep: currentStep });
          }

          setStep(currentStep);
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

      if (step === 7 || nextStep > 7) {
        payload.isOnboarded = true;
      }

      await apiClient.put("/api/onboarding/step", payload);

      if (step < 7) {
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
    } else if (step === 5) {
      handleNextWithData({ industry: selectedIndustry });
    } else if (step === 6) {
      handleNextWithData({ goals: selectedGoals });
    } else {
      handleNextWithData({});
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F6F5] text-gray-900 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-600/10 blur-[120px]" />
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        <p className="text-zinc-400 text-sm mt-4">Loading your setup progress...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F6F5] text-gray-900 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-600/10 blur-[120px]" />
      <div className="z-10 w-full max-w-2xl bg-white border border-gray-200/80 rounded-3xl p-10 shadow-xl">
        
        {/* Progress Bar */}
        <div className="flex justify-between items-center mb-12 relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-white/10 -z-10"></div>
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-purple-500 -z-10 transition-all duration-500"
            style={{ width: `${((step - 1) / 5) * 100}%` }}
          ></div>
          
          {[1, 2, 3, 4, 5, 6, 7].map((s) => (
            <div key={s} className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors duration-500 ${
              step >= s ? 'bg-purple-500 text-gray-900 shadow-[0_0_15px_rgba(168,85,247,0.5)]' : 'bg-gray-100 border border-white/20 text-gray-500'
            }`}>
              {step > s ? <CheckCircle2 size={16} /> : s}
            </div>
          ))}
        </div>

        {/* Step 1: Account */}
        {step === 1 && (
          <div className="animate-in fade-in zoom-in-95 duration-300 text-center space-y-6">
            <h1 className="text-3xl font-bold">Welcome to Revenue Pilot</h1>
            <p className="text-gray-600">Let&apos;s set up your executive control center.</p>
            <div className="space-y-4 text-left mt-8">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Company Name</label>
                <input 
                  type="text" 
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-gray-100/50 border border-gray-200 rounded-xl py-3 px-4 focus:border-purple-500 focus:outline-none" 
                  placeholder="Acme Corp" 
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Pricing */}
        {step === 2 && (
          <div className="animate-in fade-in zoom-in-95 duration-300 text-center space-y-6 w-full">
            <h1 className="text-3xl font-bold">Select Your Plan</h1>
            <p className="text-gray-600">Choose the AI intelligence tier that fits your growth.</p>
            <div className="grid grid-cols-3 gap-6 mt-8 text-left w-full">
              {[
                { name: 'Starter', price: 1, features: ['Basic AI', 'Up to ₹1L Spend'] },
                { name: 'Professional', price: 4999, features: ['GPT-4o Mini', 'Up to ₹10L Spend', 'Automations'] },
                { name: 'Enterprise', price: 15000, features: ['GPT-5 Access', 'Unlimited Spend', 'Dedicated Support'] }
              ].map((plan) => (
                <div key={plan.name} className="p-6 border border-gray-200 rounded-xl bg-gray-50 flex flex-col relative">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="text-2xl font-bold text-purple-400 mb-6">₹{plan.price}/mo</div>
                  <ul className="space-y-3 mb-8 flex-grow">
                    {plan.features.map(f => (
                      <li key={f} className="text-sm text-gray-300 flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-purple-500" /> {f}
                      </li>
                    ))}
                  </ul>
                  <button 
                    onClick={async () => {
                      setLoading(true);
                      try {
                        const res = await apiClient.post("/api/onboarding/checkout", { plan: plan.name.toUpperCase(), amount: plan.price });
                        if (res.orderId) {
                           if (!(window as any).Razorpay) {
                             await new Promise((resolve, reject) => {
                               const script = document.createElement('script');
                               script.src = 'https://checkout.razorpay.com/v1/checkout.js';
                               script.onload = resolve;
                               script.onerror = reject;
                               document.body.appendChild(script);
                             });
                           }
                           const options = {
                              key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_dummy",
                              amount: res.amount,
                              currency: res.currency,
                              name: "RevenuePilot",
                              description: `Subscription to ${plan.name}`,
                              order_id: res.orderId,
                              handler: function (response: any) {
                                  // Success - proceed to next step
                                  handleNextWithData({});
                              },
                              theme: { color: "#a855f7" }
                           };
                           const rzp = new (window as any).Razorpay(options);
                           rzp.open();
                        }
                      } catch (e) {
                        console.error(e);
                      } finally {
                        setLoading(false);
                      }
                    }} 
                    className="w-full py-3 rounded-lg bg-white/10 hover:bg-purple-600 transition-colors text-gray-900 font-medium">
                    Select {plan.name}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Google Ads */}
        {step === 3 && (
          <div className="animate-in fade-in zoom-in-95 duration-300 text-center space-y-6">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
              <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" className="w-8 h-8" alt="Google" />
            </div>
            <h1 className="text-3xl font-bold">Connect Google Ads</h1>
            <p className="text-gray-600">One-click secure authorization to import your Search and PMax campaigns.</p>
            <button onClick={async () => {
              handleNextWithData({}); // Advance step in background
              const res = await apiClient.get('/api/v1/integrations/google-ads/auth?state=onboarding');
              window.location.href = res.url;
            }} className="mt-8 bg-white text-black font-semibold py-3 px-8 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 mx-auto">
              Authorize Google OAuth
            </button>
            <button onClick={() => handleNextWithData({})} className="text-sm text-gray-500 hover:text-gray-900 transition-colors mt-4 block mx-auto">Skip for now</button>
          </div>
        )}

        {/* Step 4: Meta Ads */}
        {step === 4 && (
          <div className="animate-in fade-in zoom-in-95 duration-300 text-center space-y-6">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-900 font-bold text-3xl">
              f
            </div>
            <h1 className="text-3xl font-bold">Connect Meta Ads</h1>
            <p className="text-gray-600">Sync your Facebook and Instagram ad accounts instantly.</p>
            <button onClick={async () => {
              handleNextWithData({}); // Advance step in background
              const res = await apiClient.get('/api/v1/integrations/meta-ads/auth?state=onboarding');
              window.location.href = res.url;
            }} className="mt-8 bg-[#1877F2] text-gray-900 font-semibold py-3 px-8 rounded-xl hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 mx-auto">
              Authorize Meta OAuth
            </button>
            <button onClick={() => handleNextWithData({})} className="text-sm text-gray-500 hover:text-gray-900 transition-colors mt-4 block mx-auto">Skip for now</button>
          </div>
        )}

        {/* Step 5: Business Type */}
        {step === 5 && (
          <div className="animate-in fade-in zoom-in-95 duration-300 text-center space-y-6">
            <h1 className="text-3xl font-bold">What&apos;s your business type?</h1>
            <p className="text-gray-600">We optimize AI algorithms based on your industry.</p>
            <div className="grid grid-cols-2 gap-4 mt-8 text-left">
              {['B2B SaaS', 'E-commerce', 'Local Service', 'Agency'].map((type) => (
                <button 
                  key={type} 
                  onClick={() => {
                    setSelectedIndustry(type);
                    handleNextWithData({ industry: type });
                  }} 
                  className={`p-4 border rounded-xl bg-black/40 hover:border-purple-500 hover:bg-purple-100 transition-colors flex items-center gap-3 group ${
                    selectedIndustry === type ? 'border-purple-500 bg-purple-100' : 'border-white/10'
                  }`}
                >
                  <Building className="text-gray-500 group-hover:text-purple-400" />
                  <span className="font-medium text-gray-300 group-hover:text-white">{type}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 6: Goals */}
        {step === 6 && (
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
                  className={`p-4 border rounded-xl bg-black/40 hover:border-purple-500 hover:bg-purple-100 transition-colors flex items-center gap-3 group ${
                    selectedGoals.includes(goal) ? 'border-purple-500 bg-purple-100' : 'border-white/10'
                  }`}
                >
                  <Target className="text-gray-500 group-hover:text-purple-400" />
                  <span className="font-medium text-gray-300 group-hover:text-white">{goal}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 7: Create Campaign */}
        {step === 7 && (
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

        {step < 5 && step > 1 ? null : step < 7 && (
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
