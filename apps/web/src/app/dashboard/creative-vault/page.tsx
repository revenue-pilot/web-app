"use client";
import React, { useState, useEffect, useRef } from "react";
import { 
  FolderOpen, FileText, Image as ImageIcon, Video, UploadCloud, Tag, 
  Trash2, BrainCircuit, Sparkles, Crop, Sliders, CheckCircle2, 
  Loader2, Maximize2, RefreshCw, Layers, ShieldCheck, AlertTriangle,
  Lock, Zap
} from "lucide-react";
import { useSubscription, PlanTier } from "@/components/SubscriptionContext";
import { UpgradeModal } from "@/components/UpgradeModal";

interface AssetVersion {
  ratio: string;
  name: string;
  width: number;
  height: number;
  status: string;
  generatedByAI: boolean;
}

interface CreativeAsset {
  id: string;
  name: string;
  type: string;
  size: string;
  tag: string;
  version: string;
  lastModified: string;
  width: number | null;
  height: number | null;
  aspectRatio: string | null;
  focalPoint: { x: number; y: number } | null;
  detectedFaces: number | null;
  qualityScore: number | null;
  versions: AssetVersion[];
}

export default function CreativeVaultPage() {
  const { plan, limits, usage, isNearingLimit, isAtLimit, getUsagePercentage, changePlan } = useSubscription();
  const [upgradeRequiredPlan, setUpgradeRequiredPlan] = useState<PlanTier | null>(null);

  const [assets, setAssets] = useState<CreativeAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedAsset, setSelectedAsset] = useState<CreativeAsset | null>(null);

  // Upload simulation states
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStep, setUploadStep] = useState("");
  const [simulatedFileName, setSimulatedFileName] = useState("");
  const [simulatedFileType, setSimulatedFileType] = useState("image/png");

  // Crop edit states
  const [activeRatio, setActiveRatio] = useState<string>("1:1");
  const [cropX, setCropX] = useState<number>(50);
  const [cropY, setCropY] = useState<number>(50);
  const [cropZoom, setCropZoom] = useState<number>(100);
  const [savingCrop, setSavingCrop] = useState(false);

  // AI assistant states
  const [aiAnalyzing, setAiAnalyzing] = useState(false);

  const uploadIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (uploadIntervalRef.current) {
        clearInterval(uploadIntervalRef.current);
      }
    };
  }, []);

  const filters = ["All", "Image", "Video", "Document"];

  // Fetch assets from backend
  const fetchAssets = () => {
    setLoading(true);
    fetch("/api/creatives")
      .then((res) => res.json())
      .then((data) => {
        setAssets(data);
        if (data.length > 0 && !selectedAsset) {
          setSelectedAsset(data[0]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch assets", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAssets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedAsset) {
      // Sync crop controls with selected asset's focal point if it exists
      if (selectedAsset.focalPoint) {
        setCropX(selectedAsset.focalPoint.x);
        setCropY(selectedAsset.focalPoint.y);
      } else {
        setCropX(50);
        setCropY(50);
      }
      setCropZoom(100);
    }
  }, [selectedAsset]);

  const handleSelectAsset = (asset: CreativeAsset) => {
    setSelectedAsset(asset);
  };

  // Mock upload logic
  const triggerMockUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSimulatedFileName(file.name);
    setSimulatedFileType(file.type);
    simulateVisionScan(file.name, file.type, `${(file.size / (1024 * 1024)).toFixed(1)} MB`);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSimulatedFileName(file.name);
      setSimulatedFileType(file.type);
      simulateVisionScan(file.name, file.type, `${(file.size / (1024 * 1024)).toFixed(1)} MB`);
    }
  };

  const simulateVisionScan = (name: string, type: string, size: string) => {
    setUploading(true);
    setUploadProgress(10);
    setUploadStep("Initializing secure asset tunnel...");

    const steps = [
      { progress: 30, step: "Extracting metadata and file format..." },
      { progress: 55, step: "Running OpenCV focal point analysis..." },
      { progress: 75, step: "AI face detection & resolution mapping..." },
      { progress: 90, step: "Generating automatic crop anchors..." },
      { progress: 100, step: "Finalizing Creative Vault cataloging..." }
    ];

    if (uploadIntervalRef.current) {
      clearInterval(uploadIntervalRef.current);
    }
    let currentStep = 0;
    uploadIntervalRef.current = setInterval(() => {
      if (currentStep < steps.length) {
        setUploadProgress(steps[currentStep].progress);
        setUploadStep(steps[currentStep].step);
        currentStep++;
      } else {
        if (uploadIntervalRef.current) {
          clearInterval(uploadIntervalRef.current);
          uploadIntervalRef.current = null;
        }
        // Call backend API to create the creative
        fetch("/api/creatives", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name,
            type,
            size,
            tag: type.startsWith("image") ? "Meta Ads" : "Brand Assets"
          })
        })
          .then((res) => res.json())
          .then((newAsset) => {
            setAssets((prev) => [newAsset, ...prev]);
            setSelectedAsset(newAsset);
            setUploading(false);
            setUploadProgress(0);
            setUploadStep("");
          })
          .catch((err) => {
            console.error("Upload error", err);
            setUploading(false);
          });
      }
    }, 800);
  };

  // Generate / Save Aspect Ratio Crops
  const handleGenerateRatio = (ratio: string) => {
    if (!selectedAsset) return;
    setSavingCrop(true);

    fetch("/api/creatives/generate-ratios", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        assetId: selectedAsset.id,
        ratio
      })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          // Update local assets array
          setAssets((prev) => prev.map((a) => (a.id === data.asset.id ? data.asset : a)));
          setSelectedAsset(data.asset);
        }
        setSavingCrop(false);
      })
      .catch((err) => {
        console.error("Generate ratio error", err);
        setSavingCrop(false);
      });
  };

  const handleApplyAllCrops = () => {
    if (!selectedAsset) return;
    setAiAnalyzing(true);
    
    // Sequentially apply all required Crops (1:1, 9:16, 1.91:1, 4:1)
    const targetRatios = ["1:1", "9:16", "1.91:1", "4:1"];
    let promise = Promise.resolve();

    targetRatios.forEach((ratio) => {
      promise = promise.then(() => {
        return fetch("/api/creatives/generate-ratios", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assetId: selectedAsset.id, ratio })
        })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setAssets((prev) => prev.map((a) => (a.id === data.asset.id ? data.asset : a)));
            setSelectedAsset(data.asset);
          }
        });
      });
    });

    promise.finally(() => {
      setAiAnalyzing(false);
    });
  };

  const handleDeleteAsset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAssets((prev) => prev.filter((a) => a.id !== id));
    if (selectedAsset?.id === id) {
      setSelectedAsset(null);
    }
  };

  const filteredAssets = activeFilter === "All" 
    ? assets 
    : assets.filter((asset) => asset.type === activeFilter);

  const getIcon = (type: string) => {
    switch (type) {
      case "Image": return <ImageIcon size={20} className="text-emerald-500" />;
      case "Video": return <Video size={20} className="text-blue-500" />;
      default: return <FileText size={20} className="text-violet-500" />;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <FolderOpen size={24} className="text-emerald-500" />
            <span>Creative Vault</span>
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Centralized, AI-powered media repository with focal point analysis & ratio generation.</p>
        </div>
      </div>

      {/* Upload Simulation Overlay */}
      {uploading && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center space-y-6">
            <div className="relative w-20 h-20 mx-auto">
              <Loader2 size={80} className="text-emerald-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <BrainCircuit size={32} className="text-emerald-600 animate-pulse" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-gray-900">CreativePilot AI Scanning</h3>
              <p className="text-xs text-gray-500 font-medium truncate max-w-full">
                Processing {simulatedFileName}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div 
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[10px] text-gray-400 font-bold">
                <span>{uploadStep}</span>
                <span>{uploadProgress}%</span>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex gap-3 text-left">
              <Sparkles size={18} className="text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="text-xs font-bold text-emerald-800">Dynamic Autofit Enabled</span>
                <p className="text-[10px] text-emerald-600 font-medium">RevenuePilot is scanning for dominant subjects and text bounds to automate multi-ratio crops.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Upload & Category & Asset List (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Upload Zone (1/3 width) */}
            <div 
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="md:col-span-1 bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between"
            >
              <h3 className="font-bold text-gray-900 text-xs mb-3 flex items-center gap-1.5">
                <UploadCloud size={14} className="text-emerald-500" />
                <span>Upload Creative</span>
              </h3>
              
              <label className="border-2 border-dashed border-gray-200 hover:border-emerald-500 hover:bg-emerald-50/20 transition-all rounded-xl p-4 text-center cursor-pointer flex flex-col items-center justify-center h-28">
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*,video/*,.pdf,.xlsx"
                  onChange={triggerMockUpload}
                />
                <UploadCloud size={24} className="text-gray-400 mb-1.5" />
                <span className="text-[10px] font-bold text-gray-700">Drop files or click</span>
                <span className="text-[8px] text-gray-400 mt-0.5">PNG, JPG, MP4</span>
              </label>

              <p className="text-[8px] text-gray-400 font-medium mt-3 leading-relaxed">
                Assets will run through an automated vision classifier and Focal Point scanning.
              </p>
            </div>
            {/* Asset Categories & Statistics (2/3 width) */}
            <div className="md:col-span-2 bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-gray-900 text-xs mb-3 flex items-center gap-1.5">
                  <Layers size={14} className="text-emerald-500" />
                  <span>Asset Categories</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {filters.map((f) => (
                    <button
                      key={f}
                      onClick={() => setActiveFilter(f)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        activeFilter === f
                          ? "bg-emerald-50 border-emerald-200 text-emerald-600 shadow-sm"
                          : "bg-white border-gray-100 text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-gray-50 text-center">
                <div>
                  <span className="block text-[8px] font-bold text-gray-400 uppercase tracking-wider">Images</span>
                  <span className="text-sm font-bold text-gray-800">{assets.filter(a => a.type === "Image").length}</span>
                </div>
                <div>
                  <span className="block text-[8px] font-bold text-gray-400 uppercase tracking-wider">Videos</span>
                  <span className="text-sm font-bold text-gray-800">{assets.filter(a => a.type === "Video").length}</span>
                </div>
                <div>
                  <span className="block text-[8px] font-bold text-gray-400 uppercase tracking-wider">Total</span>
                  <span className="text-sm font-bold text-gray-800">{assets.length}</span>
                </div>
              </div>

              {/* Storage Meter */}
              <div className="mt-4 pt-3 border-t border-gray-100/60 space-y-1.5">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="font-bold text-gray-500 flex items-center gap-1">
                    <ShieldCheck size={11} className="text-emerald-500" />
                    <span>Vault Storage</span>
                  </span>
                  <span className="font-bold text-gray-700">
                    {usage.storage.toFixed(1)} GB / {limits.storage === 9999 ? "Unlimited" : `${limits.storage} GB`}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      isNearingLimit("storage") ? "bg-amber-500" : isAtLimit("storage") ? "bg-red-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${getUsagePercentage("storage")}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[8px] font-bold text-gray-400">
                  <span>{getUsagePercentage("storage")}% of plan allowance</span>
                  {plan === "starter" && (
                    <button
                      type="button"
                      onClick={() => setUpgradeRequiredPlan("Revenue")}
                      className="text-emerald-500 hover:text-emerald-600 transition-colors uppercase tracking-wider flex items-center gap-1"
                    >
                      <Lock size={8} />
                      <span>Upgrade for 50GB</span>
                    </button>
                  )}
                  {plan === "Revenue" && (
                    <button
                      type="button"
                      onClick={() => setUpgradeRequiredPlan("pro")}
                      className="text-emerald-500 hover:text-emerald-600 transition-colors uppercase tracking-wider flex items-center gap-1"
                    >
                      <Lock size={8} />
                      <span>Upgrade for 200GB</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Assets Grid list */}
          {loading ? (
            <div className="bg-white border border-gray-200/80 rounded-2xl p-12 text-center text-gray-400 font-semibold shadow-sm flex items-center justify-center gap-2">
              <Loader2 size={16} className="animate-spin text-emerald-500" />
              <span>Cataloging Vault contents...</span>
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="bg-white border border-gray-200/80 rounded-2xl p-12 text-center text-gray-400 font-semibold shadow-sm">
              No assets found in this category. Upload one to get started!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredAssets.map((asset) => (
                <div 
                  key={asset.id} 
                  onClick={() => handleSelectAsset(asset)}
                  className={`bg-white border rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-emerald-200/80 cursor-pointer transition-all flex flex-col justify-between group relative overflow-hidden ${
                    selectedAsset?.id === asset.id 
                      ? "border-emerald-500 ring-2 ring-emerald-500/10 shadow-emerald-500/5 bg-emerald-50/5" 
                      : "border-gray-200/80"
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100 shadow-sm">
                        {getIcon(asset.type)}
                      </div>
                      <div className="flex gap-1.5 items-center">
                        {asset.versions.length > 0 && (
                          <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">
                            {asset.versions.length} Ratios
                          </span>
                        )}
                        <span className="text-[8px] font-bold text-gray-400 border border-gray-100 bg-gray-50 px-1.5 py-0.5 rounded">
                          {asset.version}
                        </span>
                      </div>
                    </div>
                    
                    <h4 className="font-bold text-gray-900 text-xs truncate max-w-[200px]">
                      {asset.name}
                    </h4>
                    <p className="text-[9px] text-gray-400 mt-0.5 font-semibold">
                      {asset.size} • Modified {asset.lastModified}
                    </p>
                    
                    {asset.width && asset.height && (
                      <span className="text-[8px] text-gray-400 font-medium block mt-1">
                        Dimensions: {asset.width} x {asset.height} ({asset.aspectRatio})
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-center mt-4 pt-2.5 border-t border-gray-50">
                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Tag size={8} />
                      {asset.tag}
                    </span>
                    <button 
                      onClick={(e) => handleDeleteAsset(asset.id, e)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50 opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Selected Asset Intelligence & RatioForge Studio (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {selectedAsset ? (
            <div className="space-y-6">
              
              {/* RatioForge Cropper Workspace */}
              <div className="bg-white border border-gray-200/80 rounded-2xl shadow-sm overflow-hidden flex flex-col relative">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <div className="flex items-center gap-1.5">
                    <Crop size={14} className="text-emerald-500" />
                    <span className="font-bold text-xs text-gray-900">RatioForge Studio</span>
                  </div>
                  {selectedAsset.type === "Image" && (
                    <span className="text-[9px] font-bold text-gray-400 bg-white px-2 py-0.5 border border-gray-200/60 rounded">
                      Focal Target Active
                    </span>
                  )}
                </div>

                {/* Cropping Canvas Simulator */}
                <div className="p-5 flex flex-col items-center bg-gray-100/40 relative min-h-[220px] justify-center border-b border-gray-100">
                  {selectedAsset.type === "Image" ? (
                    <div className="relative max-w-full max-h-[200px] border border-gray-200 shadow-lg rounded bg-white overflow-hidden group">
                      
                      {/* Simulating focal-point and aspect ratio mask overlay */}
                      <img 
                        src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80" 
                        alt={selectedAsset.name}
                        className="object-cover max-h-[180px] w-full"
                        style={{
                          transform: `scale(${cropZoom / 100})`,
                          objectPosition: `${cropX}% ${cropY}%`
                        }}
                      />

                      {/* Focal point indicator */}
                      <div 
                        className="absolute w-8 h-8 -ml-4 -mt-4 border-2 border-dashed border-emerald-500 rounded-full flex items-center justify-center bg-emerald-500/20 backdrop-blur-xs transition-all pointer-events-none"
                        style={{ left: `${cropX}%`, top: `${cropY}%` }}
                      >
                        <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full"></div>
                      </div>

                      {/* Aspect Ratio Box Mask Guide */}
                      <div 
                        className={`absolute inset-0 border-2 border-emerald-500/60 pointer-events-none transition-all ${
                          activeRatio === "1:1" ? "aspect-square max-w-[120px] max-h-[120px] m-auto" :
                          activeRatio === "9:16" ? "aspect-[9/16] max-w-[80px] max-h-[140px] m-auto" :
                          activeRatio === "1.91:1" ? "aspect-[1.91/1] max-w-[180px] max-h-[94px] m-auto" :
                          "aspect-[4/1] max-w-[190px] max-h-[48px] m-auto"
                        }`}
                      >
                        <span className="absolute -top-4 left-0 bg-emerald-500 text-white text-[7px] font-bold px-1 py-0.2 rounded-t shadow">
                          {activeRatio} Box Guide
                        </span>
                      </div>
                    </div>
                  ) : selectedAsset.type === "Video" ? (
                    <div className="relative w-full aspect-video max-h-[180px] border border-gray-200 shadow-lg rounded bg-slate-900 overflow-hidden flex items-center justify-center">
                      <Video size={36} className="text-gray-600 animate-pulse" />
                      <span className="absolute bottom-2 right-2 text-[8px] bg-black/60 text-white px-2 py-0.5 rounded font-bold">
                        Video Ratios Locked
                      </span>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-gray-400 flex flex-col items-center">
                      <FileText size={40} className="text-gray-300 mb-2" />
                      <span className="text-xs font-bold">Document Metadata Only</span>
                      <span className="text-[10px] text-gray-400">Cropping is disabled for documents.</span>
                    </div>
                  )}

                  {selectedAsset.type === "Image" && (
                    <div className="w-full mt-4 space-y-3">
                      {/* Crop adjust controls */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-gray-400 flex justify-between uppercase">
                            <span>Focal Point X</span>
                            <span>{cropX}%</span>
                          </label>
                          <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={cropX}
                            onChange={(e) => setCropX(parseInt(e.target.value))}
                            className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-gray-400 flex justify-between uppercase">
                            <span>Focal Point Y</span>
                            <span>{cropY}%</span>
                          </label>
                          <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={cropY}
                            onChange={(e) => setCropY(parseInt(e.target.value))}
                            className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Aspect ratio list / Action buttons */}
                {selectedAsset.type === "Image" && (
                  <div className="p-4 space-y-4">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Target Dimensions</span>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { ratio: "1:1", label: "Meta Feed" },
                        { ratio: "9:16", label: "Meta Story" },
                        { ratio: "1.91:1", label: "Landscape" },
                        { ratio: "4:1", label: "Google Logo" }
                      ].map((item) => {
                        const hasVersion = selectedAsset.versions.some(v => v.ratio === item.ratio);
                        return (
                          <button
                            key={item.ratio}
                            type="button"
                            onClick={() => setActiveRatio(item.ratio)}
                            className={`p-2 rounded-xl border text-center transition-all flex flex-col justify-between items-center h-14 ${
                              activeRatio === item.ratio 
                                ? "border-emerald-500 bg-emerald-50/30 ring-1 ring-emerald-500" 
                                : "border-gray-200 hover:bg-gray-50"
                            }`}
                          >
                            <span className="text-[8px] font-bold text-gray-400 block truncate w-full">{item.label}</span>
                            <span className="text-[9px] font-extrabold text-gray-800 block">{item.ratio}</span>
                            <div className="flex gap-0.5 mt-0.5">
                              <span className={`w-1.5 h-1.5 rounded-full ${hasVersion ? "bg-emerald-500" : "bg-gray-200"}`}></span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => handleGenerateRatio(activeRatio)}
                        disabled={savingCrop}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-sm shadow-emerald-500/10 flex items-center justify-center gap-1.5"
                      >
                        {savingCrop ? (
                          <>
                            <Loader2 size={12} className="animate-spin" />
                            <span>Regenerating...</span>
                          </>
                        ) : (
                          <>
                            <Crop size={12} />
                            <span>Confirm & Generate {activeRatio}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Starter Plan Lock Overlay */}
                {plan === "starter" && (
                  <div className="absolute inset-0 bg-white/95 dark:bg-[#0D121F]/95 backdrop-blur-xs z-10 flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mb-3">
                      <Lock size={22} />
                    </div>
                    <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 uppercase tracking-wider mb-2">
                      Revenue Plan Feature
                    </span>
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-1">RatioForge Studio Locked</h4>
                    <p className="text-[10px] text-gray-500 dark:text-zinc-400 max-w-[240px] leading-relaxed mb-4">
                      Create perfect aspect ratios for Meta Feed, Stories, and Google Ads using AI focal points automatically.
                    </p>
                    <button
                      type="button"
                      onClick={() => setUpgradeRequiredPlan("Revenue")}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md transition-all flex items-center gap-1.5"
                    >
                      <Zap size={12} fill="currentColor" />
                      <span>Upgrade to Revenue</span>
                    </button>
                  </div>
                )}
              </div>

              {/* CreativePilot AI - Asset Intelligence Panel */}
              <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-xs text-gray-900 flex items-center gap-1.5">
                    <BrainCircuit size={14} className="text-emerald-500" />
                    <span>CreativePilot AI Engine</span>
                  </h3>
                  <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                    Confidence: 96%
                  </span>
                </div>

                <div className="space-y-2 text-[10px] leading-relaxed">
                  
                  {/* Quality Check */}
                  <div className="flex items-start gap-2.5 p-2 bg-emerald-50/30 border border-emerald-100/50 rounded-xl">
                    <ShieldCheck size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-emerald-800">Vision Analysis Passed</span>
                      <p className="text-emerald-600 mt-0.5">Asset quality score is {selectedAsset.qualityScore}%. Resolution is high enough for all major platform placements.</p>
                    </div>
                  </div>

                  {/* Face detection warning/status */}
                  {selectedAsset.type === "Image" && (
                    <div className="flex items-start gap-2.5 p-2 bg-gray-50 border border-gray-100 rounded-xl">
                      <Sliders size={14} className="text-gray-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-gray-700">Focal Point Mapping</span>
                        <p className="text-gray-400 mt-0.5">
                          {selectedAsset.detectedFaces && selectedAsset.detectedFaces > 0 
                            ? `Detected ${selectedAsset.detectedFaces} face(s) in asset. Focal center automatically locked to coordinates (${selectedAsset.focalPoint?.x}, ${selectedAsset.focalPoint?.y}).`
                            : "No faces detected. Center focused automatically."}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  <div className="space-y-1.5 pt-1">
                    <span className="font-bold text-gray-500 block">Ratio Coverage Checklist</span>
                    <div className="space-y-1">
                      {["1:1", "9:16", "1.91:1", "4:1"].map((r) => {
                        const hasVersion = selectedAsset.versions.some(v => v.ratio === r);
                        return (
                          <div key={r} className="flex items-center justify-between py-1 border-b border-gray-50">
                            <span className="text-gray-500 font-bold">{r} Placements</span>
                            {hasVersion ? (
                              <span className="text-emerald-600 font-bold flex items-center gap-1 text-[8px]">
                                <CheckCircle2 size={10} /> Ready
                              </span>
                            ) : (
                              <span className="text-amber-500 font-bold flex items-center gap-1 text-[8px]">
                                <AlertTriangle size={10} /> Missing
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-50">
                  <button
                    type="button"
                    onClick={handleApplyAllCrops}
                    disabled={aiAnalyzing || selectedAsset.type !== "Image"}
                    className="w-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100/80 border border-emerald-100 font-bold text-xs py-2 rounded-xl transition-all flex items-center justify-center gap-1"
                  >
                    {aiAnalyzing ? (
                      <>
                        <Loader2 size={12} className="animate-spin" />
                        <span>Re-framing assets...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={12} />
                        <span>Run AI Auto-Crop For All Placements</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-white border border-gray-200/80 rounded-2xl p-8 text-center text-gray-400 font-semibold shadow-sm">
              Select an asset from the library to launch RatioForge or run AI analysis.
            </div>
          )}
        </div>
      </div>

      <UpgradeModal
        isOpen={upgradeRequiredPlan !== null}
        onClose={() => setUpgradeRequiredPlan(null)}
        requiredPlan={upgradeRequiredPlan || "Revenue"}
        featureName="RatioForge Crop Studio"
        onUpgrade={changePlan}
      />
    </div>
  );
}


