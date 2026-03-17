import { Link, useLocation } from "wouter";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Bell,
  FileText,
  Search,
  ClipboardCheck,
  BarChart3,
  History,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  GitCompare,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const ROLE_LABELS: Record<string, string> = {
  cco: "Chief Compliance Officer",
  mlro: "MLRO",
  financial_crime_head: "Financial Crime Head",
  aml_ops: "AML Ops / Case Manager",
  compliance_analyst: "Compliance Analyst",
  business_analyst: "Business Analyst",
};

interface NavItem {
  href: string;
  icon: typeof LayoutDashboard;
  label: string;
  badge?: string;
}

const mainNavItems: NavItem[] = [
  { href: "/regtech/console", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/regtech/alerts", icon: Bell, label: "Web Alerts", badge: "NEW" },
  { href: "/regtech/documents", icon: FileText, label: "Documents" },
  { href: "/regtech/query", icon: MessageSquare, label: "Compliance Analysis" },
  { href: "/regtech/obligations-analysis", icon: ClipboardCheck, label: "Obligations Tracker" },
  { href: "/regtech/diff", icon: GitCompare, label: "Reports" },
  { href: "/regtech/sessions", icon: History, label: "Sessions" },
];

const bottomNavItems: NavItem[] = [
  { href: "/regtech/guide", icon: HelpCircle, label: "Guide" },
];

export default function RegTechLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = !!(user as any)?.isAdmin;

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

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--ds-bg)' }}>
        <div className="text-center">
          <div className="h-10 w-10 rounded-xl animate-pulse mx-auto mb-3" style={{ background: 'var(--ds-border)' }} />
          <div className="h-3 w-24 rounded animate-pulse mx-auto" style={{ background: 'var(--ds-border)' }} />
        </div>
      </div>
    );
  }

  const currentPage = [...mainNavItems, ...bottomNavItems].find(item => location === item.href);
  const pageTitle = currentPage?.label || "RegIntel";

  const renderNavItem = (item: NavItem, collapsed: boolean) => {
    const Icon = item.icon;
    const isActive = location === item.href;
    const isWebAlerts = item.label === "Web Alerts";

    const navLink = (
      <Link href={item.href}>
        <div
          className={`group flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-all duration-150 relative ${
            isActive
              ? 'text-white'
              : 'hover:text-white'
          } ${collapsed ? 'justify-center px-0 mx-2' : 'mx-3'}`}
          style={{
            background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
            color: isActive ? '#FFFFFF' : 'var(--ds-text-on-dark-muted)',
            borderLeft: isActive && !collapsed ? '3px solid var(--ds-gold)' : isActive && collapsed ? 'none' : '3px solid transparent',
            paddingLeft: collapsed ? undefined : isActive ? '9px' : '12px',
          }}
          onMouseEnter={(e) => {
            if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
          }}
          onMouseLeave={(e) => {
            if (!isActive) e.currentTarget.style.background = 'transparent';
          }}
        >
          {isActive && collapsed && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r" style={{ background: 'var(--ds-gold)' }} />
          )}
          <Icon className={`h-[18px] w-[18px] flex-shrink-0 ${isWebAlerts && !isActive ? 'text-[var(--ds-gold)]' : ''}`} />
          {!collapsed && (
            <span className="text-[13px] font-medium truncate flex-1">{item.label}</span>
          )}
          {!collapsed && item.badge && (
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
              style={{
                background: 'var(--ds-gold)',
                color: 'var(--ds-imperial)',
              }}
            >
              {item.badge}
            </span>
          )}
        </div>
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip key={item.href} delayDuration={0}>
          <TooltipTrigger asChild>{navLink}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return <div key={item.href}>{navLink}</div>;
  };

  const sidebarContent = (collapsed: boolean, isMobile: boolean = false) => (
    <div
      className="flex flex-col h-full"
      style={{ background: 'var(--ds-imperial)' }}
    >
      {/* Logo Section */}
      <div className={`flex items-center h-14 border-b ${collapsed ? 'justify-center px-2' : 'px-4'}`} style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
        {!collapsed && (
          <Link href="/regtech/console" className="flex items-center gap-2.5">
            <div
              className="h-8 w-8 rounded-md flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--ds-gold)' }}
            >
              <span className="text-sm font-bold" style={{ color: 'var(--ds-imperial)' }}>R</span>
            </div>
            <div className="flex flex-col">
              <span className="brand-name text-[15px] text-white leading-tight">RegIntel</span>
              <span className="text-[10px] leading-tight" style={{ color: 'var(--ds-text-on-dark-muted)' }}>
                Regulatory Intelligence
              </span>
            </div>
          </Link>
        )}
        {collapsed && !isMobile && (
          <Link href="/regtech/console">
            <div
              className="h-8 w-8 rounded-md flex items-center justify-center"
              style={{ background: 'var(--ds-gold)' }}
            >
              <span className="text-sm font-bold" style={{ color: 'var(--ds-imperial)' }}>R</span>
            </div>
          </Link>
        )}
        {isMobile && (
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto p-1 rounded hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 py-3 space-y-0.5 overflow-y-auto">
        {!collapsed && (
          <div className="px-4 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-[1.5px]" style={{ color: 'var(--ds-text-on-dark-muted)' }}>
              Navigation
            </span>
          </div>
        )}
        {mainNavItems.map(item => renderNavItem(item, collapsed))}

        {isAdmin && (
          <>
            {!collapsed && (
              <div className="px-4 mt-4 mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-[1.5px]" style={{ color: 'var(--ds-text-on-dark-muted)' }}>
                  Admin
                </span>
              </div>
            )}
            {renderNavItem({ href: "/regtech/admin", icon: Settings, label: "Admin" }, collapsed)}
          </>
        )}
      </nav>

      {/* Bottom Section */}
      <div className="border-t py-3 space-y-0.5" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
        {bottomNavItems.map(item => renderNavItem(item, collapsed))}

        {/* Collapse toggle (desktop only) */}
        {!isMobile && (
          <div className={`${collapsed ? 'flex justify-center' : 'mx-3'} mt-2`}>
            <button
              onClick={() => setSidebarCollapsed(!collapsed)}
              className="flex items-center gap-2 px-3 py-2 rounded-md w-full transition-colors hover:bg-white/5"
              style={{ color: 'var(--ds-text-on-dark-muted)' }}
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4 mx-auto" />
              ) : (
                <>
                  <ChevronLeft className="h-4 w-4" />
                  <span className="text-[12px]">Collapse</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Dark Street Tech branding */}
        {!collapsed && (
          <div className="px-4 pt-2 pb-1">
            <span className="text-[11px]" style={{ color: 'var(--ds-text-on-dark-muted)' }}>
              Dark Street Tech
            </span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--ds-bg)' }}>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col flex-shrink-0 h-screen sticky top-0 transition-all duration-200 ${
          sidebarCollapsed ? 'w-[56px]' : 'w-[240px]'
        }`}
      >
        {sidebarContent(sidebarCollapsed)}
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-[280px] h-full flex-shrink-0">
            {sidebarContent(false, true)}
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Top Bar */}
        <header
          className="sticky top-0 z-40 flex items-center h-14 px-4 lg:px-6 border-b"
          style={{
            background: 'var(--ds-surface)',
            borderColor: 'var(--ds-border)',
          }}
        >
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-1.5 mr-3 rounded-md hover:bg-gray-100 transition-colors"
          >
            <Menu className="h-5 w-5" style={{ color: 'var(--ds-text)' }} />
          </button>

          {/* Page title / breadcrumb */}
          <h1
            className="text-[18px] font-semibold"
            style={{ fontFamily: "'Playfair Display', serif", color: 'var(--ds-text)' }}
          >
            {pageTitle}
          </h1>

          <div className="flex-1" />

          {/* Right side: user menu */}
          <div className="flex items-center gap-3">
            {/* User Avatar + Info */}
            <div className="flex items-center gap-2.5">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-[13px] font-medium" style={{ color: 'var(--ds-text)' }}>
                  {user?.firstName || user?.email?.split('@')[0] || 'User'}
                </span>
                {user?.role && (
                  <span className="text-[11px]" style={{ color: 'var(--ds-text-muted)' }}>
                    {ROLE_LABELS[user.role] || user.role}
                  </span>
                )}
              </div>
              <div
                className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold"
                style={{ background: 'var(--ds-imperial)', color: 'white' }}
              >
                {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
              </div>
            </div>

            {/* Logout */}
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="h-8 w-8 p-0"
                >
                  <LogOut className="h-4 w-4" style={{ color: 'var(--ds-text-muted)' }} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Logout</TooltipContent>
            </Tooltip>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6" key={location}>
          <div className="max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer
          className="border-t py-4 px-4 lg:px-6"
          style={{
            borderColor: 'var(--ds-border)',
            background: 'var(--ds-surface)',
          }}
        >
          <div className="max-w-[1400px] mx-auto flex flex-wrap justify-between items-center gap-2 text-[11px]" style={{ color: 'var(--ds-text-muted)' }}>
            <span>&copy; {new Date().getFullYear()} RegIntel. All rights reserved.</span>
            <div className="flex items-center gap-4">
              <a href="/terms" className="hover:underline" style={{ color: 'var(--ds-text-muted)' }}>Terms</a>
              <a href="/privacy" className="hover:underline" style={{ color: 'var(--ds-text-muted)' }}>Privacy</a>
              <a href="/contact" className="hover:underline" style={{ color: 'var(--ds-text-muted)' }}>Contact</a>
              <span>Dark Street Tech</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
