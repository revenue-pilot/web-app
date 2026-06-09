'use client';
import { useState, useEffect } from 'react';
import apiClient from '@/lib/apiClient';
import { Plus } from 'lucide-react';

export default function PipelinePage() {
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPipelines();
  }, []);

  const fetchPipelines = async () => {
    try {
      const res = await apiClient.get('/api/crm/pipelines');
      setPipelines(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const moveDeal = async (dealId: string, stageId: string) => {
    try {
      await apiClient.put(`/api/crm/pipelines/deal/${dealId}/stage`, { stageId });
      fetchPipelines(); // reload for simplicity
    } catch (err) {
      console.error('Error moving deal', err);
    }
  };

  if (loading) return <div className="p-6">Loading pipeline...</div>;
  if (!pipelines || pipelines.length === 0) return <div className="p-6">No pipelines found. Please create one.</div>;

  const pipeline = pipelines[0]; // Assuming we show the first one

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-neutral-900">{pipeline.name}</h1>
          <p className="mt-2 text-sm text-neutral-700">Drag and drop deals to move them across stages.</p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto">
            <Plus className="w-4 h-4 mr-2" /> Add Deal
          </button>
        </div>
      </div>

      <div className="mt-8 flex-1 overflow-x-auto">
        <div className="flex h-full min-h-[500px] space-x-4">
          {pipeline.stages.map((stage: any) => (
            <div 
              key={stage.id} 
              className="flex-shrink-0 w-80 flex flex-col rounded-md bg-neutral-100 p-3"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const dealId = e.dataTransfer.getData('dealId');
                if (dealId) {
                  moveDeal(dealId, stage.id);
                }
              }}
            >
              <h3 className="text-sm font-medium text-neutral-900 flex justify-between">
                {stage.name}
                <span className="text-neutral-500">{stage.deals?.length || 0}</span>
              </h3>
              <div className="mt-3 flex-1 space-y-3 overflow-y-auto">
                {stage.deals?.map((deal: any) => (
                  <div
                    key={deal.id}
                    className="bg-white p-4 rounded shadow-sm border border-neutral-200 cursor-pointer hover:shadow-md transition-shadow"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('dealId', deal.id);
                    }}
                  >
                    <p className="text-sm font-medium text-neutral-900">{deal.title}</p>
                    <p className="mt-1 text-xs text-neutral-500">${deal.value.toLocaleString()}</p>
                  </div>
                ))}
                {stage.deals?.length === 0 && (
                  <div className="p-4 border-2 border-dashed border-neutral-300 rounded text-center text-sm text-neutral-500">
                    Drop deals here
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
