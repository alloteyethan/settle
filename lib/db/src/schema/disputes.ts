import { pgTable, text, serial, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { dealsTable } from "./deals";

export const disputeReasonEnum = pgEnum("dispute_reason", [
  "item_never_arrived",
  "wrong_damaged_item",
  "incomplete_service",
]);

export const disputeStatusEnum = pgEnum("dispute_status", [
  "open",
  "counter_submitted",
  "resolved_refund",
  "resolved_seller",
  "escalated",
]);

export const disputesTable = pgTable("disputes", {
  id: serial("id").primaryKey(),
  dealId: integer("deal_id")
    .notNull()
    .references(() => dealsTable.id),
  reason: disputeReasonEnum("reason").notNull(),
  description: text("description"),
  evidenceUrl: text("evidence_url"),
  counterProofUrl: text("counter_proof_url"),
  counterProofDescription: text("counter_proof_description"),
  status: disputeStatusEnum("status").notNull().default("open"),
  resolution: text("resolution"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
});

export const insertDisputeSchema = createInsertSchema(disputesTable).omit({
  id: true,
  createdAt: true,
  status: true,
});
export type InsertDispute = z.infer<typeof insertDisputeSchema>;
export type Dispute = typeof disputesTable.$inferSelect;
