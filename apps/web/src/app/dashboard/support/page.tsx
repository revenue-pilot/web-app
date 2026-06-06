"use client";
import React, { useState } from "react";
import { HelpCircle, MessageSquare, BookOpen, Send, CheckCircle2, LifeBuoy } from "lucide-react";
import { useCreateSupportTicket, useSupportFaqs } from "@/hooks/useApi";
import Link from "next/link";

export default function SupportDeckPage() {
  const { mutate: createTicket, loading: ticketLoading, error: ticketError } = useCreateSupportTicket();
  const { data: faqsData, loading: faqsLoading } = useSupportFaqs();
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketMessage.trim()) return;
    
    try {
      await createTicket({ subject: ticketSubject, message: ticketMessage });
      setSubmitted(true);
      setTicketSubject("");
      setTicketMessage("");
      setTimeout(() => setSubmitted(false), 5000);
    } catch (err) {
      console.error("Error creating ticket", err);
    }
  };

  const faqs = faqsData && Array.isArray(faqsData) ? faqsData : [
    {
      q: "How do I upgrade my organization plan?",
      a: "Navigate to the Billing section in your sidebar menu, select your preferred plan (Revenue, Pro, or Enterprise), and click the 'Upgrade Plan' checkout action. Upgrades are processed instantly via our Razorpay payment flow."
    },
    {
      q: "Where do I retrieve my API tokens?",
      a: "Access the Settings page in the dashboard, switch to the 'API Keys' configuration deck, and click 'Create API Key'. Ensure you copy your private token immediately, as it will be masked on subsequent views for security."
    },
    {
      q: "What is the campaign limit for the Starter plan?",
      a: "The Starter tier supports up to 3 active marketing campaigns. To unlock larger volumes (up to 15 on Revenue or unlimited on Pro/Enterprise), you can upgrade your plan at any time."
    },
    {
      q: "How does the AI focal point auto-crop feature work?",
      a: "Upload any brand image inside your Creative Vault. Our focal analysis model identifies faces and focus landmarks, allowing you to crop the asset into feed (1:1), story (9:16), or banner (4:1) dimensions while keeping the core subjects centered."
    }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 font-sans">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
          <LifeBuoy size={24} className="text-emerald-500" />
          <span>Support Deck</span>
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">Access documentation, consult with our AI Assistant, or open support tickets.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Help Options Column */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Quick options cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/dashboard/ai-chat"
              className="bg-white border border-gray-200/80 rounded-2xl p-5 hover:border-emerald-500/50 hover:shadow-lg transition-all text-left space-y-3 group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                <MessageSquare size={20} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Consult AI Assistant</h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">Ask campaigns advice, troubleshoot configurations, or generate optimized ad structures instantly.</p>
              </div>
            </Link>

            <a
              href="#"
              className="bg-white border border-gray-200/80 rounded-2xl p-5 hover:border-emerald-500/50 hover:shadow-lg transition-all text-left space-y-3 group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                <BookOpen size={20} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Platform Documentation</h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">Read detailed guides on launching campaigns, managing workspaces, and integrating white-label domains.</p>
              </div>
            </a>
          </div>

          {/* FAQs section */}
          <div className="bg-white border border-gray-200/80 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 text-base flex items-center gap-2 pb-2 border-b border-gray-100">
              <HelpCircle size={18} className="text-emerald-500" />
              <span>Frequently Asked Questions</span>
            </h3>
            <div className="space-y-4 divide-y divide-gray-100">
              {faqs.map((faq, i) => (
                <div key={i} className={`pt-4 ${i === 0 ? "pt-0" : ""}`}>
                  <h4 className="font-bold text-gray-800 text-sm">{faq.q}</h4>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Create Ticket Form */}
        <div className="bg-white border border-gray-200/80 rounded-3xl p-6 shadow-sm h-fit">
          <h3 className="font-bold text-gray-900 text-base mb-1">Open Help Ticket</h3>
          <p className="text-xs text-gray-400 mb-4 font-medium">Our client operations engineering team usually responds within 2 hours.</p>

          <form onSubmit={handleCreateTicket} className="space-y-4">
            {submitted && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-xs text-emerald-600 font-semibold flex items-start gap-2">
                <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-500" />
                <span>Support ticket generated successfully. We will follow up via email.</span>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Subject</label>
              <input
                type="text"
                required
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                placeholder="e.g. Domain CNAME verification check"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 focus:outline-none focus:bg-white focus:border-emerald-500 transition-all font-semibold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Details / Description</label>
              <textarea
                required
                rows={4}
                value={ticketMessage}
                onChange={(e) => setTicketMessage(e.target.value)}
                placeholder="Provide detailed information regarding your inquiry..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 focus:outline-none focus:bg-white focus:border-emerald-500 transition-all font-medium leading-relaxed resize-none"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={loading || !ticketSubject.trim() || !ticketMessage.trim()}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-200 text-white font-bold text-xs py-2.5 rounded-xl shadow-md shadow-emerald-500/10 transition-all flex items-center justify-center gap-1.5"
            >
              <Send size={14} />
              <span>{loading ? "Submitting..." : "Send Ticket"}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
