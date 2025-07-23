import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Menu, X, User, LogOut } from "lucide-react";
import logoPath from "@assets/DarkStreetTech_Logo_1752659608844.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navbar() {
  const [location] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const navigationItems = [
    { name: "Home", href: "/" },
    { name: "Fetch Patterns", href: "/fetch-patterns" },
    { name: "PerMeaTe Enterprise", href: "/permeate-enterprise" },
    { name: "Next", href: "/next" },
    { name: "About", href: "/about" },
  ];

  const authenticatedItems = [
    { name: "Home", href: "/" },
    { name: "Fetch Patterns", href: "/fetch-patterns" },
    { name: "PerMeaTe Enterprise", href: "/permeate-enterprise" },
    { name: "Next", href: "/next" },
    { name: "About", href: "/about" },
  ];

  const items = isAuthenticated ? authenticatedItems : navigationItems;

  return (
    <nav className="nav-minimal fixed top-0 left-0 right-0 z-50 backdrop-blur-sm section-divider">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main navigation line */}
        <div className="flex justify-between items-center h-24">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <img 
              src={logoPath} 
              alt="Dark Street Tech" 
              className="h-16 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6 ml-auto">
            {items.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`nav-item ${location === item.href ? 'active' : ''}`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-sm text-secondary hover:text-primary hover:bg-surface-grey transition-colors"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

        {/* User authentication line - separate from main navigation */}
        {isAuthenticated && (
          <div className="hidden md:flex justify-start items-center py-2 border-t border-light bg-gray-50/50">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-md border border-gray-200 shadow-sm h-10">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">{(user as any)?.firstName || (user as any)?.email || 'User'}</span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.location.href = "/api/logout"}
                className="text-gray-600 border-gray-300 hover:bg-gray-50 h-10"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Sign Out
              </Button>
            </div>
          </div>
        )}

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-light">
            <div className="flex flex-col space-y-1">
              {items.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-3 py-2 rounded-sm text-sm transition-colors ${
                    location === item.href
                      ? "text-primary bg-surface-grey"
                      : "text-secondary hover:text-primary hover:bg-surface-grey"
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              
              {/* Mobile Auth */}
              {isAuthenticated && (
                <div className="pt-3 border-t border-light mt-3">
                  <div className="space-y-1">
                    <Link
                      href="/subscription"
                      className="flex items-center space-x-2 px-3 py-2 text-sm text-secondary hover:text-primary hover:bg-surface-grey rounded-sm transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      <User className="w-3 h-3" />
                      <span>Subscription</span>
                    </Link>
                    <a
                      href="/api/logout"
                      className="flex items-center space-x-2 px-3 py-2 text-sm text-secondary hover:text-primary hover:bg-surface-grey rounded-sm transition-colors"
                    >
                      <LogOut className="w-3 h-3" />
                      <span>Sign out</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}