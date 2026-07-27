"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Lock, Plus, LogOut } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [seller, setSeller] = useState<any>(null);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await fetch("/api/sellers/me");
        if (res.ok) {
          const data = await res.json();
          setSeller(data);
        }
      } catch (e) {}
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
    <header className="bg-[#FAF6EE] border-b border-[#E4DDCB] sticky top-0 z-40">
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#E1EBE3] border border-[#1C5A44]/20 flex items-center justify-center text-[#1C5A44]">
              <Lock className="w-4 h-4 stroke-[1.75]" />
            </div>
            <span className="font-semibold text-lg tracking-tight text-[#1F1B14]">
              SETTLE
            </span>
          </Link>

          {/* Navigation Links */}
          {seller ? (
            <nav className="flex items-center space-x-2 sm:space-x-4">
              <Link
                href="/dashboard"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname === "/dashboard"
                    ? "text-[#1C5A44] font-semibold"
                    : "text-[#4A4438] hover:text-[#1F1B14]"
                }`}
              >
                Dashboard
              </Link>

              <Link
                href="/deals"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname === "/deals"
                    ? "text-[#1C5A44] font-semibold"
                    : "text-[#4A4438] hover:text-[#1F1B14]"
                }`}
              >
                Deals
              </Link>

              <Link
                href="/create-deal"
                className="h-10 px-4 rounded-xl text-sm font-semibold bg-[#1C5A44] hover:bg-[#123C2E] text-white flex items-center space-x-1.5 transition-colors"
              >
                <Plus className="w-4 h-4 stroke-[2]" />
                <span>Create Deal</span>
              </Link>

              <div className="h-4 w-px bg-[#E4DDCB] mx-1 hidden sm:block" />

              <div className="flex items-center space-x-2">
                <span className="hidden md:block text-xs font-medium text-[#4A4438] bg-[#F3EDE0] px-2.5 py-1 rounded-md border border-[#E4DDCB]">
                  {seller.name}
                </span>
                <button
                  onClick={handleLogout}
                  title="Sign out"
                  className="p-2 text-[#8A8271] hover:text-[#A33B2E] rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4 stroke-[1.75]" />
                </button>
              </div>
            </nav>
          ) : (
            <div className="flex items-center space-x-3">
              <Link
                href="/login"
                className="text-sm font-semibold text-[#4A4438] hover:text-[#1F1B14] px-3 py-2 transition-colors"
              >
                Seller Login
              </Link>
              <Link
                href="/register"
                className="h-10 px-4 rounded-xl text-sm font-semibold bg-[#1C5A44] hover:bg-[#123C2E] text-white flex items-center justify-center transition-colors"
              >
                Create Free Seller Account
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
