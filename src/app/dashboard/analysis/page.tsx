import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Users, AlertTriangle, CheckCircle, Clock, Eye } from 'lucide-react';

export default function AnalysisPage() {
  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Organization Analysis</h1>
          <p className="text-gray-600 mt-2">
            AI-powered insights into your organizational structure and capabilities
          </p>
        </div>
        <Button data-testid="button-run-analysis">
          <BarChart3 className="h-4 w-4 mr-2" />
          Run New Analysis
        </Button>
      </div>

      {/* Recent Proposals */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Recent Analysis Proposals</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Example proposals */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <Badge className="bg-yellow-100 text-yellow-800">
                    Proposed
                  </Badge>
                  <span className="font-medium">Q4 2024 Organizational Assessment</span>
                </div>
                <span className="text-sm text-gray-500">2 hours ago</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-blue-50 p-3 rounded">
                  <div className="text-sm text-blue-600 font-medium">Leaders Identified</div>
                  <div className="text-2xl font-bold text-blue-900">8</div>
                </div>
                <div className="bg-green-50 p-3 rounded">
                  <div className="text-sm text-green-600 font-medium">Functional Clusters</div>
                  <div className="text-2xl font-bold text-green-900">5</div>
                </div>
                <div className="bg-red-50 p-3 rounded">
                  <div className="text-sm text-red-600 font-medium">Risk Factors</div>
                  <div className="text-2xl font-bold text-red-900">3</div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button size="sm" data-testid="button-review-proposal">
                  <Eye className="h-4 w-4 mr-2" />
                  Review Details
                </Button>
                <Button size="sm" variant="outline">
                  Accept
                </Button>
                <Button size="sm" variant="outline">
                  Modify
                </Button>
                <Button size="sm" variant="outline">
                  Reject
                </Button>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <Badge className="bg-green-100 text-green-800">
                    Accepted
                  </Badge>
                  <span className="font-medium">Q3 2024 Skills Assessment</span>
                </div>
                <span className="text-sm text-gray-500">1 week ago</span>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                Comprehensive analysis revealing strong frontend capabilities and backend skill gaps.
                Identified 3 critical areas for team development.
              </p>

              <div className="flex items-center space-x-2">
                <Button size="sm" variant="outline" data-testid="button-view-accepted">
                  <Eye className="h-4 w-4 mr-2" />
                  View Analysis
                </Button>
                <Badge variant="outline" className="text-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Implemented
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span>Leadership Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Asha Menon</p>
                  <p className="text-sm text-gray-600">Org Leader • 12 direct reports</p>
                </div>
                <Badge variant="outline">Collaborative</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Ravi Kapoor</p>
                  <p className="text-sm text-gray-600">Functional Leader • 8 direct reports</p>
                </div>
                <Badge variant="outline">Technical</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Nina Sharma</p>
                  <p className="text-sm text-gray-600">Project Lead • 5 direct reports</p>
                </div>
                <Badge variant="outline">Agile</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <span>Risk Assessment</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-l-4 border-red-400 pl-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-gray-900">Technical Debt</p>
                  <Badge className="bg-red-100 text-red-800">High</Badge>
                </div>
                <p className="text-sm text-gray-600">
                  Legacy codebase requiring modernization in API layer
                </p>
              </div>
              
              <div className="border-l-4 border-yellow-400 pl-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-gray-900">Skill Concentration</p>
                  <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>
                </div>
                <p className="text-sm text-gray-600">
                  Frontend expertise concentrated in 2 team members
                </p>
              </div>
              
              <div className="border-l-4 border-yellow-400 pl-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-gray-900">Communication Gaps</p>
                  <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>
                </div>
                <p className="text-sm text-gray-600">
                  Limited cross-functional collaboration
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Items */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recommended Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                1
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Implement Code Review Standards</h3>
                <p className="text-gray-600 text-sm">Establish consistent review process to address technical debt</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                2
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Cross-Training Program</h3>
                <p className="text-gray-600 text-sm">Distribute frontend knowledge across more team members</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                3
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Regular All-Hands Meetings</h3>
                <p className="text-gray-600 text-sm">Improve communication between functional teams</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}