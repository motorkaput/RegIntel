import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import RegTechLanding from "@/pages/regtech-landing";
import { Redirect } from "wouter";
import RegTechDocuments from "@/pages/regtech/documents";
import RegTechConsole from "@/pages/regtech/console";
import RegTechQuery from "@/pages/regtech/query";
import RegTechDiff from "@/pages/regtech/diff";
import RegTechAlerts from "@/pages/regtech/alerts";
import RegtechAdmin from "@/pages/regtech/admin";
import RegTechSessions from "@/pages/regtech/sessions";
import ObligationsAnalysisPage from "@/pages/regtech/obligations-analysis";
import RegTechGuide from "@/pages/regtech/guide";
import { SessionProvider } from "@/contexts/SessionContext";
import { useAuth } from "@/hooks/useAuth";

function RegTechRoutes() {
  return (
    <SessionProvider>
      <Switch>
        <Route path="/regtech">{() => <Redirect to="/regtech/console" />}</Route>
        <Route path="/regtech/upload">{() => <Redirect to="/regtech/documents" />}</Route>
        <Route path="/regtech/documents" component={RegTechDocuments} />
        <Route path="/regtech/console" component={RegTechConsole} />
        <Route path="/regtech/query" component={RegTechQuery} />
        <Route path="/regtech/diff" component={RegTechDiff} />
        <Route path="/regtech/alerts" component={RegTechAlerts} />
        <Route path="/regtech/obligations-analysis" component={ObligationsAnalysisPage} />
        <Route path="/regtech/obligations">{() => <Redirect to="/regtech/obligations-analysis" />}</Route>
        <Route path="/regtech/compliance">{() => <Redirect to="/regtech/documents" />}</Route>
        <Route path="/regtech/audit">{() => <Redirect to="/regtech/documents" />}</Route>
        <Route path="/regtech/dashboard">{() => <Redirect to="/regtech/documents" />}</Route>
        <Route path="/regtech/sessions" component={RegTechSessions} />
        <Route path="/regtech/guide" component={RegTechGuide} />
        <Route path="/regtech/admin" component={RegtechAdmin} />
        <Route component={NotFound} />
      </Switch>
    </SessionProvider>
  );
}

function Router() {
  const [location] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    console.log('[Router] Current location:', location);
  }, [location]);

  if (location.startsWith('/regtech') && !isLoading && isAuthenticated) {
    return <RegTechRoutes />;
  }

  return (
    <Switch>
      <Route path="/" component={RegTechLanding} />
      <Route path="/login" component={RegTechLanding} />
      <Route path="/regtech/*">{() => <RegTechLanding />}</Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div>
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
