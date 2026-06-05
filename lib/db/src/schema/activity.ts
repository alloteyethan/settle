import { pgTable, text, serial, timestamp, integer, numeric, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { sellersTable } from "./sellers";
import { dealsTable } from "./deals";

export const activityTypeEnum = pgEnum("activity_type", [
  "deal_created",
  "payment_locked",
  "dispatched",
  "delivered",
  "settled",
  "dispute_raised",
  "dispute_resolved",
]);

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

export const insertActivitySchema = createInsertSchema(activityTable).omit({ id: true });
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activityTable.$inferSelect;
