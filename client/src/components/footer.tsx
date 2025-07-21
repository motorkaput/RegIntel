import { Link } from "wouter";
import { Mail, ExternalLink } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-surface-white border-t border-light section-divider">
      <div className="container-section py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-secondary">
              <Mail className="w-4 h-4" />
              <a 
                href="mailto:hello@darkstreet.org" 
                className="text-sm hover:text-accent-blue transition-colors"
              >
                hello@darkstreet.org
              </a>
            </div>
          </div>

          {/* Products */}
          <div>
            <h4 className="font-semibold text-primary mb-2 text-sm">Products</h4>
            <ul className="space-y-1">
              <li>
                <a href="/fetch-patterns" target="_blank" rel="noopener noreferrer" className="text-secondary hover:text-accent-blue transition-colors text-sm">
                  Fetch Patterns
                </a>
              </li>
              <li>
                <a href="/permeate-enterprise" target="_blank" rel="noopener noreferrer" className="text-secondary hover:text-accent-blue transition-colors text-sm">
                  PerMeaTe Enterprise
                </a>
              </li>
              <li>
                <a href="/next" target="_blank" rel="noopener noreferrer" className="text-secondary hover:text-accent-blue transition-colors text-sm">
                  What's Next
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-primary mb-2 text-sm">Company</h4>
            <ul className="space-y-1">
              <li>
                <a href="/about" target="_blank" rel="noopener noreferrer" className="text-secondary hover:text-accent-blue transition-colors text-sm">
                  About Us
                </a>
              </li>
              <li>
                <a 
                  href="mailto:hello@darkstreet.org" 
                  className="text-secondary hover:text-accent-blue transition-colors text-sm"
                >
                  Contact
                </a>
              </li>
              <li>
                <a 
                  href="https://darkstreet.consulting" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-secondary hover:text-accent-blue transition-colors text-sm inline-flex items-center gap-1"
                >
                  Strategy & Consulting
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="font-semibold text-primary mb-2 text-sm">Connect</h4>
            <ul className="space-y-1">
              <li>
                <a 
                  href="mailto:hello@darkstreet.org" 
                  className="text-secondary hover:text-accent-blue transition-colors text-sm"
                >
                  hello@darkstreet.org
                </a>
              </li>
              <li>
                <a 
                  href="https://darkstreet.consulting" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-secondary hover:text-accent-blue transition-colors text-sm inline-flex items-center gap-1"
                >
                  darkstreet.consulting
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="mt-6 pt-6 border-t border-light">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-secondary text-sm">
              © 2025 Dark Street Tech. All rights reserved.
            </p>
            <div className="flex items-center space-x-6">
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}