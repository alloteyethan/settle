import { NextRequest, NextResponse } from "next/server";
import { dbService } from "@/lib/db";
import { formatDealResponse } from "@/lib/formatters";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await params;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid deal ID" }, { status: 400 });
  }

  const deal = await dbService.getDealById(id);
  if (!deal) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }

  if (deal.status !== "dispatched" && deal.status !== "locked") {
    return NextResponse.json(
      {
        error:
          deal.status === "settled"
            ? "Delivery has already been confirmed and funds released"
            : "Seller has not processed fulfillment yet",
      },
      { status: 400 }
    );
  }

  const now = new Date();
  const updated = await dbService.updateDeal(deal.id, {
    status: "settled",
    buyerConfirmedAt: now,
    settledAt: now,
  });

  if (!updated) {
    return NextResponse.json({ error: "Failed to confirm deal settlement" }, { status: 500 });
  }

  // Release payout to seller
  const seller = await dbService.findSellerById(deal.sellerId);
  if (seller) {
    const newTotal = (parseFloat(seller.totalEarnings) + parseFloat(deal.sellerPayout)).toFixed(2);
    seller.totalEarnings = newTotal;
  }

  await dbService.addActivity({
    sellerId: deal.sellerId,
    dealId: deal.id,
    type: "settled",
    itemName: deal.itemName,
    amount: deal.sellerPayout,
    buyerName: deal.buyerName || undefined,
  });

  const formatted = await formatDealResponse(updated);
  return NextResponse.json(formatted);
}
