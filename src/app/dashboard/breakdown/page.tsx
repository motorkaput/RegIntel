import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Target, Plus, ArrowRight, Clock, Eye, CheckCircle } from 'lucide-react';

export default function BreakdownPage() {
  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Goal Breakdown</h1>
          <p className="text-gray-600 mt-2">
            Transform strategic goals into actionable projects using AI-powered analysis
          </p>
        </div>
        <Button data-testid="button-new-goal">
          <Plus className="h-4 w-4 mr-2" />
          Break Down Goal
        </Button>
      </div>

      {/* Goal Breakdown Proposals */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Goal Breakdown Proposals</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Active Proposal */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <Badge className="bg-yellow-100 text-yellow-800">
                    Proposed
                  </Badge>
                  <span className="font-medium">Increase Customer Satisfaction to 95%</span>
                </div>
                <span className="text-sm text-gray-500">1 hour ago</span>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                Strategic goal to achieve 95% customer satisfaction score by Q4 2025 through systematic improvements
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-blue-50 p-3 rounded">
                  <div className="text-sm text-blue-600 font-medium">Projects Generated</div>
                  <div className="text-2xl font-bold text-blue-900">4</div>
                </div>
                <div className="bg-green-50 p-3 rounded">
                  <div className="text-sm text-green-600 font-medium">Total Hours</div>
                  <div className="text-2xl font-bold text-green-900">520</div>
                </div>
                <div className="bg-purple-50 p-3 rounded">
                  <div className="text-sm text-purple-600 font-medium">Assignees Suggested</div>
                  <div className="text-2xl font-bold text-purple-900">8</div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button size="sm" data-testid="button-review-breakdown">
                  <Eye className="h-4 w-4 mr-2" />
                  Review Projects
                </Button>
                <Button size="sm" variant="outline">
                  Accept All
                </Button>
                <Button size="sm" variant="outline">
                  Modify
                </Button>
                <Button size="sm" variant="outline">
                  Reject
                </Button>
              </div>
            </div>

            {/* Accepted Proposal */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <Badge className="bg-green-100 text-green-800">
                    Accepted
                  </Badge>
                  <span className="font-medium">Launch Mobile App by Q2 2025</span>
                </div>
                <span className="text-sm text-gray-500">2 weeks ago</span>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                Comprehensive mobile application development project broken into 5 phases
              </p>

              <div className="flex items-center space-x-2">
                <Button size="sm" variant="outline" data-testid="button-view-projects">
                  <Eye className="h-4 w-4 mr-2" />
                  View Projects
                </Button>
                <Badge variant="outline" className="text-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  In Progress
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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