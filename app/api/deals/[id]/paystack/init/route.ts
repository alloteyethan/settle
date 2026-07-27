import { NextRequest, NextResponse } from "next/server";
import { dbService } from "@/lib/db";

const PAYSTACK_BASE = "https://api.paystack.co";

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

    if (!buyerName || !buyerPhone || !buyerEmail) {
      return NextResponse.json({ error: "buyerName, buyerPhone, and buyerEmail are required" }, { status: 400 });
    }

    const deal = await dbService.getDealById(id);
    if (!deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    if (deal.status !== "created") {
      return NextResponse.json({ error: "This deal has already been paid" }, { status: 400 });
    }

    const host = req.headers.get("host") || "localhost:3000";
    const proto = req.headers.get("x-forwarded-proto") || "http";
    const callbackUrl = `${proto}://${host}/pay/${deal.code}?verify=1`;

    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!secretKey) {
      // Demo mode fallback when no Paystack key configured
      const demoRef = `PST_SIM_${deal.id}_${Date.now()}`;
      await dbService.updateDeal(deal.id, {
        buyerName,
        buyerPhone,
        buyerEmail,
        paystackReference: demoRef,
      });

      return NextResponse.json({
        authorization_url: `${callbackUrl}&reference=${demoRef}&demo=true`,
        reference: demoRef,
        access_code: "demo_access_code",
      });
    }

    const amountPesewas = Math.round(parseFloat(deal.price) * 100);

    const paystackRes = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: buyerEmail,
        amount: amountPesewas,
        currency: "GHS",
        callback_url: callbackUrl,
        metadata: {
          deal_id: deal.id,
          deal_code: deal.code,
          buyer_name: buyerName,
          buyer_phone: buyerPhone,
        },
      }),
    });

    const paystackData = await paystackRes.json();
    if (!paystackData.status) {
      return NextResponse.json({ error: paystackData.message || "Paystack initialization failed" }, { status: 502 });
    }

    const { reference, authorization_url, access_code } = paystackData.data;

    await dbService.updateDeal(deal.id, {
      buyerName,
      buyerPhone,
      buyerEmail,
      paystackReference: reference,
    });

    return NextResponse.json({ authorization_url, reference, access_code });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
