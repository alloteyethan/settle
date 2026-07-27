"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Lock, Plus, LogOut, Menu, X, LayoutDashboard, FileText } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [seller, setSeller] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    document.cookie = "settle_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
    localStorage.removeItem("settle_token");
    setSeller(null);
    setMobileMenuOpen(false);
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
          <Link href="/" className="flex items-center space-x-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-[#E1EBE3] border border-[#1C5A44]/20 flex items-center justify-center text-[#1C5A44]">
              <Lock className="w-4 h-4 stroke-[1.75]" />
            </div>
            <span className="font-semibold text-lg tracking-tight text-[#1F1B14]">
              SETTLE
            </span>
          </Link>

          {/* Desktop Navigation */}
          {seller ? (
            <nav className="hidden md:flex items-center space-x-3 lg:space-x-4">
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

              <div className="h-4 w-px bg-[#E4DDCB] mx-1" />

              <div className="flex items-center space-x-2">
                <span className="text-xs font-medium text-[#4A4438] bg-[#F3EDE0] px-2.5 py-1 rounded-md border border-[#E4DDCB] truncate max-w-[140px]">
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
            <div className="hidden md:flex items-center space-x-3">
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

          {/* Mobile Menu Toggle Button */}
          <div className="flex md:hidden items-center space-x-2">
            {seller && (
              <Link
                href="/create-deal"
                className="h-9 px-3 rounded-lg text-xs font-semibold bg-[#1C5A44] text-white flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2]" />
                <span>New Link</span>
              </Link>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#4A4438] hover:text-[#1F1B14] rounded-lg border border-[#E4DDCB] bg-white"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Panel */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#E4DDCB] py-4 space-y-3 bg-[#FAF6EE] animate-in fade-in slide-in-from-top-2">
            {seller ? (
              <>
                <div className="px-3 py-1 text-xs text-[#8A8271] font-medium border-b border-[#E4DDCB]/60 pb-2">
                  Signed in as <span className="font-semibold text-[#1F1B14]">{seller.name}</span>
                </div>
                <Link
                  href="/dashboard"
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium ${
                    pathname === "/dashboard" ? "bg-[#E1EBE3] text-[#1C5A44]" : "text-[#4A4438]"
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  href="/deals"
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium ${
                    pathname === "/deals" ? "bg-[#E1EBE3] text-[#1C5A44]" : "text-[#4A4438]"
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Deals</span>
                </Link>
                <Link
                  href="/create-deal"
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-semibold bg-[#1C5A44] text-white"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Deal Link</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-[#A33B2E] hover:bg-[#F7E6E2]"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <div className="flex flex-col space-y-2">
                <Link
                  href="/login"
                  className="w-full text-center py-2.5 rounded-lg border border-[#E4DDCB] text-sm font-semibold text-[#1F1B14] bg-white"
                >
                  Seller Login
                </Link>
                <Link
                  href="/register"
                  className="w-full text-center py-2.5 rounded-lg text-sm font-semibold bg-[#1C5A44] text-white"
                >
                  Create Free Seller Account
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
