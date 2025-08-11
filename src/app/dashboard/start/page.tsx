import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, ArrowRight } from 'lucide-react';

export default function StartPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Getting Started</h1>
        <p className="text-gray-600 mt-2">
          Begin your strategic goal management journey
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-blue-600" />
              <span>Quick Start Guide</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                  1
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Define Your Goals</h3>
                  <p className="text-gray-600 text-sm">Start by setting clear, measurable strategic objectives</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                  2
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Break Down Tasks</h3>
                  <p className="text-gray-600 text-sm">Use our AI-powered breakdown system to create actionable tasks</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                  3
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Assign & Track</h3>
                  <p className="text-gray-600 text-sm">Automatically assign tasks and monitor progress in real-time</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <a href="/dashboard/breakdown" className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">Goal Breakdown</h3>
                    <p className="text-gray-600 text-sm">Transform strategic goals into actionable tasks</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </div>
              </a>
              
              <a href="/dashboard/org-upload" className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">Upload Organization Data</h3>
                    <p className="text-gray-600 text-sm">Import your team structure and employee data</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </div>
              </a>
              
              <a href="/dashboard/dashboards" className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">View Dashboards</h3>
                    <p className="text-gray-600 text-sm">Monitor progress and performance metrics</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </div>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}