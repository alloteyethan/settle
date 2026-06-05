import { Router } from "express";
import { db, dealsTable, disputesTable, sellersTable, activityTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { logger } from "../lib/logger";
import type { Response } from "express";
import {
  RaiseDisputeParams,
  RaiseDisputeBody,
  IssueRefundParams,
  SubmitCounterProofParams,
  SubmitCounterProofBody,
} from "@workspace/api-zod";
import { formatDeal } from "./deals";

const router = Router();

function formatDispute(d: typeof disputesTable.$inferSelect) {
  return {
    id: d.id,
    dealId: d.dealId,
    reason: d.reason,
    description: d.description ?? null,
    evidenceUrl: d.evidenceUrl ?? null,
    counterProofUrl: d.counterProofUrl ?? null,
    counterProofDescription: d.counterProofDescription ?? null,
    status: d.status,
    resolution: d.resolution ?? null,
    createdAt: d.createdAt.toISOString(),
    resolvedAt: d.resolvedAt?.toISOString() ?? null,
  };
}

// Buyer raises dispute
router.post("/deals/:id/disputes", async (req, res) => {
  const parsed = RaiseDisputeParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const bodyParsed = RaiseDisputeBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: "Validation error", details: bodyParsed.error.issues });
    return;
  }
  const [deal] = await db.select().from(dealsTable).where(eq(dealsTable.id, parsed.data.id)).limit(1);
  if (!deal) {
    res.status(404).json({ error: "Deal not found" });
    return;
  }
  if (!["dispatched", "delivered"].includes(deal.status)) {
    res.status(400).json({ error: "Disputes can only be raised on dispatched or delivered deals" });
    return;
  }
  // Freeze the deal
  await db.update(dealsTable).set({ status: "disputed" }).where(eq(dealsTable.id, deal.id));
  const [dispute] = await db.insert(disputesTable).values({
    dealId: deal.id,
    reason: bodyParsed.data.reason as typeof disputesTable.$inferInsert["reason"],
    description: bodyParsed.data.description,
    evidenceUrl: bodyParsed.data.evidenceUrl,
  }).returning();
  await db.insert(activityTable).values({
    sellerId: deal.sellerId,
    dealId: deal.id,
    type: "dispute_raised",
    itemName: deal.itemName,
    amount: deal.price,
    buyerName: deal.buyerName,
  });
  logger.info({ dealId: deal.id, disputeId: dispute.id }, "Dispute raised");
  res.status(201).json(formatDispute(dispute));
});

// Seller issues full refund
router.post("/deals/:id/disputes/refund", requireAuth, async (req: AuthRequest, res: Response) => {
  const parsed = IssueRefundParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [deal] = await db.select().from(dealsTable)
    .where(and(eq(dealsTable.id, parsed.data.id), eq(dealsTable.sellerId, req.sellerId!)))
    .limit(1);
  if (!deal || deal.status !== "disputed") {
    res.status(400).json({ error: "Deal not in disputed state" });
    return;
  }
  await db.update(dealsTable).set({ status: "settled", settledAt: new Date() }).where(eq(dealsTable.id, deal.id));
  await db.update(disputesTable)
    .set({ status: "resolved_refund", resolvedAt: new Date(), resolution: "Seller issued full refund" })
    .where(eq(disputesTable.dealId, deal.id));
  await db.insert(activityTable).values({
    sellerId: deal.sellerId,
    dealId: deal.id,
    type: "dispute_resolved",
    itemName: deal.itemName,
    amount: deal.price,
    buyerName: deal.buyerName,
  });
  const [updated] = await db.select().from(dealsTable).where(eq(dealsTable.id, deal.id)).limit(1);
  res.json(await formatDeal(updated));
});

// Seller submits counter proof
router.post("/deals/:id/disputes/counter", requireAuth, async (req: AuthRequest, res: Response) => {
  const parsed = SubmitCounterProofParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const bodyParsed = SubmitCounterProofBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: "Validation error" });
    return;
  }
  const [deal] = await db.select().from(dealsTable)
    .where(and(eq(dealsTable.id, parsed.data.id), eq(dealsTable.sellerId, req.sellerId!)))
    .limit(1);
  if (!deal || deal.status !== "disputed") {
    res.status(400).json({ error: "Deal not in disputed state" });
    return;
  }
  const [dispute] = await db.update(disputesTable)
    .set({
      counterProofUrl: bodyParsed.data.counterProofUrl,
      counterProofDescription: bodyParsed.data.counterProofDescription,
      status: "counter_submitted",
    })
    .where(eq(disputesTable.dealId, deal.id))
    .returning();
  if (!dispute) {
    res.status(404).json({ error: "Dispute not found" });
    return;
  }
  res.json(formatDispute(dispute));
});

export { formatDispute };
export default router;
