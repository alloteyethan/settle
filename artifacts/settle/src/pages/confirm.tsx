import { useParams } from "wouter";
import {
  useGetDealByCode,
  useConfirmDelivery,
  useRaiseDispute,
  getGetDealByCodeQueryKey,
} from "@workspace/api-client-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { CheckCircle2, ShieldAlert, Lock, AlertTriangle, ShieldCheck } from "lucide-react";
import { TransactionProgress } from "@/components/transaction-progress";
import type { DisputeInputReason } from "@workspace/api-client-react";

const FULFILLMENT_LABELS: Record<string, string> = {
  shipped: "Item Shipped",
  delivered: "Item Delivered",
  service_completed: "Service Completed",
  digital_sent: "Digital Product Sent",
};

export default function ConfirmPage() {
  const { code } = useParams<{ code: string }>();
  const queryClient = useQueryClient();

  const { data: deal, isLoading } = useGetDealByCode(code || "", {
    query: { enabled: !!code, queryKey: getGetDealByCodeQueryKey(code || "") },
  });

  const confirmMutation = useConfirmDelivery();
  const disputeMutation = useRaiseDispute();

  const [showDispute, setShowDispute] = useState(false);
  const [reason, setReason] = useState<DisputeInputReason>("item_never_arrived");
  const [desc, setDesc] = useState("");
  const [evidence, setEvidence] = useState("");

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }
  if (!deal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-muted-foreground">This link is invalid or has expired.</p>
      </div>
    );
  }

  const handleConfirm = () => {
    confirmMutation.mutate(
      { id: deal.id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetDealByCodeQueryKey(deal.code) });
        },
      }
    );
  };

  const handleDispute = () => {
    disputeMutation.mutate(
      { id: deal.id, data: { reason, description: desc, evidenceUrl: evidence } },
      {
        onSuccess: () => {
          setShowDispute(false);
          queryClient.invalidateQueries({ queryKey: getGetDealByCodeQueryKey(deal.code) });
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-start pt-8 pb-12 px-4">
      <div className="w-full max-w-md space-y-4">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 font-bold text-xl tracking-tight text-primary mb-2">
            <Lock className="w-5 h-5" />
            SETTLE
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            Funds held in secure partner escrow
          </div>
        </div>

        {/* Deal Summary */}
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold">{deal.itemName}</p>
                <p className="text-xs text-muted-foreground mt-0.5">From: {deal.sellerName}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">GHS {deal.price.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Total paid</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Tracker */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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

        {/* === CREATED: Not yet paid (shouldn't normally be seen) === */}
        {deal.status === "created" && (
          <Card>
            <CardContent className="pt-6 text-center py-8">
              <p className="text-muted-foreground">Payment hasn't been received yet.</p>
            </CardContent>
          </Card>
        )}

        {/* === LOCKED: Seller hasn't confirmed yet === */}
        {deal.status === "locked" && (
          <Card>
            <CardContent className="pt-6 text-center py-8 space-y-2">
              <Lock className="w-10 h-10 text-blue-400 mx-auto" />
              <p className="font-semibold">Funds Secured</p>
              <p className="text-sm text-muted-foreground">
                Your payment is locked in escrow. Waiting for the seller to confirm fulfillment.
              </p>
            </CardContent>
          </Card>
        )}

        {/* === DISPATCHED: Awaiting buyer action === */}
        {deal.status === "dispatched" && !showDispute && (
          <Card className="border-amber-200">
            <CardContent className="pt-6 space-y-5">
              {deal.fulfillmentType && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm">
                  <p className="text-muted-foreground">The seller confirmed:</p>
                  <p className="font-semibold text-amber-900 mt-0.5">
                    {FULFILLMENT_LABELS[deal.fulfillmentType] ?? deal.fulfillmentType}
                  </p>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-sm text-blue-800">
                Once you confirm receipt, funds are permanently released to the seller. This cannot be undone.
              </div>

              <div className="space-y-3">
                <Button
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={handleConfirm}
                  disabled={confirmMutation.isPending}
                >
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  {confirmMutation.isPending ? "Confirming..." : "Confirm Receipt"}
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-12 text-destructive border-destructive/30 hover:bg-destructive/5"
                  onClick={() => setShowDispute(true)}
                >
                  <ShieldAlert className="w-5 h-5 mr-2" />
                  Report a Problem
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* === DISPUTE FORM === */}
        {showDispute && deal.status === "dispatched" && (
          <Card className="border-destructive/30">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-destructive text-base">
                <AlertTriangle className="w-5 h-5" />
                Report a Problem
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>What went wrong?</Label>
                <Select value={reason} onValueChange={(v) => setReason(v as DisputeInputReason)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="item_never_arrived">Item Never Arrived</SelectItem>
                    <SelectItem value="wrong_damaged_item">Wrong or Damaged Item</SelectItem>
                    <SelectItem value="incomplete_service">Incomplete Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Describe the issue</Label>
                <Textarea
                  placeholder="Give as much detail as possible..."
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Evidence Link (photo, screenshot, video)</Label>
                <Input
                  placeholder="https://..."
                  value={evidence}
                  onChange={(e) => setEvidence(e.target.value)}
                />
              </div>

              <p className="text-xs text-muted-foreground bg-muted px-3 py-2 rounded">
                Submitting a dispute freezes all funds immediately. A SETTLE admin will review within 24 hours.
              </p>

              <div className="flex gap-3 pt-1">
                <Button variant="ghost" className="flex-1" onClick={() => setShowDispute(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleDispute}
                  disabled={disputeMutation.isPending || !desc}
                >
                  {disputeMutation.isPending ? "Submitting..." : "Submit Dispute"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* === DISPUTED === */}
        {deal.status === "disputed" && (
          <Card className="border-destructive/30">
            <CardContent className="pt-6 text-center py-8 space-y-3">
              <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
              <p className="font-bold text-destructive text-lg">Dispute Under Review</p>
              <p className="text-sm text-muted-foreground">
                Your dispute has been received. Funds are frozen and a SETTLE admin will contact both parties within 24 hours.
              </p>
            </CardContent>
          </Card>
        )}

        {/* === SETTLED: Both confirmed === */}
        {deal.status === "settled" && (
          <Card className="border-emerald-200 bg-emerald-50/60">
            <CardContent className="pt-6 text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <p className="font-bold text-emerald-800 text-xl">Transaction Completed</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Both parties have confirmed this transaction. Escrow release requirements have been met.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium">
                <CheckCircle2 className="w-4 h-4" />
                Successfully Settled
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
