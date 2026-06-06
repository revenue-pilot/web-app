"use client";
import React, { useState } from "react";
import { 
  CreditCard, TrendingUp, DollarSign, AlertTriangle, RefreshCw, 
  Search, ShieldAlert, Sparkles, Check, Trash2, Edit2, Plus
} from "lucide-react";

interface PaymentLog {
  id: string;
  client: string;
  email: string;
  amount: number;
  status: string; // Paid, Failed, Refunded
  date: string;
  method: string;
}

interface Coupon {
  id: string;
  code: string;
  discount: string; // e.g. "20%" or "₹500"
  status: string; // Active, Expired
}

export default function AdminRevenuePage() {
  // Mock payments store
  const [payments, setPayments] = useState<PaymentLog[]>([
    { id: "PAY-9831", client: "EcoMart India", email: "contact@ecomart.in", amount: 1999, status: "Paid", date: "2026-06-05", method: "Razorpay" },
    { id: "PAY-9830", client: "FitLife Gyms", email: "billing@fitlifegyms.com", amount: 1999, status: "Paid", date: "2026-06-04", method: "Razorpay" },
    { id: "PAY-9829", client: "Apex Logistics", email: "ops@apex.com", amount: 2499, status: "Failed", date: "2026-06-03", method: "Razorpay" },
    { id: "PAY-9828", client: "UrbanStays Hotel", email: "concierge@urbanstays.com", amount: 1999, status: "Paid", date: "2026-06-01", method: "Razorpay" },
    { id: "PAY-9827", client: "Solo Marketer", email: "mark@marketing.com", amount: 1199, status: "Refunded", date: "2026-05-28", method: "Razorpay" },
  ]);

  // Mock coupon store
  const [coupons, setCoupons] = useState<Coupon[]>([
    { id: "CP-1", code: "EARLYBIRD30", discount: "30%", status: "Active" },
    { id: "CP-2", code: "MINTYFRESH", discount: "₹1000", status: "Active" },
    { id: "CP-3", code: "LAUNCHOFFER", discount: "20%", status: "Expired" }
  ]);

  const [newCouponCode, setNewCouponCode] = useState("");
  const [newCouponDiscount, setNewCouponDiscount] = useState("20%");

  // Analytics
  const grossRevenue = payments.reduce((acc, p) => p.status === "Paid" ? acc + p.amount : acc, 0);
  const failedRevenue = payments.reduce((acc, p) => p.status === "Failed" ? acc + p.amount : acc, 0);
  const refundedRevenue = payments.reduce((acc, p) => p.status === "Refunded" ? acc + p.amount : acc, 0);

  const handleRefund = (id: string) => {
    setPayments(prev => prev.map(p => p.id === id ? { ...p, status: "Refunded" } : p));
  };

  const handleRetry = (id: string) => {
    setPayments(prev => prev.map(p => p.id === id ? { ...p, status: "Paid" } : p));
  };

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode) return;
    const newCp = {
      id: `CP-${Date.now()}`,
      code: newCouponCode.toUpperCase().replace(/\s+/g, ""),
      discount: newCouponDiscount,
      status: "Active"
    };
    setCoupons([newCp, ...coupons]);
    setNewCouponCode("");
  };

  const handleDeleteCoupon = (id: string) => {
    setCoupons(prev => prev.filter(c => c.id !== id));
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <CreditCard size={24} className="text-[#50BB8F]" />
          <span>Revenue Nexus</span>
        </h1>
        <p className="text-zinc-400 text-xs mt-0.5">Global finance operations, Razorpay transaction management, and Coupon Engine.</p>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-[#0D121F] border border-[#1B2438] p-4 rounded-xl">
          <span className="text-[9px] font-bold text-zinc-500 uppercase block">Gross Revenue</span>
          <span className="text-lg font-bold text-white block mt-1">₹{grossRevenue.toLocaleString("en-IN")}</span>
          <span className="text-[8px] text-zinc-400 font-semibold block mt-0.5">Successful charges</span>
        </div>
        <div className="bg-[#0D121F] border border-[#1B2438] p-4 rounded-xl">
          <span className="text-[9px] font-bold text-zinc-500 uppercase block">Net Revenue</span>
          <span className="text-lg font-bold text-emerald-400 block mt-1">₹{(grossRevenue - refundedRevenue).toLocaleString("en-IN")}</span>
          <span className="text-[8px] text-zinc-400 font-semibold block mt-0.5">Excludes refunds</span>
        </div>
        <div className="bg-[#0D121F] border border-[#1B2438] p-4 rounded-xl">
          <span className="text-[9px] font-bold text-zinc-500 uppercase block">Refunded Volume</span>
          <span className="text-lg font-bold text-zinc-400 block mt-1">₹{refundedRevenue.toLocaleString("en-IN")}</span>
          <span className="text-[8px] text-zinc-400 font-semibold block mt-0.5">Settled returns</span>
        </div>
        <div className="bg-[#0D121F] border border-[#1B2438] p-4 rounded-xl">
          <span className="text-[9px] font-bold text-zinc-500 uppercase block">Failed Payments</span>
          <span className="text-lg font-bold text-red-400 block mt-1">₹{failedRevenue.toLocaleString("en-IN")}</span>
          <span className="text-[8px] text-zinc-400 font-semibold block mt-0.5">Declined invoices</span>
        </div>
      </div>

      {/* Plans Distribution & breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Razorpay Control list */}
        <div className="lg:col-span-2 bg-[#0D121F] border border-[#1B2438] p-5 rounded-2xl space-y-4">
          <h3 className="font-bold text-white text-xs uppercase tracking-wider pb-2 border-b border-[#1B2438]">
            Razorpay Operations Ledger
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#1B2438] text-zinc-500 font-bold uppercase tracking-wider">
                  <th className="pb-3">Client</th>
                  <th className="pb-3 text-right">Amount</th>
                  <th className="pb-3 text-center">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="font-semibold text-zinc-300">
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-[#1C283F] hover:bg-[#151D2F] transition-colors">
                    <td className="py-3">
                      <span className="font-bold text-white block">{p.client}</span>
                      <span className="text-[8px] text-zinc-500 font-semibold block mt-0.5">{p.id} • {p.date}</span>
                    </td>
                    <td className="py-3 text-right font-mono font-bold text-zinc-100">
                      ₹{p.amount.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3">
                      <div className="flex justify-center">
                        <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full border ${
                          p.status === "Paid" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                          p.status === "Failed" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                          "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                        }`}>
                          {p.status}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-right">
                      {p.status === "Paid" && (
                        <button
                          onClick={() => handleRefund(p.id)}
                          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2 py-1 rounded text-[9px] transition-all font-bold"
                        >
                          Issue Refund
                        </button>
                      )}
                      {p.status === "Failed" && (
                        <button
                          onClick={() => handleRetry(p.id)}
                          className="bg-emerald-500 hover:bg-emerald-600 text-black px-2 py-1 rounded text-[9px] transition-all font-extrabold flex items-center gap-1 ml-auto"
                        >
                          <RefreshCw size={8} /> Retry Charge
                        </button>
                      )}
                      {p.status === "Refunded" && (
                        <span className="text-[9px] text-zinc-500 italic font-bold">Settled</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Coupon Engine */}
        <div className="bg-[#0D121F] border border-[#1B2438] p-5 rounded-2xl space-y-4">
          <h3 className="font-bold text-white text-xs uppercase tracking-wider pb-2 border-b border-[#1B2438]">
            Coupon Engine Console
          </h3>

          {/* Form */}
          <form onSubmit={handleCreateCoupon} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] font-bold text-zinc-500 uppercase">Code</label>
                <input 
                  type="text"
                  required
                  placeholder="MINTY50"
                  value={newCouponCode}
                  onChange={(e) => setNewCouponCode(e.target.value)}
                  className="w-full bg-[#0A0F1D] border border-[#1C283F] rounded-lg px-2.5 py-1.5 text-xs text-white uppercase focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-[9px] font-bold text-zinc-500 uppercase">Discount</label>
                <input 
                  type="text"
                  required
                  placeholder="20% or ₹500"
                  value={newCouponDiscount}
                  onChange={(e) => setNewCouponDiscount(e.target.value)}
                  className="w-full bg-[#0A0F1D] border border-[#1C283F] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold text-[10px] py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              <Plus size={12} /> Add Coupon
            </button>
          </form>

          {/* Coupon Grid */}
          <div className="space-y-2 pt-2">
            {coupons.map((c) => (
              <div 
                key={c.id} 
                className="flex justify-between items-center bg-[#0A0F1D] border border-[#1C283F] rounded-xl p-2.5 text-xs font-semibold"
              >
                <div>
                  <span className="font-mono font-bold text-white block">{c.code}</span>
                  <span className="text-[9px] text-zinc-400 block mt-0.5">Discount: {c.discount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded border ${
                    c.status === "Active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-zinc-500/10 text-zinc-500 border-zinc-500/20"
                  }`}>
                    {c.status}
                  </span>
                  <button 
                    onClick={() => handleDeleteCoupon(c.id)}
                    className="text-zinc-500 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>

    </div>
  );
}
