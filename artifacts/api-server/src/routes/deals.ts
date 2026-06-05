import { Router } from "express";
import { db, dealsTable, sellersTable, disputesTable, activityTable } from "@workspace/db";
import { eq, desc, and, sql } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { logger } from "../lib/logger";
import type { Response } from "express";
import {
  CreateDealBody,
  ListDealsQueryParams,
  GetDealParams,
  GetDealByCodeParams,
  InitiatePaymentBody,
  InitiatePaymentParams,
  MarkDispatchedParams,
  ConfirmDeliveryParams,
} from "@workspace/api-zod";

const router = Router();

const FEE_RATE = 0.02;

function generateCode(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function formatDispute(dispute: typeof disputesTable.$inferSelect | null | undefined) {
  if (!dispute) return undefined;
  return {
    id: dispute.id,
    dealId: dispute.dealId,
    reason: dispute.reason,
    description: dispute.description ?? null,
    evidenceUrl: dispute.evidenceUrl ?? null,
    counterProofUrl: dispute.counterProofUrl ?? null,
    counterProofDescription: dispute.counterProofDescription ?? null,
    status: dispute.status,
    resolution: dispute.resolution ?? null,
    createdAt: dispute.createdAt.toISOString(),
    resolvedAt: dispute.resolvedAt?.toISOString() ?? null,
  };
}

async function formatDeal(deal: typeof dealsTable.$inferSelect) {
  const dispute = await db.select().from(disputesTable).where(eq(disputesTable.dealId, deal.id)).limit(1);
  return {
    id: deal.id,
    code: deal.code,
    shortUrl: deal.shortUrl,
    itemName: deal.itemName,
    description: deal.description ?? null,
    price: parseFloat(deal.price),
    feeAmount: parseFloat(deal.feeAmount),
    sellerPayout: parseFloat(deal.sellerPayout),
    deliveryWindowHours: deal.deliveryWindowHours,
    status: deal.status,
    sellerId: deal.sellerId,
    buyerPhone: deal.buyerPhone ?? null,
    buyerName: deal.buyerName ?? null,
    dispatchedAt: deal.dispatchedAt?.toISOString() ?? null,
    deliveryDeadline: deal.deliveryDeadline?.toISOString() ?? null,
    settledAt: deal.settledAt?.toISOString() ?? null,
    dispute: dispute[0] ? formatDispute(dispute[0]) : undefined,
    createdAt: deal.createdAt.toISOString(),
  };
}

// List deals for seller
router.get("/deals", requireAuth, async (req: AuthRequest, res: Response) => {
  const parsed = ListDealsQueryParams.safeParse(req.query);
  const { status, limit = 20, offset = 0 } = parsed.success ? parsed.data : {};
  const conditions = [eq(dealsTable.sellerId, req.sellerId!)];
  if (status) {
    conditions.push(eq(dealsTable.status, status as typeof dealsTable.$inferSelect["status"]));
  }
  const [dealsResult, countResult] = await Promise.all([
    db.select().from(dealsTable)
      .where(and(...conditions))
      .orderBy(desc(dealsTable.createdAt))
      .limit(limit ?? 20)
      .offset(offset ?? 0),
    db.select({ count: sql<number>`count(*)` }).from(dealsTable).where(and(...conditions)),
  ]);
  const deals = await Promise.all(dealsResult.map(formatDeal));
  res.json({ deals, total: Number(countResult[0]?.count ?? 0) });
});

// Create deal
router.post("/deals", requireAuth, async (req: AuthRequest, res: Response) => {
  const parsed = CreateDealBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error", details: parsed.error.issues });
    return;
  }
  const { itemName, description, price, deliveryWindowHours = 48 } = parsed.data;
  const fee = price * FEE_RATE;
  const payout = price - fee;

  let code = generateCode();
  // ensure uniqueness
  let attempts = 0;
  while (attempts < 5) {
    const existing = await db.select().from(dealsTable).where(eq(dealsTable.code, code)).limit(1);
    if (!existing.length) break;
    code = generateCode();
    attempts++;
  }

  const shortUrl = `settle.shop/${code}`;
  const [deal] = await db.insert(dealsTable).values({
    code,
    shortUrl,
    itemName,
    description,
    price: price.toString(),
    feeAmount: fee.toFixed(2),
    sellerPayout: payout.toFixed(2),
    deliveryWindowHours,
    sellerId: req.sellerId!,
  }).returning();

  // Log activity
  await db.insert(activityTable).values({
    sellerId: req.sellerId!,
    dealId: deal.id,
    type: "deal_created",
    itemName,
    amount: price.toString(),
  });

  logger.info({ dealId: deal.id }, "Deal created");
  res.status(201).json(await formatDeal(deal));
});

// Get deal by ID
router.get("/deals/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  const parsed = GetDealParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [deal] = await db.select().from(dealsTable)
    .where(and(eq(dealsTable.id, parsed.data.id), eq(dealsTable.sellerId, req.sellerId!)))
    .limit(1);
  if (!deal) {
    res.status(404).json({ error: "Deal not found" });
    return;
  }
  res.json(await formatDeal(deal));
});

// Delete deal (only if created/unpaid)
router.delete("/deals/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const [deal] = await db.select().from(dealsTable)
    .where(and(eq(dealsTable.id, id), eq(dealsTable.sellerId, req.sellerId!)))
    .limit(1);
  if (!deal) {
    res.status(404).json({ error: "Deal not found" });
    return;
  }
  if (deal.status !== "created") {
    res.status(400).json({ error: "Cannot delete a deal that has been paid" });
    return;
  }
  await db.delete(dealsTable).where(eq(dealsTable.id, id));
  res.status(204).send();
});

// Get deal by code (public - buyer portal)
router.get("/deals/link/:code", async (req, res) => {
  const parsed = GetDealByCodeParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid code" });
    return;
  }
  const [deal] = await db.select().from(dealsTable).where(eq(dealsTable.code, parsed.data.code)).limit(1);
  if (!deal) {
    res.status(404).json({ error: "Deal not found" });
    return;
  }
  const [seller] = await db.select().from(sellersTable).where(eq(sellersTable.id, deal.sellerId)).limit(1);
  res.json({
    id: deal.id,
    code: deal.code,
    itemName: deal.itemName,
    description: deal.description ?? null,
    price: parseFloat(deal.price),
    deliveryWindowHours: deal.deliveryWindowHours,
    status: deal.status,
    sellerName: seller?.name ?? "Seller",
    createdAt: deal.createdAt.toISOString(),
  });
});

// Initiate payment (buyer pays, locks funds)
router.post("/deals/:id/pay", async (req, res) => {
  const parsed = InitiatePaymentParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const bodyParsed = InitiatePaymentBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: "Validation error", details: bodyParsed.error.issues });
    return;
  }
  const [deal] = await db.select().from(dealsTable).where(eq(dealsTable.id, parsed.data.id)).limit(1);
  if (!deal) {
    res.status(404).json({ error: "Deal not found" });
    return;
  }
  if (deal.status !== "created") {
    res.status(400).json({ error: "Deal has already been paid" });
    return;
  }
  const [updated] = await db.update(dealsTable)
    .set({ status: "locked", buyerName: bodyParsed.data.buyerName, buyerPhone: bodyParsed.data.buyerPhone })
    .where(eq(dealsTable.id, deal.id))
    .returning();
  await db.insert(activityTable).values({
    sellerId: deal.sellerId,
    dealId: deal.id,
    type: "payment_locked",
    itemName: deal.itemName,
    amount: deal.price,
    buyerName: bodyParsed.data.buyerName,
  });
  res.json(await formatDeal(updated));
});

// Seller marks as dispatched
router.post("/deals/:id/dispatch", requireAuth, async (req: AuthRequest, res: Response) => {
  const parsed = MarkDispatchedParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [deal] = await db.select().from(dealsTable)
    .where(and(eq(dealsTable.id, parsed.data.id), eq(dealsTable.sellerId, req.sellerId!)))
    .limit(1);
  if (!deal) {
    res.status(404).json({ error: "Deal not found" });
    return;
  }
  if (deal.status !== "locked") {
    res.status(400).json({ error: "Deal must be locked/paid before dispatching" });
    return;
  }
  const dispatchedAt = new Date();
  const deliveryDeadline = new Date(dispatchedAt.getTime() + deal.deliveryWindowHours * 60 * 60 * 1000);
  const [updated] = await db.update(dealsTable)
    .set({ status: "dispatched", dispatchedAt, deliveryDeadline })
    .where(eq(dealsTable.id, deal.id))
    .returning();
  await db.insert(activityTable).values({
    sellerId: deal.sellerId,
    dealId: deal.id,
    type: "dispatched",
    itemName: deal.itemName,
    amount: deal.price,
    buyerName: deal.buyerName,
  });
  res.json(await formatDeal(updated));
});

// Buyer confirms delivery — releases funds
router.post("/deals/:id/confirm", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const [deal] = await db.select().from(dealsTable).where(eq(dealsTable.id, id)).limit(1);
  if (!deal) {
    res.status(404).json({ error: "Deal not found" });
    return;
  }
  if (deal.status !== "dispatched") {
    res.status(400).json({ error: "Deal must be dispatched before confirming" });
    return;
  }
  const settledAt = new Date();
  const [updated] = await db.update(dealsTable)
    .set({ status: "settled", settledAt })
    .where(eq(dealsTable.id, deal.id))
    .returning();
  // Update seller earnings
  await db.update(sellersTable)
    .set({ totalEarnings: sql`${sellersTable.totalEarnings} + ${deal.sellerPayout}` })
    .where(eq(sellersTable.id, deal.sellerId));
  await db.insert(activityTable).values({
    sellerId: deal.sellerId,
    dealId: deal.id,
    type: "settled",
    itemName: deal.itemName,
    amount: deal.sellerPayout,
    buyerName: deal.buyerName,
  });
  res.json(await formatDeal(updated));
});

export { formatDeal };
export default router;
