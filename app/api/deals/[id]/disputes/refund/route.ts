import { NextRequest, NextResponse } from "next/server";
import { getSellerFromRequest } from "@/lib/auth";
import { dbService } from "@/lib/db";
import { formatDealResponse } from "@/lib/formatters";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const seller = await getSellerFromRequest(req);
  if (!seller) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: rawId } = await params;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid deal ID" }, { status: 400 });
  }

  const deal = await dbService.getDealById(id, seller.id);
  if (!deal || deal.status !== "disputed") {
    return NextResponse.json({ error: "Deal not in disputed state" }, { status: 400 });
  }

  const now = new Date();
  const updated = await dbService.updateDeal(deal.id, {
    status: "settled",
    settledAt: now,
  });

  const dispute = await dbService.getDisputeByDealId(deal.id);
  if (dispute) {
    await dbService.updateDispute(dispute.id, {
      status: "resolved_refund",
      resolution: "Seller issued full refund to buyer",
      resolvedAt: now,
    });
  }

  await dbService.addActivity({
    sellerId: deal.sellerId,
    dealId: deal.id,
    type: "dispute_resolved",
    itemName: deal.itemName,
    amount: deal.price,
    buyerName: deal.buyerName || undefined,
  });

  const formatted = await formatDealResponse(updated!);
  return NextResponse.json(formatted);
}
