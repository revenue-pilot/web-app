"use client";
import React, { useState } from "react";
import { CreditCard, Check, AlertCircle, FileText, Calendar, ShieldCheck } from "lucide-react";
import { useBilling, useInvoices, useCreateCheckoutSession } from "@/hooks/useApi";

export default function BillingPage() {
  const { data: billingData, loading: billingLoading, error: billingError, refetch: refetchBilling } = useBilling();
  const { data: invoicesData, loading: invoicesLoading } = useInvoices();
  const { mutate: createCheckout, loading: checkoutLoading } = useCreateCheckoutSession();

  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<any>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any>(null);

  const [simulationState, setSimulationState] = useState<"Success" | "Failure">("Success");

  const billingInfo = billingData?.subscription || {
    name: "Revenue Plan",
    price: 1999,
    period: "month",
    nextBilling: "Loading...",
    clientCount: 0,
    maxClients: 25,
    trialDaysRemaining: 0
  };

  const invoices = Array.isArray(invoicesData) ? invoicesData : [];

  const openCheckout = (planName: string, price: number) => {
    setCheckoutPlan({ name: planName, price });
    setPaymentResult(null);
    setShowCheckout(true);
  };

  const handleProcessPayment = async () => {
    if (!checkoutPlan) return;
    
    setPaymentProcessing(true);
    setPaymentResult(null);

    try {
      const result = await createCheckout({
        planName: checkoutPlan.name,
        amount: checkoutPlan.price
      });
      
      setPaymentResult("Success");
      
      // Refresh billing info after successful payment
      setTimeout(() => {
        refetchBilling();
        setShowCheckout(false);
      }, 2000);
    } catch (error) {
      console.error("Payment error:", error);
      setPaymentResult("Failure");
    } finally {
      setPaymentProcessing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <CreditCard size={24} className="text-emerald-500" />
            <span>Revenue Command (Billing)</span>
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage subscription structures, review billing invoices, and simulate transactions.</p>
        </div>
      </div>

      {billingLoading  ? (
        <div className="py-20 text-center text-gray-400">Loading subscription details...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Subscription status */}
          <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100/60 uppercase">
                Active Plan
              </span>
              <h3 className="text-xl font-bold text-gray-900 mt-2">{billingInfo?.name}</h3>
              <p className="text-sm font-bold text-gray-800 mt-1">₹{billingInfo?.price.toLocaleString("en-IN")} / month</p>
              <p className="text-xs text-gray-400 font-semibold mt-2">Next billing date: {billingInfo?.nextBilling}</p>
            </div>

            <div className="py-4 border-t border-gray-100 mt-4 text-xs font-semibold text-gray-500">
              <div className="flex justify-between mb-1">
                <span>Free Trial Period</span>
                <span>{billingInfo?.trialDaysRemaining} days remaining</span>
              </div>
              <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: "50%" }}></div>
              </div>
            </div>
          </div>

          {/* Plan Tiers Grid */}
          <div className="lg:col-span-2 bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 text-sm">Select Plan Tier</h3>
            <div className="grid grid-cols-3 gap-3">
              <PricingCard name="Standard" price={1199} features={["5 Clients", "Google Ads integration", "Weekly reports"]} active={billingInfo?.name === "Standard"} onClick={() => openCheckout("Standard", 1199)} />
              <PricingCard name="Revenue" price={1999} features={["25 Clients", "Google/Meta integration", "Daily reports", "AI Optimizations"]} active={billingInfo?.name === "Revenue Plan" || billingInfo?.name === "Revenue"} onClick={() => openCheckout("Revenue Plan", 1999)} />
              <PricingCard name="Premium" price={2499} features={["Unlimited Clients", "All integrations", "Realtime AI autopilot", "White Label branding"]} active={billingInfo?.name === "Premium"} onClick={() => openCheckout("Premium", 2499)} />
            </div>
          </div>
        </div>
      )}

      {/* Invoice History */}
      <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-gray-900 text-sm mb-4">Invoice Ledger History</h3>
        <div className="space-y-2.5">
          {invoices.map((inv) => (
            <div key={inv.id} className="p-3.5 bg-gray-50/50 border border-gray-100 rounded-xl flex justify-between items-center text-xs font-semibold text-gray-500">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-gray-400">
                  <FileText size={16} />
                </div>
                <div>
                  <p className="text-gray-800 font-bold">{inv.id}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{inv.date} via {inv.method}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-gray-900 font-bold">₹{inv.amount.toLocaleString("en-IN")}</span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100/60">
                  {inv.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Razorpay Simulation Dialog */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden">
            {/* Razorpay Header bar */}
            <div className="bg-[#0b1c2c] text-white px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-blue-500 flex items-center justify-center font-bold text-xs text-white">R</div>
                <span className="text-sm font-bold tracking-tight">Razorpay Checkout</span>
              </div>
              <span className="text-[10px] font-bold text-zinc-400 border border-zinc-700 bg-zinc-800/40 px-2 py-0.5 rounded">TEST MODE</span>
            </div>

            <div className="p-6 space-y-5">
              {/* Payment Summary */}
              <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-4 flex justify-between items-center text-xs font-semibold">
                <div>
                  <p className="text-zinc-400 uppercase tracking-wider text-[10px]">Plan Upgrade</p>
                  <p className="text-zinc-800 font-bold text-sm mt-0.5">{checkoutPlan?.name}</p>
                </div>
                <span className="text-zinc-900 font-bold text-sm">₹{checkoutPlan?.price.toLocaleString("en-IN")}</span>
              </div>

              {/* Checkout Controls */}
              {paymentResult === null ? (
                <div className="space-y-4">
                  {/* Simulation Config Toggle */}
                  <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs space-y-2">
                    <p className="font-bold text-amber-800 flex items-center gap-1">
                      <AlertCircle size={14} />
                      <span>Simulator Settings</span>
                    </p>
                    <p className="text-amber-700 font-medium">Select the target response behavior you wish to verify:</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSimulationState("Success")}
                        className={`flex-1 py-1.5 px-3 rounded-lg border text-center font-bold transition-all ${
                          simulationState === "Success"
                            ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                            : "bg-white text-zinc-500 border-zinc-200"
                        }`}
                      >
                        Success Response
                      </button>
                      <button
                        type="button"
                        onClick={() => setSimulationState("Failure")}
                        className={`flex-1 py-1.5 px-3 rounded-lg border text-center font-bold transition-all ${
                          simulationState === "Failure"
                            ? "bg-red-50 text-red-600 border-red-200"
                            : "bg-white text-zinc-500 border-zinc-200"
                        }`}
                      >
                        Payment Failure
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 mb-1">Simulated Card Holder</label>
                    <input type="text" disabled defaultValue="Arjun Mehta" className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-sm text-zinc-400 cursor-not-allowed" />
                  </div>

                  <button
                    onClick={handleProcessPayment}
                    disabled={paymentProcessing}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-600/10 transition-all flex items-center justify-center"
                  >
                    {paymentProcessing ? "Processing Security Verification..." : `Pay ₹${checkoutPlan?.price.toLocaleString("en-IN")}`}
                  </button>
                </div>
              ) : paymentResult === "Success" ? (
                <div className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center border border-emerald-100 shadow-inner mx-auto">
                    <Check size={32} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-base">Payment Authorized</h4>
                    <p className="text-xs text-gray-400 font-semibold mt-1">
                      Subscription applied successfully. Invoice added to your ledger.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowCheckout(false)}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md shadow-emerald-500/10 transition-colors"
                  >
                    Return to Billing
                  </button>
                </div>
              ) : (
                <div className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center border border-red-100 shadow-inner mx-auto">
                    <AlertCircle size={32} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-base">Authorization Failed</h4>
                    <p className="text-xs text-gray-400 font-semibold mt-1">
                      Insufficient funds or bank gateway timeout. Please retry transaction.
                    </p>
                  </div>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => setPaymentResult(null)}
                      className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-colors"
                    >
                      Retry Payment
                    </button>
                    <button
                      onClick={() => setShowCheckout(false)}
                      className="border border-zinc-200 hover:bg-zinc-50 text-zinc-500 font-bold text-xs px-5 py-2.5 rounded-xl transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PricingCard({ name, price, features, active, onClick }: any) {
  return (
    <div className={`p-4 border rounded-2xl flex flex-col justify-between transition-all ${
      active
        ? "bg-emerald-50/20 border-emerald-500 shadow-md shadow-emerald-500/5"
        : "bg-gray-50/30 border-gray-100 hover:border-gray-200"
    }`}>
      <div>
        <h4 className="font-bold text-gray-800 text-xs uppercase tracking-wide">{name}</h4>
        <p className="font-bold text-gray-900 text-sm mt-2">₹{price.toLocaleString("en-IN")}<span className="text-[10px] text-gray-400 font-normal">/mo</span></p>
        
        <ul className="space-y-1.5 my-4 text-[10px] font-semibold text-gray-500">
          {features.map((f: string) => (
            <li key={f} className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-emerald-500 shrink-0"></span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={onClick}
        disabled={active}
        className={`w-full py-2 rounded-xl text-center text-xs font-bold transition-all border ${
          active
            ? "bg-emerald-500 text-white border-transparent cursor-default"
            : "bg-white hover:bg-gray-50 text-emerald-500 border-emerald-100 hover:border-emerald-200"
        }`}
      >
        {active ? "Current Plan" : "Upgrade Plan"}
      </button>
    </div>
  );
}
