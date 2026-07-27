"use client";

import { useEffect, useState, use } from "react";
import { ShieldCheck, Lock, Smartphone, CreditCard, Check, AlertCircle, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

export default function PublicPayPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);

  const [deal, setDeal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [payMethod, setPayMethod] = useState("momo");

  const [submitting, setSubmitting] = useState(false);
  const [lockedSuccess, setLockedSuccess] = useState<any>(null);

  useEffect(() => {
    const fetchDeal = async () => {
      try {
        const res = await fetch(`/api/deals/link/${code}`);
        if (!res.ok) throw new Error("Deal not found or link has expired");
        const json = await res.json();
        setDeal(json);

        // Check if returning from Paystack redirect with verify parameter
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get("verify") === "1" && urlParams.get("reference")) {
          const ref = urlParams.get("reference");
          const verifyRes = await fetch(`/api/deals/${json.id}/paystack/verify?reference=${ref}`);
          if (verifyRes.ok) {
            const vData = await verifyRes.json();
            setLockedSuccess(vData.deal || json);
            try {
              confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
            } catch (e) {}
          }
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDeal();
  }, [code]);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      // Initialize Paystack transaction (or direct escrow simulation)
      const res = await fetch(`/api/deals/${deal.id}/paystack/init`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buyerName, buyerPhone, buyerEmail }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Payment initialization failed");

      if (data.authorization_url) {
        // If Paystack URL or simulated callback URL, redirect or direct lock
        if (data.authorization_url.includes("demo=true")) {
          // Direct demo simulation
          const verifyRes = await fetch(`/api/deals/${deal.id}/paystack/verify?reference=${data.reference}&demo=true`);
          const vJson = await verifyRes.json();
          setLockedSuccess(vJson.deal || deal);
          try {
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
          } catch (e) {}
        } else {
          window.location.href = data.authorization_url;
        }
      } else {
        // Direct lock fallback
        const lockRes = await fetch(`/api/deals/${deal.id}/pay`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ buyerName, buyerPhone, buyerEmail }),
        });
        const lockJson = await lockRes.json();
        setLockedSuccess(lockJson);
        try {
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        } catch (e) {}
      }
    } catch (err: any) {
      setError(err.message || "Payment failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050811] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-slate-400">Securing payment portal...</p>
        </div>
      </div>
    );
  }

  if (error && !deal) {
    return (
      <div className="min-h-screen bg-[#050811] flex items-center justify-center p-4">
        <div className="w-full max-w-md glass-card p-6 rounded-2xl border border-rose-500/30 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
          <h2 className="text-lg font-bold text-white">Deal Unavailable</h2>
          <p className="text-xs text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  const isAlreadyPaid = deal.status !== "created" || Boolean(lockedSuccess);
  const activeDealState = lockedSuccess || deal;

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decorative Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-lg mx-auto space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
            <span>SETTLE Escrow Guarantee</span>
          </div>
          <h1 className="text-xs text-slate-400">
            Purchasing from <span className="font-bold text-white">{deal.sellerName}</span>
          </h1>
        </div>

        {/* Receipt Style Card */}
        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6 shadow-2xl relative">
          {/* Item Info Header */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Item Details</span>
                <h2 className="text-lg font-bold text-white">{deal.itemName}</h2>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                {deal.code}
              </span>
            </div>

            {deal.description && <p className="text-xs text-slate-400 leading-relaxed">{deal.description}</p>}

            <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400">Total Amount Due</span>
              <span className="text-2xl font-black text-emerald-400">GH₵ {deal.price.toFixed(2)}</span>
            </div>
          </div>

          {!isAlreadyPaid ? (
            /* Checkout Form */
            <form onSubmit={handlePay} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
                  {error}
                </div>
              )}

              <div className="space-y-3">
                <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400">Buyer Information</h4>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder="e.g. Kofi Owusu"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl py-2.5 px-3.5 text-sm text-white placeholder-slate-600 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">WhatsApp Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    placeholder="024 123 4567"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl py-2.5 px-3.5 text-sm text-white placeholder-slate-600 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Email Address (For Receipt & Confirmation Code) *</label>
                  <input
                    type="email"
                    required
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                    placeholder="kofi@example.com"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl py-2.5 px-3.5 text-sm text-white placeholder-slate-600 outline-none"
                  />
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-slate-300">Select Payment Method</label>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPayMethod("momo")}
                    className={`p-3 rounded-xl border flex items-center space-x-2 text-xs font-bold transition-all ${
                      payMethod === "momo"
                        ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                        : "bg-slate-900 border-slate-800 text-slate-400"
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>MoMo Wallet</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPayMethod("card")}
                    className={`p-3 rounded-xl border flex items-center space-x-2 text-xs font-bold transition-all ${
                      payMethod === "card"
                        ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                        : "bg-slate-900 border-slate-800 text-slate-400"
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Debit / Credit Card</span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || !buyerName || !buyerPhone || !buyerEmail}
                className="w-full py-4 rounded-2xl text-base font-extrabold bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-xl shadow-emerald-500/20 transition-all hover:scale-[1.02] flex items-center justify-center space-x-2 disabled:opacity-50 mt-4"
              >
                <Lock className="w-5 h-5 stroke-[2.5]" />
                <span>{submitting ? "Processing Payment..." : `Pay GH₵ ${deal.price.toFixed(2)} into Escrow`}</span>
              </button>

              <div className="text-center text-[11px] text-slate-500 flex items-center justify-center space-x-1.5 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Your money stays safe in escrow until you receive & verify delivery.</span>
              </div>
            </form>
          ) : (
            /* Paid Success Screen for Buyer */
            <div className="space-y-6 text-center animate-in fade-in">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto ring-8 ring-emerald-500/10">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-extrabold text-white">Payment Locked in Escrow!</h3>
                <p className="text-xs text-slate-400">
                  Seller <span className="font-semibold text-slate-200">{deal.sellerName}</span> has been notified to dispatch your item.
                </p>
              </div>

              {/* Delivery Confirmation Code Card */}
              {activeDealState.deliveryCode && (
                <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-500/30 space-y-2 glow-emerald">
                  <div className="text-[11px] uppercase font-bold tracking-wider text-emerald-400">
                    Your Delivery Confirmation Code
                  </div>
                  <div className="text-4xl font-mono font-black text-white tracking-widest py-1">
                    {activeDealState.deliveryCode}
                  </div>
                  <p className="text-[11px] text-slate-300 max-w-xs mx-auto leading-relaxed">
                    ⚠️ Keep this code secret! Only give this code to the seller after you receive and inspect your package.
                  </p>
                </div>
              )}

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-left text-xs space-y-2">
                <div className="flex justify-between text-slate-400">
                  <span>Status:</span>
                  <span className="font-bold text-emerald-400 capitalize">{activeDealState.status}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Confirmation Link:</span>
                  <a
                    href={`/confirm/${deal.code}`}
                    className="font-mono text-cyan-400 underline font-bold"
                  >
                    /confirm/{deal.code}
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
