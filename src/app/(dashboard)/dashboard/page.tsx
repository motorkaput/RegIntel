import { getServerSession } from '@/lib/auth/session';
import { getRoleDisplayName } from '@/lib/auth/rbac';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Building2, Users, Target } from 'lucide-react';

export default async function DashboardPage() {
  const session = await getServerSession();

  if (!session) {
    return null; // Layout will handle redirect
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome back to PerMeaTe Enterprise
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* User Info Card */}
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Profile</CardTitle>
            <User className="h-4 w-4 text-muted-foreground ml-auto" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{session.email}</div>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant="secondary">
                {getRoleDisplayName(session.role as any)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Tenant Info Card */}
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organization</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground ml-auto" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Tenant ID</div>
            <p className="text-xs text-muted-foreground mt-2 font-mono">
              {session.tenantId}
            </p>
          </CardContent>
        </Card>

        {/* Quick Actions Card */}
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground ml-auto" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <button className="w-full text-left text-sm hover:bg-gray-50 p-2 rounded">
                View Goals
              </button>
              <button className="w-full text-left text-sm hover:bg-gray-50 p-2 rounded">
                Manage Projects
              </button>
              <button className="w-full text-left text-sm hover:bg-gray-50 p-2 rounded">
                Team Tasks
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Welcome Message */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Welcome to PerMeaTe Enterprise</CardTitle>
          <CardDescription>
            Your goal-to-work breakdown platform is ready to use
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <p>
              PerMeaTe Enterprise helps teams convert strategic objectives into 
              actionable tasks with AI-powered insights. As a{' '}
              <strong>{getRoleDisplayName(session.role as any)}</strong>, you have 
              access to the tools and features needed for your role.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Key Features:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• AI-powered goal breakdown</li>
                  <li>• Task assignment and tracking</li>
                  <li>• Team collaboration tools</li>
                  <li>• Performance analytics</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Getting Started:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Set up your organizational goals</li>
                  <li>• Create projects and assign teams</li>
                  <li>• Break down work into manageable tasks</li>
                  <li>• Track progress and performance</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}