'use client';

import { ChevronRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href?: string;
  isActive?: boolean;
}

interface DrilldownBreadcrumbProps {
  items: BreadcrumbItem[];
  onNavigate?: (href: string) => void;
}

export default function DrilldownBreadcrumb({ items, onNavigate }: DrilldownBreadcrumbProps) {
  const handleClick = (href: string) => {
    if (onNavigate) {
      onNavigate(href);
    }
  };

  return (
    <nav 
      className="flex items-center space-x-1 text-sm text-gray-600 mb-6"
      aria-label="Breadcrumb navigation"
    >
      {/* Home/Dashboard root */}
      <Link 
        href="/dashboard" 
        className="flex items-center hover:text-blue-600 transition-colors"
        data-testid="breadcrumb-home"
      >
        <Home className="h-4 w-4" />
        <span className="sr-only">Dashboard Home</span>
      </Link>

      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-1">
          <ChevronRight className="h-4 w-4 text-gray-400" />
          
          {item.href && !item.isActive ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 font-normal text-gray-600 hover:text-blue-600"
              onClick={() => item.href && handleClick(item.href)}
              data-testid={`breadcrumb-item-${index}`}
            >
              {item.label}
            </Button>
          ) : (
            <span 
              className={`${
                item.isActive 
                  ? 'font-medium text-gray-900' 
                  : 'text-gray-600'
              }`}
              aria-current={item.isActive ? 'page' : undefined}
              data-testid={`breadcrumb-current-${index}`}
            >
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}