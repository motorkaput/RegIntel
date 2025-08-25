import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import FetchPatternsApp from "@/pages/fetch-patterns-app";
import BetaLogin from "@/pages/beta-login";
import HowToPage from "@/pages/how-to-page";

// === ARCHIVED COMPONENTS (Dark Street Tech Company Pages) ===
// These are kept in archive but not actively routed
// import Landing from "@/pages/landing";
// import Home from "@/pages/home";
// import DocumentAnalyzer from "@/pages/document-analyzer";
// import PerformanceDashboard from "@/pages/performance-dashboard";
// import Pricing from "@/pages/pricing";
// import Subscription from "@/pages/subscription";
// import FetchPatterns from "@/pages/fetch-patterns";
// import PerMeateBetaLogin from "@/pages/permeate-beta-login";
// import PerMeaTeEnterpriseApp from "@/pages/permeate-enterprise-app";
// import PerMeaTeEnhanced from "@/pages/permeate-enhanced";
// import Privacy from "@/pages/privacy";
// import Terms from "@/pages/terms";
// import AboutPage from "@/pages/about";
// import Contact from "@/pages/contact";
// import Security from "@/pages/security";
// import PerMeaTeEnterprise from "@/pages/permeate-enterprise";
// import Next from "@/pages/next";

// Root redirect component
function RootRedirect() {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    setLocation('/beta-login');
  }, [setLocation]);
  
  return null;
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {/* Root URL redirect to Fetch Patterns login */}
      <Route path="/" component={RootRedirect} />
      
      {/* === FETCH PATTERNS - ONLY ACTIVE ROUTES === */}
      <Route path="/beta-login" component={BetaLogin} />
      <Route path="/x7k9p/fp-analyzer" component={FetchPatternsApp} />
      <Route path="/x7k9p/how-to" component={HowToPage} />
      
      {/* === ARCHIVED ROUTES (Dark Street Tech Company Pages) === */}
      {/* All other company pages are archived and no longer accessible */}
      {/* 
      <Route path="/fetch-patterns" component={FetchPatterns} />
      <Route path="/permeate-enterprise" component={PerMeaTeEnterprise} />
      <Route path="/next" component={Next} />
      <Route path="/about" component={AboutPage} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/home" component={Home} />
      <Route path="/document-analyzer" component={DocumentAnalyzer} />
      <Route path="/performance-dashboard" component={PerformanceDashboard} />
      <Route path="/subscription" component={Subscription} />
      <Route path="/z9m3k/pe-beta-login" component={PerMeateBetaLogin} />
      <Route path="/pe-workspace" component={PerMeaTeEnhanced} />
      <Route path="/z9m3k/pe-workspace" component={PerMeaTeEnhanced} />
      <Route path="/enhanced-pe" component={PerMeaTeEnhanced} />
      <Route path="/permeate-enhanced" component={PerMeaTeEnhanced} />
      <Route path="/m8x3r/pe-system" component={PerMeaTeEnhanced} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/terms" component={Terms} />
      <Route path="/contact" component={Contact} />
      <Route path="/security" component={Security} />
      */}
      
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
