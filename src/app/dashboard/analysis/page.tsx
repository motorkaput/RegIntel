import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, Users, AlertTriangle, CheckCircle, Clock, Eye, Filter } from 'lucide-react';
import ProposalReviewModal from '@/components/proposals/ProposalReviewModal';
import { useState } from 'react';

export default function AnalysisPage() {
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const mockProposals = [
    {
      id: '1',
      type: 'org_analysis',
      status: 'proposed',
      input: { roster_count: 25 },
      output: { leaders: [], functional_clusters: [], skill_heatmap: {}, risk_list: [], assumptions: [] },
      created_by: { first_name: 'John', last_name: 'Doe', email: 'john@company.com' },
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '2', 
      type: 'org_analysis',
      status: 'accepted',
      input: { roster_count: 23 },
      output: { leaders: [], functional_clusters: [], skill_heatmap: {}, risk_list: [], assumptions: [] },
      created_by: { first_name: 'Jane', last_name: 'Smith', email: 'jane@company.com' },
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      review_comment: 'Analysis looks comprehensive and actionable'
    }
  ];

  const handleProposalUpdate = async (proposalId: string, action: string, data?: any) => {
    try {
      const response = await fetch(`/api/ai/proposals/${proposalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...data }),
      });
      
      if (response.ok) {
        // Refresh proposals list
        console.log('Proposal updated successfully');
      }
    } catch (error) {
      console.error('Failed to update proposal:', error);
    }
  };

  const openProposal = (proposal: any) => {
    setSelectedProposal(proposal);
    setIsModalOpen(true);
  };

  const filteredProposals = statusFilter === 'all' 
    ? mockProposals 
    : mockProposals.filter(p => p.status === statusFilter);

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

      {/* Analysis Proposals */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Analysis Proposals</span>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="proposed">Proposed</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="modified">Modified</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredProposals.map((proposal) => (
            <div key={proposal.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <Badge className={
                    proposal.status === 'proposed' ? 'bg-yellow-100 text-yellow-800' :
                    proposal.status === 'accepted' ? 'bg-green-100 text-green-800' :
                    proposal.status === 'modified' ? 'bg-blue-100 text-blue-800' :
                    'bg-red-100 text-red-800'
                  }>
                    {proposal.status}
                  </Badge>
                  <span className="font-medium">
                    {proposal.type === 'org_analysis' ? 'Organizational Assessment' : proposal.type}
                  </span>
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(proposal.created_at).toLocaleString()}
                </span>
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

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  Created by {proposal.created_by.first_name} {proposal.created_by.last_name}
                </span>
                <Button 
                  size="sm" 
                  onClick={() => openProposal(proposal)}
                  data-testid="button-review-proposal"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Review
                </Button>
              </div>
            </div>
            ))}

            {filteredProposals.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No proposals found for the selected filter.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <ProposalReviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        proposal={selectedProposal}
        onUpdate={handleProposalUpdate}
      />

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