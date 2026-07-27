"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, ArrowRight } from "lucide-react";

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "settled":
        return { label: "Released", bg: "#E1EBE3", text: "#1C5A44" };
      case "locked":
        return { label: "In Escrow", bg: "#E7ECF1", text: "#3E5C76" };
      case "dispatched":
        return { label: "Dispatched", bg: "#FBF0DA", text: "#B7791F" };
      case "disputed":
        return { label: "Disputed", bg: "#F7E6E2", text: "#A33B2E" };
      default:
        return { label: "Awaiting Payment", bg: "#FBF0DA", text: "#B7791F" };
    }
  };

  const tabs = [
    { id: "all", label: "All" },
    { id: "created", label: "Unpaid" },
    { id: "locked", label: "In Escrow" },
    { id: "dispatched", label: "Dispatched" },
    { id: "settled", label: "Settled" },
    { id: "disputed", label: "Disputed" },
  ];

  return (
    <div className="max-w-[640px] mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#1F1B14]">Your Escrow Deals</h1>
          <p className="text-xs text-[#8A8271]">Track payments and release states</p>
        </div>

        <Link
          href="/create-deal"
          className="h-10 px-4 rounded-xl text-xs font-semibold bg-[#1C5A44] hover:bg-[#123C2E] text-white flex items-center space-x-1.5 transition-colors"
        >
          <Plus className="w-4 h-4 stroke-[2]" />
          <span>New Deal</span>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 border-b border-[#E4DDCB] pb-2 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? "bg-[#1C5A44] text-white font-semibold"
                : "text-[#4A4438] hover:bg-[#F3EDE0]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Deals List Container */}
      <div className="bg-white rounded-xl border border-[#E4DDCB] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-[#8A8271]">Loading deals...</div>
        ) : deals.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-xs text-[#8A8271]">No deals matching this filter.</p>
            <Link
              href="/create-deal"
              className="inline-flex items-center space-x-1 px-4 py-2 rounded-lg text-xs font-semibold bg-[#1C5A44] text-white"
            >
              <span>Create New Deal</span>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-[#E4DDCB]">
            {deals.map((deal) => {
              const badge = getStatusBadge(deal.status);

              return (
                <Link
                  key={deal.id}
                  href={`/deals/${deal.id}`}
                  className="p-4 flex items-center justify-between hover:bg-[#FAF6EE] transition-colors block"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-semibold text-[#1F1B14]">{deal.itemName}</span>
                      <span className="font-mono text-[11px] text-[#8A8271]">#{deal.code}</span>
                    </div>

                    <div className="flex items-center space-x-2 text-xs">
                      {/* Pill Badge */}
                      <span
                        className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium tracking-wide uppercase"
                        style={{ backgroundColor: badge.bg, color: badge.text }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: badge.text }} />
                        <span>{badge.label}</span>
                      </span>

                      {deal.buyerName && (
                        <span className="text-[#8A8271]">
                          • Buyer: <span className="text-[#4A4438]">{deal.buyerName}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right flex items-center space-x-3">
                    <div>
                      <div className="font-mono text-sm font-semibold text-[#1F1B14]">
                        GHS {deal.price.toFixed(2)}
                      </div>
                      <div className="font-mono text-[10px] text-[#8A8271]">
                        Payout: GHS {deal.sellerPayout.toFixed(2)}
                      </div>
                    </div>

                    <ArrowRight className="w-4 h-4 text-[#8A8271] stroke-[1.75]" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
