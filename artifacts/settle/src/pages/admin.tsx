import { useListAdminDisputes, useResolveDispute } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

export default function AdminPage() {
  const { data: disputes, isLoading } = useListAdminDisputes();
  const resolveDispute = useResolveDispute();
  const queryClient = useQueryClient();

  const handleResolve = (id: number, decision: "favor_buyer" | "favor_seller") => {
    if (confirm(`Are you sure you want to resolve in favor of ${decision === 'favor_buyer' ? 'BUYER' : 'SELLER'}?`)) {
      resolveDispute.mutate({ id, data: { decision, resolution: "Resolved by admin panel" } }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['adminDisputes'] }); // Rough invalidate, list might not have a specific query key exported easily or we rely on full refresh
          window.location.reload();
        }
      });
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-destructive">Admin: Dispute Resolution</h1>
        <p className="text-muted-foreground mt-1">Review cases and release funds.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {!disputes || disputes.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No active disputes.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Deal Info</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Buyer Claim</TableHead>
                  <TableHead>Seller Counter</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Resolve</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {disputes.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>
                      <div className="font-medium">{d.deal.itemName}</div>
                      <div className="text-xs text-muted-foreground">GHS {d.deal.price}</div>
                    </TableCell>
                    <TableCell>{d.reason.replace(/_/g, ' ')}</TableCell>
                    <TableCell className="max-w-[200px]">
                      <p className="text-sm truncate" title={d.description || ""}>{d.description}</p>
                      {d.evidenceUrl && <a href={d.evidenceUrl} target="_blank" className="text-xs text-primary underline">Evidence</a>}
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <p className="text-sm truncate" title={d.counterProofDescription || ""}>{d.counterProofDescription || <span className="italic text-muted-foreground">None yet</span>}</p>
                      {d.counterProofUrl && <a href={d.counterProofUrl} target="_blank" className="text-xs text-primary underline">Proof</a>}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={d.status === 'open' ? 'border-amber-500 text-amber-500' : ''}>{d.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" variant="outline" className="text-destructive border-destructive" onClick={() => handleResolve(d.id, "favor_buyer")} disabled={resolveDispute.isPending}>
                        Refund Buyer
                      </Button>
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleResolve(d.id, "favor_seller")} disabled={resolveDispute.isPending}>
                        Pay Seller
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
