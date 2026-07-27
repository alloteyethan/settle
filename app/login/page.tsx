"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("kwame@example.com");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      localStorage.setItem("settle_token", data.token);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-[480px] bg-white p-6 sm:p-8 rounded-xl border border-[#E4DDCB] space-y-6">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-lg bg-[#E1EBE3] text-[#1C5A44] flex items-center justify-center mx-auto border border-[#1C5A44]/20">
            <Lock className="w-5 h-5 stroke-[1.75]" />
          </div>
          <h2 className="text-xl font-semibold text-[#1F1B14]">Seller Login</h2>
          <p className="text-xs text-[#8A8271]">Access your SETTLE dashboard and escrow deals</p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-[#F7E6E2] border border-[#A33B2E]/20 flex items-center space-x-2 text-[#A33B2E] text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 stroke-[1.75]" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="settle-label">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seller@example.com"
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
            {loading ? "Signing in..." : "Log In to Dashboard"}
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-[#8A8271] border-t border-[#E4DDCB]">
          <span>Don&apos;t have a seller account? </span>
          <Link href="/register" className="text-[#1C5A44] font-semibold hover:underline">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}
