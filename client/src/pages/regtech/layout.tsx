import { Link, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { MessageSquare, FileText, GitCompare, Library, ChevronDown, LogOut, Bell, Settings, Menu, History, ClipboardCheck, Shield, Activity, BarChart3, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import iconUrl from "@assets/fprt-icon_1767950294399.png";
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
  { href: "/regtech/documents", icon: Library, label: "Library", description: "Upload & browse documents", color: "bg-blue-500" },
  { href: "/regtech/console", icon: FileText, label: "Console", description: "Regulatory news feed", color: "bg-violet-500" },
  { href: "/regtech/query", icon: MessageSquare, label: "Query AI", description: "Ask questions", color: "bg-orange-500" },
  { href: "/regtech/diff", icon: GitCompare, label: "Diff", description: "Compare documents", color: "bg-cyan-500" },
  { href: "/regtech/obligations-analysis", icon: ClipboardCheck, label: "Obligations", description: "Analyze obligations", color: "bg-amber-500" },
  { href: "/regtech/alerts", icon: Bell, label: "Alerts", description: "Notifications", color: "bg-rose-500" },
  { href: "/regtech/sessions", icon: History, label: "Sessions", description: "Session history", color: "bg-emerald-500" },
  { href: "/regtech/guide", icon: HelpCircle, label: "Guide", description: "How it works", color: "bg-indigo-500" },
];

/* ============================================================
   V2 FEATURES - Hidden from navigation, code preserved
   Uncomment these items in navItems array to re-enable in v2
   ============================================================
   { href: "/regtech/dashboard", icon: BarChart3, label: "Dashboard", description: "Compliance overview", color: "bg-indigo-500" },
   { href: "/regtech/obligations", icon: ClipboardCheck, label: "Obligations", description: "Explore obligations", color: "bg-amber-500" },
   { href: "/regtech/compliance", icon: Shield, label: "Compliance", description: "Controls & evidence", color: "bg-teal-500" },
   { href: "/regtech/audit", icon: Activity, label: "Audit", description: "AI decision logs", color: "bg-slate-500" },
   ============================================================ */

export default function RegTechLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin = user?.email === "david@darkstreet.org";

  const handleLogout = async () => {
    try {
      await apiRequest('/api/auth/logout', 'POST');
      queryClient.clear();
      setLocation('/');
    } catch (error) {
      console.error('Logout failed', error);
      setLocation('/');
    }
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/');
    }
  }, [isAuthenticated, isLoading, setLocation]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-10 w-10 rounded-xl bg-slate-200 animate-pulse mx-auto mb-3" />
          <div className="h-3 w-24 bg-slate-200 rounded animate-pulse mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Sticky Header Container */}
      <header className="sticky top-0 z-50 w-full">
        {/* Tier 1: Branding + User Account */}
        <div className="bg-slate-900 text-white">
          <div className="max-w-7xl mx-auto flex h-14 items-center justify-between px-4 lg:px-6">
            {/* Left: Mobile menu + Logo */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-1 text-slate-300 hover:text-white"
                data-testid="button-mobile-menu"
              >
                <Menu className="h-5 w-5" />
              </button>

              <Link href="/regtech/documents" data-testid="link-home" className="flex items-center gap-3">
                <img src={iconUrl} alt="RegIntel" className="h-9 w-9 flex-shrink-0" />
                <div className="flex flex-col justify-center">
                  <span className="text-sm sm:text-base font-semibold text-white leading-tight">RegIntel</span>
                  <span className="text-[10px] sm:text-xs text-slate-400 leading-tight hidden sm:block">Regulatory Intelligence Platform</span>
                </div>
              </Link>
            </div>

            {/* Right: User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-2 h-9 text-white hover:bg-slate-800" data-testid="button-account-menu">
                  <div className="h-7 w-7 rounded-full bg-white text-slate-900 flex items-center justify-center text-xs font-medium">
                    {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="hidden md:flex flex-col items-start text-left">
                    <span className="text-xs font-medium text-white" data-testid="text-username">
                      {user?.firstName || user?.email?.split('@')[0] || 'User'}
                    </span>
                    {user?.role && (
                      <span className="text-[10px] text-slate-400" data-testid="text-user-role">
                        {ROLE_LABELS[user.role] || user.role}
                      </span>
                    )}
                  </div>
                  <ChevronDown className="h-3 w-3 text-slate-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs text-slate-500">{user?.email}</p>
                    {user?.role && (
                      <span className="text-xs text-emerald-600 font-medium">{ROLE_LABELS[user.role] || user.role}</span>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isAdmin && (
                  <>
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link href="/regtech/admin" className="flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        Admin Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer" data-testid="menu-logout">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Tier 2: Session Bar */}
        <SessionBar />

        {/* Tier 3: Navigation */}
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 lg:px-6">
            <nav className="hidden lg:flex items-center gap-1 py-2 overflow-x-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.href;
                
                return (
                  <Link key={item.href} href={item.href}>
                    <button
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 whitespace-nowrap ${
                        isActive
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent hover:border-slate-200'
                      }`}
                      data-testid={`link-${item.label.toLowerCase()}`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  </Link>
                );
              })}
            </nav>
            {/* Mobile: show current page indicator */}
            <div className="lg:hidden py-2 text-sm text-slate-600">
              {navItems.find(item => item.href === location)?.label || 'RegTech'}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6" key={location}>
          {children}
        </div>
      </main>

      {/* Mobile Navigation Sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-80 p-0">
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="flex items-center gap-3">
              <img src={iconUrl} alt="RegIntel" className="h-8 w-8" />
              <div className="text-left">
                <div className="text-sm font-semibold">RegIntel</div>
                <div className="text-xs text-slate-500 font-normal">Regulatory Intelligence Platform</div>
              </div>
            </SheetTitle>
          </SheetHeader>
          
          {/* Mobile Nav Grid - Bento style */}
          <div className="p-4">
            <div className="grid grid-cols-2 gap-3">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.href;
                
                return (
                  <Link key={item.href} href={item.href}>
                    <button
                      onClick={() => setMobileMenuOpen(false)}
                      className={`w-full p-4 rounded-xl text-left transition-all ${
                        isActive 
                          ? 'bg-slate-900 text-white' 
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                      data-testid={`mobile-link-${item.label.toLowerCase()}`}
                    >
                      <Icon className="h-5 w-5 mb-2" />
                      <div className="font-medium text-sm">{item.label}</div>
                      <div className={`text-xs mt-0.5 ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                        {item.description}
                      </div>
                    </button>
                  </Link>
                );
              })}
            </div>
            
            {isAdmin && (
              <Link href="/regtech/admin">
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full mt-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-left hover:bg-emerald-100 transition-colors"
                >
                  <Settings className="h-5 w-5 mb-2 text-emerald-600" />
                  <div className="font-medium text-sm text-emerald-900">Admin Dashboard</div>
                  <div className="text-xs text-emerald-600 mt-0.5">Manage users & orgs</div>
                </button>
              </Link>
            )}
          </div>
        </SheetContent>
      </Sheet>

        {/* Minimal Footer */}
        <footer className="border-t border-slate-200 bg-white py-6">
          <div className="max-w-7xl mx-auto px-4 lg:px-6 flex justify-between items-center text-xs text-slate-500">
            <span>© RegIntel. All rights reserved.</span>
            <a href="mailto:hello@regintel.darkstreet.tech" className="hover:text-slate-900 transition-colors">hello@regintel.darkstreet.tech</a>
          </div>
        </footer>
      </div>
  );
}
