import { pgTable, text, serial, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

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

export const insertSellerSchema = createInsertSchema(sellersTable).omit({ id: true, createdAt: true, totalEarnings: true });
export type InsertSeller = z.infer<typeof insertSellerSchema>;
export type Seller = typeof sellersTable.$inferSelect;
