"use client";

import { useEffect, useState } from "react";
import { Lock, RefreshCcw } from "lucide-react";

export default function AdminPage() {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resolvingId, setResolvingId] = useState<number | null>(null);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/disputes");
      if (!res.ok) throw new Error("Failed to load disputes");
      const json = await res.json();
      setDisputes(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const handleResolve = async (disputeId: number, decision: "favor_buyer" | "favor_seller") => {
    const actionText = decision === "favor_buyer" ? "refund the buyer" : "release funds to seller";
    if (!confirm(`Are you sure you want to resolve this dispute and ${actionText}?`)) return;

    setResolvingId(disputeId);
    try {
      const res = await fetch(`/api/admin/disputes/${disputeId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision,
          resolution: `Admin decision: ${decision === "favor_buyer" ? "Refunded buyer after reviewing evidence" : "Released payout to seller after reviewing proof"}`,
        }),
      });

      if (!res.ok) throw new Error("Failed to resolve dispute");
      fetchDisputes();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div className="w-full max-w-[800px] mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E4DDCB] pb-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-md bg-[#E7ECF1] text-[#3E5C76] text-xs font-medium mb-1">
            <Lock className="w-3.5 h-3.5 stroke-[1.75]" />
            <span>SETTLE Admin Escalation Panel</span>
          </div>
          <h1 className="text-xl font-semibold text-[#1F1B14]">Dispute Resolution Center</h1>
          <p className="text-xs text-[#8A8271]">
            Review buyer evidence and seller counter-proofs to arbitrate escrow payouts
          </p>
        </div>

        <button
          onClick={fetchDisputes}
          className="self-start sm:self-auto px-3 py-1.5 rounded-lg text-xs font-semibold btn-secondary flex items-center space-x-1"
        >
          <RefreshCcw className="w-3.5 h-3.5 stroke-[1.75]" />
          <span>Refresh</span>
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-[#8A8271]">Loading disputes...</div>
      ) : disputes.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-[#E4DDCB] text-center space-y-2">
          <h3 className="text-base font-semibold text-[#1F1B14]">No Active Disputes</h3>
          <p className="text-xs text-[#8A8271]">There are currently no open disputes requiring arbitration.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {disputes.map((dispute) => (
            <div key={dispute.id} className="bg-white p-5 sm:p-6 rounded-xl border border-[#E4DDCB] space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E4DDCB] pb-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-semibold text-[#A33B2E]">Dispute #{dispute.id}</span>
                    <span className="text-sm font-semibold text-[#1F1B14]">{dispute.deal?.itemName || `Deal #${dispute.dealId}`}</span>
                  </div>
                  <div className="text-xs text-[#8A8271] mt-0.5">
                    Reason: <span className="font-semibold text-[#1F1B14] uppercase">{dispute.reason}</span> • {new Date(dispute.createdAt).toLocaleString()}
                  </div>
                </div>

                <span className="self-start sm:self-auto px-2.5 py-0.5 rounded-full text-[11px] font-medium uppercase tracking-wide bg-[#F7E6E2] text-[#A33B2E]">
                  {dispute.status}
                </span>
              </div>

              {/* Claims Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-lg bg-[#FAF6EE] border border-[#E4DDCB] space-y-1">
                  <span className="settle-label mb-0 text-[#A33B2E]">Buyer Claim</span>
                  <p className="text-[#4A4438]">{dispute.description || "No details provided."}</p>
                  {dispute.evidenceUrl && (
                    <a href={dispute.evidenceUrl} target="_blank" rel="noreferrer" className="text-[#1C5A44] font-semibold underline block pt-1">
                      View Evidence Link
                    </a>
                  )}
                </div>

                <div className="p-3.5 rounded-lg bg-[#FAF6EE] border border-[#E4DDCB] space-y-1">
                  <span className="settle-label mb-0 text-[#3E5C76]">Seller Counter-Proof</span>
                  <p className="text-[#4A4438]">{dispute.counterProofDescription || "No counter-proof submitted yet."}</p>
                  {dispute.counterProofUrl && (
                    <a href={dispute.counterProofUrl} target="_blank" rel="noreferrer" className="text-[#1C5A44] font-semibold underline block pt-1">
                      View Proof Link
                    </a>
                  )}
                </div>
              </div>

              {/* Actions */}
              {dispute.status !== "resolved_refund" && dispute.status !== "resolved_seller" ? (
                <div className="pt-2 border-t border-[#E4DDCB] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="font-mono text-xs font-semibold text-[#1F1B14]">
                    Amount: GHS {dispute.deal?.price?.toFixed(2) || "0.00"}
                  </span>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => handleResolve(dispute.id, "favor_buyer")}
                      disabled={resolvingId === dispute.id}
                      className="px-3 h-9 rounded-lg border border-[#A33B2E]/40 text-[#A33B2E] hover:bg-[#F7E6E2] text-xs font-semibold"
                    >
                      Favor Buyer (Refund)
                    </button>
                    <button
                      onClick={() => handleResolve(dispute.id, "favor_seller")}
                      disabled={resolvingId === dispute.id}
                      className="px-3 h-9 rounded-lg bg-[#1C5A44] hover:bg-[#123C2E] text-white text-xs font-semibold"
                    >
                      Favor Seller (Release)
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 rounded-lg bg-[#FAF6EE] border border-[#E4DDCB] text-xs text-[#8A8271]">
                  Resolution: <span className="font-semibold text-[#1F1B14]">{dispute.resolution || dispute.status}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
