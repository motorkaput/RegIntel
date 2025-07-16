import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import DocumentAnalyzer from "@/pages/document-analyzer";
import PerformanceDashboard from "@/pages/performance-dashboard";
import Pricing from "@/pages/pricing";
import Subscription from "@/pages/subscription";
import FetchPatterns from "@/pages/fetch-patterns";
import PerMeaTeEnterprise from "@/pages/permeate-enterprise";
import Next from "@/pages/next";
import About from "@/pages/about";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/fetch-patterns" component={FetchPatterns} />
          <Route path="/permeate-enterprise" component={PerMeaTeEnterprise} />
          <Route path="/next" component={Next} />
          <Route path="/about" component={About} />
          <Route path="/pricing" component={Pricing} />
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/fetch-patterns" component={FetchPatterns} />
          <Route path="/permeate-enterprise" component={PerMeaTeEnterprise} />
          <Route path="/next" component={Next} />
          <Route path="/about" component={About} />
          <Route path="/document-analyzer" component={DocumentAnalyzer} />
          <Route path="/performance-dashboard" component={PerformanceDashboard} />
          <Route path="/subscription" component={Subscription} />
          <Route path="/pricing" component={Pricing} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="pt-14">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
