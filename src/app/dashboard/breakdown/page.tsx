import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, Plus, ArrowRight } from 'lucide-react';

export default function BreakdownPage() {
  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Goal Breakdown</h1>
          <p className="text-gray-600 mt-2">
            Transform strategic goals into actionable tasks using AI-powered breakdown
          </p>
        </div>
        <Button data-testid="button-new-goal">
          <Plus className="h-4 w-4 mr-2" />
          New Goal
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-blue-600" />
              <span>Strategic Goal Example</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-900">Increase Customer Satisfaction</h3>
                <p className="text-blue-700 text-sm mt-1">
                  Achieve a 95% customer satisfaction score by Q4 2025
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">AI-Generated Breakdown:</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                    <span>Implement customer feedback system</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                    <span>Train customer service team</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                    <span>Develop satisfaction monitoring dashboard</span>
                  </div>
                </div>
              </div>
              
              <Button variant="outline" size="sm" className="w-full">
                View Full Breakdown
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Breakdown Process</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                  1
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Define Strategic Goal</h3>
                  <p className="text-gray-600 text-sm">Set clear, measurable objectives</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                  2
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">AI Analysis</h3>
                  <p className="text-gray-600 text-sm">AI breaks down into actionable components</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                  3
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Task Creation</h3>
                  <p className="text-gray-600 text-sm">Generate specific, assignable tasks</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                  4
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Assignment</h3>
                  <p className="text-gray-600 text-sm">Auto-assign based on team capabilities</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}