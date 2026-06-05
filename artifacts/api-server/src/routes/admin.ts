import { Router } from "express";
import { db, dealsTable, disputesTable, sellersTable, activityTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { logger } from "../lib/logger";
import { ResolveDisputeParams, ResolveDisputeBody } from "@workspace/api-zod";
import { formatDeal } from "./deals";
import { formatDispute } from "./disputes";

const router = Router();

router.get("/admin/disputes", async (_req, res) => {
  const disputes = await db.select().from(disputesTable).orderBy(sql`created_at desc`);

  const enriched = await Promise.all(disputes.map(async (d) => {
    const [deal] = await db.select().from(dealsTable).where(eq(dealsTable.id, d.dealId)).limit(1);
    return {
      id: d.id,
      dealId: d.dealId,
      deal: deal ? await formatDeal(deal) : null,
      reason: d.reason,
      description: d.description ?? null,
      evidenceUrl: d.evidenceUrl ?? null,
      counterProofUrl: d.counterProofUrl ?? null,
      counterProofDescription: d.counterProofDescription ?? null,
      status: d.status,
      createdAt: d.createdAt.toISOString(),
    };
  }));

  res.json(enriched);
});

router.post("/admin/disputes/:id/resolve", async (req, res) => {
  const parsed = ResolveDisputeParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const bodyParsed = ResolveDisputeBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: "Validation error" });
    return;
  }
  const { decision, resolution } = bodyParsed.data;
  const [dispute] = await db.select().from(disputesTable).where(eq(disputesTable.id, parsed.data.id)).limit(1);
  if (!dispute) {
    res.status(404).json({ error: "Dispute not found" });
    return;
  }
  const newDisputeStatus = decision === "favor_buyer" ? "resolved_refund" : "resolved_seller";
  const [updated] = await db.update(disputesTable)
    .set({ status: newDisputeStatus, resolution, resolvedAt: new Date() })
    .where(eq(disputesTable.id, dispute.id))
    .returning();

  const [deal] = await db.select().from(dealsTable).where(eq(dealsTable.id, dispute.dealId)).limit(1);
  if (deal) {
    // Settle the deal
    await db.update(dealsTable)
      .set({ status: "settled", settledAt: new Date() })
      .where(eq(dealsTable.id, deal.id));

    if (decision === "favor_seller") {
      // Release funds to seller
      await db.update(sellersTable)
        .set({ totalEarnings: sql`${sellersTable.totalEarnings} + ${deal.sellerPayout}` })
        .where(eq(sellersTable.id, deal.sellerId));
    }

    await db.insert(activityTable).values({
      sellerId: deal.sellerId,
      dealId: deal.id,
      type: "dispute_resolved",
      itemName: deal.itemName,
      amount: deal.price,
      buyerName: deal.buyerName,
    });
  }

  logger.info({ disputeId: dispute.id, decision }, "Dispute resolved by admin");
  res.json(formatDispute(updated));
});

export default router;
