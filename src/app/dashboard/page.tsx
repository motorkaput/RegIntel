import { Card, CardContent } from '@/components/ui/card';
import { Building2, Target, Users, BarChart3 } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">
          Welcome to PerMeaTe Enterprise!
        </h2>
        <p className="text-gray-600 mt-2">
          Transform your strategic objectives into actionable results
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">12</p>
                  <p className="text-sm text-gray-600">Active Goals</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Building2 className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">8</p>
                  <p className="text-sm text-gray-600">Projects</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">24</p>
                  <p className="text-sm text-gray-600">Team Members</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">87%</p>
                  <p className="text-sm text-gray-600">Completion Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      {/* Development Notice */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <Building2 className="h-6 w-6 text-blue-600 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900">PerMeaTe Enterprise - Two-Tier Sticky Shell Complete!</h3>
              <p className="text-blue-800 mt-1">
                The system now features a professional two-tier sticky header with company navigation and app navigation, 
                plus a comprehensive footer matching the Dark Street Tech design standards.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-blue-700">
                <div>
                  <strong>✅ Completed:</strong>
                  <ul className="mt-1 space-y-1">
                    <li>• Two-tier sticky headers</li>
                    <li>• Route-aware navigation</li>
                    <li>• Mobile responsive design</li>
                    <li>• Skip-to-content accessibility</li>
                  </ul>
                </div>
                <div>
                  <strong>✅ Features:</strong>
                  <ul className="mt-1 space-y-1">
                    <li>• Company & app navigation</li>
                    <li>• Active state indicators</li>
                    <li>• Professional footer</li>
                    <li>• Dark Street branding</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}