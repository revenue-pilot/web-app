"use client";
import React, { useState } from "react";
import { Plus, Layers, UserCheck, Activity, CreditCard, ChevronRight } from "lucide-react";
import { useWorkspaces } from "@/hooks/useApi";

export default function WorkspacesPage() {
  const { data: workspacesData, loading, error, refetch } = useWorkspaces();
  const [localWorkspaces, setLocalWorkspaces] = useState<any[]>([]);
  const [newSpaceName, setNewSpaceName] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  React.useEffect(() => {
    if (workspacesData && Array.isArray(workspacesData)) {
      setLocalWorkspaces(workspacesData);
    }
  }, [workspacesData]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpaceName.trim()) return;

    const payload = { name: newSpaceName, role: "Agency Owner" };
    setLocalWorkspaces([...localWorkspaces, { id: `ws_${Date.now()}`, name: newSpaceName, members: 1 }]);
    setNewSpaceName("");
    setShowCreateModal(false);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Layers size={24} className="text-emerald-500" />
            <span>Workspace Hub</span>
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage workspaces, team assignments, and workspace-level configurations.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600"
        >
          <Plus size={18} />
          New Workspace
        </button>
      </div>

      {error ? (
        <div className="bg-red-50 p-4 rounded-2xl">
          <p className="text-red-600">Error: {error}</p>
          <button onClick={() => refetch()} className="mt-2 px-4 py-2 bg-red-500 text-white rounded">Retry</button>
        </div>
      ) : loading ? (
        <div className="py-20 text-center text-gray-400">Loading workspaces...</div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {localWorkspaces.length === 0 ? (
            <div className="py-10 text-center text-gray-400">No workspaces</div>
          ) : (
            localWorkspaces.map((ws) => (
              <div
                key={ws.id}
                className="bg-white border border-gray-200/80 rounded-2xl p-6 flex justify-between items-center hover:shadow-md transition-all"
              >
                <div>
                  <h3 className="font-bold text-gray-900">{ws.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{ws.members} member{ws.members !== 1 ? 's' : ''}</p>
                </div>
                <ChevronRight className="text-gray-400" size={20} />
              </div>
            ))
          )}
        </div>
      )}

    fetch("/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then((res) => res.json())
      .then((newSpace) => {
        setWorkspaces([...workspaces, newSpace]);
        setNewSpaceName("");
        setShowCreateModal(false);
      })
      .catch(() => {
        // Fallback local append
        setWorkspaces([
          ...workspaces,
          {
            id: `space_${Date.now()}`,
            name: newSpaceName,
            role: "Agency Owner",
            activeCampaigns: 0,
            spend: 0,
            clientCount: 0,
            maxClients: 10
          }
        ]);
        setNewSpaceName("");
        setShowCreateModal(false);
      });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Orbit Workspaces</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage and switch between multi-tenant agency accounts.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-4 py-2 rounded-xl text-sm flex items-center gap-2 shadow-sm transition-all"
        >
          <Plus size={16} />
          <span>New Workspace</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-gray-400 font-bold">Loading workspaces...</div>
      ) : workspaces.length === 0 ? (
        <div className="bg-white border border-gray-200/80 rounded-3xl p-16 text-center shadow-sm max-w-xl mx-auto flex flex-col items-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <Layers size={26} />
          </div>
          <h3 className="text-lg font-bold text-gray-900">No workspaces established yet</h3>
          <p className="text-xs text-gray-400 max-w-xs leading-relaxed font-semibold">
            Create an isolated agency workspace container to manage client constellations and track campaign spend limits.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-emerald-500/10 transition-all"
          >
            Create Workspace
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {workspaces.map((space) => {
            const utilization = Math.round((space.clientCount / space.maxClients) * 100) || 0;
            return (
              <div
                key={space.id}
                className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100/60 shadow-inner">
                        <Layers size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{space.name}</h3>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-1 inline-block">
                          {space.role}
                        </span>
                      </div>
                    </div>
                    <button className="text-xs font-semibold text-emerald-500 hover:text-emerald-600 flex items-center gap-1">
                      <span>Switch</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-4 border-y border-gray-100 my-4 text-xs font-semibold text-gray-500">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Campaigns</p>
                      <p className="text-sm font-bold text-gray-800">{space.activeCampaigns} Active</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Managed Spend</p>
                      <p className="text-sm font-bold text-gray-800">₹{space.spend.toLocaleString("en-IN")}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Clients</p>
                      <p className="text-sm font-bold text-gray-800">{space.clientCount} Tenants</p>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1 font-medium">
                    <span>Quota Utilization</span>
                    <span>{space.clientCount} / {space.maxClients} Clients ({utilization}%)</span>
                  </div>
                  <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${utilization}%` }}></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Workspace Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Create Orbit Workspace</h3>
            <p className="text-gray-400 text-xs mb-4">Set up an isolated agency tenant container for managing campaign units.</p>
            
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Workspace Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Enterprise Global Marketing"
                  value={newSpaceName}
                  onChange={(e) => setNewSpaceName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:bg-white focus:border-emerald-500 transition-all"
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-500 hover:text-gray-800 text-sm font-semibold px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-md shadow-emerald-500/10 transition-all"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
