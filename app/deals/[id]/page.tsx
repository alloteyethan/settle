"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TransactionProgress } from "@/components/TransactionProgress";
import { CountdownTimer } from "@/components/CountdownTimer";
import { ShieldCheck, Truck, Check, Copy, Share2, AlertTriangle, ArrowLeft, RefreshCcw, Lock } from "lucide-react";

export default function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [deal, setDeal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // Fulfillment form modal
  const [showFulfillModal, setShowFulfillModal] = useState(false);
  const [fulfillmentType, setFulfillmentType] = useState("shipped");
  const [deliveryCodeInput, setDeliveryCodeInput] = useState("");
  const [fulfillError, setFulfillError] = useState("");
  const [fulfillSubmitting, setFulfillSubmitting] = useState(false);

  // Dispute actions
  const [counterProofUrl, setCounterProofUrl] = useState("");
  const [counterProofDesc, setCounterProofDesc] = useState("");
  const [disputeSubmitting, setDisputeSubmitting] = useState(false);

  const fetchDeal = async () => {
    try {
      const token = localStorage.getItem("settle_token");
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/deals/${id}`, { headers });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch deal details");

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
  }, [id]);

  const getPublicPayUrl = () => {
    if (!deal) return "";
    if (typeof window !== "undefined") {
      return `${window.location.origin}/pay/${deal.code}`;
    }
    return `https://settle.shop/${deal.code}`;
  };

  const handleFulfillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFulfillError("");
    setFulfillSubmitting(true);

    try {
      const token = localStorage.getItem("settle_token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/deals/${id}/fulfill`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          fulfillmentType,
          deliveryCode: deliveryCodeInput,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to confirm fulfillment");

      setDeal(data);
      setShowFulfillModal(false);
    } catch (err: any) {
      setFulfillError(err.message);
    } finally {
      setFulfillSubmitting(false);
    }
  };

  const handleRefund = async () => {
    if (!confirm("Are you sure you want to issue a full refund to the buyer? This action is irreversible.")) return;

    try {
      const token = localStorage.getItem("settle_token");
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/deals/${id}/disputes/refund`, {
        method: "POST",
        headers,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to issue refund");

      setDeal(data);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCounterProof = async (e: React.FormEvent) => {
    e.preventDefault();
    setDisputeSubmitting(true);

    try {
      const token = localStorage.getItem("settle_token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/deals/${id}/disputes/counter`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          counterProofUrl,
          counterProofDescription: counterProofDesc,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit counter proof");

      fetchDeal();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDisputeSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-400">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <span>Loading deal detail...</span>
      </div>
    );
  }

  if (error || !deal) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm font-semibold">
          {error || "Deal not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back Button & Title */}
      <div className="flex items-center justify-between">
        <Link href="/deals" className="flex items-center space-x-2 text-xs font-bold text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Deals</span>
        </Link>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400">Deal Code:</span>
          <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-emerald-400">
            {deal.code}
          </span>
        </div>
      </div>

      {/* Progress Timeline */}
      <div className="glass-card p-6 sm:p-8 rounded-2xl border border-slate-800">
        <TransactionProgress status={deal.status} />
      </div>

      {/* Countdown Timer if dispatched */}
      {deal.status === "dispatched" && (
        <CountdownTimer deadline={deal.deliveryDeadline} />
      )}

      {/* Main Details & Action Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Deal Info */}
        <div className="lg:col-span-2 glass-card p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6">
          <div className="space-y-2 border-b border-slate-800 pb-4">
            <h2 className="text-2xl font-extrabold text-white">{deal.itemName}</h2>
            {deal.description && <p className="text-sm text-slate-300">{deal.description}</p>}
          </div>

          {/* Pricing Breakdown */}
          <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold">Total Price</div>
              <div className="text-lg font-black text-white">GH₵ {deal.price.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold">Fee (2%)</div>
              <div className="text-lg font-black text-amber-400">GH₵ {deal.feeAmount.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold">Your Payout</div>
              <div className="text-lg font-black text-emerald-400">GH₵ {deal.sellerPayout.toFixed(2)}</div>
            </div>
          </div>

          {/* Buyer Details */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400">Buyer Information</h4>
            {deal.buyerName ? (
              <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-1 text-sm">
                <p className="font-bold text-white">{deal.buyerName}</p>
                <p className="text-xs text-slate-400">Phone: {deal.buyerPhone}</p>
                {deal.buyerEmail && <p className="text-xs text-slate-400">Email: {deal.buyerEmail}</p>}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No buyer has paid for this deal yet.</p>
            )}
          </div>

          {/* Dispute Banner if disputed */}
          {deal.status === "disputed" && deal.dispute && (
            <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-4">
              <div className="flex items-center space-x-2 text-rose-300 font-bold text-sm">
                <AlertTriangle className="w-5 h-5" />
                <span>Buyer Raised Dispute ({deal.dispute.reason})</span>
              </div>
              {deal.dispute.description && <p className="text-xs text-rose-200">{deal.dispute.description}</p>}
              {deal.dispute.evidenceUrl && (
                <a
                  href={deal.dispute.evidenceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block text-xs font-bold text-cyan-400 underline"
                >
                  View Buyer Evidence Link
                </a>
              )}

              {/* Counter proof form */}
              <form onSubmit={handleCounterProof} className="pt-4 border-t border-rose-500/20 space-y-3">
                <h5 className="text-xs font-bold text-white">Submit Counter-Proof to Support</h5>
                <input
                  type="url"
                  value={counterProofUrl}
                  onChange={(e) => setCounterProofUrl(e.target.value)}
                  placeholder="Counter-proof image/document URL..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                />
                <textarea
                  rows={2}
                  value={counterProofDesc}
                  onChange={(e) => setCounterProofDesc(e.target.value)}
                  placeholder="Explain why delivery was accurate..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                />
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={disputeSubmitting}
                    className="flex-1 py-2 rounded-xl bg-cyan-500 text-slate-950 text-xs font-bold"
                  >
                    Submit Counter-Proof
                  </button>
                  <button
                    type="button"
                    onClick={handleRefund}
                    className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold border border-rose-500/40"
                  >
                    Issue Full Refund
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Action Panel Sidebar */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3">Seller Actions</h3>

            {deal.status === "created" && (
              <div className="space-y-4">
                <p className="text-xs text-slate-400">
                  Share this payment link with your buyer. Once paid, status will change to &quot;Payment Locked&quot;.
                </p>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(getPublicPayUrl());
                    setCopied(true);
                    setTimeout(() => setCopied(false), 3000);
                  }}
                  className="w-full py-3 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center justify-center space-x-2 border border-emerald-500/30"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? "Link Copied!" : "Copy Payment Link"}</span>
                </button>
              </div>
            )}

            {deal.status === "locked" && (
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-xs text-cyan-300 font-semibold">
                  Payment is locked in escrow! You can now ship or deliver the item.
                </div>

                <button
                  onClick={() => setShowFulfillModal(true)}
                  className="w-full py-3.5 rounded-xl font-extrabold text-sm bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2 transition-all hover:scale-[1.02]"
                >
                  <Truck className="w-4 h-4" />
                  <span>Confirm Delivery / Fulfillment</span>
                </button>
              </div>
            )}

            {deal.status === "dispatched" && (
              <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-xs text-indigo-300 space-y-2">
                <p className="font-bold">Item Dispatched!</p>
                <p className="opacity-90">
                  Waiting for buyer to confirm delivery or for the 48-hour escrow timer to auto-settle.
                </p>
              </div>
            )}

            {deal.status === "settled" && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 space-y-1">
                <p className="font-bold">Deal Settled!</p>
                <p className="opacity-90">Funds released to your MoMo wallet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fulfillment Confirmation Modal */}
      {showFulfillModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-card p-6 rounded-2xl border border-slate-800 space-y-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="space-y-1">
              <h3 className="text-lg font-extrabold text-white">Confirm Fulfillment</h3>
              <p className="text-xs text-slate-400">
                Enter the buyer&apos;s 4-digit confirmation code provided upon delivery.
              </p>
            </div>

            {fulfillError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
                {fulfillError}
              </div>
            )}

            <form onSubmit={handleFulfillSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Fulfillment Method</label>
                <select
                  value={fulfillmentType}
                  onChange={(e) => setFulfillmentType(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                >
                  <option value="shipped">Shipped via Dispatch Rider / Courier</option>
                  <option value="delivered">In-person Hand Delivery</option>
                  <option value="service_completed">Service Completed</option>
                  <option value="digital_sent">Digital Product Sent</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Buyer 4-Digit Delivery Code *</label>
                <input
                  type="text"
                  maxLength={4}
                  required
                  value={deliveryCodeInput}
                  onChange={(e) => setDeliveryCodeInput(e.target.value)}
                  placeholder="e.g. 4892"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-center text-xl font-mono tracking-widest font-black text-emerald-400 outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFulfillModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 text-slate-400 text-xs font-bold border border-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={fulfillSubmitting || !deliveryCodeInput}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 text-xs font-bold disabled:opacity-50"
                >
                  {fulfillSubmitting ? "Verifying..." : "Confirm & Dispatch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
