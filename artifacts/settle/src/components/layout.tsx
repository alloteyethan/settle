import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ShieldCheck, LayoutDashboard, List, PlusCircle, Settings, LogOut, Lock } from "lucide-react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, logout } = useAuth();
  const [location, setLocation] = useLocation();

  if (!isAuthenticated) {
    setLocation("/login");
    return null;
  }

  return (
    <div className="min-h-screen flex bg-muted/40">
      <aside className="w-64 bg-card border-r flex flex-col">
        <div className="h-16 flex items-center px-6 border-b">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl tracking-tight text-primary">
            <Lock className="w-6 h-6" />
            SETTLE
          </Link>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <Link href="/dashboard">
            <Button variant={location === "/dashboard" ? "secondary" : "ghost"} className="w-full justify-start gap-2">
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Button>
          </Link>
          <Link href="/deals">
            <Button variant={location.startsWith("/deals") && location !== "/deals/new" ? "secondary" : "ghost"} className="w-full justify-start gap-2">
              <List className="w-4 h-4" />
              Deals
            </Button>
          </Link>
          <Link href="/deals/new">
            <Button variant={location === "/deals/new" ? "secondary" : "ghost"} className="w-full justify-start gap-2">
              <PlusCircle className="w-4 h-4" />
              Create Deal
            </Button>
          </Link>
        </nav>

        <div className="p-4 border-t space-y-1">
          <Link href="/settings">
            <Button variant={location === "/settings" ? "secondary" : "ghost"} className="w-full justify-start gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </Button>
          </Link>
          <Button variant="ghost" className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => { logout(); setLocation("/login"); }}>
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </aside>
      
      <main className="flex-1 flex flex-col">
        <div className="h-16 bg-card border-b flex items-center px-8 justify-between">
          <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Protected by SETTLE Escrow
          </div>
        </div>
        <div className="flex-1 p-8 overflow-auto">
          <div className="max-w-5xl mx-auto w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
