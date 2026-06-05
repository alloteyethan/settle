import { pgTable, text, serial, timestamp, numeric, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { sellersTable } from "./sellers";

export const dealStatusEnum = pgEnum("deal_status", [
  "created",
  "locked",
  "dispatched",
  "delivered",
  "settled",
  "disputed",
]);

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
  dispatchedAt: timestamp("dispatched_at", { withTimezone: true }),
  deliveryDeadline: timestamp("delivery_deadline", { withTimezone: true }),
  settledAt: timestamp("settled_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDealSchema = createInsertSchema(dealsTable).omit({
  id: true,
  createdAt: true,
  code: true,
  shortUrl: true,
  feeAmount: true,
  sellerPayout: true,
  status: true,
});
export type InsertDeal = z.infer<typeof insertDealSchema>;
export type Deal = typeof dealsTable.$inferSelect;
