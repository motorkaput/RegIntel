import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Settings, Shield, UserPlus } from 'lucide-react';

export default function AdminPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Administration</h1>
        <p className="text-gray-600 mt-2">
          Manage your organization, users, and system settings
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span>User Management</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Total Users</p>
                  <p className="text-2xl font-bold text-blue-600">24</p>
                </div>
                <Button data-testid="button-invite-user">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite User
                </Button>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Administrators</span>
                  <span className="font-medium">3</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Org Leaders</span>
                  <span className="font-medium">5</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Project Leads</span>
                  <span className="font-medium">8</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Team Members</span>
                  <span className="font-medium">8</span>
                </div>
              </div>
              
              <Button variant="outline" className="w-full">
                Manage Users
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-green-600" />
              <span>System Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Email Notifications</span>
                  <div className="h-6 w-11 bg-blue-600 rounded-full relative">
                    <div className="absolute right-1 top-1 h-4 w-4 bg-white rounded-full"></div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Auto-assignment</span>
                  <div className="h-6 w-11 bg-blue-600 rounded-full relative">
                    <div className="absolute right-1 top-1 h-4 w-4 bg-white rounded-full"></div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Progress Tracking</span>
                  <div className="h-6 w-11 bg-blue-600 rounded-full relative">
                    <div className="absolute right-1 top-1 h-4 w-4 bg-white rounded-full"></div>
                  </div>
                </div>
              </div>
              
              <Button variant="outline" className="w-full">
                Advanced Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-purple-600" />
              <span>Security & Permissions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Last security audit:</span> 2 days ago
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Failed login attempts:</span> 0
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Active sessions:</span> 12
                </p>
              </div>
              
              <Button variant="outline" className="w-full">
                Security Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Organization Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Organization:</span> Test Corp
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Domain:</span> testcorp
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Plan:</span> Starter (30-day trial)
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Created:</span> Today
                </p>
              </div>
              
              <Button variant="outline" className="w-full">
                Edit Organization
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}