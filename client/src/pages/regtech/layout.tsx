import { Link, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { MessageSquare, FileText, GitCompare, Library, ChevronDown, LogOut, Bell, Settings, Menu, History, ClipboardCheck, HelpCircle, CreditCard, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SessionBar } from "@/components/regtech/SessionBar";

const ROLE_LABELS: Record<string, string> = {
  cco: "Chief Compliance Officer",
  mlro: "MLRO",
  financial_crime_head: "Financial Crime Head",
  aml_ops: "AML Ops / Case Manager",
  compliance_analyst: "Compliance Analyst",
  business_analyst: "Business Analyst",
};

const navItems = [
  { href: "/regtech/documents", icon: Library, label: "Library", description: "Upload & browse documents" },
  { href: "/regtech/console", icon: FileText, label: "Console", description: "Regulatory news feed" },
  { href: "/regtech/query", icon: MessageSquare, label: "Query AI", description: "Ask questions" },
  { href: "/regtech/diff", icon: GitCompare, label: "Diff", description: "Compare documents" },
  { href: "/regtech/obligations-analysis", icon: ClipboardCheck, label: "Obligations", description: "Analyze obligations" },
  { href: "/regtech/alerts", icon: Bell, label: "Alerts", description: "Notifications" },
  { href: "/regtech/sessions", icon: History, label: "Sessions", description: "Session history" },
  { href: "/regtech/guide", icon: HelpCircle, label: "Guide", description: "How it works" },
];

export default function RegTechLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  const isAdmin = !!(user as any)?.isAdmin;
  const subscriptionStatus = (user as any)?.subscriptionStatus || "trial";
  const trialDaysRemaining = (user as any)?.trialDaysRemaining || 0;
  const isTrialExpired = subscriptionStatus === "trial" && trialDaysRemaining === 0;

  const handleLogout = async () => {
    try {
      await apiRequest("/api/auth/logout", "POST");
      queryClient.clear();
      setLocation("/");
    } catch {
      setLocation("/");
    }
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) setLocation("/");
  }, [isAuthenticated, isLoading, setLocation]);

  useEffect(() => {
    if (isTrialExpired && !isAdmin) setShowPaywall(true);
  }, [isTrialExpired, isAdmin]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold font-heading text-[#001D51] dark:text-white animate-pulse">regintel</h1>
          <p className="text-xs text-[#D4AF37] mt-1">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col font-body">
      {/* Trial Banner */}
      {subscriptionStatus === "trial" && trialDaysRemaining > 0 && !isAdmin && (
        <div className="bg-[#D4AF37]/10 border-b border-[#D4AF37]/20 text-center py-2 px-4">
          <p className="text-xs text-[#001D51] dark:text-[#D4AF37]">
            <span className="font-semibold">{trialDaysRemaining} days left</span> on your free trial.{" "}
            <button onClick={() => setLocation("/regtech/pricing")} className="underline font-semibold hover:no-underline">Upgrade now</button>
          </p>
        </div>
      )}

      {/* Expired Trial Banner */}
      {isTrialExpired && !isAdmin && (
        <div className="bg-red-500/10 border-b border-red-500/20 text-center py-3 px-4">
          <p className="text-sm text-red-700 dark:text-red-400 flex items-center justify-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Your free trial has expired.{" "}
            <a href="mailto:hello@darkstreet.org" className="underline font-semibold">Contact us</a> or subscribe to continue.
          </p>
        </div>
      )}

      {/* Sticky Header */}
      <header className="sticky top-0 z-50 w-full">
        {/* Tier 1: Branding */}
        <div className="bg-[#001D51] text-white">
          <div className="max-w-7xl mx-auto flex h-14 items-center justify-between px-4 lg:px-6">
            <div className="flex items-center gap-3">
              <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden p-1 text-white/60 hover:text-white">
                <Menu className="h-5 w-5" />
              </button>
              <Link href="/regtech/documents" className="flex items-center gap-2">
                <span className="text-base font-bold font-heading text-white">regintel</span>
                <span className="text-[10px] text-[#D4AF37] hidden sm:inline">by Dark Street Tech</span>
              </Link>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-2 h-9 text-white hover:bg-white/10">
                  <div className="h-7 w-7 rounded-full bg-[#D4AF37] text-[#001D51] flex items-center justify-center text-xs font-bold">
                    {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div className="hidden md:flex flex-col items-start">
                    <span className="text-xs font-medium">{user?.firstName || user?.email?.split("@")[0]}</span>
                    {user?.role && <span className="text-[10px] text-white/50">{ROLE_LABELS[user.role] || user.role}</span>}
                  </div>
                  <ChevronDown className="h-3 w-3 text-white/40" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                  {subscriptionStatus === "trial" && trialDaysRemaining > 0 && (
                    <span className="text-xs text-[#D4AF37] font-medium">Trial: {trialDaysRemaining} days left</span>
                  )}
                  {subscriptionStatus === "active" && (
                    <span className="text-xs text-emerald-600 font-medium">Professional Plan</span>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isAdmin && (
                  <>
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link href="/regtech/admin" className="flex items-center">
                        <Settings className="mr-2 h-4 w-4" />Admin Panel
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Tier 2: Session Bar */}
        <SessionBar />

        {/* Tier 3: Navigation */}
        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <div className="max-w-7xl mx-auto px-4 lg:px-6">
            <nav className="hidden lg:flex items-center gap-1 py-2 overflow-x-auto">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = location === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <button className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                      isActive
                        ? "bg-[#001D51] text-white shadow-sm"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                    }`}>
                      <Icon className="h-4 w-4" />{item.label}
                    </button>
                  </Link>
                );
              })}
            </nav>
            <div className="lg:hidden py-2 text-sm text-slate-600 dark:text-slate-300">
              {navItems.find(i => i.href === location)?.label || "RegIntel"}
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6" key={location}>
          {children}
        </div>
      </main>

      {/* Mobile Nav */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-80 p-0">
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="flex items-center gap-2 text-left">
              <span className="text-base font-bold font-heading">regintel</span>
              <span className="text-xs text-[#D4AF37]">by Dark Street Tech</span>
            </SheetTitle>
          </SheetHeader>
          <div className="p-4">
            <div className="grid grid-cols-2 gap-3">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = location === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <button onClick={() => setMobileMenuOpen(false)}
                      className={`w-full p-4 rounded-xl text-left transition-all ${isActive ? "bg-[#001D51] text-white" : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"}`}>
                      <Icon className="h-5 w-5 mb-2" />
                      <div className="font-medium text-sm">{item.label}</div>
                      <div className={`text-xs mt-0.5 ${isActive ? "text-white/60" : "text-slate-500"}`}>{item.description}</div>
                    </button>
                  </Link>
                );
              })}
            </div>
            {isAdmin && (
              <Link href="/regtech/admin">
                <button onClick={() => setMobileMenuOpen(false)}
                  className="w-full mt-3 p-4 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-left">
                  <Settings className="h-5 w-5 mb-2 text-[#D4AF37]" />
                  <div className="font-medium text-sm">Admin Panel</div>
                  <div className="text-xs text-[#D4AF37]/70 mt-0.5">Manage users & orgs</div>
                </button>
              </Link>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-6">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span className="font-heading font-bold text-slate-700 dark:text-slate-300">regintel</span>
              <span className="text-[#D4AF37]">by Dark Street Tech</span>
            </div>
            <div className="flex items-center gap-4">
              <a href="mailto:hello@darkstreet.org" className="hover:text-[#D4AF37] transition">hello@darkstreet.org</a>
              <a href="https://darkstreet.tech" target="_blank" className="hover:text-[#D4AF37] transition">darkstreet.tech</a>
            </div>
          </div>
          <p className="text-center text-[10px] text-slate-400 dark:text-slate-500 mt-4">
            RegIntel can make mistakes. Please verify all important information before taking decisions.
          </p>
          <p className="text-center text-[10px] text-slate-300 dark:text-slate-600 mt-1">
            © {new Date().getFullYear()} Dark Street Tech. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
