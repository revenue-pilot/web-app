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

  
    </div>
  );
}
