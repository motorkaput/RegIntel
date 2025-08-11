'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Edit, Clock, User, Eye, History } from 'lucide-react';
import Editor from '@monaco-editor/react';
import ReactDiffViewer from 'react-diff-viewer-continued';

interface Proposal {
  id: string;
  type: 'org_analysis' | 'goal_breakdown' | 'assignment';
  status: 'proposed' | 'accepted' | 'modified' | 'rejected';
  input: any;
  output: any;
  created_by: {
    first_name: string;
    last_name: string;
    email: string;
  };
  created_at: string;
  updated_at: string;
  review_comment?: string;
}

interface ProposalReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: Proposal | null;
  onUpdate: (proposalId: string, action: 'accept' | 'modify' | 'reject', data?: any) => void;
}

export default function ProposalReviewModal({ 
  isOpen, 
  onClose, 
  proposal, 
  onUpdate 
}: ProposalReviewModalProps) {
  const [activeTab, setActiveTab] = useState('review');
  const [editedOutput, setEditedOutput] = useState<string>('');
  const [reason, setReason] = useState('');
  const [showDiff, setShowDiff] = useState(false);
  const [auditHistory, setAuditHistory] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    if (proposal) {
      setEditedOutput(JSON.stringify(proposal.output, null, 2));
      setReason('');
      setShowDiff(false);
    }
  }, [proposal]);

  useEffect(() => {
    if (proposal && activeTab === 'history') {
      fetchAuditHistory();
    }
  }, [proposal, activeTab]);

  const fetchAuditHistory = async () => {
    if (!proposal) return;
    
    try {
      const response = await fetch(`/api/audit-logs?resource_type=proposal&resource_id=${proposal.id}`);
      if (response.ok) {
        const logs = await response.json();
        setAuditHistory(logs);
      }
    } catch (error) {
      console.error('Failed to fetch audit history:', error);
    }
  };

  const handleAccept = () => {
    if (!proposal) return;
    onUpdate(proposal.id, 'accept');
    onClose();
    toast({
      title: 'Proposal Accepted',
      description: 'The AI proposal has been accepted and will be implemented.',
    });
  };

  const handleReject = () => {
    if (!proposal || !reason.trim()) {
      toast({
        title: 'Reason Required',
        description: 'Please provide a reason for rejecting this proposal.',
        variant: 'destructive',
      });
      return;
    }
    
    onUpdate(proposal.id, 'reject', { reason });
    onClose();
    toast({
      title: 'Proposal Rejected',
      description: 'The AI proposal has been rejected with your feedback.',
    });
  };

  const handleModify = () => {
    if (!proposal || !reason.trim()) {
      toast({
        title: 'Reason Required', 
        description: 'Please provide a reason for modifying this proposal.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const changes = JSON.parse(editedOutput);
      onUpdate(proposal.id, 'modify', { changes, reason });
      onClose();
      toast({
        title: 'Proposal Modified',
        description: 'Your changes have been saved and the proposal updated.',
      });
    } catch (error) {
      toast({
        title: 'Invalid JSON',
        description: 'Please ensure your edits are valid JSON format.',
        variant: 'destructive',
      });
    }
  };

  const toggleDiff = () => {
    setShowDiff(!showDiff);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    const colors = {
      proposed: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      modified: 'bg-blue-100 text-blue-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      org_analysis: 'Organization Analysis',
      goal_breakdown: 'Goal Breakdown',
      assignment: 'Assignment Recommendation',
    };
    return labels[type as keyof typeof labels] || type;
  };

  if (!proposal) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{getTypeLabel(proposal.type)} Review</span>
            <Badge className={getStatusColor(proposal.status)}>
              {proposal.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="review">Review</TabsTrigger>
            <TabsTrigger value="edit">Edit</TabsTrigger>
            <TabsTrigger value="diff">Diff View</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <div className="mt-4 h-[60vh] overflow-hidden">
            <TabsContent value="review" className="h-full">
              <ScrollArea className="h-full">
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <User className="h-5 w-5" />
                        <span>Proposal Details</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Created by:</span>
                          <p>{proposal.created_by.first_name} {proposal.created_by.last_name}</p>
                        </div>
                        <div>
                          <span className="font-medium">Created at:</span>
                          <p>{formatTimestamp(proposal.created_at)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>AI Output</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-gray-50 p-4 rounded text-sm overflow-auto">
                        {JSON.stringify(proposal.output, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>

                  {proposal.review_comment && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Review Comment</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600">{proposal.review_comment}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="edit" className="h-full">
              <div className="h-full border rounded">
                <Editor
                  height="100%"
                  defaultLanguage="json"
                  value={editedOutput}
                  onChange={(value) => setEditedOutput(value || '')}
                  options={{
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    formatOnPaste: true,
                    formatOnType: true,
                  }}
                />
              </div>
            </TabsContent>

            <TabsContent value="diff" className="h-full">
              <ScrollArea className="h-full">
                <ReactDiffViewer
                  oldValue={JSON.stringify(proposal.output, null, 2)}
                  newValue={editedOutput}
                  splitView={true}
                  leftTitle="Original AI Output"
                  rightTitle="Your Edits"
                  hideLineNumbers={false}
                  showDiffOnly={false}
                />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="history" className="h-full">
              <ScrollArea className="h-full">
                <div className="space-y-3">
                  {auditHistory.map((log: any, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{log.action}</span>
                          <span className="text-sm text-gray-500">
                            {formatTimestamp(log.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{log.metadata?.reason}</p>
                        {log.metadata?.status_change && (
                          <Badge variant="outline" className="mt-2">
                            {log.metadata.status_change}
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  {auditHistory.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No history available</p>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </div>
        </Tabs>

        <div className="border-t pt-4">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Reason {(proposal.status === 'proposed') && '(required for modify/reject)'}
            </label>
            <Textarea
              placeholder="Provide your reasoning for this decision..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[80px]"
              data-testid="textarea-reason"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleDiff}
                data-testid="button-toggle-diff"
              >
                <Eye className="h-4 w-4 mr-2" />
                {showDiff ? 'Hide' : 'Show'} Diff
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              
              {proposal.status === 'proposed' && (
                <>
                  <Button
                    variant="outline"
                    onClick={handleReject}
                    className="text-red-600 hover:text-red-700"
                    data-testid="button-reject"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={handleModify}
                    className="text-blue-600 hover:text-blue-700"
                    data-testid="button-modify"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Modify
                  </Button>
                  
                  <Button
                    onClick={handleAccept}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    data-testid="button-accept"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Accept
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}