import { NextRequest, NextResponse } from "next/server";
import { dbService } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await params;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid deal ID" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { reason, description, evidenceUrl } = body;

    if (!reason) {
      return NextResponse.json({ error: "Reason is required" }, { status: 400 });
    }

    const deal = await dbService.getDealById(id);
    if (!deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    if (!["dispatched", "delivered", "locked"].includes(deal.status)) {
      return NextResponse.json(
        { error: "Disputes can only be raised on locked or dispatched deals" },
        { status: 400 }
      );
    }

    const dispute = await dbService.createDispute({
      dealId: deal.id,
      reason,
      description,
      evidenceUrl,
    });

    return NextResponse.json(dispute, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
