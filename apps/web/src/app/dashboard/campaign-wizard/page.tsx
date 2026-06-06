"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSubscription } from "@/components/SubscriptionContext";
import { UpgradeModal } from "@/components/UpgradeModal";
import { 
  Sparkles, Check, AlertTriangle, AlertCircle, RefreshCw, Eye, 
  HelpCircle, ChevronRight, ChevronLeft, Target, Globe, Copy, 
  Settings, Layout, Image as ImageIcon, Send, ArrowRight, Play, CheckCircle2
} from "lucide-react";

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

export default function CampaignWizardPage() {
  const { plan, isAtLimit, changePlan } = useSubscription();
  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [clients, setClients] = useState<any[]>([]);
  const [vaultAssets, setVaultAssets] = useState<CreativeAsset[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  
  // Wizard state
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["meta"]); // meta, google
  const [selectedObjective, setSelectedObjective] = useState("Leads");
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  
  // Copy state
  const [headline, setHeadline] = useState("");
  const [description, setDescription] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [dailyBudget, setDailyBudget] = useState("5000");

  // Previews active preview channel
  const [previewChannel, setPreviewChannel] = useState("meta_feed"); // meta_feed, meta_story, google_search, google_display, youtube

  // Deploy simulation states
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploySteps, setDeploySteps] = useState<any[]>([]);
  const [deploySuccess, setDeploySuccess] = useState(false);
  const [deployError, setDeployError] = useState("");
  const deployIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (deployIntervalRef.current) {
        clearInterval(deployIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Fetch Clients
    fetch("/api/clients")
      .then((res) => res.json())
      .then((data) => {
        setClients(data);
        if (data.length > 0) setSelectedClient(data[0].id);
        setLoadingClients(false);
      })
      .catch(() => {
        setClients([
          { id: "client_1", name: "EcoMart India" },
          { id: "client_2", name: "FitLife Gyms" },
          { id: "client_3", name: "UrbanStays Hotel" }
        ]);
        setSelectedClient("client_1");
        setLoadingClients(false);
      });

    // Fetch Vault Assets
    fetch("/api/creatives")
      .then((res) => res.json())
      .then((data) => {
        setVaultAssets(data);
      })
      .catch(() => {
        console.error("Failed to load vault assets");
      });
  }, []);

  // Sync campaign name default
  useEffect(() => {
    if (selectedClient) {
      const clientName = clients.find(c => c.id === selectedClient)?.name || "Client";
      setCampaignName(`${clientName} - ${selectedObjective} - PMax`);
    }
  }, [selectedClient, selectedObjective, clients]);

  // Validation rules
  const headlineLimit = 30;
  const descriptionLimit = 90;
  const headlineExceeds = headline.length > headlineLimit;
  const descriptionExceeds = description.length > descriptionLimit;

  // Policy scan keyword list
  const restrictedKeywords = ["crypto", "guaranteed", "overnight weight loss", "earn $", "bitcoin", "casino"];
  const scanForPolicyAlert = () => {
    const combined = `${headline} ${description}`.toLowerCase();
    return restrictedKeywords.filter(kw => combined.includes(kw));
  };

  const policyAlerts = scanForPolicyAlert();

  // Helper: auto-generate crop for an asset
  const handleAutoGenerateCrop = (assetId: string, ratio: string) => {
    fetch("/api/creatives/generate-ratios", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ assetId, ratio })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          // Update local state
          setVaultAssets(prev => prev.map(a => a.id === data.asset.id ? data.asset : a));
        }
      });
  };

  // Submit and deployment simulation
  const handleDeployCampaign = () => {
    if (isAtLimit("campaigns")) {
      setModalOpen(true);
      return;
    }
    setIsDeploying(true);
    setDeploySteps([]);
    setDeploySuccess(false);

    // Initial deployment steps
    const initialSteps = [
      { name: "Policy Pre-check", status: "PENDING", details: "Scanning copy text for restricted guidelines..." },
      { name: "Ad Copy Validation", status: "PENDING", details: "Verifying length and target keywords matches..." },
      { name: "Asset Processing", status: "PENDING", details: "Matching aspect ratio configs and Focal anchors..." },
      { name: "Meta Ad Account Deployment", status: "PENDING", details: "Pushing pixel configurations and campaign groups..." },
      { name: "Google Ads Account Deployment", status: "PENDING", details: "Populating responsive display matrix and target keywords..." },
      { name: "Status Activation", status: "PENDING", details: "Enabling campaign tags. Setting status to ACTIVE..." }
    ];

    setDeploySteps(initialSteps);

    // Post to backend deploy endpoint
    fetch("/api/campaigns/deploy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        clientId: selectedClient,
        platforms: selectedPlatforms,
        objective: selectedObjective,
        assets: selectedAssetIds,
        campaignName,
        headline,
        description,
        budget: dailyBudget
      })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          if (deployIntervalRef.current) {
            clearInterval(deployIntervalRef.current);
          }
          // Iterate and show success step by step
          let stepIdx = 0;
          deployIntervalRef.current = setInterval(() => {
            if (stepIdx < data.steps.length) {
              setDeploySteps(prev => prev.map((step, idx) => {
                if (idx === stepIdx) {
                  return { ...step, status: "SUCCESS", details: data.steps[idx].details };
                }
                return step;
              }));
              stepIdx++;
            } else {
              if (deployIntervalRef.current) {
                clearInterval(deployIntervalRef.current);
                deployIntervalRef.current = null;
              }
              setDeploySuccess(true);
              setIsDeploying(false);
            }
          }, 1200);
        } else {
          setDeployError("Failed to authenticate API tokens.");
          setIsDeploying(false);
        }
      })
      .catch((err) => {
        setDeployError("Connection to backend timed out.");
        setIsDeploying(false);
      });
  };

  const handleTogglePlatform = (platform: string) => {
    if (selectedPlatforms.includes(platform)) {
      if (selectedPlatforms.length > 1) {
        setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform));
      }
    } else {
      setSelectedPlatforms([...selectedPlatforms, platform]);
    }
  };

  const handleToggleAssetSelection = (id: string) => {
    if (selectedAssetIds.includes(id)) {
      setSelectedAssetIds(selectedAssetIds.filter(aid => aid !== id));
    } else {
      setSelectedAssetIds([...selectedAssetIds, id]);
    }
  };

  // Find first selected image asset for preview purposes
  const getSelectedImageAsset = () => {
    const selected = vaultAssets.filter(a => selectedAssetIds.includes(a.id) && a.type === "Image");
    if (selected.length > 0) return selected[0];
    return null;
  };

  const previewImage = "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80";

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 font-sans">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Sparkles size={24} className="text-emerald-500" />
            <span>Launch Campaign Flow</span>
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">8-Step optimization wizard pushing assets and copies directly to Google Ads and Meta APIs.</p>
        </div>
      </div>

      {/* Progress Wizard Steps Map */}
      <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-sm">
        <div className="flex justify-between items-center overflow-x-auto gap-4 py-1">
          {[
            { id: 1, label: "Client" },
            { id: 2, label: "Platform" },
            { id: 3, label: "Objective" },
            { id: 4, label: "Vault Assets" },
            { id: 5, label: "Copy & Policy" },
            { id: 6, label: "Optimizations" },
            { id: 7, label: "Preview Center" },
            { id: 8, label: "Publish" }
          ].map((s) => (
            <div 
              key={s.id} 
              className={`flex items-center gap-2 shrink-0 ${step === s.id ? "text-emerald-600 font-bold" : "text-gray-400 font-semibold text-xs"}`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border ${
                step === s.id 
                  ? "bg-emerald-500 text-white border-transparent" 
                  : step > s.id 
                  ? "bg-emerald-50 border-emerald-200 text-emerald-600" 
                  : "bg-gray-50 border-gray-200 text-gray-400"
              }`}>
                {step > s.id ? <Check size={12} /> : s.id}
              </div>
              <span className="text-xs">{s.label}</span>
              {s.id < 8 && <ChevronRight size={12} className="text-gray-300" />}
            </div>
          ))}
        </div>
      </div>

      {/* Deploy Simulation Modal */}
      {isDeploying && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-3xl p-8 max-w-lg w-full shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-gray-900">Campaign API Deployment Core</h3>
              <p className="text-xs text-gray-400 font-semibold">Deploying {campaignName} to cloud ad accounts.</p>
            </div>

            {/* Timeline Steps */}
            <div className="space-y-4 pt-2">
              {deploySteps.map((s, idx) => (
                <div key={idx} className="flex gap-3 items-start">
                  <div className="mt-0.5">
                    {s.status === "SUCCESS" ? (
                      <CheckCircle2 size={16} className="text-emerald-500" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-gray-200 border-t-emerald-500 animate-spin"></div>
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-800 block">{s.name}</span>
                    <p className="text-[10px] text-gray-400 font-medium leading-relaxed">{s.details}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Deploy Success View */}
      {deploySuccess && (
        <div className="bg-white border border-emerald-200 rounded-2xl p-8 text-center max-w-xl mx-auto space-y-6 shadow-lg">
          <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto text-emerald-500">
            <CheckCircle2 size={40} className="animate-bounce" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-gray-900">Campaign Pushed Successfully!</h2>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Dynamic creatives, Focal coordinate models, copy matrix guidelines, and platform structures are active.
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-left text-xs font-semibold text-gray-600 space-y-2">
            <div className="flex justify-between">
              <span>Campaign Name:</span>
              <span className="text-gray-900">{campaignName}</span>
            </div>
            <div className="flex justify-between">
              <span>Daily Limit:</span>
              <span className="text-gray-900">₹{parseFloat(dailyBudget).toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between">
              <span>Networks:</span>
              <span className="text-gray-900 uppercase">{selectedPlatforms.join(" & ")}</span>
            </div>
          </div>

          <div className="flex gap-4 justify-center pt-2">
            <button 
              onClick={() => {
                setStep(1);
                setDeploySuccess(false);
                setHeadline("");
                setDescription("");
              }}
              className="text-xs font-semibold px-5 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-600"
            >
              Launch Another Campaign
            </button>
            <Link 
              href="/dashboard/campaigns"
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-500/10"
            >
              View active campaigns
            </Link>
          </div>
        </div>
      )}

      {/* Wizard Form Workspace */}
      {!deploySuccess && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Main settings pane (7 cols) */}
          <div className="lg:col-span-7 bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm min-h-[400px] flex flex-col justify-between">
            
            <div className="space-y-6">
              
              {/* Step 1: Select Client */}
              {step === 1 && (
                <div className="space-y-4 animate-in fade-in">
                  <h3 className="font-bold text-gray-900 text-sm">Step 1: Select Client Constellation Account</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">Choose which account to configure this campaign for. Ad accounts and budgets sync to this selection.</p>
                  
                  {loadingClients ? (
                    <div className="py-4 text-xs font-semibold text-gray-400">Loading accounts...</div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {clients.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => setSelectedClient(c.id)}
                          className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between h-20 ${
                            selectedClient === c.id 
                              ? "border-emerald-500 bg-emerald-50/20 ring-2 ring-emerald-500/10 font-bold" 
                              : "border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          <span className="text-xs text-gray-800 font-bold">{c.name}</span>
                          <span className="text-[10px] text-gray-400">ID: {c.id}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Choose Platform */}
              {step === 2 && (
                <div className="space-y-4 animate-in fade-in">
                  <h3 className="font-bold text-gray-900 text-sm">Step 2: Choose Networks</h3>
                  <p className="text-xs text-gray-500">Enable multi-channel synchronization by choosing Google, Meta, or both.</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div
                      onClick={() => handleTogglePlatform("meta")}
                      className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between h-28 ${
                        selectedPlatforms.includes("meta")
                          ? "border-emerald-500 bg-emerald-50/20 ring-2 ring-emerald-500/10 font-bold"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <span className="text-xs font-bold text-gray-800">Meta Ads Network</span>
                      <span className="text-[10px] text-gray-400 leading-relaxed">Pushes assets to Facebook, Instagram, Messenger, and Audience Network.</span>
                    </div>

                    <div
                      onClick={() => handleTogglePlatform("google")}
                      className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between h-28 ${
                        selectedPlatforms.includes("google")
                          ? "border-emerald-500 bg-emerald-50/20 ring-2 ring-emerald-500/10 font-bold"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <span className="text-xs font-bold text-gray-800">Google Ads Network</span>
                      <span className="text-[10px] text-gray-400 leading-relaxed">Pushes to Performance Max structures, Search, Display, Maps, and YouTube.</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Select Objective */}
              {step === 3 && (
                <div className="space-y-4 animate-in fade-in">
                  <h3 className="font-bold text-gray-900 text-sm">Step 3: Select Objective</h3>
                  <p className="text-xs text-gray-500">Ad delivery models are optimized based on target conversion goals.</p>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { label: "Leads", desc: "Form captures & conversions" },
                      { label: "Sales", desc: "Checkout and purchase logs" },
                      { label: "Traffic", desc: "Page views and clicks" },
                      { label: "Awareness", desc: "CPM display expansion" },
                      { label: "Calls", desc: "Direct number calls" },
                      { label: "Store Visits", desc: "Local map searches" }
                    ].map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => setSelectedObjective(item.label)}
                        className={`p-4 rounded-xl border text-left flex flex-col justify-between h-24 transition-all ${
                          selectedObjective === item.label
                            ? "border-emerald-500 bg-emerald-50/20 ring-2 ring-emerald-500/10 font-bold"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <span className="text-xs text-gray-800 font-bold">{item.label}</span>
                        <span className="text-[9px] text-gray-400 leading-tight">{item.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 4: Asset Vault Selector */}
              {step === 4 && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-gray-900 text-sm">Step 4: Select Assets from Vault</h3>
                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 border border-emerald-100 rounded">
                      {selectedAssetIds.length} Selected
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">Pick base images, videos, and brand kits from your centralized RevenuePilot library.</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
                    {vaultAssets.map((asset) => (
                      <div
                        key={asset.id}
                        onClick={() => handleToggleAssetSelection(asset.id)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 relative ${
                          selectedAssetIds.includes(asset.id)
                            ? "border-emerald-500 bg-emerald-50/10 ring-2 ring-emerald-500/10"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                          {asset.type === "Image" ? <ImageIcon size={16} className="text-emerald-500" /> : <Globe size={16} className="text-gray-400" />}
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs text-gray-800 font-bold block truncate">{asset.name}</span>
                          <span className="text-[8px] text-gray-400 font-semibold uppercase">{asset.type} • {asset.size}</span>
                        </div>
                        {selectedAssetIds.includes(asset.id) && (
                          <span className="absolute right-3 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-extrabold">
                            ✓
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 5: Copy & Policy Validation */}
              {step === 5 && (
                <div className="space-y-4 animate-in fade-in">
                  <h3 className="font-bold text-gray-900 text-sm">Step 5: Copywriting & Policy Pre-Check</h3>
                  <p className="text-xs text-gray-500">Input primary ad copies. RevenuePilot automatically cross-references network limits and restricted terms.</p>
                  
                  <div className="space-y-4">
                    {/* Headline */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase">
                        <span>Ad Headline</span>
                        <span className={headlineExceeds ? "text-red-500" : ""}>
                          {headline.length} / {headlineLimit} chars
                        </span>
                      </div>
                      <input
                        type="text"
                        value={headline}
                        onChange={(e) => setHeadline(e.target.value)}
                        placeholder="e.g. Save 20% on Organic Produce"
                        className={`w-full bg-gray-50 border rounded-xl px-4 py-2.5 text-xs focus:outline-none transition-all ${
                          headlineExceeds ? "border-red-500 focus:bg-white" : "border-gray-200 focus:border-emerald-500 focus:bg-white"
                        }`}
                      />
                      {headlineExceeds && (
                        <p className="text-[9px] text-red-500 font-bold flex items-center gap-1">
                          <AlertCircle size={10} /> Headline exceeds Google limit ({headlineLimit} chars).
                        </p>
                      )}
                    </div>

                    {/* Description */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase">
                        <span>Ad Description</span>
                        <span className={descriptionExceeds ? "text-red-500" : ""}>
                          {description.length} / {descriptionLimit} chars
                        </span>
                      </div>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        placeholder="e.g. Try India's leading organic grocery store. Farm fresh items direct to your door."
                        className={`w-full bg-gray-50 border rounded-xl px-4 py-2.5 text-xs focus:outline-none transition-all ${
                          descriptionExceeds ? "border-red-500 focus:bg-white" : "border-gray-200 focus:border-emerald-500 focus:bg-white"
                        }`}
                      />
                      {descriptionExceeds && (
                        <p className="text-[9px] text-red-500 font-bold flex items-center gap-1">
                          <AlertCircle size={10} /> Description exceeds standard limit ({descriptionLimit} chars).
                        </p>
                      )}
                    </div>

                    {/* Policy Alerts list */}
                    {policyAlerts.length > 0 && (
                      <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex gap-3 text-left">
                        <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-xs font-bold text-amber-800">Policy Pre-Check Warnings</span>
                          <p className="text-[10px] text-amber-600 font-medium mt-0.5">
                            Your text contains terms flagged for policy checks: <strong className="underline">{policyAlerts.join(", ")}</strong>. 
                            These are prone to ad disapproval. We recommend updating them.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 6: Creative Optimization */}
              {step === 6 && (
                <div className="space-y-4 animate-in fade-in">
                  <h3 className="font-bold text-gray-900 text-sm">Step 6: Creative Optimizations</h3>
                  <p className="text-xs text-gray-500">Ensure optimal aspect ratio coverage across channels. Missing aspect ratios will be auto-generated by RatioForge.</p>
                  
                  <div className="space-y-3">
                    {vaultAssets
                      .filter(a => selectedAssetIds.includes(a.id))
                      .map((asset) => {
                        const required = ["1:1", "9:16", "1.91:1", "4:1"];
                        const missing = required.filter(r => !asset.versions.some(v => v.ratio === r));

                        return (
                          <div key={asset.id} className="bg-gray-50 border border-gray-100 rounded-2xl p-4 space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-gray-800">{asset.name}</span>
                              <span className="text-[9px] font-bold text-gray-400 uppercase">{asset.type}</span>
                            </div>

                            {missing.length === 0 ? (
                              <div className="text-[10px] font-bold text-emerald-600 flex items-center gap-1.5">
                                <CheckCircle2 size={12} /> Complete aspect ratio coverage ready.
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <div className="text-[10px] font-bold text-amber-600 flex items-center gap-1.5">
                                  <AlertTriangle size={12} /> Missing ratio configurations: {missing.join(", ")}.
                                </div>
                                <div className="flex flex-wrap gap-2 pt-1">
                                  {missing.map((ratio) => (
                                    <button
                                      key={ratio}
                                      onClick={() => handleAutoGenerateCrop(asset.id, ratio)}
                                      className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 font-bold text-[9px] px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                                    >
                                      <RefreshCw size={8} /> Auto-Generate {ratio}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Step 7: Preview Center */}
              {step === 7 && (
                <div className="space-y-4 animate-in fade-in">
                  <h3 className="font-bold text-gray-900 text-sm">Step 7: Multi-Channel Preview Center</h3>
                  <p className="text-xs text-gray-500">Preview live mockup simulations across Meta and Google platforms.</p>
                  
                  {/* Channel Switcher */}
                  <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-3">
                    {[
                      { key: "meta_feed", label: "Meta Feed" },
                      { key: "meta_story", label: "Meta Story" },
                      { key: "google_search", label: "Google Search" },
                      { key: "google_display", label: "Google Display" }
                    ].map((ch) => (
                      <button
                        key={ch.key}
                        onClick={() => setPreviewChannel(ch.key)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                          previewChannel === ch.key
                            ? "bg-emerald-500 text-white border-transparent shadow-sm"
                            : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        {ch.label}
                      </button>
                    ))}
                  </div>

                  {/* Previews Canvas */}
                  <div className="border border-gray-200 rounded-2xl bg-gray-100/40 p-6 flex justify-center items-center">
                    
                    {/* Meta Feed Preview */}
                    {previewChannel === "meta_feed" && (
                      <div className="bg-white border border-gray-200 max-w-sm w-full rounded-xl shadow-md text-xs font-semibold text-gray-700 overflow-hidden font-sans">
                        <div className="p-3 flex items-center gap-2 border-b border-gray-50 bg-white">
                          <div className="w-8 h-8 rounded-full bg-emerald-500 text-white font-extrabold flex items-center justify-center text-xs shadow-inner">
                            GP
                          </div>
                          <div>
                            <span className="font-bold text-gray-900 text-xs block">RevenuePilot Agent</span>
                            <span className="text-[9px] text-gray-400 font-semibold block mt-0.2">Sponsored</span>
                          </div>
                        </div>
                        <div className="p-3 text-[11px] text-gray-800 font-normal leading-relaxed">
                          {description || "Your dynamic primary text goes here."}
                        </div>
                        <div className="relative aspect-square border-y border-gray-50 overflow-hidden bg-gray-50">
                          <img 
                            src={previewImage} 
                            alt="Mock ad creative"
                            className="object-cover w-full h-full"
                          />
                        </div>
                        <div className="p-3 flex justify-between items-center bg-gray-50">
                          <div className="min-w-0">
                            <span className="text-[9px] text-gray-400 uppercase tracking-wider block font-bold">WWW.RevenuePILOT.IN</span>
                            <span className="text-gray-900 font-bold text-xs block truncate mt-0.5">
                              {headline || "Dynamic Headline Option"}
                            </span>
                          </div>
                          <button className="bg-white border border-gray-200 hover:bg-gray-50 px-3.5 py-1.5 rounded text-[10px] font-extrabold text-gray-700 uppercase shadow-sm">
                            Shop Now
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Meta Story Preview */}
                    {previewChannel === "meta_story" && (
                      <div className="relative bg-slate-900 border border-gray-200/40 aspect-[9/16] max-h-[380px] max-w-[214px] w-full rounded-2xl shadow-xl overflow-hidden text-[9px] text-white">
                        <img 
                          src={previewImage} 
                          alt="Story Background"
                          className="object-cover w-full h-full opacity-90 blur-xs absolute scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/60 flex flex-col justify-between p-4">
                          <div className="flex gap-2 items-center">
                            <div className="w-6 h-6 rounded-full bg-emerald-500 text-white font-extrabold flex items-center justify-center text-[9px]">
                              GP
                            </div>
                            <span className="font-bold">Sponsored</span>
                          </div>
                          
                          <div className="space-y-2 text-center pb-8">
                            <h4 className="text-sm font-extrabold uppercase tracking-wide bg-black/45 py-1 px-2 rounded backdrop-blur-xs max-w-full truncate">
                              {headline || "Epic Deal Active"}
                            </h4>
                            <p className="text-[9px] font-semibold text-gray-200 max-h-16 overflow-hidden leading-relaxed">
                              {description || "Explore dynamic multi-ratio templates."}
                            </p>
                            <div className="pt-2">
                              <span className="bg-emerald-500 text-white px-4 py-1.5 rounded-full font-bold uppercase tracking-wider shadow animate-pulse">
                                Swipe Up
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Google Search Preview */}
                    {previewChannel === "google_search" && (
                      <div className="bg-white border border-gray-200 max-w-md w-full rounded-xl p-4 shadow text-[11px] text-gray-600 font-sans">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="text-[10px] text-gray-800 font-extrabold block">Sponsored</span>
                          <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                          <span className="text-[10px] text-gray-400 block truncate">https://www.Revenuepilot.in/sales</span>
                        </div>
                        <h4 className="text-[14px] font-semibold text-[#1a0dab] hover:underline cursor-pointer block leading-normal">
                          {headline || "Save 20% on Organic Groceries | EcoMart India"}
                        </h4>
                        <p className="text-gray-800 leading-relaxed font-normal mt-1">
                          {description || "Farm fresh organic veggies delivered to your door step. Buy organic fruits and seeds online."}
                        </p>
                      </div>
                    )}

                    {/* Google Display Preview */}
                    {previewChannel === "google_display" && (
                      <div className="bg-white border border-gray-200 aspect-square max-h-[220px] max-w-[220px] w-full rounded-xl shadow-md overflow-hidden relative flex flex-col justify-between">
                        <div className="relative flex-1 bg-gray-50 border-b border-gray-50 overflow-hidden">
                          <img 
                            src={previewImage} 
                            alt="Display Banner"
                            className="object-cover w-full h-full"
                          />
                          <span className="absolute top-2 left-2 bg-black/60 text-white font-extrabold text-[7px] px-1 py-0.2 rounded uppercase">
                            Ad
                          </span>
                        </div>
                        <div className="p-2.5 bg-white text-[9px] space-y-1">
                          <span className="font-bold text-gray-900 block truncate uppercase">
                            {headline || "EcoMart India Banner"}
                          </span>
                          <p className="text-gray-400 font-semibold truncate">
                            {description || "Farm fresh direct to your doorstep."}
                          </p>
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              )}

              {/* Step 8: Publishing Configuration */}
              {step === 8 && (
                <div className="space-y-4 animate-in fade-in">
                  <h3 className="font-bold text-gray-900 text-sm">Step 8: Deploy & Activate</h3>
                  <p className="text-xs text-gray-500">Configure deployment controls and activate daily budgets.</p>
                  
                  <div className="space-y-4">
                    {/* Campaign Name */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">System Campaign Name</label>
                      <input
                        type="text"
                        value={campaignName}
                        onChange={(e) => setCampaignName(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white transition-all font-bold text-gray-800"
                      />
                    </div>

                    {/* Budget configuration */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Daily Budget Limit (₹)</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-4 flex items-center font-bold text-xs text-gray-500">₹</span>
                        <input
                          type="number"
                          value={dailyBudget}
                          onChange={(e) => setDailyBudget(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-4 py-2.5 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white transition-all font-bold text-gray-800"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Navigation buttons */}
            <div className="flex gap-4 pt-6 border-t border-gray-100 mt-8">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="text-xs font-semibold px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-1.5 text-gray-600"
                >
                  <ChevronLeft size={14} /> Back
                </button>
              ) : (
                <Link
                  href="/dashboard/campaigns"
                  className="text-xs font-semibold px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-500"
                >
                  Cancel
                </Link>
              )}

              {step < 8 ? (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-sm shadow-emerald-500/10 flex items-center justify-center gap-1 ml-auto"
                >
                  <span>Continue</span>
                  <ChevronRight size={14} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleDeployCampaign}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 ml-auto"
                >
                  <Send size={12} />
                  <span>Push to Ad Accounts</span>
                </button>
              )}
            </div>

          </div>

          {/* Right Summary Dashboard Sidebar Panel (5 cols) */}
          <div className="lg:col-span-5 bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm space-y-5">
            <h3 className="font-bold text-xs text-gray-900 uppercase tracking-wider pb-2 border-b border-gray-50">
              Campaign Summary
            </h3>

            <div className="space-y-4 text-xs">
              
              {/* Account Check */}
              <div className="flex justify-between items-center text-[10px] py-1 border-b border-gray-50">
                <span className="text-gray-400 font-semibold uppercase">Account</span>
                <span className="font-bold text-gray-800">
                  {clients.find(c => c.id === selectedClient)?.name || "Not Selected"}
                </span>
              </div>

              {/* Network tags */}
              <div className="flex justify-between items-center text-[10px] py-1 border-b border-gray-50">
                <span className="text-gray-400 font-semibold uppercase">Networks</span>
                <div className="flex gap-1">
                  {selectedPlatforms.map((p) => (
                    <span key={p} className="bg-emerald-50 text-emerald-600 font-bold border border-emerald-100/60 px-2 py-0.5 rounded uppercase text-[8px]">
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              {/* Goal model */}
              <div className="flex justify-between items-center text-[10px] py-1 border-b border-gray-50">
                <span className="text-gray-400 font-semibold uppercase">Objective</span>
                <span className="font-bold text-gray-800">{selectedObjective}</span>
              </div>

              {/* Budget */}
              <div className="flex justify-between items-center text-[10px] py-1 border-b border-gray-50">
                <span className="text-gray-400 font-semibold uppercase">Daily Budget</span>
                <span className="font-bold text-emerald-600">₹{parseFloat(dailyBudget).toLocaleString("en-IN")}</span>
              </div>

              {/* Assets list summary */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Selected Vault Items</span>
                {selectedAssetIds.length === 0 ? (
                  <span className="text-[10px] text-gray-400 italic block">No assets linked.</span>
                ) : (
                  <div className="space-y-1.5">
                    {vaultAssets
                      .filter(a => selectedAssetIds.includes(a.id))
                      .map((asset) => (
                        <div key={asset.id} className="flex justify-between items-center bg-gray-50 border border-gray-100 rounded-lg p-2 text-[9px] font-bold">
                          <span className="text-gray-700 truncate max-w-[150px]">{asset.name}</span>
                          <span className="text-gray-400">{asset.versions.length} Crops</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Validation errors checklist summary inside sidebar */}
              <div className="pt-2 space-y-2 border-t border-gray-50">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Pre-flight Checklist</span>
                <div className="space-y-1.5 text-[9px] font-bold">
                  {/* Account */}
                  <div className="flex items-center gap-1.5">
                    <Check size={10} className="text-emerald-500" />
                    <span className="text-gray-600">Account Connected</span>
                  </div>
                  {/* Copy length */}
                  <div className="flex items-center gap-1.5">
                    {!headlineExceeds && !descriptionExceeds && headline.length > 0 ? (
                      <Check size={10} className="text-emerald-500" />
                    ) : (
                      <AlertTriangle size={10} className="text-amber-500" />
                    )}
                    <span className="text-gray-600">Char limits check</span>
                  </div>
                  {/* Policy keyword */}
                  <div className="flex items-center gap-1.5">
                    {policyAlerts.length === 0 ? (
                      <Check size={10} className="text-emerald-500" />
                    ) : (
                      <AlertCircle size={10} className="text-red-500" />
                    )}
                    <span className="text-gray-600">Advertising standards pass</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      <UpgradeModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        requiredPlan="Revenue"
        featureName="Additional Ad Campaigns"
        benefits={[
          "Scale up to 15 active campaigns simultaneously (Revenue Tier)",
          "Enable basic automation rules in Automation Forge",
          "AI Copy generation and budget recommendations",
          "Sync up to 3 workspaces"
        ]}
        onUpgrade={changePlan}
      />
    </div>
  );
}
