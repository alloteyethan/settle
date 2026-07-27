"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check, MessageSquare, AlertCircle, ArrowRight } from "lucide-react";

export default function CreateDealPage() {
  const router = useRouter();
  const [itemName, setItemName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [deliveryWindowHours, setDeliveryWindowHours] = useState("48");

  const [createdDeal, setCreatedDeal] = useState<any>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);
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
    return `Hi! To complete your purchase of *${createdDeal.itemName}* (GHS ${createdDeal.price.toFixed(
      2
    )}), please pay via our secure SETTLE Escrow link below:\n\n${url}\n\nYour payment will be held safely until you confirm delivery.`;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getPublicPayUrl());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyWhatsApp = () => {
    navigator.clipboard.writeText(getWhatsAppMessage());
    setCopiedMsg(true);
    setTimeout(() => setCopiedMsg(false), 2500);
  };

  return (
    <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {!createdDeal ? (
        <div className="max-w-[480px] mx-auto space-y-6">
          <div className="space-y-1 text-center">
            <h1 className="text-2xl font-semibold text-[#1F1B14]">Create Deal Link</h1>
            <p className="text-xs text-[#8A8271]">
              Generate a secure escrow link for your buyer on WhatsApp
            </p>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-xl border border-[#E4DDCB] space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-[#F7E6E2] border border-[#A33B2E]/20 flex items-center space-x-2 text-[#A33B2E] text-xs font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 stroke-[1.75]" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="settle-label">Item / Product Name</label>
                <input
                  type="text"
                  required
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="e.g. Kente Cloth / iPhone 13 Pro"
                  className="w-full settle-input px-3"
                />
              </div>

              <div>
                <label className="settle-label">Description (Optional)</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Size, color, shipping notes..."
                  className="w-full settle-input p-3 h-auto resize-none"
                />
              </div>

              <div>
                <label className="settle-label">Price (GHS)</label>
                <div className="relative">
                  <span className="text-[#8A8271] font-mono text-sm font-medium absolute left-3 top-2.5">
                    GHS
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="500.00"
                    className="w-full settle-input pl-14 pr-3 font-mono font-medium"
                  />
                </div>
              </div>

              {/* Fee Breakdown Readout */}
              <div className="p-3 rounded-lg bg-[#FAF6EE] border border-[#E4DDCB] text-xs space-y-1 text-[#4A4438]">
                <div className="flex justify-between">
                  <span>Platform fee (2%):</span>
                  <span className="font-mono text-[#8A8271]">GHS {feeAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold text-[#1F1B14] pt-1 border-t border-[#E4DDCB]/60">
                  <span>You receive:</span>
                  <span className="font-mono text-[#1C5A44] text-sm">GHS {sellerPayout.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="settle-label">Delivery Escrow Window</label>
                <select
                  value={deliveryWindowHours}
                  onChange={(e) => setDeliveryWindowHours(e.target.value)}
                  className="w-full settle-input px-3 text-sm text-[#1F1B14]"
                >
                  <option value="24">24 Hours (Fast Local Delivery)</option>
                  <option value="48">48 Hours (Standard Default)</option>
                  <option value="72">72 Hours (Regional Courier)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading || !itemName || !price}
                className="w-full h-12 btn-primary transition-colors disabled:opacity-50 mt-2"
              >
                {loading ? "Generating Link..." : "Generate Deal Link"}
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* Generated Success View */
        <div className="max-w-[540px] mx-auto space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-semibold text-[#1F1B14]">Deal Link Created</h1>
            <p className="text-xs text-[#8A8271]">Share this payment link with your buyer</p>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-xl border border-[#E4DDCB] space-y-6">
            {/* Copyable Link Field */}
            <div className="space-y-1">
              <label className="settle-label">Payment Link</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  readOnly
                  value={getPublicPayUrl()}
                  className="flex-1 settle-input px-3 font-mono text-sm bg-[#FAF6EE]"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-4 btn-secondary text-xs flex items-center space-x-1 shrink-0"
                >
                  {copiedLink ? <Check className="w-4 h-4 stroke-[2]" /> : <Copy className="w-4 h-4 stroke-[1.75]" />}
                  <span>{copiedLink ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>

            {/* WhatsApp Message Card */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <label className="settle-label mb-0">Pre-formatted WhatsApp Message</label>
              </div>

              <div className="p-3.5 rounded-lg bg-[#FAF6EE] border border-[#E4DDCB] font-mono text-xs text-[#4A4438] leading-relaxed whitespace-pre-wrap">
                {getWhatsAppMessage()}
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleCopyWhatsApp}
                  className="flex-1 h-12 btn-primary text-sm flex items-center justify-center space-x-2"
                >
                  <MessageSquare className="w-4 h-4 stroke-[1.75]" />
                  <span>{copiedMsg ? "Copied to Clipboard!" : "Share on WhatsApp"}</span>
                </button>

                <button
                  onClick={() => router.push(`/deals/${createdDeal.id}`)}
                  className="px-5 h-12 btn-secondary text-sm"
                >
                  View Deal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
