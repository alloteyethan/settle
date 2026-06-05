import { Router } from "express";
import { db, dealsTable, sellersTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import type { Response } from "express";
import { formatDeal } from "./deals";

const router = Router();

router.get("/sellers/me/dashboard", requireAuth, async (req: AuthRequest, res: Response) => {
  const sellerId = req.sellerId!;

  const [seller] = await db.select().from(sellersTable).where(eq(sellersTable.id, sellerId)).limit(1);

  const [stats] = await db.select({
    total: sql<number>`count(*)`,
    settled: sql<number>`count(*) filter (where status = 'settled')`,
    active: sql<number>`count(*) filter (where status in ('locked', 'dispatched', 'delivered'))`,
    disputed: sql<number>`count(*) filter (where status = 'disputed')`,
    pending: sql<number>`coalesce(sum(case when status in ('locked', 'dispatched', 'delivered') then seller_payout::numeric else 0 end), 0)`,
  }).from(dealsTable).where(eq(dealsTable.sellerId, sellerId));

  const recentSettlements = await db.select().from(dealsTable)
    .where(and(eq(dealsTable.sellerId, sellerId), eq(dealsTable.status, "settled")))
    .orderBy(sql`settled_at desc`)
    .limit(5);

  const formatted = await Promise.all(recentSettlements.map(formatDeal));

  res.json({
    totalDeals: Number(stats.total),
    settledDeals: Number(stats.settled),
    activeDeals: Number(stats.active),
    disputedDeals: Number(stats.disputed),
    totalEarnings: parseFloat(seller?.totalEarnings ?? "0"),
    pendingEarnings: Number(stats.pending),
    recentSettlements: formatted,
  });
});

export default router;
