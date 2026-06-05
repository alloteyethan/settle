import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { setAuthTokenGetter } from "@workspace/api-client-react/src/custom-fetch";

import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import DashboardPage from "@/pages/dashboard";
import DealsPage from "@/pages/deals";
import CreateDealPage from "@/pages/create-deal";
import DealDetailPage from "@/pages/deal-detail";
import PayPage from "@/pages/pay";
import ConfirmPage from "@/pages/confirm";
import AdminPage from "@/pages/admin";
import SettingsPage from "@/pages/settings";
import { AppLayout } from "@/components/layout";

// Set up the token getter for Orval generated hooks
setAuthTokenGetter(() => localStorage.getItem("settle_auth_token"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      
      {/* Public Buyer Routes */}
      <Route path="/pay/:code" component={PayPage} />
      <Route path="/confirm/:code" component={ConfirmPage} />
      
      {/* Authenticated Routes */}
      <Route path="/dashboard">
        <AppLayout><DashboardPage /></AppLayout>
      </Route>
      <Route path="/deals">
        <AppLayout><DealsPage /></AppLayout>
      </Route>
      <Route path="/deals/new">
        <AppLayout><CreateDealPage /></AppLayout>
      </Route>
      <Route path="/deals/:id">
        <AppLayout><DealDetailPage /></AppLayout>
      </Route>
      <Route path="/settings">
        <AppLayout><SettingsPage /></AppLayout>
      </Route>
      <Route path="/admin">
        <AppLayout><AdminPage /></AppLayout>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
