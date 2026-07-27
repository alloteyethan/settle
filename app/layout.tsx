import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SETTLE — West Africa P2P Escrow Platform",
  description: "Secure escrow payment links for informal West African social commerce on WhatsApp & Instagram.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#050811] text-slate-100 selection:bg-emerald-500 selection:text-slate-950">
        <Navbar />
        <main className="flex-1 flex flex-col">{children}</main>
        <footer className="border-t border-slate-900 bg-slate-950/60 py-8 mt-auto">
          <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-400">
            <p>© {new Date().getFullYear()} SETTLE Escrow Platform. Building Trust in African Commerce.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
