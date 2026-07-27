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
  title: "SETTLE — Peer-to-Peer Escrow for WhatsApp & IG Sellers",
  description: "Peer-to-peer escrow payment platform for informal commerce in West Africa. Sellers generate payment links, buyers pay via MoMo or Card.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#FAF6EE] text-[#4A4438] selection:bg-[#E1EBE3] selection:text-[#123C2E]">
        <Navbar />
        <main className="flex-1 flex flex-col">{children}</main>
        <footer className="border-t border-[#E4DDCB] bg-[#FAF6EE] py-6 mt-auto">
          <div className="max-w-[1120px] mx-auto px-4 text-center text-xs text-[#8A8271]">
            <p>© {new Date().getFullYear()} SETTLE — Peer-to-Peer Escrow Platform for West Africa</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
