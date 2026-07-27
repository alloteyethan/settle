import { NextRequest } from "next/server";
import { dbService } from "./db";

export function hashPassword(password: string): string {
  return Buffer.from(password + "settle_salt_2024").toString("base64");
}

export function generateToken(sellerId: number): string {
  return `seller-${sellerId}-${Date.now()}`;
}

export async function getSellerFromRequest(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  let token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;

  if (!token) {
    token = req.cookies.get("settle_token")?.value || null;
  }

  if (!token) return null;

  const match = token.match(/^seller-(\d+)-/);
  if (!match) return null;

  const sellerId = parseInt(match[1], 10);
  if (isNaN(sellerId)) return null;

  const seller = await dbService.findSellerById(sellerId);
  return seller;
}
