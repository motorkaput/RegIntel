import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Clock, Eye, CheckCircle, User } from 'lucide-react';

export default function AssignmentsPage() {
  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Assignment Recommendations</h1>
          <p className="text-gray-600 mt-2">
            AI-powered recommendations for optimal task assignment based on skills and availability
          </p>
        </div>
        <Button data-testid="button-request-assignment">
          <Plus className="h-4 w-4 mr-2" />
          Request Assignment
        </Button>
      </div>

      {/* Assignment Proposals */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Assignment Proposals</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Active Assignment Proposal */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <Badge className="bg-yellow-100 text-yellow-800">
                    Proposed
                  </Badge>
                  <span className="font-medium">Customer Portal Frontend Development</span>
                </div>
                <span className="text-sm text-gray-500">30 minutes ago</span>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Build responsive React components for customer self-service portal
                </p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>⏱️ 80 hours</span>
                  <span>📍 Remote preferred</span>
                  <span>🛠️ React, TypeScript, CSS</span>
                </div>
              </div>

              {/* Candidate Recommendations */}
              <div className="space-y-3 mb-4">
                <div className="bg-green-50 border border-green-200 rounded p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-green-600 text-white">Rank #1</Badge>
                      <span className="font-medium">Nina Sharma</span>
                      <Badge variant="outline">92% confidence</Badge>
                    </div>
                    <User className="h-4 w-4 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-600">
                    Perfect skill match with React expertise, available capacity, remote location preference
                  </p>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    <span>Skill Match: 95%</span>
                    <span>Availability: 85%</span>
                    <span>Location: ✅ Match</span>
                    <span>Workload: Medium</span>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-blue-600 text-white">Rank #2</Badge>
                      <span className="font-medium">Dev Patel</span>
                      <Badge variant="outline">78% confidence</Badge>
                    </div>
                    <User className="h-4 w-4 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-600">
                    Strong React skills but currently at higher capacity, good learning opportunity
                  </p>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    <span>Skill Match: 88%</span>
                    <span>Availability: 60%</span>
                    <span>Location: ✅ Match</span>
                    <span>Workload: High</span>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-gray-600 text-white">Rank #3</Badge>
                      <span className="font-medium">Meera Iyer</span>
                      <Badge variant="outline">65% confidence</Badge>
                    </div>
                    <User className="h-4 w-4 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-600">
                    Intermediate React skills, excellent availability, great for skill development
                  </p>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    <span>Skill Match: 70%</span>
                    <span>Availability: 90%</span>
                    <span>Location: ✅ Match</span>
                    <span>Workload: Low</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button size="sm" data-testid="button-review-assignments">
                  <Eye className="h-4 w-4 mr-2" />
                  Review Details
                </Button>
                <Button size="sm" variant="outline">
                  Accept Recommendation
                </Button>
                <Button size="sm" variant="outline">
                  Modify
                </Button>
                <Button size="sm" variant="outline">
                  Reject
                </Button>
              </div>
            </div>

            {/* Accepted Assignment */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <Badge className="bg-green-100 text-green-800">
                    Accepted
                  </Badge>
                  <span className="font-medium">Database Migration Task</span>
                </div>
                <span className="text-sm text-gray-500">3 days ago</span>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Assigned to <span className="font-medium">Ravi Kapoor</span> based on backend expertise
                </p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>⏱️ 40 hours</span>
                  <span>📍 Delhi office</span>
                  <span>🛠️ PostgreSQL, Node.js</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button size="sm" variant="outline" data-testid="button-view-assignment">
                  <Eye className="h-4 w-4 mr-2" />
                  View Assignment
                </Button>
                <Badge variant="outline" className="text-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Assigned
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assignment Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span>Team Utilization</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Nina Sharma</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                  <span className="text-sm font-medium">75%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Dev Patel</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '90%' }}></div>
                  </div>
                  <span className="text-sm font-medium">90%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Meera Iyer</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                  </div>
                  <span className="text-sm font-medium">60%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assignment Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">94%</div>
              <p className="text-gray-600 text-sm">AI recommendations accepted</p>
              <p className="text-xs text-gray-500 mt-2">Based on last 30 days</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Awaiting Review</span>
                <Badge variant="outline">3</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">In Progress</span>
                <Badge variant="outline">8</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Completed</span>
                <Badge className="bg-green-100 text-green-800">12</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}