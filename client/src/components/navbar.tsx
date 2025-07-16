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
      <div className="container-section">
        <div className="flex justify-between items-center h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <img 
              src={logoPath} 
              alt="Dark Street Tech" 
              className="h-10 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
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

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 text-secondary hover:text-primary h-8 px-3">
                    <User className="w-3 h-3" />
                    <span className="text-xs">{user?.firstName || user?.email || "User"}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/subscription" className="flex items-center space-x-2">
                      <User className="w-3 h-3" />
                      <span className="text-xs">Subscription</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href="/api/logout" className="flex items-center space-x-2">
                      <LogOut className="w-3 h-3" />
                      <span className="text-xs">Sign out</span>
                    </a>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-sm text-secondary hover:text-primary hover:bg-surface-grey transition-colors"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

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