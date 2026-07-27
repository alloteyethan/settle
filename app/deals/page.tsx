"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PlusCircle, ExternalLink, ShieldCheck, Clock, CheckCircle2, AlertTriangle, Lock } from "lucide-react";

export default function DealsPage() {
  const router = useRouter();
  const [deals, setDeals] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDeals = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("settle_token");
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const statusQuery = activeTab !== "all" ? `?status=${activeTab}` : "";
      const res = await fetch(`/api/deals${statusQuery}`, { headers });

      if (res.status === 401) {
        router.push("/login");
        return;
      }

      if (!res.ok) throw new Error("Failed to load deals");
      const json = await res.json();
      setDeals(json.deals || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, [activeTab]);

  const tabs = [
    { id: "all", label: "All Deals" },
    { id: "created", label: "Created (Unpaid)" },
    { id: "locked", label: "Locked (Paid)" },
    { id: "dispatched", label: "Dispatched" },
    { id: "settled", label: "Settled" },
    { id: "disputed", label: "Disputed" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Your Escrow Deals</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Track deal status, confirm fulfillment, and manage buyer payouts.
          </p>
        </div>

        <Link
          href="/create-deal"
          className="flex items-center justify-center space-x-2 px-5 py-3 rounded-xl text-sm font-extrabold bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02]"
        >
          <PlusCircle className="w-4 h-4 stroke-[2.5]" />
          <span>New Escrow Link</span>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-800">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Deals List */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <span>Loading deals...</span>
        </div>
      ) : deals.length === 0 ? (
        <div className="glass-card p-12 rounded-2xl border border-slate-800 text-center space-y-4">
          <ShieldCheck className="w-12 h-12 text-slate-700 mx-auto" />
          <h3 className="text-lg font-bold text-white">No deals found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            You don&apos;t have any deals matching this filter status yet.
          </p>
          <Link
            href="/create-deal"
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create New Link</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {deals.map((deal) => (
            <div
              key={deal.id}
              className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900 text-emerald-400 border border-slate-800">
                      {deal.code}
                    </span>
                    <h3 className="text-base font-bold text-white mt-1.5 line-clamp-1">{deal.itemName}</h3>
                  </div>

                  <span
                    className={`text-[10px] uppercase font-extrabold px-2.5 py-1 rounded-full border ${
                      deal.status === "settled"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        : deal.status === "locked"
                        ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                        : deal.status === "dispatched"
                        ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/30"
                        : deal.status === "disputed"
                        ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                        : "bg-slate-800 text-slate-400 border-slate-700"
                    }`}
                  >
                    {deal.status}
                  </span>
                </div>

                {deal.description && (
                  <p className="text-xs text-slate-400 line-clamp-2">{deal.description}</p>
                )}

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between text-xs">
                  <div>
                    <div className="text-slate-400 text-[10px]">Price</div>
                    <div className="font-extrabold text-white">GH₵ {deal.price.toFixed(2)}</div>
                  </div>

                  <div className="text-right">
                    <div className="text-slate-400 text-[10px]">Your Payout</div>
                    <div className="font-extrabold text-emerald-400">GH₵ {deal.sellerPayout.toFixed(2)}</div>
                  </div>
                </div>

                {deal.buyerName && (
                  <div className="text-xs text-slate-400 flex items-center space-x-1">
                    <span>Buyer:</span>
                    <span className="font-semibold text-slate-200">{deal.buyerName}</span>
                    {deal.buyerPhone && <span>({deal.buyerPhone})</span>}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-800/60 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  {new Date(deal.createdAt).toLocaleDateString()}
                </span>

                <Link
                  href={`/deals/${deal.id}`}
                  className="flex items-center space-x-1 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  <span>Manage Deal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
