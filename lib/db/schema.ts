import { pgTable, text, serial, timestamp, numeric, integer, pgEnum } from "drizzle-orm/pg-core";

export const dealStatusEnum = pgEnum("deal_status", [
  "created",
  "locked",
  "dispatched",
  "delivered",
  "settled",
  "disputed",
]);

export const fulfillmentTypeEnum = pgEnum("fulfillment_type", [
  "shipped",
  "delivered",
  "service_completed",
  "digital_sent",
]);

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

export const activityTypeEnum = pgEnum("activity_type", [
  "deal_created",
  "payment_locked",
  "dispatched",
  "delivered",
  "settled",
  "dispute_raised",
  "dispute_resolved",
]);

export const sellersTable = pgTable("sellers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  passwordHash: text("password_hash").notNull(),
  walletAddress: text("wallet_address").notNull(),
  totalEarnings: numeric("total_earnings", { precision: 12, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const dealsTable = pgTable("deals", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  shortUrl: text("short_url").notNull(),
  itemName: text("item_name").notNull(),
  description: text("description"),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  feeAmount: numeric("fee_amount", { precision: 12, scale: 2 }).notNull(),
  sellerPayout: numeric("seller_payout", { precision: 12, scale: 2 }).notNull(),
  deliveryWindowHours: integer("delivery_window_hours").notNull().default(48),
  status: dealStatusEnum("status").notNull().default("created"),
  sellerId: integer("seller_id")
    .notNull()
    .references(() => sellersTable.id),
  buyerPhone: text("buyer_phone"),
  buyerName: text("buyer_name"),
  buyerEmail: text("buyer_email"),
  paystackReference: text("paystack_reference"),
  fulfillmentType: fulfillmentTypeEnum("fulfillment_type"),
  sellerConfirmedAt: timestamp("seller_confirmed_at", { withTimezone: true }),
  buyerConfirmedAt: timestamp("buyer_confirmed_at", { withTimezone: true }),
  dispatchedAt: timestamp("dispatched_at", { withTimezone: true }),
  deliveryDeadline: timestamp("delivery_deadline", { withTimezone: true }),
  deliveryCode: text("delivery_code"),
  settledAt: timestamp("settled_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

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

export const activityTable = pgTable("activity", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id")
    .notNull()
    .references(() => sellersTable.id),
  dealId: integer("deal_id")
    .notNull()
    .references(() => dealsTable.id),
  type: activityTypeEnum("type").notNull(),
  itemName: text("item_name").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull().default("0"),
  buyerName: text("buyer_name"),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
});

export type Seller = typeof sellersTable.$inferSelect;
export type Deal = typeof dealsTable.$inferSelect;
export type Dispute = typeof disputesTable.$inferSelect;
export type Activity = typeof activityTable.$inferSelect;
