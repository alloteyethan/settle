import { useParams } from "wouter";
import {
  useGetDeal,
  useFulfillDeal,
  useIssueRefund,
  useSubmitCounterProof,
  getGetDealQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Package,
  Truck,
  Wrench,
  Smartphone,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { TransactionProgress } from "@/components/transaction-progress";
import { CountdownTimer } from "@/components/countdown-timer";

const FULFILLMENT_OPTIONS = [
  { value: "shipped", label: "Item Shipped", description: "Handed to courier or dispatch rider", Icon: Truck },
  { value: "delivered", label: "Item Delivered", description: "Personally delivered to buyer", Icon: Package },
  { value: "service_completed", label: "Service Completed", description: "Service has been fully rendered", Icon: Wrench },
  { value: "digital_sent", label: "Digital Product Sent", description: "File, link, or code sent to buyer", Icon: Smartphone },
];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    created: "bg-slate-100 text-slate-700",
    locked: "bg-blue-100 text-blue-800",
    dispatched: "bg-amber-100 text-amber-800",
    delivered: "bg-green-100 text-green-800",
    settled: "bg-emerald-100 text-emerald-800",
    disputed: "bg-red-100 text-red-700",
  };
  const labels: Record<string, string> = {
    created: "Created",
    locked: "Payment Received",
    dispatched: "Seller Fulfilled",
    delivered: "Delivered",
    settled: "Completed",
    disputed: "Disputed",
  };
  return (
    <Badge variant="secondary" className={map[status] ?? ""}>
      {labels[status] ?? status}
    </Badge>
  );
}

export default function DealDetailPage() {
  const { id } = useParams<{ id: string }>();
  const dealId = parseInt(id, 10);
  const queryClient = useQueryClient();

  const { data: deal, isLoading } = useGetDeal(dealId, {
    query: {
      enabled: !!dealId,
      queryKey: getGetDealQueryKey(dealId),
      refetchInterval: 5000,
    },
  });

  const fulfillDeal = useFulfillDeal();
  const issueRefund = useIssueRefund();
  const submitProof = useSubmitCounterProof();

  const [selectedFulfillment, setSelectedFulfillment] = useState("shipped");
  const [proofDesc, setProofDesc] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [fulfillError, setFulfillError] = useState<string | null>(null);
  const [deliveryCode, setDeliveryCode] = useState("");
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-muted-foreground">Loading deal...</div>
      </div>
    );
  }
  if (!deal) return <div className="text-muted-foreground">Deal not found.</div>;

  const handleFulfill = () => {
    setFulfillError(null);
    fulfillDeal.mutate(
      { id: dealId, data: { fulfillmentType: selectedFulfillment as any, deliveryCode } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetDealQueryKey(dealId) });
        },
        onError: (err: any) => {
          setFulfillError(err?.data?.error ?? "Failed to confirm fulfillment.");
        },
      }
    );
  };

  const handleRefund = () => {
    if (!confirm("Refund the buyer in full? This cannot be undone.")) return;
    issueRefund.mutate(
      { id: dealId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetDealQueryKey(dealId) });
        },
      }
    );
  };

  const handleProofSubmit = () => {
    submitProof.mutate(
      { id: dealId, data: { counterProofDescription: proofDesc, counterProofUrl: proofUrl } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetDealQueryKey(dealId) });
        },
      }
    );
  };

  const buyerLink = `${window.location.origin}/confirm/${deal.code}`;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{deal.itemName}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Code: <span className="font-mono">{deal.code}</span>
            {deal.buyerName && <> · Buyer: <span className="font-medium text-foreground">{deal.buyerName}</span></>}
          </p>
        </div>
        <div className="text-right space-y-1">
          <StatusBadge status={deal.status} />
          <p className="text-xs text-muted-foreground">
            Debug status: {deal.status}
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left — Progress Tracker */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Transaction Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TransactionProgress
                status={deal.status as any}
                fulfillmentType={deal.fulfillmentType as any}
                sellerConfirmedAt={deal.sellerConfirmedAt}
                buyerConfirmedAt={deal.buyerConfirmedAt}
                createdAt={deal.createdAt}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right — Action Area + Details */}
        <div className="md:col-span-2 space-y-4">
          {/* Deal info */}
          <Card>
            <CardContent className="pt-5">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <p className="text-muted-foreground font-medium">Financial</p>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price</span>
                    <span className="font-medium">GHS {deal.price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fee (2%)</span>
                    <span className="text-destructive">– GHS {deal.feeAmount?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-muted-foreground">Your Payout</span>
                    <span className="font-bold text-emerald-600">GHS {deal.sellerPayout?.toFixed(2)}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-muted-foreground font-medium">Buyer</p>
                  {deal.buyerName ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Name</span>
                        <span className="font-medium">{deal.buyerName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Phone</span>
                        <span className="font-medium">{deal.buyerPhone}</span>
                      </div>
                    </>
                  ) : (
                    <p className="text-muted-foreground italic">No buyer yet</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* === LOCKED: Seller must confirm fulfillment === */}
          {deal.status === "locked" && (
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <ShieldCheck className="w-5 h-5" />
                  Confirm Fulfillment
                </CardTitle>
                <CardDescription>
                  Payment of <strong>GHS {deal.price.toFixed(2)}</strong> is secured in escrow.
                  Select how you fulfilled this order — this action is permanent and cannot be undone.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <RadioGroup value={selectedFulfillment} onValueChange={setSelectedFulfillment}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {FULFILLMENT_OPTIONS.map(({ value, label, description, Icon }) => (
                      <div key={value}>
                        <RadioGroupItem value={value} id={`ft-${value}`} className="peer sr-only" />
                        <Label
                          htmlFor={`ft-${value}`}
                          className="flex items-start gap-3 rounded-lg border-2 border-muted bg-white p-4 cursor-pointer hover:border-primary/40 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 transition-colors"
                        >
                          <Icon className="w-5 h-5 mt-0.5 text-muted-foreground shrink-0" />
                          <div>
                            <p className="font-medium text-sm">{label}</p>
                            <p className="text-xs text-muted-foreground">{description}</p>
                          </div>
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>

                {fulfillError && (
                  <p className="text-sm text-destructive">{fulfillError}</p>
                )}

                <div className="space-y-2">
                  <Label>Buyer confirmation code</Label>
                  <Input
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="Enter 4-digit code from buyer"
                    value={deliveryCode}
                    onChange={(e) => setDeliveryCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button
                    className="flex-1"
                    onClick={handleFulfill}
                    disabled={fulfillDeal.isPending}
                  >
                    {fulfillDeal.isPending ? "Confirming..." : "Confirm Fulfillment"}
                  </Button>
                  <Button
                    variant="outline"
                    className="text-destructive border-destructive/30 hover:bg-destructive/5"
                    onClick={handleRefund}
                    disabled={issueRefund.isPending}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Cancel & Refund
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* === DISPATCHED: Waiting for buyer === */}
          {deal.status === "dispatched" && (
            <Card className="border-amber-200 bg-amber-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-800">
                  <Clock className="w-5 h-5" />
                  Waiting for Buyer Confirmation
                </CardTitle>
                <CardDescription>
                  You confirmed fulfillment. Funds auto-release when the timer expires if the buyer doesn't respond.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Live countdown */}
                {deal.deliveryDeadline && (
                  <div className="bg-white border border-amber-200 rounded-lg px-4 py-4">
                    <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-3">
                      Auto-release in
                    </p>
                    <CountdownTimer
                      deadline={deal.deliveryDeadline}
                      totalHours={deal.deliveryWindowHours}
                    />
                  </div>
                )}
                <div className="text-sm bg-white rounded-lg border p-3 space-y-1">
                  <p className="text-muted-foreground">Send this link to your buyer if they haven't confirmed:</p>
                  <a
                    href={buyerLink}
                    className="font-mono text-primary text-xs break-all hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {buyerLink}
                  </a>
                </div>
              </CardContent>
            </Card>
          )}

          {/* === SETTLED: Complete === */}
          {deal.status === "settled" && (
            <Card className="border-emerald-200 bg-emerald-50/50">
              <CardContent className="pt-6 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <p className="font-bold text-emerald-800 text-lg">Transaction Completed</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Both parties confirmed. <strong className="text-foreground">GHS {deal.sellerPayout?.toFixed(2)}</strong> has been released to your wallet.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* === DISPUTED === */}
          {deal.status === "disputed" && deal.dispute && (
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="w-5 h-5" />
                  Dispute Raised
                </CardTitle>
                <CardDescription>
                  Reason: <span className="font-medium text-foreground">{deal.dispute.reason.replace(/_/g, " ")}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {deal.dispute.description && (
                  <div className="bg-destructive/5 rounded-lg p-3 text-sm">
                    <p className="font-medium mb-1">Buyer's Note</p>
                    <p className="text-muted-foreground">{deal.dispute.description}</p>
                    {deal.dispute.evidenceUrl && (
                      <a href={deal.dispute.evidenceUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline block mt-2 text-xs">
                        View Evidence
                      </a>
                    )}
                  </div>
                )}

                {deal.dispute.status === "open" ? (
                  <div className="space-y-4 pt-4 border-t">
                    <p className="text-sm font-medium">Submit your counter proof for admin review:</p>
                    <div className="space-y-2">
                      <Label>Your Explanation</Label>
                      <Textarea
                        placeholder="Explain your side clearly..."
                        value={proofDesc}
                        onChange={(e) => setProofDesc(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Evidence Link (optional)</Label>
                      <Input
                        placeholder="https://..."
                        value={proofUrl}
                        onChange={(e) => setProofUrl(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button
                        onClick={handleProofSubmit}
                        disabled={submitProof.isPending || !proofDesc}
                      >
                        Submit to Admin
                      </Button>
                      <Button
                        variant="outline"
                        className="text-destructive"
                        onClick={handleRefund}
                        disabled={issueRefund.isPending}
                      >
                        Accept & Refund Buyer
                      </Button>
                    </div>
                  </div>
                ) : ( 
                  <div className="bg-muted rounded-lg p-3 text-sm text-muted-foreground">
                    Counter proof submitted. An admin will review and resolve shortly.
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
