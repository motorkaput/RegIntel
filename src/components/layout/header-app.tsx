import { ServerSession } from '@/lib/auth/session';
import { getRoleDisplayName } from '@/lib/auth/rbac';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, LogOut, Settings } from 'lucide-react';
import Link from 'next/link';

interface HeaderAppProps {
  session: ServerSession;
}

export function HeaderApp({ session }: HeaderAppProps) {
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12">
          {/* Logo and Navigation */}
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-blue-600 rounded"></div>
              <span className="font-semibold text-gray-900">PerMeaTe Enterprise</span>
            </Link>
            
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
                Dashboard
              </Link>
              <Link href="/dashboard/goals" className="text-sm text-gray-600 hover:text-gray-900">
                Goals
              </Link>
              <Link href="/dashboard/projects" className="text-sm text-gray-600 hover:text-gray-900">
                Projects
              </Link>
              <Link href="/dashboard/tasks" className="text-sm text-gray-600 hover:text-gray-900">
                Tasks
              </Link>
            </nav>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {/* Tenant Badge */}
            <Badge variant="outline" className="text-xs">
              tenant: {session.tenantId.slice(0, 8)}...
            </Badge>

            {/* User Card */}
            <div className="flex items-center space-x-2 px-3 py-1 bg-gray-50 rounded-md">
              <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                <User className="w-3 h-3 text-gray-600" />
              </div>
              <div className="text-xs">
                <div className="font-medium text-gray-900">{session.email}</div>
                <div className="text-gray-500">
                  {getRoleDisplayName(session.role as any)}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <Link href="/dashboard/settings">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={handleLogout}
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}