import { useState } from "react";
import { Link } from "wouter";
import { useListDeals } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Search } from "lucide-react";
import { DealStatus, ListDealsStatus } from "@workspace/api-client-react/src/generated/api.schemas";

export default function DealsPage() {
  const [statusFilter, setStatusFilter] = useState<ListDealsStatus | "all">("all");
  
  const { data, isLoading } = useListDeals(statusFilter !== "all" ? { status: statusFilter } : {});

  const getStatusBadge = (status: DealStatus) => {
    switch(status) {
      case 'created': return <Badge variant="secondary" className="bg-slate-100 text-slate-800">Created</Badge>;
      case 'locked': return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Locked</Badge>;
      case 'dispatched': return <Badge variant="secondary" className="bg-amber-100 text-amber-800">Dispatched</Badge>;
      case 'delivered': return <Badge variant="secondary" className="bg-green-100 text-green-800">Delivered</Badge>;
      case 'settled': return <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">Settled</Badge>;
      case 'disputed': return <Badge variant="secondary" className="bg-red-100 text-red-800">Disputed</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Deals</h1>
          <p className="text-muted-foreground mt-1">Manage all your escrow transactions.</p>
        </div>
        <Link href="/deals/new">
          <Button className="gap-2">
            <PlusCircle className="w-4 h-4" />
            Create Deal
          </Button>
        </Link>
      </div>

      <Card>
        <div className="p-4 border-b flex items-center justify-between">
          <div className="w-[200px]">
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Deals</SelectItem>
                <SelectItem value="created">Created</SelectItem>
                <SelectItem value="locked">Locked</SelectItem>
                <SelectItem value="dispatched">Dispatched</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="settled">Settled</SelectItem>
                <SelectItem value="disputed">Disputed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading deals...</div>
          ) : data?.deals.length === 0 ? (
            <div className="p-12 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                <Search className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No deals found</h3>
              <p className="text-muted-foreground mt-1 max-w-sm">
                You don't have any deals matching the selected criteria.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.deals.map((deal) => (
                  <TableRow key={deal.id}>
                    <TableCell className="font-medium">{deal.itemName}</TableCell>
                    <TableCell>{deal.buyerName || <span className="text-muted-foreground italic">Waiting</span>}</TableCell>
                    <TableCell>GHS {deal.price.toFixed(2)}</TableCell>
                    <TableCell>{getStatusBadge(deal.status)}</TableCell>
                    <TableCell>{new Date(deal.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/deals/${deal.id}`}>
                        <Button variant="ghost" size="sm">View</Button>
                      </Link>
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
