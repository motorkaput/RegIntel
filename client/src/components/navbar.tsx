import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, X } from "lucide-react";
import logoPath from "@assets/DarkStreetTech_Logo_1752637328308.png";

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

  const handleNavClick = (href: string) => {
    setIsOpen(false);
    if (href.startsWith("/#")) {
      const element = document.querySelector(href.substring(1));
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <nav className="fixed top-0 w-full bg-surface-darkest/90 backdrop-blur-md z-50 border-b border-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <img 
              src={logoPath} 
              alt="Dark Street Tech Logo" 
              className="h-8 w-auto"
            />
            <span className="text-xl font-bold text-primary-blue">
              Dark Street Tech
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              {items.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    location === item.href
                      ? "text-primary-blue"
                      : "text-white hover:text-primary-blue"
                  }`}
                  onClick={() => handleNavClick(item.href)}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <div className="text-sm text-secondary">
                  Welcome, {user?.firstName || "User"}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.href = "/api/logout"}
                  className="border-primary-blue text-primary-blue hover:bg-primary-blue hover:text-white"
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.location.href = "/api/login"}
                  className="text-white hover:text-primary-blue"
                >
                  Sign In
                </Button>
                <Button
                  size="sm"
                  onClick={() => window.location.href = "/api/login"}
                  className="bg-primary-blue text-white hover:bg-primary-blue-dark"
                >
                  Get Started
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden text-white hover:text-neon-green"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent 
              side="right" 
              className="bg-black border-l border-neon-green/20 text-white"
            >
              <div className="flex flex-col space-y-4 mt-8">
                {items.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`px-3 py-2 text-sm font-medium transition-colors ${
                      location === item.href
                        ? "text-neon-green"
                        : "text-white hover:text-neon-green"
                    }`}
                    onClick={() => handleNavClick(item.href)}
                  >
                    {item.name}
                  </Link>
                ))}
                
                <div className="pt-4 border-t border-gray-600">
                  {isAuthenticated ? (
                    <>
                      <div className="text-sm text-gray-300 mb-4">
                        Welcome, {user?.firstName || "User"}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.href = "/api/logout"}
                        className="w-full border-neon-green text-neon-green hover:bg-neon-green hover:text-black"
                      >
                        Sign Out
                      </Button>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.location.href = "/api/login"}
                        className="w-full text-white hover:text-neon-green"
                      >
                        Sign In
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => window.location.href = "/api/login"}
                        className="w-full bg-neon-green text-black hover:bg-neon-cyan"
                      >
                        Get Started
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
