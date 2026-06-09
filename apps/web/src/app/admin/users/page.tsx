"use client";
import React, { useState } from "react";
import { 
  Users, Key, ShieldAlert, Check, AlertTriangle, Search, 
  Trash2, Ban, ShieldCheck, Mail, LogOut
} from "lucide-react";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  organization: string;
  plan: string;
  status: string; // Active, Suspended
  lastLogin: string;
}

export default function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeNotification, setActiveNotification] = useState("");

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    async function fetchUsers() {
      try {
        const token = localStorage.getItem("token") || localStorage.getItem("auth_token");
        const res = await fetch("/api/v1/admin/users", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          // Map backend User model to our frontend UserProfile
          const mappedUsers = data.map((u: any) => ({
            id: u.id,
            name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Unknown',
            email: u.email,
            organization: u.organization?.name || 'No Organization',
            plan: 'N/A', // Would need subscription link to determine plan
            status: 'Active',
            lastLogin: u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A',
          }));
          setUsers(mappedUsers);
        }
      } catch (err) {
        console.error("Failed to fetch users", err);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  const triggerNotification = (msg: string) => {
    setActiveNotification(msg);
    setTimeout(() => setActiveNotification(""), 3000);
  };

  const handleToggleSuspend = (id: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === id) {
        const nextStatus = u.status === "Active" ? "Suspended" : "Active";
        triggerNotification(`User ${u.name} status updated to ${nextStatus}.`);
        return { ...u, status: nextStatus };
      }
      return u;
    }));
  };

  const handleResetPassword = (name: string) => {
    triggerNotification(`Password reset token sent to ${name}'s email.`);
  };

  const handleForceLogout = (name: string) => {
    triggerNotification(`Forced logout session expired for ${name}.`);
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.organization.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12 font-sans">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Users size={24} className="text-[#50BB8F]" />
          <span>Account Nexus</span>
        </h1>
        <p className="text-zinc-400 text-xs mt-0.5">Manage user profiles, reset credentials tokens, and audit user sessions.</p>
      </div>

      {/* Action Notification banner */}
      {activeNotification && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2.5 rounded-xl text-xs font-bold animate-in fade-in flex items-center gap-2">
          <ShieldCheck size={14} />
          <span>{activeNotification}</span>
        </div>
      )}

      {/* Filter box */}
      <div className="bg-[#0D121F] border border-[#1B2438] p-4 rounded-xl flex gap-4 items-center">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-3 flex items-center text-zinc-500">
            <Search size={14} />
          </span>
          <input
            type="text"
            placeholder="Search by name, email, or tenant organization..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0A0F1D] border border-[#1C283F] rounded-xl pl-9 pr-4 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500 transition-all font-semibold"
          />
        </div>
      </div>

      {/* Users Ledger card */}
      <div className="bg-[#0D121F] border border-[#1B2438] p-5 rounded-2xl shadow-sm">
        <h3 className="font-bold text-white text-xs uppercase tracking-wider pb-2 border-b border-[#1B2438] mb-4">
          User Credentials Ledger
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#1B2438] text-zinc-500 font-bold uppercase tracking-wider">
                <th className="pb-3">Name & Email</th>
                <th className="pb-3">Organization</th>
                <th className="pb-3">Plan Tier</th>
                <th className="pb-3">Last Active</th>
                <th className="pb-3 text-center">Status</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="font-semibold text-zinc-300">
              {loading ? (
                <tr><td colSpan={6} className="py-4 text-center">Loading users...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={6} className="py-4 text-center">No users found.</td></tr>
              ) : filteredUsers.map((u) => (
                <tr key={u.id} className="border-b border-[#1C283F] hover:bg-[#151D2F] transition-colors">
                  <td className="py-3">
                    <span className="font-bold text-white block">{u.name}</span>
                    <span className="text-[8px] text-zinc-500 font-semibold block mt-0.5">{u.email}</span>
                  </td>
                  <td className="py-3 text-zinc-300">
                    {u.organization}
                  </td>
                  <td className="py-3">
                    <span className="text-[9px] font-bold text-zinc-300 bg-zinc-800 border border-zinc-700/60 px-2 py-0.5 rounded-full">
                      {u.plan}
                    </span>
                  </td>
                  <td className="py-3 text-zinc-400 font-mono">
                    {u.lastLogin}
                  </td>
                  <td className="py-3">
                    <div className="flex justify-center">
                      <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full border ${
                        u.status === "Active"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-red-500/10 text-red-400 border-red-500/20"
                      }`}>
                        {u.status}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => handleResetPassword(u.name)}
                        className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2 py-1 rounded text-[9px] transition-all font-bold flex items-center gap-1"
                        title="Reset Password"
                      >
                        <Key size={10} /> Reset PW
                      </button>
                      <button
                        onClick={() => handleForceLogout(u.name)}
                        className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2 py-1 rounded text-[9px] transition-all font-bold flex items-center gap-1"
                        title="Force Logout"
                      >
                        <LogOut size={10} /> Logout
                      </button>
                      <button
                        onClick={() => handleToggleSuspend(u.id)}
                        className="text-zinc-400 hover:text-amber-500 p-1 rounded"
                        title={u.status === "Active" ? "Suspend Account" : "Activate Account"}
                      >
                        <Ban size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
