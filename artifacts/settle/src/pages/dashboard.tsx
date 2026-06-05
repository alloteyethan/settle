import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useGetSellerDashboard, useGetRecentActivity } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Wallet, CheckCircle2, AlertTriangle, Clock, PlusCircle } from "lucide-react";
import { Link } from "wouter";

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useGetSellerDashboard();
  const { data: activity, isLoading: activityLoading } = useGetRecentActivity({ limit: 10 });

  if (statsLoading || activityLoading) {
    return <div>Loading dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your escrow transactions.</p>
        </div>
        <Link href="/deals/new">
          <Button className="gap-2">
            <PlusCircle className="w-4 h-4" />
            Create Deal
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Earnings</CardTitle>
            <Wallet className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">GHS {stats?.totalEarnings?.toFixed(2) || "0.00"}</div>
            <p className="text-xs text-muted-foreground mt-1">GHS {stats?.pendingEarnings?.toFixed(2) || "0.00"} pending</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Deals</CardTitle>
            <Clock className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeDeals || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Settled Deals</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.settledDeals || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Disputed Deals</CardTitle>
            <AlertTriangle className="w-4 h-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.disputedDeals || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activity && activity.length > 0 ? (
              <div className="space-y-4">
                {activity.map(item => (
                  <div key={item.id} className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium">{item.itemName}</p>
                      <p className="text-sm text-muted-foreground">{item.type} • {new Date(item.timestamp).toLocaleDateString()}</p>
                    </div>
                    <div className="font-medium">
                      GHS {item.amount.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No recent activity. Create a deal to get started.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Settlements</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.recentSettlements && stats.recentSettlements.length > 0 ? (
              <div className="space-y-4">
                {stats.recentSettlements.map(deal => (
                  <div key={deal.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium">{deal.itemName}</p>
                      <p className="text-sm text-muted-foreground">Buyer: {deal.buyerName || 'Unknown'}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-emerald-600">+ GHS {deal.sellerPayout?.toFixed(2)}</div>
                      <Link href={`/deals/${deal.id}`} className="text-xs text-primary hover:underline">View deal</Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No settlements yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
