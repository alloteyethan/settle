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

  try {
    const body = await req.json();
    const { fulfillmentType, deliveryCode } = body;

    const deal = await dbService.getDealById(id, seller.id);
    if (!deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    if (deal.status !== "locked") {
      return NextResponse.json(
        {
          error:
            deal.status === "created"
              ? "Buyer has not paid yet"
              : "Fulfillment has already been confirmed",
        },
        { status: 400 }
      );
    }

    if (deliveryCode && String(deliveryCode).trim() !== String(deal.deliveryCode).trim()) {
      return NextResponse.json({ error: "Invalid buyer confirmation code" }, { status: 400 });
    }

    const now = new Date();
    const deliveryDeadline = new Date(now.getTime() + deal.deliveryWindowHours * 3600000);

    const updated = await dbService.updateDeal(deal.id, {
      status: "dispatched",
      fulfillmentType: fulfillmentType || "shipped",
      sellerConfirmedAt: now,
      dispatchedAt: now,
      deliveryDeadline,
    });

    if (!updated) {
      return NextResponse.json({ error: "Failed to update deal" }, { status: 500 });
    }

    await dbService.addActivity({
      sellerId: deal.sellerId,
      dealId: deal.id,
      type: "dispatched",
      itemName: deal.itemName,
      amount: deal.price,
      buyerName: deal.buyerName || undefined,
    });

    const formatted = await formatDealResponse(updated);
    return NextResponse.json(formatted);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
