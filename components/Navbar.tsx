"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ShieldCheck, PlusCircle, LayoutDashboard, FileText, Settings, LogOut, Lock } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [seller, setSeller] = useState<any>(null);

  useEffect(() => {
    // Read local seller auth state
    const fetchMe = async () => {
      try {
        const res = await fetch("/api/sellers/me");
        if (res.ok) {
          const data = await res.json();
          setSeller(data);
        }
      } catch (e) {
        // Unauthenticated
      }
    };
    fetchMe();
  }, [pathname]);

  const handleLogout = () => {
    document.cookie = "settle_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
    localStorage.removeItem("settle_token");
    setSeller(null);
    router.push("/login");
  };

  // Hide Navbar on public buyer checkout & confirmation pages
  if (pathname.startsWith("/pay/") || pathname.startsWith("/confirm/")) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6 text-slate-950 stroke-[2.5]" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl tracking-tight text-white flex items-center gap-1.5">
                SETTLE
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Escrow
                </span>
              </span>
              <span className="text-[11px] text-slate-400 font-medium">West Africa P2P Commerce</span>
            </div>
          </Link>

          {/* Navigation Links */}
          {seller ? (
            <nav className="flex items-center space-x-1 sm:space-x-4">
              <Link
                href="/dashboard"
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  pathname === "/dashboard"
                    ? "bg-slate-800 text-emerald-400 border border-slate-700"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>

              <Link
                href="/deals"
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  pathname === "/deals"
                    ? "bg-slate-800 text-emerald-400 border border-slate-700"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Deals</span>
              </Link>

              <Link
                href="/create-deal"
                className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <PlusCircle className="w-4 h-4 stroke-[2.5]" />
                <span>Create Deal</span>
              </Link>

              <div className="h-6 w-px bg-slate-800 mx-1 hidden sm:block" />

              <div className="flex items-center space-x-2">
                <span className="hidden md:block text-xs font-semibold text-slate-300 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
                  {seller.name}
                </span>
                <button
                  onClick={handleLogout}
                  title="Sign out"
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </nav>
          ) : (
            <div className="flex items-center space-x-3">
              <Link
                href="/login"
                className="text-sm font-semibold text-slate-300 hover:text-white px-4 py-2 rounded-lg transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shadow-md shadow-emerald-500/20"
              >
                <Lock className="w-4 h-4" />
                <span>Start Selling</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
