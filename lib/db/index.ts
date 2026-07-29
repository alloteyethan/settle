import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";
import { eq, and, desc, sql } from "drizzle-orm";

// Types
export interface SellerRecord {
  id: number;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  walletAddress: string;
  totalEarnings: string;
  createdAt: Date;
}

export interface DealRecord {
  id: number;
  code: string;
  shortUrl: string;
  itemName: string;
  description: string | null;
  price: string;
  feeAmount: string;
  sellerPayout: string;
  deliveryWindowHours: number;
  status: "created" | "locked" | "dispatched" | "delivered" | "settled" | "disputed";
  fulfillmentType?: "shipped" | "delivered" | "service_completed" | "digital_sent" | null;
  sellerId: number;
  buyerPhone: string | null;
  buyerName: string | null;
  buyerEmail: string | null;
  paystackReference: string | null;
  sellerConfirmedAt: Date | null;
  buyerConfirmedAt: Date | null;
  dispatchedAt: Date | null;
  deliveryDeadline: Date | null;
  deliveryCode: Date | string | null;
  settledAt: Date | null;
  createdAt: Date;
}

export interface DisputeRecord {
  id: number;
  dealId: number;
  reason: "item_never_arrived" | "wrong_damaged_item" | "incomplete_service";
  description: string | null;
  evidenceUrl: string | null;
  counterProofUrl: string | null;
  counterProofDescription: string | null;
  status: "open" | "counter_submitted" | "resolved_refund" | "resolved_seller" | "escalated";
  resolution: string | null;
  createdAt: Date;
  resolvedAt: Date | null;
}

export interface ActivityRecord {
  id: number;
  sellerId: number;
  dealId: number;
  type: "deal_created" | "payment_locked" | "dispatched" | "delivered" | "settled" | "dispute_raised" | "dispute_resolved";
  itemName: string;
  amount: string;
  buyerName?: string | null;
  timestamp: Date;
}

// In-Memory Fallback Storage for local testing without external Postgres
class MemoryStore {
  sellers: SellerRecord[] = [
    {
      id: 1,
      name: "Kwame Mensah",
      email: "kwame@example.com",
      phone: "+233540001122",
      passwordHash: Buffer.from("password123settle_salt_2024").toString("base64"),
      walletAddress: "0241234567 (MTN MoMo)",
      totalEarnings: "1250.00",
      createdAt: new Date("2026-01-15T10:00:00Z"),
    },
    {
      id: 2,
      name: "Abena Osei",
      email: "abena@example.com",
      phone: "+233200003344",
      passwordHash: Buffer.from("password123settle_salt_2024").toString("base64"),
      walletAddress: "0209876543 (Telecel Cash)",
      totalEarnings: "840.00",
      createdAt: new Date("2026-02-01T14:30:00Z"),
    },
  ];

  deals: DealRecord[] = [
    {
      id: 101,
      code: "k3P9x2",
      shortUrl: "settle.shop/k3P9x2",
      itemName: "Custom Kente Cloth (2 Yards)",
      description: "Authentic handmade Kumasi Kente woven with premium silk thread.",
      price: "600.00",
      feeAmount: "12.00",
      sellerPayout: "588.00",
      deliveryWindowHours: 48,
      status: "locked",
      fulfillmentType: null,
      sellerId: 1,
      buyerPhone: "+233559876543",
      buyerName: "Kofi Owusu",
      buyerEmail: "kofi@example.com",
      paystackReference: "PST_DEMO_101",
      sellerConfirmedAt: null,
      buyerConfirmedAt: null,
      dispatchedAt: null,
      deliveryDeadline: null,
      deliveryCode: "4892",
      settledAt: null,
      createdAt: new Date(Date.now() - 3600000 * 5),
    },
    {
      id: 102,
      code: "m7L1w9",
      shortUrl: "settle.shop/m7L1w9",
      itemName: "Refurbished MacBook Air M1",
      description: "Space Gray 8GB RAM 256GB SSD in pristine condition with charger.",
      price: "4500.00",
      feeAmount: "90.00",
      sellerPayout: "4410.00",
      deliveryWindowHours: 48,
      status: "settled",
      fulfillmentType: "shipped",
      sellerId: 1,
      buyerPhone: "+233241112233",
      buyerName: "Ama Serwaa",
      buyerEmail: "ama@example.com",
      paystackReference: "PST_DEMO_102",
      sellerConfirmedAt: new Date(Date.now() - 3600000 * 48),
      buyerConfirmedAt: new Date(Date.now() - 3600000 * 24),
      dispatchedAt: new Date(Date.now() - 3600000 * 48),
      deliveryDeadline: new Date(Date.now() - 3600000 * 24),
      deliveryCode: "1234",
      settledAt: new Date(Date.now() - 3600000 * 24),
      createdAt: new Date(Date.now() - 3600000 * 72),
    },
  ];

  disputes: DisputeRecord[] = [];
  activity: ActivityRecord[] = [
    {
      id: 1,
      sellerId: 1,
      dealId: 101,
      type: "payment_locked",
      itemName: "Custom Kente Cloth (2 Yards)",
      amount: "600.00",
      buyerName: "Kofi Owusu",
      timestamp: new Date(Date.now() - 3600000 * 5),
    },
    {
      id: 2,
      sellerId: 1,
      dealId: 102,
      type: "settled",
      itemName: "Refurbished MacBook Air M1",
      amount: "4410.00",
      buyerName: "Ama Serwaa",
      timestamp: new Date(Date.now() - 3600000 * 24),
    },
  ];

  nextSellerId = 3;
  nextDealId = 103;
  nextDisputeId = 1;
  nextActivityId = 3;
}

const memoryStore = new MemoryStore();

let dbPool: Pool | null = null;
let drizzleDb: ReturnType<typeof drizzle> | null = null;

function getDb() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    if (!(globalThis as any).__warnedNoDbUrl) {
      console.warn("⚠️ DATABASE_URL is not set in .env.local — Settle is operating on temporary in-memory fallback. Add DATABASE_URL to save records directly to Supabase!");
      (globalThis as any).__warnedNoDbUrl = true;
    }
    return null;
  }
  if (!drizzleDb) {
    try {
      dbPool = new Pool({
        connectionString,
        ssl: connectionString.includes("localhost") || connectionString.includes("127.0.0.1")
          ? false
          : { rejectUnauthorized: false },
      });
      drizzleDb = drizzle(dbPool, { schema });
      console.log("✅ Database pool connected to PostgreSQL / Supabase");
    } catch (e) {
      console.warn("⚠️ Failed to initialize PostgreSQL pool, using memory store fallback.", e);
      drizzleDb = null;
    }
  }
  return drizzleDb;
}



// Global auto-settle check helper
export async function autoSettleIfOverdue(deal: DealRecord): Promise<DealRecord> {
  if (deal.status !== "dispatched" || !deal.deliveryDeadline) {
    return deal;
  }
  const now = new Date();
  if (now > new Date(deal.deliveryDeadline)) {
    const settledAt = now;
    const updatedDeal: DealRecord = {
      ...deal,
      status: "settled",
      settledAt,
    };

    const db = getDb();
    if (db) {
      await db
        .update(schema.dealsTable)
        .set({ status: "settled", settledAt })
        .where(eq(schema.dealsTable.id, deal.id));

      await db
        .update(schema.sellersTable)
        .set({
          totalEarnings: sql`${schema.sellersTable.totalEarnings} + ${deal.sellerPayout}`,
        })
        .where(eq(schema.sellersTable.id, deal.sellerId));

      await db.insert(schema.activityTable).values({
        sellerId: deal.sellerId,
        dealId: deal.id,
        type: "settled",
        itemName: deal.itemName,
        amount: deal.sellerPayout,
        buyerName: deal.buyerName,
      });
    } else {
      const dealIdx = memoryStore.deals.findIndex((d) => d.id === deal.id);
      if (dealIdx !== -1) memoryStore.deals[dealIdx] = updatedDeal;

      const seller = memoryStore.sellers.find((s) => s.id === deal.sellerId);
      if (seller) {
        seller.totalEarnings = (parseFloat(seller.totalEarnings) + parseFloat(deal.sellerPayout)).toFixed(2);
      }

      memoryStore.activity.unshift({
        id: memoryStore.nextActivityId++,
        sellerId: deal.sellerId,
        dealId: deal.id,
        type: "settled",
        itemName: deal.itemName,
        amount: deal.sellerPayout,
        buyerName: deal.buyerName,
        timestamp: new Date(),
      });
    }

    return updatedDeal;
  }
  return deal;
}

// Database helper functions
export const dbService = {
  // Sellers
  async findSellerByEmail(email: string): Promise<SellerRecord | null> {
    const db = getDb();
    if (db) {
      const [res] = await db.select().from(schema.sellersTable).where(eq(schema.sellersTable.email, email)).limit(1);
      if (!res) return null;
      return {
        ...res,
        totalEarnings: res.totalEarnings,
      };
    }
    return memoryStore.sellers.find((s) => s.email.toLowerCase() === email.toLowerCase()) || null;
  },

  async findSellerById(id: number): Promise<SellerRecord | null> {
    const db = getDb();
    if (db) {
      const [res] = await db.select().from(schema.sellersTable).where(eq(schema.sellersTable.id, id)).limit(1);
      if (!res) return null;
      return {
        ...res,
        totalEarnings: res.totalEarnings,
      };
    }
    return memoryStore.sellers.find((s) => s.id === id) || null;
  },

  async createSeller(data: { name: string; email: string; phone: string; passwordHash: string; walletAddress: string }): Promise<SellerRecord> {
    const db = getDb();
    if (db) {
      const [inserted] = await db.insert(schema.sellersTable).values(data).returning();
      return {
        ...inserted,
        totalEarnings: inserted.totalEarnings,
      };
    }
    const newSeller: SellerRecord = {
      id: memoryStore.nextSellerId++,
      name: data.name,
      email: data.email,
      phone: data.phone,
      passwordHash: data.passwordHash,
      walletAddress: data.walletAddress,
      totalEarnings: "0.00",
      createdAt: new Date(),
    };
    memoryStore.sellers.push(newSeller);
    return newSeller;
  },

  // Deals
  async listDealsForSeller(sellerId: number, status?: string, limit = 20, offset = 0) {
    const db = getDb();
    if (db) {
      const conditions = [eq(schema.dealsTable.sellerId, sellerId)];
      if (status) {
        conditions.push(eq(schema.dealsTable.status, status as any));
      }
      const deals = await db
        .select()
        .from(schema.dealsTable)
        .where(and(...conditions))
        .orderBy(desc(schema.dealsTable.createdAt))
        .limit(limit)
        .offset(offset);

      const countRes = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.dealsTable)
        .where(and(...conditions));

      return {
        deals: deals as DealRecord[],
        total: Number(countRes[0]?.count ?? 0),
      };
    }

    let filtered = memoryStore.deals.filter((d) => d.sellerId === sellerId);
    if (status) {
      filtered = filtered.filter((d) => d.status === status);
    }
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const paginated = filtered.slice(offset, offset + limit);

    return {
      deals: paginated,
      total: filtered.length,
    };
  },

  async getDealById(id: number, sellerId?: number): Promise<DealRecord | null> {
    let deal: DealRecord | null = null;
    const db = getDb();

    if (db) {
      const conditions = [eq(schema.dealsTable.id, id)];
      if (sellerId !== undefined) {
        conditions.push(eq(schema.dealsTable.sellerId, sellerId));
      }
      const [res] = await db.select().from(schema.dealsTable).where(and(...conditions)).limit(1);
      deal = (res as DealRecord) || null;
    } else {
      deal = memoryStore.deals.find((d) => d.id === id && (sellerId === undefined || d.sellerId === sellerId)) || null;
    }

    if (deal) {
      deal = await autoSettleIfOverdue(deal);
    }
    return deal;
  },

  async getDealByCode(code: string): Promise<DealRecord | null> {
    let deal: DealRecord | null = null;
    const db = getDb();
    if (db) {
      const [res] = await db.select().from(schema.dealsTable).where(eq(schema.dealsTable.code, code)).limit(1);
      deal = (res as DealRecord) || null;
    } else {
      deal = memoryStore.deals.find((d) => d.code === code) || null;
    }

    if (deal) {
      deal = await autoSettleIfOverdue(deal);
    }
    return deal;
  },

  async createDeal(data: {
    code: string;
    shortUrl: string;
    itemName: string;
    description?: string;
    price: string;
    feeAmount: string;
    sellerPayout: string;
    deliveryWindowHours: number;
    sellerId: number;
  }): Promise<DealRecord> {
    const db = getDb();
    if (db) {
      const [inserted] = await db.insert(schema.dealsTable).values(data).returning();
      await db.insert(schema.activityTable).values({
        sellerId: data.sellerId,
        dealId: inserted.id,
        type: "deal_created",
        itemName: data.itemName,
        amount: data.price,
      });
      return inserted as DealRecord;
    }

    const newDeal: DealRecord = {
      id: memoryStore.nextDealId++,
      code: data.code,
      shortUrl: data.shortUrl,
      itemName: data.itemName,
      description: data.description || null,
      price: data.price,
      feeAmount: data.feeAmount,
      sellerPayout: data.sellerPayout,
      deliveryWindowHours: data.deliveryWindowHours,
      status: "created",
      sellerId: data.sellerId,
      buyerPhone: null,
      buyerName: null,
      buyerEmail: null,
      paystackReference: null,
      sellerConfirmedAt: null,
      buyerConfirmedAt: null,
      dispatchedAt: null,
      deliveryDeadline: null,
      deliveryCode: null,
      settledAt: null,
      createdAt: new Date(),
    };

    memoryStore.deals.unshift(newDeal);
    memoryStore.activity.unshift({
      id: memoryStore.nextActivityId++,
      sellerId: data.sellerId,
      dealId: newDeal.id,
      type: "deal_created",
      itemName: data.itemName,
      amount: data.price,
      timestamp: new Date(),
    });

    return newDeal;
  },

  async updateDeal(id: number, updates: Partial<DealRecord>): Promise<DealRecord | null> {
    const db = getDb();
    if (db) {
      const [updated] = await db
        .update(schema.dealsTable)
        .set(updates as any)
        .where(eq(schema.dealsTable.id, id))
        .returning();
      return (updated as DealRecord) || null;
    }

    const idx = memoryStore.deals.findIndex((d) => d.id === id);
    if (idx === -1) return null;
    memoryStore.deals[idx] = { ...memoryStore.deals[idx], ...updates };
    return memoryStore.deals[idx];
  },

  async deleteDeal(id: number, sellerId: number): Promise<boolean> {
    const deal = await this.getDealById(id, sellerId);
    if (!deal || deal.status !== "created") return false;

    const db = getDb();
    if (db) {
      await db.delete(schema.dealsTable).where(and(eq(schema.dealsTable.id, id), eq(schema.dealsTable.sellerId, sellerId)));
    } else {
      memoryStore.deals = memoryStore.deals.filter((d) => d.id !== id);
    }
    return true;
  },

  // Disputes
  async getDisputeByDealId(dealId: number): Promise<DisputeRecord | null> {
    const db = getDb();
    if (db) {
      const [res] = await db.select().from(schema.disputesTable).where(eq(schema.disputesTable.dealId, dealId)).limit(1);
      return (res as DisputeRecord) || null;
    }
    return memoryStore.disputes.find((d) => d.dealId === dealId) || null;
  },

  async listAllDisputes() {
    const db = getDb();
    if (db) {
      const disputes = await db.select().from(schema.disputesTable).orderBy(desc(schema.disputesTable.createdAt));
      return disputes as DisputeRecord[];
    }
    return [...memoryStore.disputes].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async createDispute(data: {
    dealId: number;
    reason: "item_never_arrived" | "wrong_damaged_item" | "incomplete_service";
    description?: string;
    evidenceUrl?: string;
  }): Promise<DisputeRecord> {
    const deal = await this.getDealById(data.dealId);
    if (!deal) throw new Error("Deal not found");

    const db = getDb();
    if (db) {
      await db.update(schema.dealsTable).set({ status: "disputed" }).where(eq(schema.dealsTable.id, deal.id));
      const [dispute] = await db
        .insert(schema.disputesTable)
        .values({
          dealId: deal.id,
          reason: data.reason,
          description: data.description,
          evidenceUrl: data.evidenceUrl,
        })
        .returning();
      await db.insert(schema.activityTable).values({
        sellerId: deal.sellerId,
        dealId: deal.id,
        type: "dispute_raised",
        itemName: deal.itemName,
        amount: deal.price,
        buyerName: deal.buyerName,
      });
      return dispute as DisputeRecord;
    }

    await this.updateDeal(deal.id, { status: "disputed" });
    const newDispute: DisputeRecord = {
      id: memoryStore.nextDisputeId++,
      dealId: deal.id,
      reason: data.reason,
      description: data.description || null,
      evidenceUrl: data.evidenceUrl || null,
      counterProofUrl: null,
      counterProofDescription: null,
      status: "open",
      resolution: null,
      createdAt: new Date(),
      resolvedAt: null,
    };
    memoryStore.disputes.push(newDispute);
    memoryStore.activity.unshift({
      id: memoryStore.nextActivityId++,
      sellerId: deal.sellerId,
      dealId: deal.id,
      type: "dispute_raised",
      itemName: deal.itemName,
      amount: deal.price,
      buyerName: deal.buyerName,
      timestamp: new Date(),
    });

    return newDispute;
  },

  async updateDispute(id: number, updates: Partial<DisputeRecord>): Promise<DisputeRecord | null> {
    const db = getDb();
    if (db) {
      const [updated] = await db
        .update(schema.disputesTable)
        .set(updates as any)
        .where(eq(schema.disputesTable.id, id))
        .returning();
      return (updated as DisputeRecord) || null;
    }

    const idx = memoryStore.disputes.findIndex((d) => d.id === id);
    if (idx === -1) return null;
    memoryStore.disputes[idx] = { ...memoryStore.disputes[idx], ...updates };
    return memoryStore.disputes[idx];
  },

  // Dashboard Stats
  async getDashboardStats(sellerId: number) {
    const seller = await this.findSellerById(sellerId);
    const db = getDb();
    if (db) {
      const [stats] = await db
        .select({
          total: sql<number>`count(*)`,
          settled: sql<number>`count(*) filter (where status = 'settled')`,
          active: sql<number>`count(*) filter (where status in ('locked', 'dispatched', 'delivered'))`,
          disputed: sql<number>`count(*) filter (where status = 'disputed')`,
          pending: sql<number>`coalesce(sum(case when status in ('locked', 'dispatched', 'delivered') then seller_payout::numeric else 0 end), 0)`,
        })
        .from(schema.dealsTable)
        .where(eq(schema.dealsTable.sellerId, sellerId));

      const recentSettlements = await db
        .select()
        .from(schema.dealsTable)
        .where(and(eq(schema.dealsTable.sellerId, sellerId), eq(schema.dealsTable.status, "settled")))
        .orderBy(desc(schema.dealsTable.settledAt))
        .limit(5);

      return {
        totalDeals: Number(stats.total),
        settledDeals: Number(stats.settled),
        activeDeals: Number(stats.active),
        disputedDeals: Number(stats.disputed),
        totalEarnings: parseFloat(seller?.totalEarnings ?? "0"),
        pendingEarnings: Number(stats.pending),
        recentSettlements: recentSettlements as DealRecord[],
      };
    }

    const sellerDeals = memoryStore.deals.filter((d) => d.sellerId === sellerId);
    const totalDeals = sellerDeals.length;
    const settledDeals = sellerDeals.filter((d) => d.status === "settled").length;
    const activeDeals = sellerDeals.filter((d) => ["locked", "dispatched", "delivered"].includes(d.status)).length;
    const disputedDeals = sellerDeals.filter((d) => d.status === "disputed").length;
    const pendingEarnings = sellerDeals
      .filter((d) => ["locked", "dispatched", "delivered"].includes(d.status))
      .reduce((sum, d) => sum + parseFloat(d.sellerPayout), 0);

    const recentSettlements = sellerDeals
      .filter((d) => d.status === "settled")
      .sort((a, b) => new Date(b.settledAt || b.createdAt).getTime() - new Date(a.settledAt || a.createdAt).getTime())
      .slice(0, 5);

    return {
      totalDeals,
      settledDeals,
      activeDeals,
      disputedDeals,
      totalEarnings: parseFloat(seller?.totalEarnings ?? "0"),
      pendingEarnings,
      recentSettlements,
    };
  },

  async addActivity(data: { sellerId: number; dealId: number; type: ActivityRecord["type"]; itemName: string; amount: string; buyerName?: string }) {
    const db = getDb();
    if (db) {
      await db.insert(schema.activityTable).values(data);
    } else {
      memoryStore.activity.unshift({
        id: memoryStore.nextActivityId++,
        sellerId: data.sellerId,
        dealId: data.dealId,
        type: data.type,
        itemName: data.itemName,
        amount: data.amount,
        buyerName: data.buyerName || null,
        timestamp: new Date(),
      });
    }
  },
};

