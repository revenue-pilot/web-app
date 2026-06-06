"use client";
import React, { useState } from "react";
import { Plus, Users, Shield, Send, Check, Mail } from "lucide-react";
import { useTeamMembers, useInviteTeamMember } from "@/hooks/useApi";

export default function TeamPage() {
  const { data: members, loading, error, refetch } = useTeamMembers();
  const { mutate: inviteTeamMember, loading: inviteLoading } = useInviteTeamMember();
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Invite states
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Campaign Specialist");

  const membersList = Array.isArray(members) ? members : [];

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    const payload = { email: inviteEmail, role: inviteRole };

    try {
      await inviteTeamMember(payload);
      refetch();
      setInviteEmail("");
      setShowInviteModal(false);
    } catch (err) {
      console.error("Error inviting member:", err);
    }
  };

  if (error) {
    return (
      <div className="max-w-5xl mx-auto py-12">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
          <h3 className="font-bold text-red-900 mb-2">Error Loading Team</h3>
          <p className="text-red-700 text-sm mb-4">{error}</p>
          <button onClick={() => refetch()} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Users size={24} className="text-emerald-500" />
            <span>Crew Command (Team)</span>
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage team access controls, assign roles, and audit access credentials.</p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 shadow-sm transition-all"
        >
          <Plus size={16} />
          <span>Invite Member</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-gray-400">Loading team members...</div>
      ) : (
        <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="pb-3 font-semibold">User</th>
                  <th className="pb-3 font-semibold">Email</th>
                  <th className="pb-3 font-semibold">Workspace Role</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Access Token</th>
                </tr>
              </thead>
              <tbody className="text-sm font-medium text-gray-700">
                {members.map((member) => (
                  <tr key={member.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        {member.avatar ? (
                          <img src={member.avatar} alt={member.name} className="w-9 h-9 rounded-full object-cover border border-gray-200 shadow-sm" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm shadow-inner">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="font-bold text-gray-900">{member.name}</span>
                      </div>
                    </td>
                    <td className="py-4 text-gray-500 font-semibold">{member.email}</td>
                    <td className="py-4">
                      <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                        <Shield size={14} className="text-emerald-500" />
                        <span>{member.role}</span>
                      </span>
                    </td>
                    <td className="py-4">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        member.status === "Active"
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100/60"
                          : "bg-amber-50 text-amber-600 border-amber-100/60"
                      }`}>
                        {member.status}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <button className="text-xs font-semibold border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 text-gray-500 hover:text-gray-800 transition-all">
                        Edit RBAC
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Invite Team Member</h3>
            <p className="text-gray-400 text-xs mb-4">Grant access rights to campaign builders and analyst metrics pipelines.</p>

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="teammate@agency.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-3 py-2 text-sm text-gray-700 focus:outline-none focus:bg-white focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Access Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:bg-white focus:border-emerald-500 transition-all font-semibold text-gray-600"
                >
                  <option>Agency Manager</option>
                  <option>Campaign Specialist</option>
                  <option>Analyst</option>
                  <option>Viewer</option>
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="text-gray-500 hover:text-gray-800 text-sm font-semibold px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-md shadow-emerald-500/10 transition-all flex items-center gap-1.5"
                >
                  <Send size={14} />
                  <span>Send Invite</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
