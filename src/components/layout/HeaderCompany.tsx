'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Menu, X } from 'lucide-react';

export default function HeaderCompany() {
  const [isProductsOpen, setIsProductsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-6 w-6 bg-blue-600 rounded"></div>
              <span className="text-lg font-semibold text-gray-900">Dark Street Tech</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {/* Products Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProductsOpen(!isProductsOpen)}
                className="flex items-center space-x-1 text-gray-700 hover:text-gray-900 transition-colors"
                data-testid="nav-products"
              >
                <span>Products</span>
                <ChevronDown className="h-4 w-4" />
              </button>
              
              {isProductsOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-md shadow-lg border border-gray-200 py-2">
                  <Link
                    href="/fetch-patterns"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    data-testid="link-fetch-patterns"
                  >
                    <div className="font-medium">Fetch Patterns</div>
                    <div className="text-gray-500">Document analysis platform</div>
                  </Link>
                  <Link
                    href="/permeate-enterprise"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    data-testid="link-permeate-enterprise"
                  >
                    <div className="font-medium">PerMeaTe Enterprise</div>
                    <div className="text-gray-500">Strategic goal management</div>
                  </Link>
                </div>
              )}
            </div>

            <Link
              href="/whats-next"
              className="text-gray-700 hover:text-gray-900 transition-colors"
              data-testid="nav-whats-next"
            >
              What's next
            </Link>

            <Link
              href="/company"
              className="text-gray-700 hover:text-gray-900 transition-colors"
              data-testid="nav-company"
            >
              Company
            </Link>

            <Link
              href="/contact"
              className="text-gray-700 hover:text-gray-900 transition-colors"
              data-testid="nav-contact"
            >
              Contact
            </Link>
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100"
            data-testid="button-mobile-menu"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="space-y-4">
              <div>
                <div className="font-medium text-gray-900 mb-2">Products</div>
                <div className="ml-4 space-y-2">
                  <Link
                    href="/fetch-patterns"
                    className="block text-gray-700 hover:text-gray-900"
                    data-testid="mobile-link-fetch-patterns"
                  >
                    Fetch Patterns
                  </Link>
                  <Link
                    href="/permeate-enterprise"
                    className="block text-gray-700 hover:text-gray-900"
                    data-testid="mobile-link-permeate-enterprise"
                  >
                    PerMeaTe Enterprise
                  </Link>
                </div>
              </div>

              <Link
                href="/whats-next"
                className="block text-gray-700 hover:text-gray-900"
                data-testid="mobile-nav-whats-next"
              >
                What's next
              </Link>

              <Link
                href="/company"
                className="block text-gray-700 hover:text-gray-900"
                data-testid="mobile-nav-company"
              >
                Company
              </Link>

              <Link
                href="/contact"
                className="block text-gray-700 hover:text-gray-900"
                data-testid="mobile-nav-contact"
              >
                Contact
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}