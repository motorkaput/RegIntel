import Link from 'next/link';

export function FooterCompany() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-blue-400 rounded"></div>
              <span className="font-semibold">PerMeaTe Enterprise</span>
            </div>
            <p className="text-sm text-gray-300">
              Transform strategic objectives into actionable results with AI-powered 
              goal-to-work breakdown.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>
                <Link href="/dashboard/goals" className="hover:text-white">
                  Goal Management
                </Link>
              </li>
              <li>
                <Link href="/dashboard/projects" className="hover:text-white">
                  Project Tracking
                </Link>
              </li>
              <li>
                <Link href="/dashboard/tasks" className="hover:text-white">
                  Task Assignment
                </Link>
              </li>
              <li>
                <Link href="/dashboard/analytics" className="hover:text-white">
                  Performance Analytics
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold mb-4">Resources</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>
                <Link href="/docs" className="hover:text-white">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/api-docs" className="hover:text-white">
                  API Reference
                </Link>
              </li>
              <li>
                <Link href="/support" className="hover:text-white">
                  Support Center
                </Link>
              </li>
              <li>
                <Link href="/changelog" className="hover:text-white">
                  Changelog
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>
                <Link href="/about" className="hover:text-white">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm text-gray-400">
            © 2024 PerMeaTe Enterprise. All rights reserved.
          </div>
          <div className="flex items-center space-x-6 mt-4 md:mt-0 text-sm text-gray-400">
            <span>Built for enterprise teams</span>
            <span>•</span>
            <span>Powered by AI</span>
          </div>
        </div>
      </div>
    </footer>
  );
}