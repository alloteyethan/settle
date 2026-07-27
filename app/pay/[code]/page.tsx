"use client";

import { useEffect, useState, use } from "react";
import { Lock, Smartphone, CreditCard, AlertCircle, ShieldCheck } from "lucide-react";
import { ConfirmationCodeBoxes } from "@/components/ConfirmationCodeBoxes";

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
        if (!res.ok) throw new Error("Deal link has expired or does not exist");
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
      const res = await fetch(`/api/deals/${deal.id}/paystack/init`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buyerName, buyerPhone, buyerEmail }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Payment initialization failed");

      if (data.authorization_url) {
        if (data.authorization_url.includes("demo=true")) {
          const verifyRes = await fetch(`/api/deals/${deal.id}/paystack/verify?reference=${data.reference}&demo=true`);
          const vJson = await verifyRes.json();
          setLockedSuccess(vJson.deal || deal);
        } else {
          window.location.href = data.authorization_url;
        }
      } else {
        const lockRes = await fetch(`/api/deals/${deal.id}/pay`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ buyerName, buyerPhone, buyerEmail }),
        });
        const lockJson = await lockRes.json();
        setLockedSuccess(lockJson);
      }
    } catch (err: any) {
      setError(err.message || "Payment failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF6EE] flex items-center justify-center p-4">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 rounded-full border-2 border-[#1C5A44] border-t-transparent animate-spin mx-auto" />
          <p className="text-xs font-medium text-[#8A8271]">Securing payment portal...</p>
        </div>
      </div>
    );
  }

  if (error && !deal) {
    return (
      <div className="min-h-screen bg-[#FAF6EE] flex items-center justify-center p-4">
        <div className="w-full max-w-[480px] bg-white p-6 rounded-xl border border-[#A33B2E]/30 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-[#A33B2E] mx-auto stroke-[1.75]" />
          <h2 className="text-base font-semibold text-[#1F1B14]">Deal Unavailable</h2>
          <p className="text-xs text-[#8A8271]">This deal link has expired. Ask the seller to create a new one.</p>
        </div>
      </div>
    );
  }

  const isAlreadyPaid = deal.status !== "created" || Boolean(lockedSuccess);
  const activeDealState = lockedSuccess || deal;

  return (
    <div className="min-h-screen bg-[#FAF6EE] text-[#4A4438] flex flex-col justify-center py-10 px-4 sm:px-6">
      <div className="w-full max-w-[480px] mx-auto space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#E1EBE3] text-[#1C5A44] text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 stroke-[2]" />
            <span>SETTLE Escrow Guarantee</span>
          </div>
          <h1 className="text-xs text-[#8A8271]">
            Purchasing from <span className="font-semibold text-[#1F1B14]">{deal.sellerName}</span>
          </h1>
        </div>

        {/* Receipt Card */}
        <div className="bg-white p-6 sm:p-8 rounded-xl border border-[#E4DDCB] space-y-6">
          {/* Item Details */}
          <div className="p-4 rounded-lg bg-[#FAF6EE] border border-[#E4DDCB] space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <span className="settle-label mb-0">Item Name</span>
                <h2 className="text-lg font-semibold text-[#1F1B14]">{deal.itemName}</h2>
              </div>
              {/* Status pill badge */}
              <span
                className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium tracking-wide uppercase"
                style={{
                  backgroundColor: isAlreadyPaid ? "#E7ECF1" : "#FBF0DA",
                  color: isAlreadyPaid ? "#3E5C76" : "#B7791F",
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: isAlreadyPaid ? "#3E5C76" : "#B7791F" }}
                />
                <span>{isAlreadyPaid ? "IN ESCROW" : "AWAITING PAYMENT"}</span>
              </span>
            </div>

            {deal.description && <p className="text-xs text-[#4A4438]">{deal.description}</p>}

            <div className="pt-2 border-t border-[#E4DDCB] flex justify-between items-center">
              <span className="text-xs font-medium text-[#8A8271]">Total Price</span>
              <span className="font-mono text-2xl font-semibold text-[#1C5A44]">
                GHS {deal.price.toFixed(2)}
              </span>
            </div>
          </div>

          {!isAlreadyPaid ? (
            /* Checkout Form */
            <form onSubmit={handlePay} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-[#F7E6E2] border border-[#A33B2E]/20 text-[#A33B2E] text-xs font-medium">
                  {error}
                </div>
              )}

              <div>
                <label className="settle-label">Your Full Name</label>
                <input
                  type="text"
                  required
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="e.g. Kofi Owusu"
                  className="w-full settle-input px-3"
                />
              </div>

              <div>
                <label className="settle-label">WhatsApp Phone Number</label>
                <input
                  type="tel"
                  required
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  placeholder="024 123 4567"
                  className="w-full settle-input px-3"
                />
              </div>

              <div>
                <label className="settle-label">Email Address (For Delivery Code & Receipt)</label>
                <input
                  type="email"
                  required
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                  placeholder="kofi@example.com"
                  className="w-full settle-input px-3"
                />
              </div>

              {/* Payment Method Segmented Control */}
              <div>
                <label className="settle-label">Payment Method</label>
                <div className="grid grid-cols-2 gap-2 bg-[#FAF6EE] p-1 rounded-lg border border-[#E4DDCB]">
                  <button
                    type="button"
                    onClick={() => setPayMethod("momo")}
                    className={`h-9 rounded-md text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors ${
                      payMethod === "momo"
                        ? "bg-[#1C5A44] text-white"
                        : "text-[#4A4438] hover:text-[#1F1B14]"
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5 stroke-[1.75]" />
                    <span>MoMo Wallet</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPayMethod("card")}
                    className={`h-9 rounded-md text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors ${
                      payMethod === "card"
                        ? "bg-[#1C5A44] text-white"
                        : "text-[#4A4438] hover:text-[#1F1B14]"
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5 stroke-[1.75]" />
                    <span>Card</span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || !buyerName || !buyerPhone || !buyerEmail}
                className="w-full h-12 btn-primary transition-colors disabled:opacity-50 mt-2 flex items-center justify-center space-x-2"
              >
                <Lock className="w-4 h-4 stroke-[2]" />
                <span>{submitting ? "Processing Payment..." : `Pay GHS ${deal.price.toFixed(2)} into Escrow`}</span>
              </button>

              {/* Recurring Trust Anchor */}
              <p className="text-center text-[12px] text-[#8A8271] leading-relaxed pt-1">
                Your money is held securely by SETTLE and only released to the seller after you confirm delivery.
              </p>
            </form>
          ) : (
            /* Paid Success Screen */
            <div className="space-y-5 text-center">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-[#1F1B14]">Payment Locked in Escrow</h3>
                <p className="text-xs text-[#8A8271]">
                  Seller <span className="font-semibold text-[#1F1B14]">{deal.sellerName}</span> has been notified to dispatch your order.
                </p>
              </div>

              {/* 4-Digit Confirmation Code Box Display */}
              {activeDealState.deliveryCode && (
                <div className="p-4 rounded-lg bg-[#FAF6EE] border border-[#E4DDCB] space-y-2">
                  <span className="settle-label mb-0 text-[#1C5A44]">Your Delivery Confirmation Code</span>
                  <ConfirmationCodeBoxes value={activeDealState.deliveryCode} readOnly />
                  <p className="text-[11px] text-[#8A8271] max-w-xs mx-auto leading-normal">
                    Keep this code safe. Only share this code with the seller after you receive and inspect your package.
                  </p>
                </div>
              )}

              <div className="pt-2 text-center">
                <a
                  href={`/confirm/${deal.code}`}
                  className="text-xs font-semibold text-[#1C5A44] underline"
                >
                  Go to Delivery Confirmation Portal (/confirm/{deal.code})
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
