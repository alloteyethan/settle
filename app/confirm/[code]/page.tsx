"use client";

import { useEffect, useState, use } from "react";
import { TransactionProgress } from "@/components/TransactionProgress";
import { CountdownTimer } from "@/components/CountdownTimer";
import { ConfirmationCodeBoxes } from "@/components/ConfirmationCodeBoxes";
import { Check, AlertCircle, ShieldCheck } from "lucide-react";

export default function PublicConfirmPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);

  const [deal, setDeal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
      if (!res.ok) throw new Error("Deal link is invalid or has expired");
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
      <div className="min-h-screen bg-[#FAF6EE] flex items-center justify-center p-4">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 rounded-full border-2 border-[#1C5A44] border-t-transparent animate-spin mx-auto" />
          <p className="text-xs font-medium text-[#8A8271]">Loading delivery status...</p>
        </div>
      </div>
    );
  }

  if (error || !deal) {
    return (
      <div className="min-h-screen bg-[#FAF6EE] flex items-center justify-center p-4">
        <div className="w-full max-w-[480px] bg-white p-6 rounded-xl border border-[#A33B2E]/30 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-[#A33B2E] mx-auto stroke-[1.75]" />
          <h2 className="text-base font-semibold text-[#1F1B14]">Invalid Order Link</h2>
          <p className="text-xs text-[#8A8271]">{error || "Order not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6EE] text-[#4A4438] flex flex-col justify-center py-10 px-4 sm:px-6">
      <div className="w-full max-w-[540px] mx-auto space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#E1EBE3] text-[#1C5A44] text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 stroke-[2]" />
            <span>SETTLE Escrow Delivery Portal</span>
          </div>
          <h1 className="text-xl font-semibold text-[#1F1B14]">{deal.itemName}</h1>
          <p className="text-xs text-[#8A8271]">
            Seller: <span className="font-semibold text-[#1F1B14]">{deal.sellerName}</span>
          </p>
        </div>

        {/* Progress Tracker Card */}
        <div className="bg-white p-6 sm:p-8 rounded-xl border border-[#E4DDCB] space-y-6">
          <TransactionProgress status={deal.status} />

          {/* Countdown timer if dispatched */}
          {deal.status === "dispatched" && (
            <CountdownTimer deadline={deal.deliveryDeadline} />
          )}

          {/* Settled Success State */}
          {deal.status === "settled" || settledSuccess ? (
            <div className="p-6 rounded-lg bg-[#E1EBE3] border border-[#1C5A44]/20 text-center space-y-2">
              <div className="inline-flex items-center space-x-1.5 text-[#1C5A44] font-semibold text-sm">
                <Check className="w-5 h-5 stroke-[2.5]" />
                <span>Delivery Confirmed & Released</span>
              </div>
              <p className="text-xs text-[#4A4438] max-w-sm mx-auto">
                Thank you! Escrow funds have been safely released to <span className="font-semibold text-[#1F1B14]">{deal.sellerName}</span>.
              </p>
            </div>
          ) : deal.status === "disputed" ? (
            <div className="p-4 rounded-lg bg-[#F7E6E2] border border-[#A33B2E]/20 space-y-1 text-xs">
              <span className="font-semibold text-[#A33B2E] block">Dispute Active</span>
              <span className="text-[#4A4438]">
                You have raised a dispute on this transaction. SETTLE support team is reviewing claims.
              </span>
            </div>
          ) : deal.status === "dispatched" ? (
            /* Action Box for Buyer to Confirm Delivery */
            <div className="p-5 rounded-lg bg-[#FAF6EE] border border-[#E4DDCB] space-y-4">
              <div className="space-y-1 text-center">
                <h3 className="text-sm font-semibold text-[#1F1B14]">Have you received your package?</h3>
                <p className="text-xs text-[#8A8271]">
                  Enter your 4-digit confirmation code below to release funds to the seller.
                </p>
              </div>

              {confirmError && (
                <div className="p-3 rounded-lg bg-[#F7E6E2] border border-[#A33B2E]/20 text-[#A33B2E] text-xs font-medium text-center">
                  {confirmError}
                </div>
              )}

              <form onSubmit={handleConfirmDelivery} className="space-y-4">
                {/* Boxed Mono OTP Cells Component */}
                <ConfirmationCodeBoxes
                  value={codeDigits}
                  onChange={setCodeDigits}
                />

                <button
                  type="submit"
                  disabled={confirming || codeDigits.length !== 4}
                  className="w-full h-12 btn-primary transition-colors disabled:opacity-50 text-sm font-semibold"
                >
                  {confirming ? "Releasing Escrow..." : "Confirm Delivery"}
                </button>
              </form>

              {/* Recurring Trust Anchor */}
              <p className="text-center text-[12px] text-[#8A8271] leading-relaxed pt-1 border-t border-[#E4DDCB]/60">
                Your money is held securely by SETTLE and only released to the seller after you confirm delivery.
              </p>

              <div className="pt-1 text-center">
                <button
                  onClick={() => setShowDisputeModal(true)}
                  className="text-xs font-semibold text-[#A33B2E] hover:underline"
                >
                  Item missing or damaged? Raise a Dispute
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-[#FAF6EE] border border-[#E4DDCB] text-center text-xs text-[#8A8271]">
              Awaiting seller dispatch. Once shipped, you can confirm delivery here.
            </div>
          )}
        </div>
      </div>

      {/* Dispute Modal */}
      {showDisputeModal && (
        <div className="fixed inset-0 z-50 bg-[#1F1B14]/40 flex items-center justify-center p-4">
          <div className="w-full max-w-[440px] bg-white p-6 rounded-xl border border-[#E4DDCB] space-y-4 shadow-[0_8px_24px_rgba(31,27,20,0.10)]">
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-[#1F1B14]">Raise Transaction Dispute</h3>
              <p className="text-xs text-[#8A8271]">
                This will freeze escrow payout while SETTLE admins investigate.
              </p>
            </div>

            <form onSubmit={handleRaiseDispute} className="space-y-4">
              <div>
                <label className="settle-label">Dispute Reason</label>
                <select
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="w-full settle-input px-3 text-xs text-[#1F1B14]"
                >
                  <option value="item_never_arrived">Item Never Arrived</option>
                  <option value="wrong_damaged_item">Wrong or Damaged Item Received</option>
                  <option value="incomplete_service">Incomplete Service Delivered</option>
                </select>
              </div>

              <div>
                <label className="settle-label">Description of Issue</label>
                <textarea
                  rows={3}
                  required
                  value={disputeDesc}
                  onChange={(e) => setDisputeDesc(e.target.value)}
                  placeholder="Explain what went wrong..."
                  className="w-full settle-input p-3 text-xs h-auto resize-none"
                />
              </div>

              <div>
                <label className="settle-label">Photo / Evidence URL (Optional)</label>
                <input
                  type="url"
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  placeholder="https://example.com/evidence-photo.jpg"
                  className="w-full settle-input px-3 text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDisputeModal(false)}
                  className="flex-1 h-10 btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={disputeSubmitting}
                  className="flex-1 h-10 btn-primary text-xs bg-[#A33B2E] hover:bg-[#852E23] text-white disabled:opacity-50"
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
