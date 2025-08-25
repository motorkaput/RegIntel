import { Link, useLocation } from "wouter";
import { Mail, ExternalLink } from "lucide-react";
import { handleNavigation } from "@/utils/navigation";

export default function Footer() {
  const [location] = useLocation();
  
  return (
    <footer className="bg-surface-white border-t border-light section-divider">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* Contact Information */}
          <div className="flex items-center space-x-2 text-secondary">
            <Mail className="w-4 h-4" />
            <a 
              href="mailto:hello@darkstreet.org" 
              className="text-sm hover:text-accent-blue transition-colors"
            >
              hello@darkstreet.org
            </a>
          </div>
          
          {/* Copyright and Strategy Consulting Link */}
          <div className="flex items-center space-x-4 text-secondary text-sm">
            <p>Copyright Dark Street. All rights reserved.</p>
            <a 
              href="https://darkstreet.consulting" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center space-x-1 hover:text-accent-blue transition-colors"
            >
              <span>Strategy Consulting</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}