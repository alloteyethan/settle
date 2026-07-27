import { NextRequest, NextResponse } from "next/server";
import { dbService } from "@/lib/db";
import { hashPassword, generateToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const seller = await dbService.findSellerByEmail(email);
    if (!seller || seller.passwordHash !== hashPassword(password)) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

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
    });

    response.cookies.set("settle_token", token, { path: "/", maxAge: 86400 * 30 });
    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
