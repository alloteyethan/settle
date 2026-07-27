"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, ArrowRight, Lock } from "lucide-react";

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
      <div className="max-w-[640px] mx-auto px-4 py-16 text-center text-[#8A8271] text-sm">
        <span>Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-[640px] mx-auto px-4 py-12">
        <div className="p-3.5 rounded-lg bg-[#F7E6E2] border border-[#A33B2E]/20 text-[#A33B2E] text-xs font-medium">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[640px] mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Dashboard Title & Main Action */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#1F1B14]">Dashboard</h1>
          <p className="text-xs text-[#8A8271]">Escrow balance & recent settlements</p>
        </div>

        <Link
          href="/create-deal"
          className="h-10 px-4 rounded-xl text-xs font-semibold bg-[#1C5A44] hover:bg-[#123C2E] text-white flex items-center space-x-1.5 transition-colors"
        >
          <Plus className="w-4 h-4 stroke-[2]" />
          <span>Create Deal</span>
        </Link>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Total Earnings */}
        <div className="bg-white p-5 rounded-xl border border-[#E4DDCB] space-y-1">
          <span className="settle-label mb-1">Total Earnings</span>
          <div className="font-mono text-2xl font-semibold text-[#1C5A44]">
            GHS {data.totalEarnings.toFixed(2)}
          </div>
          <span className="text-[11px] text-[#8A8271] block">Released to MoMo</span>
        </div>

        {/* Pending Escrow */}
        <div className="bg-white p-5 rounded-xl border border-[#E4DDCB] space-y-1">
          <span className="settle-label mb-1">Pending in Escrow</span>
          <div className="font-mono text-2xl font-semibold text-[#3E5C76]">
            GHS {data.pendingEarnings.toFixed(2)}
          </div>
          <span className="text-[11px] text-[#8A8271] block">Active transactions</span>
        </div>
      </div>

      {/* Overview Counts */}
      <div className="bg-white p-5 rounded-xl border border-[#E4DDCB] flex items-center justify-between text-xs text-[#4A4438]">
        <div>
          <span className="text-[#8A8271]">Active Deals:</span>{" "}
          <span className="font-mono font-semibold text-[#1F1B14]">{data.activeDeals}</span>
        </div>
        <div className="h-4 w-px bg-[#E4DDCB]" />
        <div>
          <span className="text-[#8A8271]">Settled:</span>{" "}
          <span className="font-mono font-semibold text-[#1C5A44]">{data.settledDeals}</span>
        </div>
        <div className="h-4 w-px bg-[#E4DDCB]" />
        <div>
          <span className="text-[#8A8271]">Disputed:</span>{" "}
          <span className="font-mono font-semibold text-[#A33B2E]">{data.disputedDeals}</span>
        </div>
      </div>

      {/* Recent Settlements List */}
      <div className="bg-white rounded-xl border border-[#E4DDCB] overflow-hidden space-y-0">
        <div className="p-4 border-b border-[#E4DDCB] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#1F1B14]">Recent Settled Payouts</h3>
          <Link href="/deals" className="text-xs font-semibold text-[#1C5A44] hover:underline flex items-center space-x-1">
            <span>All Deals</span>
            <ArrowRight className="w-3 h-3 stroke-[2]" />
          </Link>
        </div>

        {data.recentSettlements.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#8A8271]">
            No settled payouts yet. Create your first deal link to begin.
          </div>
        ) : (
          <div className="divide-y divide-[#E4DDCB]">
            {data.recentSettlements.map((deal: any) => (
              <div key={deal.id} className="p-4 flex items-center justify-between hover:bg-[#FAF6EE] transition-colors">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold text-[#1F1B14]">{deal.itemName}</span>
                    <span className="font-mono text-[11px] text-[#8A8271] px-1.5 py-0.5 bg-[#FAF6EE] rounded border border-[#E4DDCB]">
                      {deal.code}
                    </span>
                  </div>
                  <div className="text-xs text-[#8A8271]">
                    Buyer: {deal.buyerName || "N/A"}
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono text-sm font-semibold text-[#1C5A44]">
                    GHS {deal.sellerPayout.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-[#8A8271] font-mono">
                    (Fee: GHS {deal.feeAmount.toFixed(2)})
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
