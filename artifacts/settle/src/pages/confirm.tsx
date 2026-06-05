import { useParams } from "wouter";
import { useGetDealByCode, useConfirmDelivery, useRaiseDispute, getGetDealByCodeQueryKey } from "@workspace/api-client-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { CheckCircle2, ShieldAlert, Package, AlertTriangle } from "lucide-react";
import { DisputeInputReason } from "@workspace/api-client-react/src/generated/api.schemas";

export default function ConfirmPage() {
  const { code } = useParams<{ code: string }>();
  const queryClient = useQueryClient();

  const { data: deal, isLoading } = useGetDealByCode(code || "", {
    query: { enabled: !!code, queryKey: getGetDealByCodeQueryKey(code || "") }
  });

  const confirmMutation = useConfirmDelivery();
  const disputeMutation = useRaiseDispute();

  const [showDispute, setShowDispute] = useState(false);
  const [reason, setReason] = useState<DisputeInputReason>("item_never_arrived");
  const [desc, setDesc] = useState("");
  const [evidence, setEvidence] = useState("");

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!deal) return <div className="min-h-screen flex items-center justify-center">Link invalid.</div>;

  const handleConfirm = () => {
    confirmMutation.mutate({ code: deal.code }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetDealByCodeQueryKey(deal.code) });
      }
    });
  };

  const handleDispute = () => {
    disputeMutation.mutate({ code: deal.code, data: { reason, description: desc, evidenceUrl: evidence } }, {
      onSuccess: () => {
        setShowDispute(false);
        queryClient.invalidateQueries({ queryKey: getGetDealByCodeQueryKey(deal.code) });
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <Card className="overflow-hidden shadow-lg border-t-4 border-t-primary">
          <CardHeader className="text-center pb-2">
            <CardTitle>Delivery Status</CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-2">
            <div className="mb-6 bg-muted p-4 rounded-lg flex justify-between items-center">
              <div>
                <p className="font-semibold">{deal.itemName}</p>
                <p className="text-sm text-muted-foreground">From: {deal.sellerName}</p>
              </div>
              <div className="font-bold">GHS {deal.price.toFixed(2)}</div>
            </div>

            {deal.status === 'created' && (
              <div className="text-center py-6">
                <p className="text-muted-foreground">Waiting for payment.</p>
              </div>
            )}

            {deal.status === 'locked' && (
              <div className="text-center py-6">
                <Package className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                <h3 className="font-semibold text-lg">Waiting for Dispatch</h3>
                <p className="text-sm text-muted-foreground mt-2">The seller has been notified to ship your item.</p>
              </div>
            )}

            {deal.status === 'dispatched' && !showDispute && (
              <div className="text-center py-2 space-y-6">
                <div>
                  <Package className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                  <h3 className="font-semibold text-lg">Item is on the way!</h3>
                  <p className="text-sm text-muted-foreground mt-2 px-4">Once you receive and verify the item, confirm below to release the funds to the seller.</p>
                </div>
                
                <div className="space-y-3">
                  <Button className="w-full h-12 bg-emerald-600 hover:bg-emerald-700" onClick={handleConfirm} disabled={confirmMutation.isPending}>
                    <CheckCircle2 className="w-5 h-5 mr-2" /> Yes, I received it
                  </Button>
                  <Button variant="outline" className="w-full h-12 text-destructive border-destructive hover:bg-destructive/10" onClick={() => setShowDispute(true)}>
                    <ShieldAlert className="w-5 h-5 mr-2" /> Report a Problem
                  </Button>
                </div>
              </div>
            )}

            {showDispute && deal.status === 'dispatched' && (
              <div className="space-y-4 pt-4 border-t mt-4">
                <h3 className="font-semibold flex items-center gap-2 text-destructive"><AlertTriangle className="w-5 h-5" /> Raise a Dispute</h3>
                <div className="space-y-2 text-left">
                  <Label>Issue Reason</Label>
                  <Select value={reason} onValueChange={(v) => setReason(v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="item_never_arrived">Item Never Arrived</SelectItem>
                      <SelectItem value="wrong_damaged_item">Wrong or Damaged Item</SelectItem>
                      <SelectItem value="incomplete_service">Incomplete Service</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 text-left">
                  <Label>Description</Label>
                  <Textarea placeholder="Provide details..." value={desc} onChange={e => setDesc(e.target.value)} />
                </div>
                <div className="space-y-2 text-left">
                  <Label>Evidence Link (Image/Video)</Label>
                  <Input placeholder="https://..." value={evidence} onChange={e => setEvidence(e.target.value)} />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button variant="ghost" onClick={() => setShowDispute(false)} className="flex-1">Cancel</Button>
                  <Button variant="destructive" onClick={handleDispute} className="flex-1" disabled={disputeMutation.isPending}>Submit Dispute</Button>
                </div>
              </div>
            )}

            {deal.status === 'disputed' && (
              <div className="text-center py-6">
                <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
                <h3 className="font-semibold text-lg text-destructive">Dispute Under Review</h3>
                <p className="text-sm text-muted-foreground mt-2">Funds are frozen. A SETTLE admin will review the case and resolve it shortly.</p>
              </div>
            )}

            {deal.status === 'settled' && (
              <div className="text-center py-6">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                <h3 className="font-semibold text-lg text-emerald-700">Deal Settled</h3>
                <p className="text-sm text-muted-foreground mt-2">Delivery was confirmed. Thank you for using SETTLE!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
