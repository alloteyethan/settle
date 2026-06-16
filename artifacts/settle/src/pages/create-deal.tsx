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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Copy, CheckCircle2, Package, Wrench, Smartphone, Clock } from "lucide-react";
import { Label } from "@/components/ui/label";

const DELIVERY_TYPES = [
  {
    id: "physical",
    label: "Physical Product",
    description: "Shipped or hand-delivered",
    icon: Package,
    hours: 72,
    color: "orange",
  },
  {
    id: "service",
    label: "Service",
    description: "Rendered in person or remotely",
    icon: Wrench,
    hours: 48,
    color: "blue",
  },
  {
    id: "digital",
    label: "Digital Item",
    description: "File, link, or access code",
    icon: Smartphone,
    hours: 24,
    color: "purple",
  },
] as const;

const formSchema = z.object({
  itemName: z.string().min(2, "Item name is required"),
  description: z.string().optional(),
  price: z.coerce.number().min(1, "Price must be greater than 0"),
  deliveryWindowHours: z.number().min(1),
});

export default function CreateDealPage() {
  const createDeal = useCreateDeal();
  const [createdDeal, setCreatedDeal] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [selectedType, setSelectedType] = useState<"physical" | "service" | "digital">("physical");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      itemName: "",
      description: "",
      price: 0,
      deliveryWindowHours: 72,
    },
  });

  const price = Number(form.watch("price")) || 0;
  const fee = price * 0.02;
  const payout = price - fee;

  const handleTypeSelect = (type: typeof selectedType) => {
    setSelectedType(type);
    const found = DELIVERY_TYPES.find((t) => t.id === type);
    if (found) form.setValue("deliveryWindowHours", found.hours);
  };

  function onSubmit(values: z.infer<typeof formSchema>) {
    createDeal.mutate({ data: values }, {
      onSuccess: (deal) => setCreatedDeal(deal),
    });
  }

  const getShareText = () => {
    if (!createdDeal) return "";
    const domain = window.location.origin;
    const url = `${domain}/pay/${createdDeal.code}`;
    const typeInfo = DELIVERY_TYPES.find((t) => t.hours === createdDeal.deliveryWindowHours);
    const windowDesc = typeInfo
      ? `Funds auto-release in ${typeInfo.hours} hours after I confirm ${typeInfo.id === "physical" ? "dispatch" : "completion"}.`
      : `Funds auto-release in ${createdDeal.deliveryWindowHours} hours after delivery confirmation.`;
    return `Hey! I'm using SETTLE to secure our deal. Your funds will be held safely in escrow until you receive and verify the ${createdDeal.itemName}. ${windowDesc}\n\nPay here: ${url}`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getShareText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (createdDeal) {
    const typeInfo = DELIVERY_TYPES.find((t) => t.hours === createdDeal.deliveryWindowHours);
    return (
      <div className="max-w-2xl mx-auto space-y-6 mt-8">
        <Card className="border-emerald-200">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <CardTitle className="text-2xl">Deal Link Generated</CardTitle>
            <CardDescription>
              Share this with your buyer. The{" "}
              <strong>{createdDeal.deliveryWindowHours}-hour</strong> auto-release
              timer starts once you confirm {typeInfo?.id === "physical" ? "dispatch" : "completion"}.
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

  const selectedTypeInfo = DELIVERY_TYPES.find((t) => t.id === selectedType)!;

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

              {/* Delivery Type — determines auto-release window */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Delivery Type</Label>
                <p className="text-xs text-muted-foreground -mt-1">
                  Sets the SETTLE-controlled auto-release timer. Fixed by deal type.
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {DELIVERY_TYPES.map(({ id, label, description, icon: Icon, hours }) => {
                    const selected = selectedType === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => handleTypeSelect(id)}
                        className={`flex flex-col items-center text-center gap-2 rounded-xl border-2 p-4 transition-all ${
                          selected
                            ? "border-primary bg-primary/5"
                            : "border-muted hover:border-primary/30 bg-background"
                        }`}
                      >
                        <Icon className={`w-6 h-6 ${selected ? "text-primary" : "text-muted-foreground"}`} />
                        <div>
                          <p className={`text-xs font-semibold leading-tight ${selected ? "text-primary" : "text-foreground"}`}>
                            {label}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                        </div>
                        <div className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                          selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        }`}>
                          <Clock className="w-3 h-3" />
                          {hours}h
                        </div>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                  <strong>Auto-release in {selectedTypeInfo.hours} hours</strong> after you confirm{" "}
                  {selectedType === "physical" ? "dispatch" : "completion"} — buyer can still dispute before the timer expires.
                </p>
              </div>

              <FormField
                control={form.control}
                name="itemName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item / Service Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. iPhone 13 Pro Max, Logo Design" {...field} />
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
                      <Textarea placeholder="Condition, scope, deliverables..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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

              {price > 0 && (
                <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Deal Price</span>
                    <span>GHS {price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Platform Fee (2%)</span>
                    <span className="text-destructive">– GHS {fee.toFixed(2)}</span>
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
