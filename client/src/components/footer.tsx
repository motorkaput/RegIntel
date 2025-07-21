import { Link } from "wouter";
import { Mail, ExternalLink } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-surface-white border-t border-light section-divider">
      <div className="container-section py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                <a href="/contact" target="_blank" rel="noopener noreferrer" className="text-secondary hover:text-accent-blue transition-colors text-sm">
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
                <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-secondary hover:text-accent-blue transition-colors text-sm">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-secondary hover:text-accent-blue transition-colors text-sm">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="/security" target="_blank" rel="noopener noreferrer" className="text-secondary hover:text-accent-blue transition-colors text-sm">
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
              <div>
                <a 
                  href="https://darkstreet.consulting" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-secondary hover:text-accent-blue transition-colors text-sm inline-flex items-center gap-1"
                >
                  darkstreet.consulting
                  <ExternalLink className="w-3 h-3" />
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
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}