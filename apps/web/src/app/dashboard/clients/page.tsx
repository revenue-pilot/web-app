"use client";
import React, { useState } from "react";
import { Plus, Users, Heart, ArrowUpRight, ArrowDownRight, MoreHorizontal, Sparkles } from "lucide-react";
import { useSubscription } from "@/components/SubscriptionContext";
import { FeatureGate } from "@/components/FeatureGate";
import { useClients, useCreateClient } from "@/hooks/useApi";

export default function ClientsPage() {
  const { plan } = useSubscription();
  const { data: clients, loading, error, refetch } = useClients();
  const { mutate: createClient, loading: createLoading } = useCreateClient();
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Create client form states
  const [clientName, setClientName] = useState("");
  const [industry, setIndustry] = useState("E-Commerce");
  const [email, setEmail] = useState("");

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !email.trim()) return;

    const payload = { name: clientName, industry, email };

    try {
      await createClient(payload);
      refetch();
      setClientName("");
      setEmail("");
      setShowAddModal(false);
    } catch (err) {
      console.error("Error creating client:", err);
    }
  };

  const clientsList = Array.isArray(clients) ? clients : [];

  if (error) {
    return (
      <div className="max-w-6xl mx-auto py-12">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
          <h3 className="font-bold text-red-900 mb-2">Error Loading Clients</h3>
          <p className="text-red-700 text-sm mb-4">{error}</p>
          <button onClick={() => refetch()} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const pageContent = (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Client Constellation</h1>
          <p className="text-gray-500 dark:text-zinc-400 text-sm mt-0.5">Monitor client lifecycles, health scores, and managed ad performances.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 shadow-sm transition-all"
        >
          <Plus size={16} />
          <span>Add Client</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-gray-400 font-bold">Loading clients...</div>
      ) : clientsList.length === 0 ? (
        <div className="bg-white dark:bg-[#0D121F] border border-gray-200/80 dark:border-[#1B2438] rounded-3xl p-16 text-center shadow-sm max-w-xl mx-auto flex flex-col items-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <Users size={26} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">No clients added yet</h3>
          <p className="text-xs text-gray-400 max-w-xs leading-relaxed font-semibold">
            Add client accounts to link their Google & Meta Ads credentials and monitor performance metrics.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-emerald-500/10 transition-all"
          >
            Add First Client
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#0D121F] border border-gray-200/80 dark:border-[#1B2438] rounded-2xl p-6 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-[#1B2438] text-gray-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Client Name</th>
                  <th className="pb-3 font-semibold">Industry</th>
                  <th className="pb-3 font-semibold text-center">Health Index</th>
                  <th className="pb-3 font-semibold text-right">Ad Spend</th>
                  <th className="pb-3 font-semibold text-right">Conversions</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm font-medium text-gray-700 dark:text-zinc-200">
               {clientsList.map((client: any) => (
                  <tr key={client.id} className="border-b border-gray-50 dark:border-[#1B2438]/50 hover:bg-gray-50/50 dark:hover:bg-[#151D2F]/50 transition-colors">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm shadow-inner">
                          {client.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white leading-tight">{client.name}</p>
                          <p className="text-[10px] text-gray-400 font-medium mt-0.5">{client.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-gray-500 dark:text-zinc-400 font-semibold">{client.industry}</td>
                    <td className="py-4">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-12 bg-gray-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              client.health >= 85 ? "bg-emerald-500" : "bg-amber-500"
                            }`}
                            style={{ width: `${client.health}%` }}
                          ></div>
                        </div>
                        <span className={`text-xs font-bold ${
                          client.health >= 85 ? "text-emerald-500" : "text-amber-500"
                        }`}>{client.health}</span>
                      </div>
                    </td>
                    <td className="py-4 text-right font-bold text-gray-800 dark:text-zinc-100">
                      ₹{client.spend.toLocaleString("en-IN")}
                    </td>
                    <td className="py-4 text-right font-semibold text-gray-500 dark:text-zinc-400">
                      {client.conversions.toLocaleString("en-IN")}
                    </td>
                    <td className="py-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        client.status === "Active"
                          ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100/60 dark:border-emerald-500/20"
                          : "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100/60 dark:border-blue-500/20"
                      }`}>
                        {client.status}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <button className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 rounded-lg">
                        <MoreHorizontal size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0D121F] border border-gray-200 dark:border-[#1B2438] rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Add New Client Account</h3>
            <p className="text-gray-400 text-xs mb-4">Establish an organizational mapping for client attribution reporting.</p>
            
            <form onSubmit={handleAddClient} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1">Client Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. EcoMart India"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#0A0F1D] border border-gray-200 dark:border-[#1B2438] rounded-xl px-3 py-2 text-sm text-gray-700 dark:text-zinc-100 focus:outline-none focus:bg-white focus:border-emerald-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1">Industry</label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#0A0F1D] border border-gray-200 dark:border-[#1B2438] rounded-xl px-3 py-2 text-sm text-gray-700 dark:text-zinc-100 focus:outline-none focus:bg-white focus:border-emerald-500 transition-all font-semibold"
                >
                  <option>E-Commerce</option>
                  <option>Health & Fitness</option>
                  <option>Travel & Hospitality</option>
                  <option>Logistics</option>
                  <option>Finance</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1">Client Email</label>
                <input
                  type="email"
                  required
                  placeholder="billing@client.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#0A0F1D] border border-gray-200 dark:border-[#1B2438] rounded-xl px-3 py-2 text-sm text-gray-700 dark:text-zinc-100 focus:outline-none focus:bg-white focus:border-emerald-500 transition-all"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-white text-sm font-semibold px-4 py-2 border border-gray-200 dark:border-[#1B2438] rounded-xl hover:bg-gray-50 dark:hover:bg-[#151D2F] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-md shadow-emerald-500/10 transition-all"
                >
                  Add Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <FeatureGate
      moduleKey="clients"
      requiredPlan="enterprise"
      featureName="Client Constellation (Agency Portal)"
      description="Organize your team workflow, map client advertising budgets separately, whitelabel invoice lookups, and monitor client health score indices."
      benefits={[
        "Multi-tenant Agency Portal management",
        "Track sub-client organizations performance separately",
        "Access Coupon Engine & customize brand themes",
        "EnableWhitelabel Custom domains support"
      ]}
    >
      {pageContent}
    </FeatureGate>
  );
}
