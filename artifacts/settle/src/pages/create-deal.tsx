import { useState } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateDeal } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Copy, CheckCircle2, Share } from "lucide-react";

const formSchema = z.object({
  itemName: z.string().min(2, "Item name is required"),
  description: z.string().optional(),
  price: z.coerce.number().min(1, "Price must be greater than 0"),
  deliveryWindowHours: z.coerce.number().min(1, "Window required").default(48),
});

export default function CreateDealPage() {
  const createDeal = useCreateDeal();
  const [createdDeal, setCreatedDeal] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      itemName: "",
      description: "",
      price: 0,
      deliveryWindowHours: 48,
    },
  });

  const price = Number(form.watch("price")) || 0;
  const fee = price * 0.02;
  const payout = price - fee;

  function onSubmit(values: z.infer<typeof formSchema>) {
    createDeal.mutate({ data: values }, {
      onSuccess: (deal) => {
        setCreatedDeal(deal);
      }
    });
  }

  const getShareText = () => {
    if (!createdDeal) return "";
    const domain = window.location.origin;
    const url = `${domain}/pay/${createdDeal.code}`;
    return `Hey! Let's secure our deal safely using SETTLE. Your funds will be locked securely until you receive and verify the item. Click here to pay: ${url}`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getShareText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (createdDeal) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 mt-8">
        <Card className="border-emerald-200">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <CardTitle className="text-2xl">Deal Created Successfully</CardTitle>
            <CardDescription>
              Share this link with your buyer. Funds will be locked in escrow.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted p-4 rounded-lg relative">
              <p className="text-sm text-foreground whitespace-pre-wrap pr-12">
                {getShareText()}
              </p>
              <Button 
                size="icon" 
                variant="ghost" 
                className="absolute top-2 right-2"
                onClick={handleCopy}
              >
                {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            
            <div className="flex gap-4">
              <Button className="flex-1" onClick={handleCopy} variant={copied ? "secondary" : "default"}>
                {copied ? "Copied!" : "Copy to Clipboard"}
              </Button>
              <Link href={`/deals/${createdDeal.id}`}>
                <Button variant="outline" className="flex-1">View Deal Status</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Deal</h1>
        <p className="text-muted-foreground mt-1">Generate a secure payment link for your buyer.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="itemName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. iPhone 13 Pro Max" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Condition, color, accessories included..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (GHS)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deliveryWindowHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Delivery Window (Hours)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="48" {...field} />
                      </FormControl>
                      <FormDescription>Time allowed for delivery</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {price > 0 && (
                <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Deal Price</span>
                    <span>GHS {price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Platform Fee (2%)</span>
                    <span className="text-destructive">- GHS {fee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold pt-2 border-t">
                    <span>Your Payout</span>
                    <span className="text-emerald-600">GHS {payout.toFixed(2)}</span>
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={createDeal.isPending}>
                {createDeal.isPending ? "Generating..." : "Generate Settle Link"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
