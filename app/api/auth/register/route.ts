import { NextRequest, NextResponse } from "next/server";
import { dbService } from "@/lib/db";
import { hashPassword, generateToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, password, walletAddress } = body;

    if (!name || !email || !phone || !password || !walletAddress) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const existing = await dbService.findSellerByEmail(email);
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }

    const passwordHash = hashPassword(password);
    const seller = await dbService.createSeller({
      name,
      email,
      phone,
      passwordHash,
      walletAddress,
    });

    const token = generateToken(seller.id);

    const response = NextResponse.json({
      token,
      seller: {
        id: seller.id,
        name: seller.name,
        email: seller.email,
        phone: seller.phone,
        walletAddress: seller.walletAddress,
        totalEarnings: parseFloat(seller.totalEarnings),
        createdAt: seller.createdAt.toISOString(),
      },
    }, { status: 201 });

    response.cookies.set("settle_token", token, { path: "/", maxAge: 86400 * 30 });
    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
