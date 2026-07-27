import { NextRequest, NextResponse } from "next/server";
import { getSellerFromRequest } from "@/lib/auth";
import { dbService } from "@/lib/db";

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
    const { counterProofUrl, counterProofDescription } = body;

    const deal = await dbService.getDealById(id, seller.id);
    if (!deal || deal.status !== "disputed") {
      return NextResponse.json({ error: "Deal is not in a disputed state" }, { status: 400 });
    }

    const dispute = await dbService.getDisputeByDealId(deal.id);
    if (!dispute) {
      return NextResponse.json({ error: "Dispute record not found" }, { status: 404 });
    }

    const updated = await dbService.updateDispute(dispute.id, {
      counterProofUrl,
      counterProofDescription,
      status: "counter_submitted",
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
