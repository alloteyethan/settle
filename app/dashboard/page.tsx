"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DollarSign, Clock, ShieldCheck, CheckCircle2, AlertTriangle, PlusCircle, ArrowRight, ExternalLink } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem("settle_token");
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch("/api/sellers/me/dashboard", { headers });
        if (res.status === 401) {
          router.push("/login");
          return;
        }

        if (!res.ok) throw new Error("Failed to load dashboard");
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [router]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-400">Loading your SETTLE dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm font-semibold">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 sm:p-8 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Seller Dashboard</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Monitor escrow balances, active payment links, and recent payouts.
          </p>
        </div>

        <Link
          href="/create-deal"
          className="flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl text-sm font-extrabold bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02]"
        >
          <PlusCircle className="w-5 h-5 stroke-[2.5]" />
          <span>Generate Deal Link</span>
        </Link>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Earnings Card */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-2 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Earnings</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            GH₵ {data.totalEarnings.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-emerald-400/80 font-medium">Released directly to your wallet</p>
        </div>

        {/* Pending Card */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-2 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending in Escrow</span>
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-cyan-300">
            GH₵ {data.pendingEarnings.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-cyan-400/80 font-medium">Locked pending buyer delivery confirmation</p>
        </div>

        {/* Active Deals */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Deals</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">{data.activeDeals}</div>
          <p className="text-[11px] text-slate-400 font-medium">Paid or dispatched transactions</p>
        </div>

        {/* Settled / Disputed */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Settled / Disputed</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              {data.disputedDeals > 0 ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white flex items-center space-x-2">
            <span>{data.settledDeals}</span>
            {data.disputedDeals > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {data.disputedDeals} Disputed
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Completed vs open disputes</p>
        </div>
      </div>

      {/* Recent Settlements Section */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white">Recent Settled Payouts</h2>
            <p className="text-xs text-slate-400">Transactions where funds were successfully released</p>
          </div>

          <Link
            href="/deals"
            className="flex items-center space-x-1 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <span>View All Deals</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {data.recentSettlements.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm space-y-3">
            <ShieldCheck className="w-10 h-10 mx-auto text-slate-700 stroke-1" />
            <p>No settled payouts yet. Generate your first deal link to start receiving payments!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {data.recentSettlements.map((deal: any) => (
              <div key={deal.id} className="py-4 flex items-center justify-between hover:bg-slate-900/40 px-3 rounded-xl transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-bold text-white">{deal.itemName}</h4>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                      {deal.code}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Buyer: {deal.buyerName || "N/A"} • Settled: {new Date(deal.settledAt || deal.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="text-right flex items-center space-x-4">
                  <div>
                    <div className="text-sm font-black text-emerald-400">
                      +GH₵ {deal.sellerPayout.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">
                      (Fee: GH₵ {deal.feeAmount.toFixed(2)})
                    </div>
                  </div>

                  <Link
                    href={`/deals/${deal.id}`}
                    className="p-2 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
