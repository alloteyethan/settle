"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Copy, Check, Share2, ArrowRight, MessageSquare, AlertCircle } from "lucide-react";

export default function CreateDealPage() {
  const router = useRouter();
  const [itemName, setItemName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [deliveryWindowHours, setDeliveryWindowHours] = useState("48");

  const [createdDeal, setCreatedDeal] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const numPrice = parseFloat(price) || 0;
  const feeAmount = numPrice * 0.02;
  const sellerPayout = numPrice - feeAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const token = localStorage.getItem("settle_token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/deals", {
        method: "POST",
        headers,
        body: JSON.stringify({
          itemName,
          description,
          price: numPrice,
          deliveryWindowHours: Number(deliveryWindowHours),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create deal");

      setCreatedDeal(data);
    } catch (err: any) {
      setError(err.message || "Failed to generate payment link");
    } finally {
      setLoading(false);
    }
  };

  const getPublicPayUrl = () => {
    if (!createdDeal) return "";
    if (typeof window !== "undefined") {
      return `${window.location.origin}/pay/${createdDeal.code}`;
    }
    return `https://settle.shop/${createdDeal.code}`;
  };

  const getWhatsAppMessage = () => {
    if (!createdDeal) return "";
    const url = getPublicPayUrl();
    return `Hi! To complete your purchase of *${createdDeal.itemName}* (GH₵ ${createdDeal.price.toFixed(
      2
    )}), please pay via our secure SETTLE Escrow link below:\n\n👉 ${url}\n\nYour payment will be locked safely until you receive your delivery! 🛡️`;
  };

  const handleCopyWhatsApp = () => {
    navigator.clipboard.writeText(getWhatsAppMessage());
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Generate Escrow Payment Link</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Create a secure payment link to share directly with buyers on WhatsApp or Instagram.
        </p>
      </div>

      {!createdDeal ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2 glass-card p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6">
            {error && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center space-x-2 text-rose-400 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Item / Product Name *</label>
                <input
                  type="text"
                  required
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="e.g. Handmade Kente Cloth / iPhone 13 Pro"
                  className="w-full bg-slate-900/90 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl py-3 px-4 text-sm text-white placeholder-slate-600 transition-all outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Description / Specs (Optional)</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Include color, size, condition, or shipping terms..."
                  className="w-full bg-slate-900/90 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl py-2.5 px-4 text-sm text-white placeholder-slate-600 transition-all outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Price (GH₵) *</label>
                  <div className="relative">
                    <span className="text-slate-500 font-bold text-sm absolute left-3.5 top-3">GH₵</span>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      required
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="500.00"
                      className="w-full bg-slate-900/90 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl py-3 pl-14 pr-4 text-sm font-bold text-white placeholder-slate-600 transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Delivery Escrow Window</label>
                  <select
                    value={deliveryWindowHours}
                    onChange={(e) => setDeliveryWindowHours(e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl py-3 px-4 text-sm text-white transition-all outline-none"
                  >
                    <option value="24">24 Hours (Fast Local Delivery)</option>
                    <option value="48">48 Hours (Standard Default)</option>
                    <option value="72">72 Hours (Regional Courier)</option>
                    <option value="96">96 Hours (Pre-order / Custom)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !itemName || !price}
                className="w-full py-4 rounded-xl text-sm font-extrabold bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-xl shadow-emerald-500/20 transition-all hover:scale-[1.02] flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <span>{loading ? "Generating Link..." : "Generate Escrow Link"}</span>
                <ArrowRight className="w-5 h-5 stroke-[2.5]" />
              </button>
            </form>
          </div>

          {/* Realtime Fee Summary Box */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm border-b border-slate-800 pb-3">
                <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
                <span>Escrow Fee Breakdown</span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Item Price:</span>
                  <span className="font-bold">GH₵ {numPrice.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-slate-400">
                  <span>SETTLE Platform Fee (2%):</span>
                  <span className="font-semibold text-amber-400">- GH₵ {feeAmount.toFixed(2)}</span>
                </div>

                <div className="border-t border-slate-800 pt-3 flex justify-between items-center text-sm">
                  <span className="font-extrabold text-white">Your Net Payout:</span>
                  <span className="font-black text-emerald-400 text-lg">
                    GH₵ {sellerPayout.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 text-[11px] text-slate-400 space-y-1.5 leading-relaxed">
              <p className="font-semibold text-slate-300">🛡️ How SETTLE Escrow Works:</p>
              <p>1. Buyer pays into secure escrow via MoMo or Card.</p>
              <p>2. You dispatch item & enter buyer&apos;s 4-digit delivery code.</p>
              <p>3. Funds auto-release directly to your wallet.</p>
            </div>
          </div>
        </div>
      ) : (
        /* Generated Success Screen */
        <div className="glass-card p-8 rounded-2xl border border-emerald-500/30 space-y-8 glow-emerald">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto ring-8 ring-emerald-500/10">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>
            <h2 className="text-2xl font-black text-white">Payment Link Ready!</h2>
            <p className="text-xs text-slate-400">
              Share this link or copy the formatted WhatsApp message below.
            </p>
          </div>

          {/* Generated Link Field */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-3 w-full sm:w-auto truncate">
              <Share2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="font-mono text-sm text-emerald-300 font-bold truncate">
                {getPublicPayUrl()}
              </span>
            </div>

            <button
              onClick={() => {
                navigator.clipboard.writeText(getPublicPayUrl());
                setCopied(true);
                setTimeout(() => setCopied(false), 3000);
              }}
              className="w-full sm:w-auto px-4 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-center space-x-2 transition-all border border-emerald-500/30"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? "Copied!" : "Copy Link"}</span>
            </button>
          </div>

          {/* WhatsApp Card */}
          <div className="p-6 rounded-2xl bg-emerald-950/30 border border-emerald-500/20 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
                <MessageSquare className="w-5 h-5" />
                <span>Formatted WhatsApp Message</span>
              </div>
              <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-extrabold px-2 py-0.5 rounded bg-emerald-500/20">
                Ready to Send
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
              {getWhatsAppMessage()}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleCopyWhatsApp}
                className="flex-1 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2 transition-all"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? "WhatsApp Message Copied!" : "Copy WhatsApp Message"}</span>
              </button>

              <button
                onClick={() => router.push(`/deals/${createdDeal.id}`)}
                className="px-6 py-3.5 rounded-xl font-bold text-sm bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 transition-all text-center"
              >
                View Deal Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
