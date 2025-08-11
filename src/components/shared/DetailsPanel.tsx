'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  X, 
  Star, 
  MessageSquare, 
  Paperclip, 
  ExternalLink, 
  Clock,
  User,
  RotateCcw,
  Download
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TaskDetails {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  due_date?: string;
  assignees: Array<{
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  }>;
  project: {
    id: string;
    name: string;
  };
  external_key?: string;
  external_url?: string;
  scores: {
    self_score?: number;
    self_rationale?: string;
    review_score?: number;
    review_rationale?: string;
    override_score?: number;
    override_rationale?: string;
    final_score?: number;
  };
  comments: Array<{
    id: string;
    content: string;
    author: {
      first_name: string;
      last_name: string;
    };
    created_at: string;
  }>;
  attachments: Array<{
    id: string;
    filename: string;
    file_size: number;
    mime_type: string;
    file_url: string;
    uploaded_at: string;
    uploaded_by: {
      first_name: string;
      last_name: string;
    };
  }>;
  score_history: Array<{
    id: string;
    type: 'self' | 'review' | 'override';
    from_value?: number;
    to_value: number;
    reason?: string;
    created_at: string;
    actor: {
      first_name: string;
      last_name: string;
    };
  }>;
  linked_proposals?: Array<{
    id: string;
    type: string;
    status: string;
    created_at: string;
  }>;
}

interface DetailsPanelProps {
  taskId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onExport?: (taskId: string, format: 'png' | 'csv') => void;
}

export default function DetailsPanel({ taskId, isOpen, onClose, onExport }: DetailsPanelProps) {
  const [task, setTask] = useState<TaskDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'scores' | 'comments' | 'attachments' | 'history'>('overview');

  useEffect(() => {
    if (taskId && isOpen) {
      fetchTaskDetails(taskId);
    }
  }, [taskId, isOpen]);

  const fetchTaskDetails = async (id: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/tasks/${id}/details`);
      if (response.ok) {
        const data = await response.json();
        setTask(data);
      }
    } catch (error) {
      console.error('Failed to fetch task details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getScoreColor = (score: number) => {
    if (score >= 4.5) return 'text-green-600';
    if (score >= 3.5) return 'text-blue-600';
    if (score >= 2.5) return 'text-yellow-600';
    if (score >= 1.5) return 'text-orange-600';
    return 'text-red-600';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      todo: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      review: 'bg-yellow-100 text-yellow-800',
      done: 'bg-green-100 text-green-800',
      blocked: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (!isOpen || !taskId) {
    return null;
  }

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white border-l shadow-lg z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">Task Details</h2>
        <div className="flex items-center space-x-2">
          {onExport && task && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExport(task.id, 'png')}
                data-testid="button-export-png"
              >
                PNG
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExport(task.id, 'csv')}
                data-testid="button-export-csv"
              >
                CSV
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            data-testid="button-close-panel"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        {[
          { id: 'overview', label: 'Overview', icon: null },
          { id: 'scores', label: 'Scores', icon: Star },
          { id: 'comments', label: 'Comments', icon: MessageSquare },
          { id: 'attachments', label: 'Files', icon: Paperclip },
          { id: 'history', label: 'History', icon: RotateCcw }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 px-3 py-2 text-sm font-medium border-b-2 ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            data-testid={`tab-${tab.id}`}
          >
            <div className="flex items-center justify-center space-x-1">
              {tab.icon && <tab.icon className="h-3 w-3" />}
              <span className="hidden sm:inline">{tab.label}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : task ? (
            <>
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">{task.title}</h3>
                    {task.description && (
                      <p className="text-sm text-gray-600">{task.description}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</label>
                      <Badge className={getStatusColor(task.status)}>
                        {task.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Priority</label>
                      <Badge className={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Project</label>
                    <p className="text-sm font-medium">{task.project.name}</p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Assignees</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {task.assignees.map(assignee => (
                        <Badge key={assignee.id} variant="outline">
                          {assignee.first_name} {assignee.last_name}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {task.due_date && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Due Date</label>
                      <p className="text-sm">{formatDate(task.due_date)}</p>
                    </div>
                  )}

                  {task.external_key && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">External Reference</label>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{task.external_key}</Badge>
                        {task.external_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => window.open(task.external_url, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'scores' && (
                <div className="space-y-4">
                  {task.scores.final_score && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Final Score</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className={`text-2xl font-bold ${getScoreColor(task.scores.final_score)}`}>
                          {task.scores.final_score}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {task.scores.self_score && (
                    <div>
                      <h4 className="font-medium mb-2">Self Assessment</h4>
                      <div className={`font-semibold ${getScoreColor(task.scores.self_score)}`}>
                        Score: {task.scores.self_score}
                      </div>
                      {task.scores.self_rationale && (
                        <p className="text-sm text-gray-600 mt-1">{task.scores.self_rationale}</p>
                      )}
                    </div>
                  )}

                  {task.scores.review_score && (
                    <div>
                      <h4 className="font-medium mb-2">Review Score</h4>
                      <div className={`font-semibold ${getScoreColor(task.scores.review_score)}`}>
                        Score: {task.scores.review_score}
                      </div>
                      {task.scores.review_rationale && (
                        <p className="text-sm text-gray-600 mt-1">{task.scores.review_rationale}</p>
                      )}
                    </div>
                  )}

                  {task.scores.override_score && (
                    <div>
                      <h4 className="font-medium mb-2">Override Score</h4>
                      <div className={`font-semibold ${getScoreColor(task.scores.override_score)}`}>
                        Score: {task.scores.override_score}
                      </div>
                      {task.scores.override_rationale && (
                        <p className="text-sm text-gray-600 mt-1">{task.scores.override_rationale}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'comments' && (
                <div className="space-y-3">
                  {task.comments.map(comment => (
                    <div key={comment.id} className="border rounded p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">
                          {comment.author.first_name} {comment.author.last_name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(comment.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{comment.content}</p>
                    </div>
                  ))}
                  {task.comments.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">No comments yet</p>
                  )}
                </div>
              )}

              {activeTab === 'attachments' && (
                <div className="space-y-3">
                  {task.attachments.map(attachment => (
                    <div key={attachment.id} className="border rounded p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Paperclip className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-sm">{attachment.filename}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => window.open(attachment.file_url, '_blank')}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatFileSize(attachment.file_size)} • 
                        Uploaded by {attachment.uploaded_by.first_name} {attachment.uploaded_by.last_name} • 
                        {formatDate(attachment.uploaded_at)}
                      </div>
                    </div>
                  ))}
                  {task.attachments.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">No attachments</p>
                  )}
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-3">
                  {task.score_history.map(history => (
                    <div key={history.id} className="border-l-4 border-blue-200 pl-3">
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant="outline" className="capitalize">
                          {history.type}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {formatDate(history.created_at)}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">
                          {history.actor.first_name} {history.actor.last_name}
                        </span>
                        {' '}scored{' '}
                        {history.from_value !== null && (
                          <span className="text-gray-600">{history.from_value} → </span>
                        )}
                        <span className={getScoreColor(history.to_value)}>
                          {history.to_value}
                        </span>
                      </div>
                      {history.reason && (
                        <p className="text-xs text-gray-600 mt-1 italic">"{history.reason}"</p>
                      )}
                    </div>
                  ))}
                  {task.score_history.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">No score history</p>
                  )}
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">Task not found</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}