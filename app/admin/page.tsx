"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, AlertTriangle, CheckCircle2, RefreshCcw, ExternalLink, UserCheck, XCircle } from "lucide-react";

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-6 sm:p-8 rounded-2xl border border-slate-800">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-2">
            <ShieldCheck className="w-4 h-4" />
            <span>SETTLE Admin Escalation Panel</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Dispute Resolution Center</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Review buyer dispute evidence, seller counter-proofs, and make binding escrow payout decisions.
          </p>
        </div>

        <button
          onClick={fetchDisputes}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800"
        >
          <RefreshCcw className="w-4 h-4" />
          <span>Refresh Disputes</span>
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm">
          <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <span>Loading platform disputes...</span>
        </div>
      ) : disputes.length === 0 ? (
        <div className="glass-card p-12 rounded-2xl border border-slate-800 text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">All Clear!</h3>
          <p className="text-xs text-slate-400">There are currently no active disputes on the platform.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {disputes.map((dispute) => (
            <div key={dispute.id} className="glass-card p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      Dispute #{dispute.id}
                    </span>
                    <h3 className="text-lg font-bold text-white">{dispute.deal?.itemName || `Deal #${dispute.dealId}`}</h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Reason: <span className="font-bold text-white uppercase">{dispute.reason}</span> • Date: {new Date(dispute.createdAt).toLocaleString()}
                  </p>
                </div>

                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full uppercase border ${
                    dispute.status === "open"
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                      : dispute.status === "counter_submitted"
                      ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                      : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  }`}
                >
                  {dispute.status}
                </span>
              </div>

              {/* Claims Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Buyer Claim */}
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-2">
                  <h4 className="text-xs uppercase font-bold text-rose-400">Buyer Claim</h4>
                  <p className="text-xs text-slate-300">{dispute.description || "No description provided."}</p>
                  {dispute.evidenceUrl && (
                    <a
                      href={dispute.evidenceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center space-x-1 text-xs font-bold text-cyan-400 underline"
                    >
                      <span>Buyer Evidence Link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                {/* Seller Counter-Proof */}
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-2">
                  <h4 className="text-xs uppercase font-bold text-cyan-400">Seller Counter-Proof</h4>
                  <p className="text-xs text-slate-300">{dispute.counterProofDescription || "Seller has not submitted counter-proof yet."}</p>
                  {dispute.counterProofUrl && (
                    <a
                      href={dispute.counterProofUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center space-x-1 text-xs font-bold text-cyan-400 underline"
                    >
                      <span>Seller Proof Link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>

              {/* Resolution Action Bar */}
              {dispute.status !== "resolved_refund" && dispute.status !== "resolved_seller" ? (
                <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs text-slate-400">
                    Value: <span className="font-extrabold text-white">GH₵ {dispute.deal?.price?.toFixed(2) || "0.00"}</span>
                  </div>

                  <div className="flex gap-3 w-full sm:w-auto">
                    <button
                      onClick={() => handleResolve(dispute.id, "favor_buyer")}
                      disabled={resolvingId === dispute.id}
                      className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold border border-rose-500/40 flex items-center justify-center space-x-2"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Favor Buyer (Refund)</span>
                    </button>

                    <button
                      onClick={() => handleResolve(dispute.id, "favor_seller")}
                      disabled={resolvingId === dispute.id}
                      className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold flex items-center justify-center space-x-2 shadow-md shadow-emerald-500/20"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Favor Seller (Release Funds)</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400">
                  Resolution Result: <span className="font-bold text-white">{dispute.resolution || dispute.status}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
