import { Router } from "express";
import crypto from "node:crypto";
import { db, dealsTable, activityTable, sellersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { logger } from "../lib/logger";
import { notifySellerPaymentReceived } from "../lib/notify";
import type { Request, Response } from "express";

const router = Router();

const PAYSTACK_BASE = "https://api.paystack.co";

function getSecretKey(): string {
  const key = process.env["PAYSTACK_SECRET_KEY"];
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not configured");
  return key;
}

async function paystackPost(path: string, body: Record<string, unknown>) {
  const res = await fetch(`${PAYSTACK_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getSecretKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return res.json() as Promise<Record<string, unknown>>;
}

async function paystackGet(path: string) {
  const res = await fetch(`${PAYSTACK_BASE}${path}`, {
    headers: { Authorization: `Bearer ${getSecretKey()}` },
  });
  return res.json() as Promise<Record<string, unknown>>;
}

async function lockDeal(dealId: number, buyerName?: string | null, buyerPhone?: string | null, buyerEmail?: string | null) {
  const [updated] = await db
    .update(dealsTable)
    .set({ status: "locked", buyerName, buyerPhone, buyerEmail })
    .where(and(eq(dealsTable.id, dealId), eq(dealsTable.status, "created")))
    .returning();
  if (!updated) return null;
  await db.insert(activityTable).values({
    sellerId: updated.sellerId,
    dealId: updated.id,
    type: "payment_locked",
    itemName: updated.itemName,
    amount: updated.price,
    buyerName: buyerName ?? undefined,
  });
  return updated;
}

// POST /api/deals/:id/paystack/init
// Public — buyer initiates payment. Returns Paystack authorization URL.
router.post("/deals/:id/paystack/init", async (req: Request, res: Response) => {
  const dealId = parseInt(req.params["id"], 10);
  if (isNaN(dealId)) {
    res.status(400).json({ error: "Invalid deal id" });
    return;
  }

  const { buyerName, buyerPhone, buyerEmail } = req.body as Record<string, string>;
  if (!buyerName?.trim() || !buyerPhone?.trim() || !buyerEmail?.trim()) {
    res.status(400).json({ error: "buyerName, buyerPhone, and buyerEmail are required" });
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail)) {
    res.status(400).json({ error: "Invalid email address" });
    return;
  }

  const [deal] = await db.select().from(dealsTable).where(eq(dealsTable.id, dealId)).limit(1);
  if (!deal) {
    res.status(404).json({ error: "Deal not found" });
    return;
  }
  if (deal.status !== "created") {
    res.status(400).json({ error: "This deal has already been paid" });
    return;
  }

  // Build callback URL from the incoming request
  const proto = (req.headers["x-forwarded-proto"] as string) || req.protocol;
  const host = (req.headers["x-forwarded-host"] as string) || req.get("host") || "";
  const callbackUrl = `${proto}://${host}/pay/${deal.code}`;

  // Amount in pesewas (GHS × 100)
  const amountPesewas = Math.round(parseFloat(deal.price) * 100);

  let paystackData: Record<string, unknown>;
  try {
    paystackData = await paystackPost("/transaction/initialize", {
      email: buyerEmail,
      amount: amountPesewas,
      currency: "GHS",
      reference: undefined, // Paystack auto-generates
      callback_url: callbackUrl,
      metadata: {
        deal_id: deal.id,
        deal_code: deal.code,
        buyer_name: buyerName,
        buyer_phone: buyerPhone,
        custom_fields: [
          { display_name: "Item", variable_name: "item", value: deal.itemName },
          { display_name: "Buyer", variable_name: "buyer", value: buyerName },
        ],
      },
    });
  } catch (err) {
    logger.error({ err, dealId }, "Paystack init failed");
    res.status(502).json({ error: "Payment provider unavailable. Please try again." });
    return;
  }

  if (!paystackData["status"]) {
    logger.error({ paystackData, dealId }, "Paystack init returned false status");
    res.status(502).json({ error: (paystackData["message"] as string) || "Payment initialization failed" });
    return;
  }

  const txData = paystackData["data"] as Record<string, string>;
  const reference = txData["reference"];
  const authorizationUrl = txData["authorization_url"];
  const accessCode = txData["access_code"];

  // Persist buyer info and reference so webhook can identify the deal
  await db
    .update(dealsTable)
    .set({ buyerName, buyerPhone, buyerEmail, paystackReference: reference })
    .where(eq(dealsTable.id, dealId));

  logger.info({ dealId, reference }, "Paystack transaction initialized");
  res.json({ authorization_url: authorizationUrl, reference, access_code: accessCode });
});

// GET /api/deals/:id/paystack/verify?reference=xxx
// Public — called by frontend after Paystack redirects back. Verifies and locks the deal.
router.get("/deals/:id/paystack/verify", async (req: Request, res: Response) => {
  const dealId = parseInt(req.params["id"], 10);
  const reference = req.query["reference"] as string | undefined;

  if (isNaN(dealId) || !reference) {
    res.status(400).json({ error: "Missing deal id or reference" });
    return;
  }

  const [deal] = await db.select().from(dealsTable).where(eq(dealsTable.id, dealId)).limit(1);
  if (!deal) {
    res.status(404).json({ error: "Deal not found" });
    return;
  }

  // If already locked, payment already processed (idempotent)
  if (deal.status === "locked") {
    res.json({ status: "success", alreadyProcessed: true });
    return;
  }

  if (deal.status !== "created") {
    res.status(400).json({ error: "Deal is not in a payable state" });
    return;
  }

  // Verify reference matches what we stored
  if (deal.paystackReference && deal.paystackReference !== reference) {
    res.status(400).json({ error: "Payment reference mismatch" });
    return;
  }

  let verifyData: Record<string, unknown>;
  try {
    verifyData = await paystackGet(`/transaction/verify/${encodeURIComponent(reference)}`);
  } catch (err) {
    logger.error({ err, dealId, reference }, "Paystack verify request failed");
    res.status(502).json({ error: "Could not verify payment. Please contact support." });
    return;
  }

  const txData = verifyData["data"] as Record<string, unknown> | undefined;
  const txStatus = txData?.["status"] as string | undefined;

  if (!verifyData["status"] || txStatus !== "success") {
    logger.warn({ dealId, reference, txStatus }, "Paystack verify: payment not successful");
    res.status(402).json({ error: "Payment was not completed successfully", paystackStatus: txStatus });
    return;
  }

  const updated = await lockDeal(dealId, deal.buyerName, deal.buyerPhone, deal.buyerEmail);
  if (!updated) {
    // Race condition — another process already locked it
    res.json({ status: "success", alreadyProcessed: true });
    return;
  }

  const [seller] = await db
    .select({ name: sellersTable.name, email: sellersTable.email })
    .from(sellersTable)
    .where(eq(sellersTable.id, updated.sellerId))
    .limit(1);
  logger.info({ dealId, reference }, "Payment verified and deal locked");

  // Send seller notification (non-blocking — never delays the response)
  if (seller?.email) {
    const proto = (req.headers["x-forwarded-proto"] as string) || req.protocol;
    const host = (req.headers["x-forwarded-host"] as string) || req.get("host") || "";
    notifySellerPaymentReceived({
      sellerName: seller.name,
      sellerEmail: seller.email,
      buyerName: updated.buyerName ?? "Unknown Buyer",
      buyerPhone: updated.buyerPhone ?? "",
      itemName: updated.itemName,
      amount: parseFloat(updated.price),
      dealCode: updated.code,
      dashboardUrl: `${proto}://${host}/deals/${updated.id}`,
    }).catch((err) => logger.error({ err }, "Seller notification failed"));
  }

  res.json({
    status: "success",
    deal: {
      id: updated.id,
      code: updated.code,
      itemName: updated.itemName,
      price: parseFloat(updated.price),
      status: updated.status,
      sellerName: seller?.name ?? "Seller",
    },
  });
});

// POST /api/webhooks/paystack
// Paystack webhook — called server-to-server on payment events.
// Uses raw body (set via express.json verify option in app.ts) for HMAC-SHA512 verification.
router.post("/webhooks/paystack", async (req: Request, res: Response) => {
  const signature = req.headers["x-paystack-signature"] as string | undefined;
  if (!signature) {
    res.status(400).json({ error: "Missing signature" });
    return;
  }

  let secretKey: string;
  try {
    secretKey = getSecretKey();
  } catch {
    res.status(500).json({ error: "Server not configured" });
    return;
  }

  const rawBody = (req as unknown as { rawBody?: Buffer })["rawBody"];
  if (!rawBody) {
    logger.warn("Webhook received but rawBody was not captured — check express.json verify option");
    res.status(400).json({ error: "Cannot verify signature" });
    return;
  }

  const expectedHash = crypto.createHmac("sha512", secretKey).update(rawBody).digest("hex");
  if (expectedHash !== signature) {
    logger.warn({ signature }, "Paystack webhook signature mismatch");
    res.status(401).json({ error: "Invalid signature" });
    return;
  }

  // Paystack expects a 200 quickly — acknowledge first, process after
  res.status(200).json({ received: true });

  const event = req.body as { event: string; data: Record<string, unknown> };
  if (event.event !== "charge.success") return;

  const txData = event.data;
  const reference = txData["reference"] as string | undefined;
  const metadata = txData["metadata"] as Record<string, unknown> | undefined;
  const dealId = metadata?.["deal_id"] as number | undefined;

  if (!reference || !dealId) {
    logger.warn({ reference, dealId }, "Webhook charge.success missing reference or deal_id");
    return;
  }

  const [deal] = await db.select().from(dealsTable).where(eq(dealsTable.id, dealId)).limit(1);
  if (!deal || deal.status !== "created") {
    logger.info({ dealId, reference }, "Webhook: deal already locked or not found");
    return;
  }

  if (deal.paystackReference && deal.paystackReference !== reference) {
    logger.warn({ dealId, stored: deal.paystackReference, incoming: reference }, "Webhook reference mismatch");
    return;
  }

  const lockedDeal = await lockDeal(dealId, deal.buyerName, deal.buyerPhone, deal.buyerEmail);
  logger.info({ dealId, reference }, "Deal locked via Paystack webhook");

  if (lockedDeal) {
    const [seller] = await db
      .select({ name: sellersTable.name, email: sellersTable.email })
      .from(sellersTable)
      .where(eq(sellersTable.id, lockedDeal.sellerId))
      .limit(1);
    if (seller?.email) {
      const domains = process.env["REPLIT_DOMAINS"] ?? "";
      const primaryDomain = domains.split(",")[0]?.trim();
      const dashboardUrl = primaryDomain
        ? `https://${primaryDomain}/deals/${lockedDeal.id}`
        : `/deals/${lockedDeal.id}`;
      notifySellerPaymentReceived({
        sellerName: seller.name,
        sellerEmail: seller.email,
        buyerName: lockedDeal.buyerName ?? "Unknown Buyer",
        buyerPhone: lockedDeal.buyerPhone ?? "",
        itemName: lockedDeal.itemName,
        amount: parseFloat(lockedDeal.price),
        dealCode: lockedDeal.code,
        dashboardUrl,
      }).catch((err) => logger.error({ err }, "Seller notification failed (webhook)"));
    }
  }
});

export default router;
