import { Link, useLocation } from "wouter";
import { Mail, ExternalLink } from "lucide-react";
import { handleNavigation } from "@/utils/navigation";

export default function Footer() {
  const [location] = useLocation();
  
  return (
    <footer className="bg-surface-white border-t border-light section-divider">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-center">
          {/* Contact Only */}
          <div>
            <h4 className="font-semibold text-primary mb-2 text-sm text-center">Contact</h4>
            <div className="flex justify-center">
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

          </div>
        </div>
      </div>
    </footer>
  );
}