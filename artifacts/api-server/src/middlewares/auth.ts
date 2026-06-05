import type { Request, Response, NextFunction } from "express";
import { db, sellersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export interface AuthRequest extends Request {
  sellerId?: number;
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = authHeader.slice(7);
  // token format: "seller-<id>-<timestamp>"
  const match = token.match(/^seller-(\d+)-/);
  if (!match) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }
  const sellerId = parseInt(match[1], 10);
  const seller = await db.select().from(sellersTable).where(eq(sellersTable.id, sellerId)).limit(1);
  if (!seller.length) {
    res.status(401).json({ error: "Seller not found" });
    return;
  }
  req.sellerId = sellerId;
  next();
}
