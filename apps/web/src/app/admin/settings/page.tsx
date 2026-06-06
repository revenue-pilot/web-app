"use client";
import React, { useState } from "react";
import { Globe, Palette, Image as ImageIcon, Save, Check } from "lucide-react";

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Platform Settings</h1>
        <p className="text-gray-400 mt-1">Configure global white-label settings and brand appearance.</p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10 flex items-center gap-3">
          <Globe className="text-purple-400" />
          <h2 className="text-lg font-semibold">Custom Domain</h2>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-400">Map your SaaS to a custom domain for client access.</p>
          <div className="flex gap-4">
            <input 
              type="text" 
              defaultValue="app.myagency.com" 
              className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-2 focus:border-purple-500 focus:outline-none" 
            />
            <button className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              Verify DNS
            </button>
          </div>
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-start gap-3">
            <Check className="text-emerald-400 shrink-0 mt-0.5" size={16} />
            <div className="text-sm">
              <p className="text-emerald-400 font-medium">Domain Verified</p>
              <p className="text-emerald-400/70 mt-1">SSL Certificate has been automatically provisioned.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10 flex items-center gap-3">
          <Palette className="text-blue-400" />
          <h2 className="text-lg font-semibold">Brand Appearance</h2>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Primary Color</label>
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)]"></div>
                <input 
                  type="text" 
                  defaultValue="#a855f7" 
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 focus:border-purple-500 focus:outline-none" 
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Accent Color</label>
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.4)]"></div>
                <input 
                  type="text" 
                  defaultValue="#3b82f6" 
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 focus:border-purple-500 focus:outline-none" 
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
              <ImageIcon size={16} /> Brand Logo
            </label>
            <div className="border-2 border-dashed border-white/20 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-white/5 transition-colors cursor-pointer">
              <div className="w-16 h-16 bg-white/10 rounded-lg flex items-center justify-center mb-4">
                <span className="font-bold text-xl">GP</span>
              </div>
              <p className="text-sm font-medium">Click to upload new logo</p>
              <p className="text-xs text-gray-500 mt-1">SVG, PNG, or JPG (max. 2MB)</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button 
          onClick={handleSave}
          className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 shadow-lg shadow-purple-500/20"
        >
          {saved ? <Check size={18} /> : <Save size={18} />}
          {saved ? "Settings Saved" : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
