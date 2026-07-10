import { useParams, useLocation } from "wouter";
import { useGetDealByCode, getGetDealByCodeQueryKey } from "@workspace/api-client-react";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, ShieldCheck, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export default function PayPage() {
  const { code } = useParams<{ code: string }>();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data: deal, isLoading } = useGetDealByCode(code || "", {
    query: { enabled: !!code, queryKey: getGetDealByCodeQueryKey(code || "") },
  });

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [initError, setInitError] = useState<string | null>(null);
  const [initLoading, setInitLoading] = useState(false);

  // Verification state (triggered when Paystack redirects back with ?reference=)
  const [verifyState, setVerifyState] = useState<"idle" | "verifying" | "success" | "failed">("idle");
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // On mount, check for Paystack callback reference in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reference = params.get("reference") || params.get("trxref");
    if (!reference || !deal) return;

    setVerifyState("verifying");

    fetch(`/api/deals/${deal.id}/paystack/verify?reference=${encodeURIComponent(reference)}`)
      .then((r) => r.json())
     .then(async (data: { status?: string; error?: string }) => {
       if (data.status === "success") {
         await queryClient.invalidateQueries({
           queryKey: getGetDealByCodeQueryKey(code || ""),
         });

         setVerifyState("success");
         // Redirect to confirm page after short delay
         setTimeout(() => setLocation(`/confirm/${code}`), 2000);
       } else {
          setVerifyState("failed");
          setVerifyError(data.error || "Payment verification failed.");
        }
      })
      .catch(() => {
        setVerifyState("failed");
        setVerifyError("Could not reach the server. Please contact support.");
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deal?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Invalid or expired payment link.</p>
      </div>
    );
  }

  // Deal already paid — redirect to tracking
  if (deal.status !== "created") {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center py-10 px-6">
          <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
          <p className="text-xl font-bold mb-2">Already Paid</p>
          <p className="text-muted-foreground mb-6">
            This deal has already been secured in escrow.
          </p>
          <Button onClick={() => setLocation(`/confirm/${code}`)}>
            View Delivery Status
          </Button>
        </Card>
      </div>
    );
  }

  // Paystack has redirected back and we're verifying
  if (verifyState === "verifying") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center py-10 px-6">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg font-semibold">Verifying your payment…</p>
          <p className="text-muted-foreground text-sm mt-2">Checking with Paystack — please wait.</p>
        </Card>
      </div>
    );
  }

  if (verifyState === "success") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center py-10 px-6">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <p className="text-xl font-bold text-emerald-800 mb-2">Funds Locked in Escrow</p>
          <p className="text-muted-foreground mb-2">
            Your payment is secured. The seller has been notified.
          </p>
          <p className="text-xs text-muted-foreground">Redirecting to status tracking…</p>
        </Card>
      </div>
    );
  }

  if (verifyState === "failed") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center py-10 px-6">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <p className="text-lg font-bold mb-2">Payment Not Confirmed</p>
          <p className="text-muted-foreground text-sm mb-6">{verifyError}</p>
          <Button variant="outline" onClick={() => {
            setVerifyState("idle");
            // Remove ?reference from URL without reload
            window.history.replaceState({}, "", window.location.pathname);
          }}>
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  const handlePay = async () => {
    setInitError(null);
    setInitLoading(true);
    try {
      const res = await fetch(`/api/deals/${deal.id}/paystack/init`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buyerName: name, buyerPhone: phone, buyerEmail: email }),
      });
      const data = await res.json() as { authorization_url?: string; error?: string };
      if (!res.ok || !data.authorization_url) {
        setInitError(data.error || "Could not start payment. Please try again.");
        return;
      }
      // Redirect to Paystack hosted checkout
      window.location.href = data.authorization_url;
    } catch {
      setInitError("Network error. Please check your connection and try again.");
    } finally {
      setInitLoading(false);
    }
  };

  const canPay = name.trim().length > 0 && phone.trim().length > 0 && email.trim().length > 0 && !initLoading;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-5">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 font-bold text-xl tracking-tight text-primary">
            <Lock className="w-5 h-5" />
            SETTLE
          </div>
          <br />
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            Funds held in secure partner escrow
          </div>
        </div>

        {/* Deal summary */}
        <Card className="border-t-4 border-t-primary shadow-md overflow-hidden">
          <div className="bg-muted px-6 py-4 border-b text-center">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">
              Paying to
            </p>
            <p className="text-lg font-bold">{deal.sellerName}</p>
          </div>
          {/* Escrow window info — shown before payment */}
          {(() => {
            const h = deal.deliveryWindowHours;
            const typeLabel = h <= 24 ? "Digital Item" : h <= 48 ? "Service" : "Physical Product";
            const triggerLabel = h <= 48 ? "completion" : "dispatch";
            return (
              <div className="bg-blue-50 border-b border-blue-100 px-5 py-3 flex items-start gap-3">
                <span className="text-lg mt-0.5">{h <= 24 ? "💻" : h <= 48 ? "🛠" : "📦"}</span>
                <div>
                  <p className="text-xs font-semibold text-blue-800">{typeLabel} · {h}-hour auto-release</p>
                  <p className="text-xs text-blue-600 mt-0.5">
                    Funds release automatically {h}h after seller confirms {triggerLabel} — you can dispute before the timer expires.
                  </p>
                </div>
              </div>
            );
          })()}
          <CardContent className="px-6 py-5 space-y-5">
            {/* Item + price */}
            <div className="flex justify-between items-start gap-4 pb-4 border-b">
              <div>
                <p className="font-semibold text-base">{deal.itemName}</p>
                {(deal as { description?: string | null }).description && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {(deal as { description?: string | null }).description}
                  </p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-muted-foreground uppercase mb-0.5">Total</p>
                <p className="text-2xl font-bold">GHS {deal.price.toFixed(2)}</p>
              </div>
            </div>

            {/* Buyer info form */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="buyer-name">Your Full Name</Label>
                <Input
                  id="buyer-name"
                  placeholder="Kwame Mensah"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="buyer-phone">Phone Number</Label>
                <Input
                  id="buyer-phone"
                  placeholder="054 000 0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                  type="tel"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="buyer-email">Email Address</Label>
                <Input
                  id="buyer-email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  type="email"
                />
                <p className="text-xs text-muted-foreground">
                  Paystack sends your payment receipt here
                </p>
              </div>
            </div>

            {initError && (
              <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/5 rounded-lg px-3 py-2.5">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                {initError}
              </div>
            )}

            <Button
              className="w-full h-12 text-base font-semibold"
              onClick={handlePay}
              disabled={!canPay}
            >
              {initLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Opening Paystack…
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Pay GHS {deal.price.toFixed(2)} Securely
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground leading-relaxed">
              You will be redirected to Paystack to complete payment via MoMo or card.
              Funds are not released to the seller until you confirm delivery.
            </p>
          </CardContent>
        </Card>

        {/* Powered by Paystack badge */}
        <p className="text-center text-xs text-muted-foreground">
          Payments secured by{" "}
          <span className="font-semibold text-foreground">Paystack</span>
        </p>
      </div>
    </div>
  );
}
