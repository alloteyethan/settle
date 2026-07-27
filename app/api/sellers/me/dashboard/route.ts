import { NextRequest, NextResponse } from "next/server";
import { getSellerFromRequest } from "@/lib/auth";
import { dbService } from "@/lib/db";

export async function GET(req: NextRequest) {
  const seller = await getSellerFromRequest(req);
  if (!seller) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stats = await dbService.getDashboardStats(seller.id);

  const formattedSettlements = await Promise.all(
    stats.recentSettlements.map(async (deal) => {
      const dispute = await dbService.getDisputeByDealId(deal.id);
      return {
        id: deal.id,
        code: deal.code,
        shortUrl: deal.shortUrl,
        itemName: deal.itemName,
        description: deal.description ?? null,
        price: parseFloat(deal.price),
        feeAmount: parseFloat(deal.feeAmount),
        sellerPayout: parseFloat(deal.sellerPayout),
        deliveryWindowHours: deal.deliveryWindowHours,
        status: deal.status,
        fulfillmentType: deal.fulfillmentType ?? null,
        sellerId: deal.sellerId,
        buyerPhone: deal.buyerPhone ?? null,
        buyerName: deal.buyerName ?? null,
        sellerConfirmedAt: deal.sellerConfirmedAt ? new Date(deal.sellerConfirmedAt).toISOString() : null,
        buyerConfirmedAt: deal.buyerConfirmedAt ? new Date(deal.buyerConfirmedAt).toISOString() : null,
        dispatchedAt: deal.dispatchedAt ? new Date(deal.dispatchedAt).toISOString() : null,
        deliveryDeadline: deal.deliveryDeadline ? new Date(deal.deliveryDeadline).toISOString() : null,
        deliveryCode: deal.deliveryCode ? String(deal.deliveryCode) : null,
        settledAt: deal.settledAt ? new Date(deal.settledAt).toISOString() : null,
        dispute: dispute
          ? {
              id: dispute.id,
              dealId: dispute.dealId,
              reason: dispute.reason,
              description: dispute.description ?? null,
              evidenceUrl: dispute.evidenceUrl ?? null,
              counterProofUrl: dispute.counterProofUrl ?? null,
              counterProofDescription: dispute.counterProofDescription ?? null,
              status: dispute.status,
              resolution: dispute.resolution ?? null,
              createdAt: new Date(dispute.createdAt).toISOString(),
              resolvedAt: dispute.resolvedAt ? new Date(dispute.resolvedAt).toISOString() : null,
            }
          : undefined,
        createdAt: new Date(deal.createdAt).toISOString(),
      };
    })
  );

  return NextResponse.json({
    totalDeals: stats.totalDeals,
    settledDeals: stats.settledDeals,
    activeDeals: stats.activeDeals,
    disputedDeals: stats.disputedDeals,
    totalEarnings: stats.totalEarnings,
    pendingEarnings: stats.pendingEarnings,
    recentSettlements: formattedSettlements,
  });
}
