import { NextRequest, NextResponse } from "next/server";
import { dbService } from "@/lib/db";
import { formatDealResponse } from "@/lib/formatters";

export async function GET(req: NextRequest) {
  const disputes = await dbService.listAllDisputes();

  const enriched = await Promise.all(
    disputes.map(async (d) => {
      const deal = await dbService.getDealById(d.dealId);
      return {
        id: d.id,
        dealId: d.dealId,
        deal: deal ? await formatDealResponse(deal) : null,
        reason: d.reason,
        description: d.description ?? null,
        evidenceUrl: d.evidenceUrl ?? null,
        counterProofUrl: d.counterProofUrl ?? null,
        counterProofDescription: d.counterProofDescription ?? null,
        status: d.status,
        resolution: d.resolution ?? null,
        createdAt: new Date(d.createdAt).toISOString(),
        resolvedAt: d.resolvedAt ? new Date(d.resolvedAt).toISOString() : null,
      };
    })
  );

  return NextResponse.json(enriched);
}
