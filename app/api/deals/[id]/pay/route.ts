import { NextRequest, NextResponse } from "next/server";
import { dbService } from "@/lib/db";
import { formatDealResponse } from "@/lib/formatters";
import { notifySellerPaymentReceived, notifyBuyerDeliveryCode } from "@/lib/notify";

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
    const { buyerName, buyerPhone, buyerEmail } = body;

    if (!buyerName || !buyerPhone) {
      return NextResponse.json({ error: "Buyer name and phone are required" }, { status: 400 });
    }

    const deal = await dbService.getDealById(id);
    if (!deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    if (deal.status !== "created") {
      return NextResponse.json({ error: "Deal has already been paid or locked" }, { status: 400 });
    }

    const deliveryCode = Math.floor(1000 + Math.random() * 9000).toString();
    const updated = await dbService.updateDeal(deal.id, {
      status: "locked",
      buyerName,
      buyerPhone,
      buyerEmail: buyerEmail || null,
      deliveryCode,
    });

    if (!updated) {
      return NextResponse.json({ error: "Failed to update deal status" }, { status: 500 });
    }

    await dbService.addActivity({
      sellerId: deal.sellerId,
      dealId: deal.id,
      type: "payment_locked",
      itemName: deal.itemName,
      amount: deal.price,
      buyerName,
    });

    const seller = await dbService.findSellerById(deal.sellerId);
    const host = req.headers.get("host") || "localhost:3000";
    const proto = req.headers.get("x-forwarded-proto") || "http";
    const baseUrl = `${proto}://${host}`;

    if (seller?.email) {
      notifySellerPaymentReceived({
        sellerName: seller.name,
        sellerEmail: seller.email,
        buyerName,
        buyerPhone,
        itemName: deal.itemName,
        amount: parseFloat(deal.price),
        dealCode: deal.code,
        dashboardUrl: `${baseUrl}/deals/${deal.id}`,
      }).catch(console.error);
    }

    if (buyerEmail && deliveryCode) {
      notifyBuyerDeliveryCode({
        buyerName,
        buyerEmail,
        itemName: deal.itemName,
        sellerName: seller?.name || "Seller",
        deliveryCode,
        confirmUrl: `${baseUrl}/confirm/${deal.code}`,
      }).catch(console.error);
    }

    const formatted = await formatDealResponse(updated);
    return NextResponse.json(formatted);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
