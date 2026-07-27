"use client";

import { useEffect, useState, use } from "react";
import { TransactionProgress } from "@/components/TransactionProgress";
import { CountdownTimer } from "@/components/CountdownTimer";
import { ShieldCheck, CheckCircle2, AlertTriangle, ArrowRight, Lock, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

export default function PublicConfirmPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);

  const [deal, setDeal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Delivery confirmation input
  const [codeDigits, setCodeDigits] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState("");
  const [settledSuccess, setSettledSuccess] = useState(false);

  // Dispute modal/form
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState("item_never_arrived");
  const [disputeDesc, setDisputeDesc] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [disputeSubmitting, setDisputeSubmitting] = useState(false);

  const fetchDeal = async () => {
    try {
      const res = await fetch(`/api/deals/link/${code}`);
      if (!res.ok) throw new Error("Deal not found or invalid link");
      const json = await res.json();
      setDeal(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeal();
  }, [code]);

  const handleConfirmDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfirmError("");
    setConfirming(true);

    try {
      if (deal.deliveryCode && codeDigits.trim() !== String(deal.deliveryCode).trim()) {
        throw new Error("Invalid 4-digit confirmation code. Please check your purchase receipt.");
      }

      const res = await fetch(`/api/deals/${deal.id}/confirm`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to confirm delivery");

      setDeal(data);
      setSettledSuccess(true);
      try {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
      } catch (e) {}
    } catch (err: any) {
      setConfirmError(err.message);
    } finally {
      setConfirming(false);
    }
  };

  const handleRaiseDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    setDisputeSubmitting(true);

    try {
      const res = await fetch(`/api/deals/${deal.id}/disputes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: disputeReason,
          description: disputeDesc,
          evidenceUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit dispute");

      setShowDisputeModal(false);
      fetchDeal();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDisputeSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050811] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-slate-400">Loading order status...</p>
        </div>
      </div>
    );
  }

  if (error || !deal) {
    return (
      <div className="min-h-screen bg-[#050811] flex items-center justify-center p-4">
        <div className="w-full max-w-md glass-card p-6 rounded-2xl border border-rose-500/30 text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto" />
          <h2 className="text-lg font-bold text-white">Invalid Order Link</h2>
          <p className="text-xs text-slate-400">{error || "Order not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="w-full max-w-2xl mx-auto space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
            <span>SETTLE Escrow Delivery Portal</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">{deal.itemName}</h1>
          <p className="text-xs text-slate-400">
            Seller: <span className="font-bold text-white">{deal.sellerName}</span>
          </p>
        </div>

        {/* Progress Tracker Card */}
        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
          <TransactionProgress status={deal.status} />

          {/* Countdown timer if dispatched */}
          {deal.status === "dispatched" && (
            <CountdownTimer deadline={deal.deliveryDeadline} />
          )}

          {/* Settled Success State */}
          {deal.status === "settled" || settledSuccess ? (
            <div className="p-8 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3 glow-emerald">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <h3 className="text-xl font-extrabold text-white">Delivery Confirmed!</h3>
              <p className="text-xs text-slate-300 max-w-md mx-auto">
                Thank you! Escrow funds have been successfully released to <span className="font-bold text-white">{deal.sellerName}</span>.
              </p>
            </div>
          ) : deal.status === "disputed" ? (
            <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-2">
              <div className="flex items-center space-x-2 text-rose-400 font-bold text-sm">
                <AlertTriangle className="w-5 h-5" />
                <span>Dispute Active</span>
              </div>
              <p className="text-xs text-rose-200">
                You have raised a dispute on this transaction. SETTLE support team is reviewing evidence and will resolve payouts shortly.
              </p>
            </div>
          ) : deal.status === "dispatched" ? (
            /* Action Box for Buyer to Confirm Delivery */
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="space-y-1 text-center">
                <h3 className="text-base font-extrabold text-white">Have you received your package?</h3>
                <p className="text-xs text-slate-400">
                  Enter your 4-digit delivery confirmation code to release funds to the seller.
                </p>
              </div>

              {confirmError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold text-center">
                  {confirmError}
                </div>
              )}

              <form onSubmit={handleConfirmDelivery} className="space-y-4">
                <div className="max-w-xs mx-auto">
                  <input
                    type="text"
                    maxLength={4}
                    required
                    value={codeDigits}
                    onChange={(e) => setCodeDigits(e.target.value)}
                    placeholder="4-digit Code"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-2xl p-3.5 text-center text-2xl font-mono font-black tracking-widest text-emerald-400 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={confirming || codeDigits.length !== 4}
                  className="w-full py-4 rounded-2xl text-sm font-extrabold bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-xl shadow-emerald-500/20 transition-all hover:scale-[1.02] flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                  <span>{confirming ? "Releasing Escrow..." : "Confirm Delivery & Release Payout"}</span>
                </button>
              </form>

              <div className="pt-3 border-t border-slate-800 text-center">
                <button
                  onClick={() => setShowDisputeModal(true)}
                  className="text-xs font-bold text-rose-400 hover:text-rose-300 underline"
                >
                  Item missing or damaged? Raise a Dispute
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-400 space-y-1">
              <p className="font-bold text-slate-200">Waiting for seller dispatch...</p>
              <p>Once seller ships your order, you can confirm delivery here using your confirmation code.</p>
            </div>
          )}
        </div>
      </div>

      {/* Dispute Modal */}
      {showDisputeModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-card p-6 rounded-2xl border border-slate-800 space-y-5 shadow-2xl">
            <div className="space-y-1">
              <h3 className="text-lg font-extrabold text-white">Raise Transaction Dispute</h3>
              <p className="text-xs text-slate-400">
                This will freeze escrow payout while SETTLE admins investigate.
              </p>
            </div>

            <form onSubmit={handleRaiseDispute} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Dispute Category</label>
                <select
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                >
                  <option value="item_never_arrived">Item Never Arrived</option>
                  <option value="wrong_damaged_item">Wrong or Damaged Item Received</option>
                  <option value="incomplete_service">Incomplete Service Delivered</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Description of Issue</label>
                <textarea
                  rows={3}
                  required
                  value={disputeDesc}
                  onChange={(e) => setDisputeDesc(e.target.value)}
                  placeholder="Describe what went wrong..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Photo / Evidence URL (Optional)</label>
                <input
                  type="url"
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  placeholder="https://imgur.com/your-photo.jpg"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDisputeModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 text-slate-400 text-xs font-bold border border-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={disputeSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white text-xs font-bold disabled:opacity-50"
                >
                  {disputeSubmitting ? "Submitting..." : "Submit Dispute"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
