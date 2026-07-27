import { NextRequest, NextResponse } from "next/server";
import { getSellerFromRequest } from "@/lib/auth";
import { dbService } from "@/lib/db";
import { formatDealResponse } from "@/lib/formatters";

const FEE_RATE = 0.02;

function generateCode(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// GET /api/deals (List seller deals)
export async function GET(req: NextRequest) {
  const seller = await getSellerFromRequest(req);
  if (!seller) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || undefined;
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  const { deals, total } = await dbService.listDealsForSeller(seller.id, status, limit, offset);
  const formattedDeals = await Promise.all(deals.map(formatDealResponse));

  return NextResponse.json({ deals: formattedDeals, total });
}

// POST /api/deals (Create deal)
export async function POST(req: NextRequest) {
  const seller = await getSellerFromRequest(req);
  if (!seller) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { itemName, description, price, deliveryWindowHours = 48 } = body;

    if (!itemName || !price || isNaN(Number(price))) {
      return NextResponse.json({ error: "Item name and valid price are required" }, { status: 400 });
    }

    const numPrice = parseFloat(price);
    const fee = numPrice * FEE_RATE;
    const payout = numPrice - fee;

    let code = generateCode();
    let attempts = 0;
    while (attempts < 5) {
      const existing = await dbService.getDealByCode(code);
      if (!existing) break;
      code = generateCode();
      attempts++;
    }

    const shortUrl = `settle.shop/${code}`;

    const deal = await dbService.createDeal({
      code,
      shortUrl,
      itemName,
      description,
      price: numPrice.toFixed(2),
      feeAmount: fee.toFixed(2),
      sellerPayout: payout.toFixed(2),
      deliveryWindowHours: Number(deliveryWindowHours),
      sellerId: seller.id,
    });

    const formatted = await formatDealResponse(deal);
    return NextResponse.json(formatted, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
