import Link from 'next/link';

export default function FooterCompany() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="h-6 w-6 bg-blue-600 rounded"></div>
              <span className="text-lg font-semibold">Dark Street Tech</span>
            </div>
            <p className="text-gray-400 text-sm">
              AI-powered solutions for enterprise document analysis and strategic goal management.
            </p>
          </div>

          {/* Products */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider">Products</h3>
            <nav className="space-y-2">
              <Link
                href="/fetch-patterns"
                className="block text-sm text-gray-400 hover:text-white transition-colors"
                data-testid="footer-fetch-patterns"
              >
                Fetch Patterns
              </Link>
              <Link
                href="/permeate-enterprise"
                className="block text-sm text-gray-400 hover:text-white transition-colors"
                data-testid="footer-permeate-enterprise"
              >
                PerMeaTe Enterprise
              </Link>
            </nav>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider">Company</h3>
            <nav className="space-y-2">
              <Link
                href="/company"
                className="block text-sm text-gray-400 hover:text-white transition-colors"
                data-testid="footer-company"
              >
                About Us
              </Link>
              <Link
                href="/whats-next"
                className="block text-sm text-gray-400 hover:text-white transition-colors"
                data-testid="footer-whats-next"
              >
                What's Next
              </Link>
              <Link
                href="/contact"
                className="block text-sm text-gray-400 hover:text-white transition-colors"
                data-testid="footer-contact"
              >
                Contact
              </Link>
            </nav>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider">Support</h3>
            <nav className="space-y-2">
              <Link
                href="/docs"
                className="block text-sm text-gray-400 hover:text-white transition-colors"
                data-testid="footer-docs"
              >
                Documentation
              </Link>
              <Link
                href="/support"
                className="block text-sm text-gray-400 hover:text-white transition-colors"
                data-testid="footer-support"
              >
                Support
              </Link>
              <Link
                href="/privacy"
                className="block text-sm text-gray-400 hover:text-white transition-colors"
                data-testid="footer-privacy"
              >
                Privacy Policy
              </Link>
            </nav>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-gray-800">
          <div className="flex flex-col sm:flex-row items-center justify-between">
            <p className="text-sm text-gray-400">
              Copyright. Dark Street. All rights reserved.{' '}
              <a
                href="https://darkstreet.consulting"
                className="hover:text-white transition-colors"
                target="_blank"
                rel="noopener noreferrer"
                data-testid="footer-website"
              >
                darkstreet.consulting
              </a>
            </p>
            
            <div className="mt-4 sm:mt-0">
              {/* Skip to content link - positioned for screen readers */}
              <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 bg-blue-600 text-white px-4 py-2 rounded-md z-50"
                data-testid="skip-to-content"
              >
                Skip to main content
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}