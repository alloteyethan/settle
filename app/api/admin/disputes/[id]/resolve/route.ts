import { NextRequest, NextResponse } from "next/server";
import { dbService } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await params;
  const disputeId = parseInt(rawId, 10);
  if (isNaN(disputeId)) {
    return NextResponse.json({ error: "Invalid dispute ID" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { decision, resolution } = body;

    if (!decision || !["favor_buyer", "favor_seller"].includes(decision)) {
      return NextResponse.json({ error: "Valid decision (favor_buyer or favor_seller) is required" }, { status: 400 });
    }

    const disputes = await dbService.listAllDisputes();
    const dispute = disputes.find((d) => d.id === disputeId);

    if (!dispute) {
      return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
    }

    const now = new Date();
    const newDisputeStatus = decision === "favor_buyer" ? "resolved_refund" : "resolved_seller";

    const updatedDispute = await dbService.updateDispute(dispute.id, {
      status: newDisputeStatus,
      resolution: resolution || `Admin resolved in favor of ${decision === "favor_buyer" ? "buyer" : "seller"}`,
      resolvedAt: now,
    });

    const deal = await dbService.getDealById(dispute.dealId);
    if (deal) {
      await dbService.updateDeal(deal.id, {
        status: "settled",
        settledAt: now,
      });

      if (decision === "favor_seller") {
        const seller = await dbService.findSellerById(deal.sellerId);
        if (seller) {
          seller.totalEarnings = (parseFloat(seller.totalEarnings) + parseFloat(deal.sellerPayout)).toFixed(2);
        }
      }

      await dbService.addActivity({
        sellerId: deal.sellerId,
        dealId: deal.id,
        type: "dispute_resolved",
        itemName: deal.itemName,
        amount: deal.price,
        buyerName: deal.buyerName || undefined,
      });
    }

    return NextResponse.json(updatedDispute);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
