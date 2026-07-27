import Link from "next/link";
import { Lock, Zap, Smartphone, MessageSquare, ArrowRight, ShieldCheck } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="bg-[#FAF6EE] min-h-[calc(100vh-4rem)] flex flex-col">
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 space-y-16">
        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#E1EBE3] text-[#1C5A44] text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 stroke-[2]" />
            <span>Peer-to-Peer Escrow for West Africa</span>
          </div>

          <h1 className="text-3xl sm:text-[40px] font-semibold text-[#1F1B14] leading-[1.15] tracking-tight">
            Sell with trust on WhatsApp & Instagram
          </h1>

          <p className="text-base sm:text-lg text-[#4A4438] leading-relaxed">
            Generate secure payment links in 30 seconds. Buyers pay via MoMo or Card, and funds are only released after delivery confirmation.
          </p>

          {/* Primary & Secondary Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/register"
              className="w-full sm:w-auto h-12 px-6 rounded-xl font-semibold text-sm bg-[#1C5A44] hover:bg-[#123C2E] text-white flex items-center justify-center space-x-2 transition-colors"
            >
              <span>Create Free Seller Account</span>
              <ArrowRight className="w-4 h-4 stroke-[2]" />
            </Link>

            <Link
              href="/login"
              className="w-full sm:w-auto h-12 px-6 rounded-xl font-semibold text-sm bg-transparent border border-[#E4DDCB] text-[#1F1B14] hover:bg-[#F3EDE0] flex items-center justify-center transition-colors"
            >
              <span>Seller Login</span>
            </Link>
          </div>
        </div>

        {/* Trust Strip */}
        <div className="pt-4 border-t border-b border-[#E4DDCB]/60 py-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-[#4A4438] text-xs font-medium">
          <div className="flex items-center justify-center space-x-2">
            <Zap className="w-4 h-4 text-[#1C5A44] stroke-[1.75]" />
            <span>Zero Buyer Sign-up</span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <Smartphone className="w-4 h-4 text-[#1C5A44] stroke-[1.75]" />
            <span>MoMo & Card Payments</span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <Lock className="w-4 h-4 text-[#1C5A44] stroke-[1.75]" />
            <span>48h Escrow Guarantee</span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <MessageSquare className="w-4 h-4 text-[#1C5A44] stroke-[1.75]" />
            <span>1-Tap WhatsApp Share</span>
          </div>
        </div>

        {/* 3-Step Explainer Section */}
        <div className="py-8 space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-medium uppercase tracking-wider text-[#8A8271]">How It Works</span>
            <h2 className="text-xl sm:text-2xl font-semibold text-[#1F1B14]">Three steps to protected payments</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 sm:p-8 rounded-xl border border-[#E4DDCB] space-y-4">
              <div className="w-8 h-8 rounded-full bg-[#1C5A44] text-white flex items-center justify-center font-semibold text-xs">
                1
              </div>
              <h3 className="text-base font-semibold text-[#1F1B14]">Create Deal Link</h3>
              <p className="text-sm text-[#4A4438] leading-relaxed">
                Enter item name and price. SETTLE calculates the 2% platform fee and generates a pre-filled WhatsApp message.
              </p>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-xl border border-[#E4DDCB] space-y-4">
              <div className="w-8 h-8 rounded-full bg-[#1C5A44] text-white flex items-center justify-center font-semibold text-xs">
                2
              </div>
              <h3 className="text-base font-semibold text-[#1F1B14]">Buyer Pays into Escrow</h3>
              <p className="text-sm text-[#4A4438] leading-relaxed">
                Buyer clicks link from WhatsApp, pays via MoMo or Card. Funds are securely locked in SETTLE escrow.
              </p>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-xl border border-[#E4DDCB] space-y-4">
              <div className="w-8 h-8 rounded-full bg-[#1C5A44] text-white flex items-center justify-center font-semibold text-xs">
                3
              </div>
              <h3 className="text-base font-semibold text-[#1F1B14]">Confirm & Get Paid</h3>
              <p className="text-sm text-[#4A4438] leading-relaxed">
                Once buyer receives delivery, they confirm with their 4-digit code. Funds release directly into your MoMo wallet.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
