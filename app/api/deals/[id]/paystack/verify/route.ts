import { NextRequest, NextResponse } from "next/server";
import { dbService } from "@/lib/db";
import { notifySellerPaymentReceived, notifyBuyerDeliveryCode } from "@/lib/notify";

const PAYSTACK_BASE = "https://api.paystack.co";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await params;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid deal ID" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const reference = searchParams.get("reference");
  const isDemo = searchParams.get("demo") === "true";

  if (!reference) {
    return NextResponse.json({ error: "Missing reference" }, { status: 400 });
  }

  const deal = await dbService.getDealById(id);
  if (!deal) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }

  if (deal.status === "locked") {
    return NextResponse.json({ status: "success", alreadyProcessed: true });
  }

  if (deal.status !== "created") {
    return NextResponse.json({ error: "Deal is not in a payable state" }, { status: 400 });
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey || isDemo || reference.startsWith("PST_SIM_")) {
    // Simulated payment verification for testing without Paystack keys
    const deliveryCode = Math.floor(1000 + Math.random() * 9000).toString();
    const updated = await dbService.updateDeal(deal.id, {
      status: "locked",
      deliveryCode,
    });

    if (updated) {
      await dbService.addActivity({
        sellerId: updated.sellerId,
        dealId: updated.id,
        type: "payment_locked",
        itemName: updated.itemName,
        amount: updated.price,
        buyerName: updated.buyerName || undefined,
      });
    }

    return NextResponse.json({ status: "success", deal: updated });
  }

  // Real Paystack verification
  try {
    const paystackRes = await fetch(`${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    const verifyData = await paystackRes.json();

    if (!verifyData.status || verifyData.data?.status !== "success") {
      return NextResponse.json({ error: "Payment was not completed successfully" }, { status: 402 });
    }

    const deliveryCode = Math.floor(1000 + Math.random() * 9000).toString();
    const updated = await dbService.updateDeal(deal.id, {
      status: "locked",
      deliveryCode,
    });

    if (updated) {
      await dbService.addActivity({
        sellerId: updated.sellerId,
        dealId: updated.id,
        type: "payment_locked",
        itemName: updated.itemName,
        amount: updated.price,
        buyerName: updated.buyerName || undefined,
      });

      const seller = await dbService.findSellerById(updated.sellerId);
      const host = req.headers.get("host") || "localhost:3000";
      const proto = req.headers.get("x-forwarded-proto") || "http";
      const baseUrl = `${proto}://${host}`;

      if (seller?.email) {
        notifySellerPaymentReceived({
          sellerName: seller.name,
          sellerEmail: seller.email,
          buyerName: updated.buyerName || "Buyer",
          buyerPhone: updated.buyerPhone || "",
          itemName: updated.itemName,
          amount: parseFloat(updated.price),
          dealCode: updated.code,
          dashboardUrl: `${baseUrl}/deals/${updated.id}`,
        }).catch(console.error);
      }

      if (updated.buyerEmail && deliveryCode) {
        notifyBuyerDeliveryCode({
          buyerName: updated.buyerName || "Buyer",
          buyerEmail: updated.buyerEmail,
          itemName: updated.itemName,
          sellerName: seller?.name || "Seller",
          deliveryCode,
          confirmUrl: `${baseUrl}/confirm/${updated.code}`,
        }).catch(console.error);
      }
    }

    return NextResponse.json({ status: "success", deal: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Could not verify payment" }, { status: 502 });
  }
}
