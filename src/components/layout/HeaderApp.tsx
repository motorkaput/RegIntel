'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, LogOut, User } from 'lucide-react';

interface HeaderAppProps {
  user?: {
    first_name: string;
    last_name: string;
    role: string;
  };
  onLogout?: () => void;
}

export default function HeaderApp({ user, onLogout }: HeaderAppProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard/start', label: 'Start', testId: 'nav-start' },
    { href: '/dashboard/analysis', label: 'Analysis', testId: 'nav-analysis' },
    { href: '/dashboard/breakdown', label: 'Breakdown', testId: 'nav-breakdown' },
    { href: '/dashboard/org-upload', label: 'Org Upload', testId: 'nav-org-upload' },
    { href: '/dashboard/auto-assignment', label: 'Auto-assignment', testId: 'nav-auto-assignment' },
    { href: '/dashboard/dashboards', label: 'Dashboards', testId: 'nav-dashboards' },
    { href: '/dashboard/admin', label: 'Admin', testId: 'nav-admin' },
  ];

  const isActivePath = (href: string) => {
    if (href === '/dashboard/start') {
      return pathname === '/dashboard' || pathname === href;
    }
    return pathname?.startsWith(href);
  };

  return (
    <header className="sticky top-12 z-40 bg-gray-50 border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12">
          {/* App Title */}
          <div className="flex-shrink-0">
            <Link href="/dashboard" className="text-lg font-semibold text-gray-900">
              PerMeaTe Enterprise
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm transition-colors ${
                  isActivePath(item.href)
                    ? 'text-blue-600 font-medium border-b-2 border-blue-600 pb-3'
                    : 'text-gray-700 hover:text-gray-900 pb-3'
                }`}
                data-testid={item.testId}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user && (
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-700">
                <User className="h-4 w-4" />
                <span>{user.first_name} {user.last_name}</span>
                <span className="text-gray-500">({user.role})</span>
              </div>
            )}

            <button
              onClick={onLogout}
              className="p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4" />
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100"
              data-testid="button-mobile-app-menu"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block py-2 text-sm transition-colors ${
                    isActivePath(item.href)
                      ? 'text-blue-600 font-medium bg-blue-50 px-2 rounded'
                      : 'text-gray-700 hover:text-gray-900 px-2'
                  }`}
                  data-testid={`mobile-${item.testId}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {user && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-2 text-sm text-gray-700 px-2">
                  <User className="h-4 w-4" />
                  <span>{user.first_name} {user.last_name}</span>
                  <span className="text-gray-500">({user.role})</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}