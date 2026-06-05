import { Router } from "express";
import { db, sellersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { logger } from "../lib/logger";
import type { Response } from "express";
import { RegisterSellerBody, LoginSellerBody } from "@workspace/api-zod";

const router = Router();

function hashPassword(password: string): string {
  // Simple hash for demo (in production use bcrypt)
  return Buffer.from(password + "settle_salt_2024").toString("base64");
}

function generateToken(sellerId: number): string {
  return `seller-${sellerId}-${Date.now()}`;
}

function formatSeller(seller: typeof sellersTable.$inferSelect) {
  return {
    id: seller.id,
    name: seller.name,
    email: seller.email,
    phone: seller.phone,
    walletAddress: seller.walletAddress,
    totalEarnings: parseFloat(seller.totalEarnings),
    createdAt: seller.createdAt.toISOString(),
  };
}

router.post("/sellers/register", async (req, res) => {
  const parsed = RegisterSellerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error", details: parsed.error.issues });
    return;
  }
  const { name, email, phone, password, walletAddress } = parsed.data;
  const existing = await db.select().from(sellersTable).where(eq(sellersTable.email, email)).limit(1);
  if (existing.length) {
    res.status(400).json({ error: "Email already registered" });
    return;
  }
  const [seller] = await db.insert(sellersTable).values({
    name,
    email,
    phone,
    passwordHash: hashPassword(password),
    walletAddress,
  }).returning();
  logger.info({ sellerId: seller.id }, "Seller registered");
  res.status(201).json(formatSeller(seller));
});

router.post("/sellers/login", async (req, res) => {
  const parsed = LoginSellerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error" });
    return;
  }
  const { email, password } = parsed.data;
  const [seller] = await db.select().from(sellersTable).where(eq(sellersTable.email, email)).limit(1);
  if (!seller || seller.passwordHash !== hashPassword(password)) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  const token = generateToken(seller.id);
  res.json({ token, seller: formatSeller(seller) });
});

router.get("/sellers/me", requireAuth, async (req: AuthRequest, res: Response) => {
  const [seller] = await db.select().from(sellersTable).where(eq(sellersTable.id, req.sellerId!)).limit(1);
  if (!seller) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(formatSeller(seller));
});

export { formatSeller };
export default router;
