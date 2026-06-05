import { useGetSellerProfile } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function SettingsPage() {
  const { data: profile, isLoading } = useGetSellerProfile();

  if (isLoading) return <div>Loading profile...</div>;
  if (!profile) return <div>Profile not found</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account profile and payout methods.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seller Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Business / Full Name</Label>
              <Input value={profile.name} disabled />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={profile.email} disabled />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={profile.phone} disabled />
            </div>
            <div className="space-y-2">
              <Label>Payout Wallet (MoMo)</Label>
              <Input value={profile.walletAddress} disabled />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground">To update these details, please contact support. Escrow wallets are locked to prevent fraud.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
