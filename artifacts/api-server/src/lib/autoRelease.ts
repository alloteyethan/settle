import { db, dealsTable, activityTable, sellersTable, disputesTable } from "@workspace/db";
import { eq, and, lt, isNotNull } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { logger } from "./logger";

/**
 * Settles a single dispatched deal if its delivery deadline has passed and there is no active dispute.
 * Returns the updated deal if auto-released, or null if no action was taken.
 */
export async function autoSettleIfOverdue(deal: { id: number; status: string; deliveryDeadline: Date | null; sellerId: number; sellerPayout: string; itemName: string; buyerName: string | null }) {
  if (deal.status !== "dispatched" || !deal.deliveryDeadline) return null;
  if (new Date() <= deal.deliveryDeadline) return null;

  const [dispute] = await db
    .select()
    .from(disputesTable)
    .where(eq(disputesTable.dealId, deal.id))
    .limit(1);

  if (dispute && !["resolved_refund", "resolved_seller"].includes(dispute.status)) {
    return null; // Active dispute — do not auto-release
  }

  const now = new Date();
  const [updated] = await db
    .update(dealsTable)
    .set({ status: "settled", buyerConfirmedAt: now, settledAt: now })
    .where(and(eq(dealsTable.id, deal.id), eq(dealsTable.status, "dispatched")))
    .returning();

  if (!updated) return null; // Race condition guard

  await db
    .update(sellersTable)
    .set({ totalEarnings: sql`${sellersTable.totalEarnings} + ${deal.sellerPayout}` })
    .where(eq(sellersTable.id, deal.sellerId));

  await db.insert(activityTable).values({
    sellerId: deal.sellerId,
    dealId: deal.id,
    type: "settled",
    itemName: deal.itemName,
    amount: deal.sellerPayout,
    buyerName: deal.buyerName ?? undefined,
  });

  logger.info({ dealId: deal.id }, "Deal auto-released — delivery window expired");
  return updated;
}

/**
 * Batch job: finds all overdue dispatched deals and settles them.
 * Safe to run multiple times — uses status check as optimistic lock.
 */
export async function autoReleaseOverdueDeals() {
  const now = new Date();
  const overdueDeals = await db
    .select()
    .from(dealsTable)
    .where(
      and(
        eq(dealsTable.status, "dispatched"),
        isNotNull(dealsTable.deliveryDeadline),
        lt(dealsTable.deliveryDeadline, now),
      ),
    );

  if (overdueDeals.length === 0) return;

  let released = 0;
  for (const deal of overdueDeals) {
    const updated = await autoSettleIfOverdue(deal);
    if (updated) released++;
  }

  logger.info({ checked: overdueDeals.length, released }, "Auto-release job completed");
}
