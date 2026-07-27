"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, AlertCircle } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password, walletAddress }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      localStorage.setItem("settle_token", data.token);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Could not register account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-[480px] bg-white p-6 sm:p-8 rounded-xl border border-[#E4DDCB] space-y-6">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-lg bg-[#E1EBE3] text-[#1C5A44] flex items-center justify-center mx-auto border border-[#1C5A44]/20">
            <Lock className="w-5 h-5 stroke-[1.75]" />
          </div>
          <h2 className="text-xl font-semibold text-[#1F1B14]">Create Seller Account</h2>
          <p className="text-xs text-[#8A8271]">Start generating secure WhatsApp escrow payment links</p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-[#F7E6E2] border border-[#A33B2E]/20 flex items-center space-x-2 text-[#A33B2E] text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 stroke-[1.75]" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="settle-label">Business / Seller Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Kwame Kente Crafts"
              className="w-full settle-input px-3"
            />
          </div>

          <div>
            <label className="settle-label">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="kwame@example.com"
              className="w-full settle-input px-3"
            />
          </div>

          <div>
            <label className="settle-label">Phone Number (WhatsApp)</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+233 24 123 4567"
              className="w-full settle-input px-3"
            />
          </div>

          <div>
            <label className="settle-label">Payout MoMo / Wallet Details</label>
            <input
              type="text"
              required
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="0241234567 (MTN MoMo)"
              className="w-full settle-input px-3"
            />
          </div>

          <div>
            <label className="settle-label">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full settle-input px-3"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 btn-primary transition-colors disabled:opacity-50 mt-2"
          >
            {loading ? "Creating account..." : "Register & Start Selling"}
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-[#8A8271] border-t border-[#E4DDCB]">
          <span>Already have an account? </span>
          <Link href="/login" className="text-[#1C5A44] font-semibold hover:underline">
            Log in here
          </Link>
        </div>
      </div>
    </div>
  );
}
