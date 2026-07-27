import { NextRequest, NextResponse } from "next/server";
import { getSellerFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const seller = await getSellerFromRequest(req);
  if (!seller) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    id: seller.id,
    name: seller.name,
    email: seller.email,
    phone: seller.phone,
    walletAddress: seller.walletAddress,
    totalEarnings: parseFloat(seller.totalEarnings),
    createdAt: seller.createdAt.toISOString(),
  });
}
