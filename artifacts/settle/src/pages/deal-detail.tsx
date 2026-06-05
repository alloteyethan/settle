import { useParams } from "wouter";
import { useGetDeal, useMarkDispatched, useIssueRefund, useSubmitCounterProof, getGetDealQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, ShieldAlert, CheckCircle2, RotateCcw, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function DealDetailPage() {
  const { id } = useParams<{ id: string }>();
  const dealId = parseInt(id, 10);
  const queryClient = useQueryClient();
  
  const { data: deal, isLoading } = useGetDeal(dealId, {
    query: { enabled: !!dealId, queryKey: getGetDealQueryKey(dealId) }
  });

  const markDispatched = useMarkDispatched();
  const issueRefund = useIssueRefund();
  const submitProof = useSubmitCounterProof();

  const [proofDesc, setProofDesc] = useState("");
  const [proofUrl, setProofUrl] = useState("");

  if (isLoading) return <div>Loading...</div>;
  if (!deal) return <div>Deal not found</div>;

  const handleDispatch = () => {
    markDispatched.mutate({ id: dealId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetDealQueryKey(dealId) });
      }
    });
  };

  const handleRefund = () => {
    if (confirm("Are you sure you want to cancel this deal and refund the buyer?")) {
      issueRefund.mutate({ id: dealId }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetDealQueryKey(dealId) });
        }
      });
    }
  };

  const handleProofSubmit = () => {
    submitProof.mutate({ id: dealId, data: { counterProofDescription: proofDesc, counterProofUrl: proofUrl } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetDealQueryKey(dealId) });
      }
    });
  };

  const getStatusBadge = () => {
    switch(deal.status) {
      case 'created': return <Badge variant="secondary" className="bg-slate-100 text-slate-800">Created</Badge>;
      case 'locked': return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Locked</Badge>;
      case 'dispatched': return <Badge variant="secondary" className="bg-amber-100 text-amber-800">Dispatched</Badge>;
      case 'delivered': return <Badge variant="secondary" className="bg-green-100 text-green-800">Delivered</Badge>;
      case 'settled': return <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">Settled</Badge>;
      case 'disputed': return <Badge variant="secondary" className="bg-red-100 text-red-800">Disputed</Badge>;
      default: return null;
    }
  };

  const steps = ["Created", "Locked", "Dispatched", "Delivered", "Settled"];
  let currentStepIdx = 0;
  if (deal.status === 'locked') currentStepIdx = 1;
  if (deal.status === 'dispatched') currentStepIdx = 2;
  if (deal.status === 'delivered') currentStepIdx = 3;
  if (deal.status === 'settled') currentStepIdx = 4;
  if (deal.status === 'disputed') currentStepIdx = 2; // Roughly

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{deal.itemName}</h1>
          <p className="text-muted-foreground mt-1">Deal Code: {deal.code}</p>
        </div>
        {getStatusBadge()}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center mb-8 relative">
            <div className="absolute left-0 top-1/2 w-full h-1 bg-muted -z-10 -translate-y-1/2 rounded-full" />
            <div 
              className="absolute left-0 top-1/2 h-1 bg-primary -z-10 -translate-y-1/2 rounded-full transition-all" 
              style={{ width: `${(currentStepIdx / (steps.length - 1)) * 100}%` }}
            />
            {steps.map((step, idx) => (
              <div key={step} className="flex flex-col items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${idx <= currentStepIdx ? 'bg-primary border-primary text-primary-foreground' : 'bg-background border-muted text-muted-foreground'}`}>
                  {idx + 1}
                </div>
                <span className={`text-xs font-medium ${idx <= currentStepIdx ? 'text-foreground' : 'text-muted-foreground'}`}>{step}</span>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-8 border-t pt-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Price</span><span className="font-medium">GHS {deal.price.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Fee</span><span className="text-destructive">- GHS {deal.feeAmount?.toFixed(2)}</span></div>
                <div className="flex justify-between border-t pt-2"><span className="text-muted-foreground">Payout</span><span className="font-bold text-emerald-600">GHS {deal.sellerPayout?.toFixed(2)}</span></div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Buyer Info</h3>
              {deal.buyerName ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">{deal.buyerName}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span className="font-medium">{deal.buyerPhone}</span></div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">Waiting for buyer payment...</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {deal.status === 'locked' && (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800"><Package className="w-5 h-5" /> Ready to Dispatch</CardTitle>
            <CardDescription>The buyer has paid and funds are secured in escrow. You can now dispatch the item.</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Button onClick={handleDispatch} disabled={markDispatched.isPending}>
              {markDispatched.isPending ? "Updating..." : "Mark as Dispatched"}
            </Button>
            <Button variant="outline" className="text-destructive" onClick={handleRefund} disabled={issueRefund.isPending}>
              <RotateCcw className="w-4 h-4 mr-2" /> Cancel & Refund
            </Button>
          </CardContent>
        </Card>
      )}

      {deal.status === 'disputed' && deal.dispute && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive"><AlertTriangle className="w-5 h-5" /> Dispute Raised</CardTitle>
            <CardDescription>The buyer reported an issue: <span className="font-medium text-foreground">{deal.dispute.reason.replace(/_/g, ' ')}</span></CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-destructive/5 p-4 rounded-lg text-sm">
              <p className="font-medium mb-1">Buyer's Note:</p>
              <p>{deal.dispute.description || "No description provided."}</p>
              {deal.dispute.evidenceUrl && <a href={deal.dispute.evidenceUrl} target="_blank" className="text-primary hover:underline block mt-2">View Evidence</a>}
            </div>
            
            {deal.dispute.status === 'open' ? (
              <div className="space-y-4 mt-6 pt-6 border-t">
                <h4 className="font-medium">Submit Counter Proof</h4>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea placeholder="Explain your side..." value={proofDesc} onChange={e => setProofDesc(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Evidence Link (Optional)</Label>
                  <Input placeholder="https://..." value={proofUrl} onChange={e => setProofUrl(e.target.value)} />
                </div>
                <div className="flex gap-4">
                  <Button onClick={handleProofSubmit} disabled={submitProof.isPending || !proofDesc}>Submit Proof to Admin</Button>
                  <Button variant="outline" className="text-destructive" onClick={handleRefund} disabled={issueRefund.isPending}>
                    Accept & Refund Buyer
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-muted p-4 rounded-lg text-sm">
                You have submitted counter proof. Waiting for admin resolution.
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
