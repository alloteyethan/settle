"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TransactionProgress } from "@/components/TransactionProgress";
import { CountdownTimer } from "@/components/CountdownTimer";
import { ConfirmationCodeBoxes } from "@/components/ConfirmationCodeBoxes";
import { Copy, Check, ArrowLeft, AlertCircle } from "lucide-react";

export default function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [deal, setDeal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // Fulfillment form modal / Inline state
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
      <div className="max-w-[640px] mx-auto px-4 py-16 text-center text-xs text-[#8A8271]">
        Loading deal detail...
      </div>
    );
  }

  if (error || !deal) {
    return (
      <div className="max-w-[640px] mx-auto px-4 py-12">
        <div className="p-3.5 rounded-lg bg-[#F7E6E2] border border-[#A33B2E]/20 text-[#A33B2E] text-xs font-medium">
          {error || "Deal not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[640px] mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <Link href="/deals" className="inline-flex items-center space-x-1 text-xs font-semibold text-[#8A8271] hover:text-[#1F1B14]">
          <ArrowLeft className="w-4 h-4 stroke-[1.75]" />
          <span>Back to Deals</span>
        </Link>

        <span className="font-mono text-xs text-[#8A8271]">
          Deal ID: <span className="font-semibold text-[#1F1B14]">#{deal.code}</span>
        </span>
      </div>

      {/* Progress Indicator Card */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-[#E4DDCB]">
        <TransactionProgress status={deal.status} />
      </div>

      {/* Countdown Timer if Dispatched */}
      {deal.status === "dispatched" && (
        <CountdownTimer deadline={deal.deliveryDeadline} />
      )}

      {/* Deal Main Card */}
      <div className="bg-white p-6 sm:p-8 rounded-xl border border-[#E4DDCB] space-y-6">
        <div className="border-b border-[#E4DDCB] pb-4 space-y-1">
          <h2 className="text-xl font-semibold text-[#1F1B14]">{deal.itemName}</h2>
          {deal.description && <p className="text-xs text-[#4A4438]">{deal.description}</p>}
        </div>

        {/* Pricing Breakdown */}
        <div className="p-4 rounded-lg bg-[#FAF6EE] border border-[#E4DDCB] grid grid-cols-3 gap-2 text-xs">
          <div>
            <span className="settle-label mb-0">Total Price</span>
            <div className="font-mono text-base font-semibold text-[#1F1B14]">GHS {deal.price.toFixed(2)}</div>
          </div>
          <div>
            <span className="settle-label mb-0">Fee (2%)</span>
            <div className="font-mono text-base font-medium text-[#8A8271]">GHS {deal.feeAmount.toFixed(2)}</div>
          </div>
          <div>
            <span className="settle-label mb-0">Net Payout</span>
            <div className="font-mono text-base font-semibold text-[#1C5A44]">GHS {deal.sellerPayout.toFixed(2)}</div>
          </div>
        </div>

        {/* Buyer Info */}
        <div className="space-y-2">
          <span className="settle-label">Buyer Information</span>
          {deal.buyerName ? (
            <div className="p-3.5 rounded-lg bg-[#FAF6EE] border border-[#E4DDCB] text-xs space-y-0.5">
              <div className="font-semibold text-[#1F1B14]">{deal.buyerName}</div>
              <div className="text-[#8A8271]">Phone: {deal.buyerPhone}</div>
              {deal.buyerEmail && <div className="text-[#8A8271]">Email: {deal.buyerEmail}</div>}
            </div>
          ) : (
            <p className="text-xs text-[#8A8271] italic">Awaiting buyer payment.</p>
          )}
        </div>

        {/* Seller Actions depending on state */}
        {deal.status === "created" && (
          <div className="pt-2 border-t border-[#E4DDCB] space-y-3">
            <span className="settle-label">Share Payment Link</span>
            <div className="flex space-x-2">
              <input
                type="text"
                readOnly
                value={getPublicPayUrl()}
                className="flex-1 settle-input px-3 font-mono text-xs bg-[#FAF6EE]"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(getPublicPayUrl());
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2500);
                }}
                className="px-4 btn-secondary text-xs shrink-0 flex items-center space-x-1"
              >
                {copied ? <Check className="w-4 h-4 stroke-[2]" /> : <Copy className="w-4 h-4 stroke-[1.75]" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </div>
        )}

        {deal.status === "locked" && (
          <div className="pt-2 border-t border-[#E4DDCB] space-y-3">
            <div className="p-3.5 rounded-lg bg-[#E7ECF1] border border-[#3E5C76]/20 text-xs text-[#3E5C76]">
              Payment is locked in escrow! Prepare package for delivery and enter the buyer&apos;s 4-digit code below.
            </div>

            <button
              onClick={() => setShowFulfillModal(true)}
              className="w-full h-12 btn-primary text-sm flex items-center justify-center space-x-2"
            >
              <span>Confirm Delivery / Dispatch</span>
            </button>
          </div>
        )}

        {/* Dispute Box if disputed */}
        {deal.status === "disputed" && deal.dispute && (
          <div className="p-4 rounded-lg bg-[#F7E6E2] border border-[#A33B2E]/30 space-y-3">
            <div className="flex items-center space-x-2 text-[#A33B2E] font-semibold text-xs uppercase">
              <AlertCircle className="w-4 h-4 stroke-[1.75]" />
              <span>Dispute Raised ({deal.dispute.reason})</span>
            </div>
            {deal.dispute.description && <p className="text-xs text-[#4A4438]">{deal.dispute.description}</p>}

            <form onSubmit={handleCounterProof} className="pt-3 border-t border-[#A33B2E]/20 space-y-3">
              <span className="settle-label mb-1 text-[#A33B2E]">Submit Counter-Proof to Support</span>
              <input
                type="url"
                value={counterProofUrl}
                onChange={(e) => setCounterProofUrl(e.target.value)}
                placeholder="Proof document or photo URL..."
                className="w-full settle-input px-3 text-xs"
              />
              <textarea
                rows={2}
                value={counterProofDesc}
                onChange={(e) => setCounterProofDesc(e.target.value)}
                placeholder="Explain delivery details..."
                className="w-full settle-input p-3 text-xs h-auto resize-none"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={disputeSubmitting}
                  className="flex-1 h-10 btn-primary text-xs"
                >
                  Submit Counter-Proof
                </button>
                <button
                  type="button"
                  onClick={handleRefund}
                  className="px-3 h-10 btn-secondary text-xs text-[#A33B2E] border-[#A33B2E]/30"
                >
                  Issue Refund
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Fulfillment Confirmation Modal */}
      {showFulfillModal && (
        <div className="fixed inset-0 z-50 bg-[#1F1B14]/40 flex items-center justify-center p-4">
          <div className="w-full max-w-[440px] bg-white p-6 rounded-xl border border-[#E4DDCB] space-y-4 shadow-[0_8px_24px_rgba(31,27,20,0.10)]">
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-[#1F1B14]">Confirm Delivery</h3>
              <p className="text-xs text-[#8A8271]">
                Enter the 4-digit code provided by the buyer upon delivery inspection.
              </p>
            </div>

            {fulfillError && (
              <div className="p-3 rounded-lg bg-[#F7E6E2] border border-[#A33B2E]/20 text-[#A33B2E] text-xs font-medium">
                {fulfillError}
              </div>
            )}

            <form onSubmit={handleFulfillSubmit} className="space-y-4">
              <div>
                <label className="settle-label">Fulfillment Method</label>
                <select
                  value={fulfillmentType}
                  onChange={(e) => setFulfillmentType(e.target.value)}
                  className="w-full settle-input px-3 text-xs text-[#1F1B14]"
                >
                  <option value="shipped">Shipped via Dispatch Rider / Courier</option>
                  <option value="delivered">In-person Hand Delivery</option>
                  <option value="service_completed">Service Completed</option>
                  <option value="digital_sent">Digital Product Sent</option>
                </select>
              </div>

              <div>
                <label className="settle-label text-center block">Buyer 4-Digit Confirmation Code</label>
                <ConfirmationCodeBoxes
                  value={deliveryCodeInput}
                  onChange={setDeliveryCodeInput}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFulfillModal(false)}
                  className="flex-1 h-11 btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={fulfillSubmitting || deliveryCodeInput.length !== 4}
                  className="flex-1 h-11 btn-primary text-xs disabled:opacity-50"
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
