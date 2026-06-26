import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Lock, Shield, CheckCircle2, ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="h-16 border-b flex items-center justify-between px-6 lg:px-12 bg-card">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-primary">
          <Lock className="w-6 h-6" />
          SETTLE
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost">Log In</Button>
          </Link>
          <Link href="/register">
            <Button>Register</Button>
          </Link>
        </div>
      </header>
      <main className="flex-1 flex flex-col items-center text-center px-6 pt-24 pb-16 bg-[#b8becc87]">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
          <Shield className="w-4 h-4" />
          Secure Escrow for MoMo & Card
        </div>
        
        <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-foreground max-w-3xl mb-6">
          The trust layer for informal commerce.
        </h1>
        
        <p className="text-xl text-muted-foreground max-w-2xl mb-10">
          Selling on WhatsApp? Don't lose customers to trust issues. SETTLE holds funds securely until delivery is confirmed. It's sorted. It's settled.
        </p>

        <div className="flex items-center gap-4 mb-20">
          <Link href="/register">
            <Button size="lg" className="h-14 px-8 text-lg">
              Start Selling Safely <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl w-full text-left">
          <div className="bg-card p-6 rounded-xl border shadow-sm">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center mb-4 text-xl font-bold">1</div>
            <h3 className="text-xl font-semibold mb-2">Create a Deal</h3>
            <p className="text-muted-foreground">Enter the item details and price. Generate a secure payment link instantly.</p>
          </div>
          <div className="bg-card p-6 rounded-xl border shadow-sm">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center mb-4 text-xl font-bold">2</div>
            <h3 className="text-xl font-semibold mb-2">Buyer Pays</h3>
            <p className="text-muted-foreground">Buyer pays via MoMo or Card. Funds are locked in escrow. You ship the item with confidence.</p>
          </div>
          <div className="bg-card p-6 rounded-xl border shadow-sm">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center mb-4 text-xl font-bold">3</div>
            <h3 className="text-xl font-semibold mb-2">Get Settled</h3>
            <p className="text-muted-foreground">Buyer confirms delivery. Funds are instantly released to your wallet. Everyone wins.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
