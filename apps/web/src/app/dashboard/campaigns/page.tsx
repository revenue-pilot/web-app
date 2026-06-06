"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Plus, Search, Filter, Play, Pause, DollarSign, ArrowUpRight, ArrowDownRight, Edit2, Loader } from "lucide-react";
import { useCampaigns, useUpdateCampaign } from "@/hooks/useApi";

export default function CampaignsPage() {
  const { data: campaigns, loading, error, refetch } = useCampaigns();
  const { mutate: updateCampaign } = useUpdateCampaign("");
  const [searchQuery, setSearchQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // Budget Edit modal states
  const [editCampaign, setEditCampaign] = useState<any>(null);
  const [newBudget, setNewBudget] = useState("");
  const [updateLoading, setUpdateLoading] = useState(false);

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "Active" ? "Paused" : "Active";
    setUpdateLoading(true);
    try {
      await updateCampaign({ status: newStatus });
      refetch(); // Refresh data after update
    } catch (err) {
      console.error("Error updating campaign:", err);
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleOpenBudgetModal = (campaign: any) => {
    setEditCampaign(campaign);
    setNewBudget(campaign.budgetNum?.toString() || "0");
  };

  const handleUpdateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(newBudget);
    if (isNaN(val) || val <= 0) return;

    setUpdateLoading(true);
    try {
      await updateCampaign({ budget: val });
      refetch();
      setEditCampaign(null);
    } catch (err) {
      console.error("Error updating budget:", err);
    } finally {
      setUpdateLoading(false);
    }
  };

  const campaignsList = Array.isArray(campaigns) ? campaigns : [];

  const filteredCampaigns = campaignsList.filter((c: any) => {
    const matchesSearch = c.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlatform = platformFilter === "All" || c.platform?.startsWith(platformFilter);
    const matchesStatus = statusFilter === "All" || c.status === statusFilter;
    return matchesSearch && matchesPlatform && matchesStatus;
  });

  if (error) {
    return (
      <div className="max-w-7xl mx-auto py-12">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
          <h3 className="font-bold text-red-900 mb-2">Error Loading Campaigns</h3>
          <p className="text-red-700 text-sm mb-4">{error}</p>
          <button onClick={() => refetch()} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">RevenuePilot Studio</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage and control active campaign budgets, ad copies, and networks.</p>
        </div>
        <Link
          href="/dashboard/campaign-wizard"
          className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 shadow-sm transition-all"
        >
          <Plus size={16} />
          <span>Launch Campaign</span>
        </Link>
      </div>

      {/* Filters Row */}
      <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-3 py-2 text-sm text-gray-700 focus:outline-none focus:bg-white focus:border-emerald-500 transition-all font-semibold"
          />
        </div>

        <div className="flex gap-3 w-full sm:w-auto">
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-500 focus:outline-none shadow-sm flex-1 sm:flex-initial"
          >
            <option value="All">All Networks</option>
            <option value="Google">Google Ads</option>
            <option value="Meta">Meta Ads</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-500 focus:outline-none shadow-sm flex-1 sm:flex-initial"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Paused">Paused</option>
          </select>
        </div>
      </div>

      {/* Campaigns Table */}
      {loading ? (
        <div className="py-20 text-center text-gray-400 font-bold">Loading campaigns...</div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="bg-white border border-gray-200/80 rounded-3xl p-16 text-center shadow-sm max-w-xl mx-auto flex flex-col items-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <Plus size={26} />
          </div>
          <h3 className="text-lg font-bold text-gray-900">No campaigns launched yet</h3>
          <p className="text-xs text-gray-400 max-w-xs leading-relaxed font-semibold">
            Deploy your first automated search, display, or PMax ads campaign now to sync performance analytics.
          </p>
          <Link
            href="/dashboard/campaign-wizard"
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-emerald-500/10 transition-all inline-block"
          >
            Launch Campaign
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Campaign Name</th>
                  <th className="pb-3 font-semibold">Platform</th>
                  <th className="pb-3 font-semibold text-right">Daily Budget</th>
                  <th className="pb-3 font-semibold text-right">Spend</th>
                  <th className="pb-3 font-semibold text-right">Conversions</th>
                  <th className="pb-3 font-semibold text-right">ROAS</th>
                  <th className="pb-3 font-semibold text-center">Status</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm font-medium text-gray-700">
                {filteredCampaigns.map((camp) => (
                  <tr key={camp.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="py-4">
                      <Link href={`/dashboard/campaigns/${camp.id}`} className="font-bold text-gray-900 hover:text-emerald-500 transition-colors block">
                        {camp.name}
                      </Link>
                      <span className="text-[10px] text-gray-400 mt-1 block font-semibold">
                        {camp.clicks.toLocaleString()} Clicks • {camp.impressions.toLocaleString()} Imps
                      </span>
                    </td>
                    <td className="py-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        camp.platform.startsWith("Google")
                          ? "bg-red-50 text-red-600 border-red-100/60"
                          : "bg-blue-50 text-blue-600 border-blue-100/60"
                      }`}>
                        {camp.platform}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 font-bold text-gray-900">
                        <span>₹{camp.budgetNum.toLocaleString("en-IN")}</span>
                        <button
                          onClick={() => handleOpenBudgetModal(camp)}
                          className="p-1 hover:bg-gray-50 rounded text-gray-400 hover:text-gray-700"
                        >
                          <Edit2 size={12} />
                        </button>
                      </div>
                    </td>
                    <td className="py-4 text-right font-bold text-gray-800">
                      ₹{camp.spendNum.toLocaleString("en-IN")}
                    </td>
                    <td className="py-4 text-right font-semibold text-gray-500">
                      {camp.conversions.toLocaleString()}
                    </td>
                    <td className="py-4 text-right">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${
                        camp.roasNum >= 4.0 ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
                      }`}>
                        {camp.roasNum}x
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex justify-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          camp.status === "Active"
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100/60"
                            : "bg-gray-50 text-gray-400 border-gray-200/60"
                        }`}>
                          {camp.status}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 text-right">
                      <button
                        onClick={() => handleToggleStatus(camp.id, camp.status)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ml-auto ${
                          camp.status === "Active"
                            ? "bg-white hover:bg-gray-50 text-amber-500 border-gray-200"
                            : "bg-emerald-500 hover:bg-emerald-600 text-white border-transparent"
                        }`}
                      >
                        {camp.status === "Active" ? (
                          <>
                            <Pause size={12} />
                            <span>Pause</span>
                          </>
                        ) : (
                          <>
                            <Play size={12} />
                            <span>Run</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Budget Modal */}
      {editCampaign && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Adjust Daily Budget</h3>
            <p className="text-gray-400 text-xs mb-4">Set the maximum daily spend limit for campaign: <strong>{editCampaign.name}</strong>.</p>
            
            <form onSubmit={handleUpdateBudget} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Daily Limit (₹)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-gray-500 font-bold text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    required
                    value={newBudget}
                    onChange={(e) => setNewBudget(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-3 py-2 text-sm text-gray-700 focus:outline-none focus:bg-white focus:border-emerald-500 transition-all font-bold"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setEditCampaign(null)}
                  className="text-gray-500 hover:text-gray-800 text-sm font-semibold px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-md shadow-emerald-500/10 transition-all"
                >
                  Save Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
