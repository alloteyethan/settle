import Link from "next/link";
import { ShieldCheck, Lock, Smartphone, ArrowRight, Zap, CheckCircle2, RefreshCw, MessageSquare } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="relative overflow-hidden min-h-[calc(100vh-4rem)] flex flex-col justify-center">
      {/* Background Decorative Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 relative z-10">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold tracking-wide">
            <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
            <span>Peer-to-Peer Escrow for West Africa</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-none">
            Sell with trust on <br />
            <span className="gradient-text">WhatsApp & Instagram</span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-xl text-slate-400 font-normal leading-relaxed max-w-2xl mx-auto">
            Generate secure payment links in 30 seconds. Buyers pay via MoMo or Card, and funds are only released after delivery confirmation.
          </p>

          {/* Call to Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-bold bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-xl shadow-emerald-500/20 transition-all hover:scale-105 flex items-center justify-center space-x-2"
            >
              <span>Create Free Seller Account</span>
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
            </Link>

            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-semibold bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-800 transition-all flex items-center justify-center space-x-2"
            >
              <span>Seller Login</span>
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="pt-10 grid grid-cols-2 md:grid-cols-4 gap-4 text-slate-400 text-xs font-medium">
            <div className="flex items-center justify-center space-x-2 p-3 rounded-xl bg-slate-900/50 border border-slate-800/60">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>Zero Buyer Sign-up</span>
            </div>
            <div className="flex items-center justify-center space-x-2 p-3 rounded-xl bg-slate-900/50 border border-slate-800/60">
              <Smartphone className="w-4 h-4 text-cyan-400" />
              <span>MoMo & Card Payments</span>
            </div>
            <div className="flex items-center justify-center space-x-2 p-3 rounded-xl bg-slate-900/50 border border-slate-800/60">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>48h Escrow Guarantee</span>
            </div>
            <div className="flex items-center justify-center space-x-2 p-3 rounded-xl bg-slate-900/50 border border-slate-800/60">
              <MessageSquare className="w-4 h-4 text-cyan-400" />
              <span>1-Tap WhatsApp Share</span>
            </div>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-card p-8 rounded-2xl border border-slate-800/80 space-y-4 hover:border-emerald-500/30 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6 stroke-[2.5]" />
            </div>
            <h3 className="text-xl font-bold text-white">1. Create Deal Link</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Enter item name and price. SETTLE automatically calculates the 2% platform fee and generates a pre-filled WhatsApp message.
            </p>
          </div>

          <div className="glass-card p-8 rounded-2xl border border-slate-800/80 space-y-4 hover:border-cyan-500/30 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
              <Lock className="w-6 h-6 stroke-[2.5]" />
            </div>
            <h3 className="text-xl font-bold text-white">2. Buyer Pays into Escrow</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Buyer clicks the link from WhatsApp, pays via MoMo or Card. Funds are securely locked in SETTLE escrow.
            </p>
          </div>

          <div className="glass-card p-8 rounded-2xl border border-slate-800/80 space-y-4 hover:border-emerald-500/30 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
            </div>
            <h3 className="text-xl font-bold text-white">3. Confirm & Get Paid</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Once buyer receives delivery, they confirm with their 4-digit code. Funds release straight into seller&apos;s MoMo wallet.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
