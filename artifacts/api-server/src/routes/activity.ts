import { Router } from "express";
import { db, activityTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import type { Response } from "express";
import { GetRecentActivityQueryParams } from "@workspace/api-zod";

const router = Router();

router.get("/activity", requireAuth, async (req: AuthRequest, res: Response) => {
  const parsed = GetRecentActivityQueryParams.safeParse(req.query);
  const limit = parsed.success ? (parsed.data.limit ?? 10) : 10;

  const items = await db.select().from(activityTable)
    .where(eq(activityTable.sellerId, req.sellerId!))
    .orderBy(desc(activityTable.timestamp))
    .limit(limit);

  res.json(items.map(a => ({
    id: a.id,
    type: a.type,
    dealId: a.dealId,
    itemName: a.itemName,
    amount: parseFloat(a.amount),
    buyerName: a.buyerName ?? null,
    timestamp: a.timestamp.toISOString(),
  })));
});

export default router;
