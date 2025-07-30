import { Link, useLocation } from "wouter";
import { Mail, ExternalLink } from "lucide-react";
import { handleNavigation } from "@/utils/navigation";

export default function Footer() {
  const [location] = useLocation();
  
  return (
    <footer className="bg-surface-white border-t border-light section-divider">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Products */}
          <div>
            <h4 className="font-semibold text-primary mb-2 text-sm">Products</h4>
            <ul className="space-y-1">
              <li>
                <a 
                  href="/fetch-patterns" 
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigation('/fetch-patterns', location);
                  }}
                  className="text-secondary hover:text-accent-blue transition-colors text-sm"
                >
                  Fetch Patterns
                </a>
              </li>
              <li>
                <a 
                  href="/permeate-enterprise" 
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigation('/permeate-enterprise', location);
                  }}
                  className="text-secondary hover:text-accent-blue transition-colors text-sm"
                >
                  PerMeaTe Enterprise
                </a>
              </li>
              <li>
                <a 
                  href="/next" 
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigation('/next', location);
                  }}
                  className="text-secondary hover:text-accent-blue transition-colors text-sm"
                >
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
                <a 
                  href="/about" 
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigation('/about', location);
                  }}
                  className="text-secondary hover:text-accent-blue transition-colors text-sm"
                >
                  About Us
                </a>
              </li>
              <li>
                <a 
                  href="/contact" 
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigation('/contact', location);
                  }}
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

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-primary mb-2 text-sm">Legal</h4>
            <ul className="space-y-1">
              <li>
                <a 
                  href="/privacy" 
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigation('/privacy', location);
                  }}
                  className="text-secondary hover:text-accent-blue transition-colors text-sm"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a 
                  href="/terms" 
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigation('/terms', location);
                  }}
                  className="text-secondary hover:text-accent-blue transition-colors text-sm"
                >
                  Terms of Service
                </a>
              </li>
              <li>
                <a 
                  href="/security" 
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigation('/security', location);
                  }}
                  className="text-secondary hover:text-accent-blue transition-colors text-sm"
                >
                  Security
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-primary mb-2 text-sm">Contact</h4>
            <div className="space-y-2">
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
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="mt-6 pt-6 border-t border-light">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-secondary text-sm">
              Copyright Dark Street. All rights reserved.
            </p>
            <div className="flex items-center space-x-6">
              <img src="https://darkstreet.tech/attached_assets/DarkStreetTech_Icon_1752659608842.png" alt="Dark Street Tech" className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}