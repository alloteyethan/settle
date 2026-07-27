import { NextRequest, NextResponse } from "next/server";
import { getSellerFromRequest } from "@/lib/auth";
import { dbService } from "@/lib/db";
import { formatDealResponse } from "@/lib/formatters";

export async function GET(
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
  if (!deal) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }

  const formatted = await formatDealResponse(deal);
  return NextResponse.json(formatted);
}

export async function DELETE(
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

  const success = await dbService.deleteDeal(id, seller.id);
  if (!success) {
    return NextResponse.json({ error: "Cannot delete a deal that has already been paid or does not exist" }, { status: 400 });
  }

  return new NextResponse(null, { status: 24 });
}
