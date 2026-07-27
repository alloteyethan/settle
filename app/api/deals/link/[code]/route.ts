import { NextRequest, NextResponse } from "next/server";
import { dbService } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  if (!code) {
    return NextResponse.json({ error: "Code is required" }, { status: 400 });
  }

  let deal = await dbService.getDealByCode(code);
  if (!deal) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }

  // Ensure delivery code is set if locked
  if (deal.status === "locked" && !deal.deliveryCode) {
    const deliveryCode = Math.floor(1000 + Math.random() * 9000).toString();
    const updated = await dbService.updateDeal(deal.id, { deliveryCode });
    if (updated) deal = updated;
  }

  const seller = await dbService.findSellerById(deal.sellerId);

  return NextResponse.json({
    id: deal.id,
    code: deal.code,
    itemName: deal.itemName,
    description: deal.description ?? null,
    price: parseFloat(deal.price),
    deliveryWindowHours: deal.deliveryWindowHours,
    status: deal.status,
    fulfillmentType: deal.fulfillmentType ?? null,
    sellerName: seller?.name ?? "Seller",
    sellerPhone: seller?.phone ?? "",
    sellerConfirmedAt: deal.sellerConfirmedAt ? new Date(deal.sellerConfirmedAt).toISOString() : null,
    buyerConfirmedAt: deal.buyerConfirmedAt ? new Date(deal.buyerConfirmedAt).toISOString() : null,
    deliveryDeadline: deal.deliveryDeadline ? new Date(deal.deliveryDeadline).toISOString() : null,
    deliveryCode: deal.deliveryCode ? String(deal.deliveryCode) : null,
    createdAt: new Date(deal.createdAt).toISOString(),
  });
}
