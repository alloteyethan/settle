import { useParams, useLocation } from "wouter";
import { useGetDealByCode, useInitiatePayment, getGetDealByCodeQueryKey } from "@workspace/api-client-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Lock, ShieldCheck, CheckCircle2 } from "lucide-react";

export default function PayPage() {
  const { code } = useParams<{ code: string }>();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: deal, isLoading, error } = useGetDealByCode(code || "", {
    query: { enabled: !!code, queryKey: getGetDealByCodeQueryKey(code || "") }
  });

  const payMutation = useInitiatePayment();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [method, setMethod] = useState<"momo" | "card">("momo");
  const [paid, setPaid] = useState(false);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (error || !deal) return <div className="min-h-screen flex items-center justify-center">Invalid or expired link.</div>;

  if (deal.status !== 'created') {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center py-8">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <CardTitle className="mb-2">Deal Secured</CardTitle>
          <p className="text-muted-foreground px-6">This deal has already been paid and is locked in escrow.</p>
          <Button className="mt-6" onClick={() => setLocation(`/confirm/${code}`)}>Go to Delivery Status</Button>
        </Card>
      </div>
    );
  }

  if (paid) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center py-8">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <CardTitle className="mb-2">Funds Locked</CardTitle>
          <p className="text-muted-foreground px-6 mb-6">Your payment is secure in escrow. The seller has been notified to dispatch the item.</p>
          <Button onClick={() => setLocation(`/confirm/${code}`)}>View Status Tracking</Button>
        </Card>
      </div>
    );
  }

  const handlePay = () => {
    payMutation.mutate({ code: deal.code, data: { buyerName: name, buyerPhone: phone, paymentMethod: method } }, {
      onSuccess: () => {
        setPaid(true);
        queryClient.invalidateQueries({ queryKey: getGetDealByCodeQueryKey(code || "") });
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 font-bold text-xl tracking-tight text-primary mb-4">
            <Lock className="w-6 h-6" />
            SETTLE
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-sm font-medium">
            <ShieldCheck className="w-4 h-4" />
            Funds held in secure partner escrow
          </div>
        </div>

        <Card className="overflow-hidden border-t-4 border-t-primary shadow-lg">
          <div className="bg-muted p-6 border-b text-center">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">PAYING TO</p>
            <h2 className="text-lg font-bold">{deal.sellerName}</h2>
          </div>
          <CardContent className="p-6 space-y-6">
            <div className="flex justify-between items-end border-b pb-4">
              <div>
                <h3 className="font-semibold text-lg">{deal.itemName}</h3>
                {deal.description && <p className="text-sm text-muted-foreground mt-1">{deal.description}</p>}
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground uppercase mb-1">TOTAL</p>
                <p className="text-2xl font-bold">GHS {deal.price.toFixed(2)}</p>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Your Name</Label>
                <Input placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input placeholder="054XXXXXXX" value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              
              <div className="space-y-3 pt-2">
                <Label>Payment Method</Label>
                <RadioGroup value={method} onValueChange={(v) => setMethod(v as any)} className="grid grid-cols-2 gap-4">
                  <div>
                    <RadioGroupItem value="momo" id="momo" className="peer sr-only" />
                    <Label htmlFor="momo" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-muted peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer">
                      Mobile Money
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="card" id="card" className="peer sr-only" />
                    <Label htmlFor="card" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-muted peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer">
                      Credit Card
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            <Button 
              className="w-full h-14 text-lg mt-4" 
              onClick={handlePay} 
              disabled={payMutation.isPending || !name || !phone}
            >
              {payMutation.isPending ? "Processing..." : `Pay & Lock Funds`}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Funds are not released until you confirm delivery.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
