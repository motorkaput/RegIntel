'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { User, Clock, Star, RotateCcw, CheckCircle, AlertCircle } from 'lucide-react';

interface TaskScore {
  task_id: string;
  self_score: number | null;
  self_rationale: string | null;
  self_scored_at: string | null;
  review_score: number | null;
  review_rationale: string | null;
  reviewed_at: string | null;
  override_score: number | null;
  override_rationale: string | null;
  overridden_at: string | null;
  final_score: number | null;
  updated_at: string;
}

interface TaskScoreIteration {
  id: string;
  type: 'self' | 'review' | 'override';
  from_value: number | null;
  to_value: number;
  reason: string | null;
  created_at: string;
  actor: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface TaskScorePanelProps {
  taskId: string;
  taskTitle: string;
  userRole: string;
  userId: string;
  isAssigned: boolean;
  canReview: boolean;
  canOverride: boolean;
  onScoreUpdate?: () => void;
}

export default function TaskScorePanel({
  taskId,
  taskTitle,
  userRole,
  userId,
  isAssigned,
  canReview,
  canOverride,
  onScoreUpdate
}: TaskScorePanelProps) {
  const [score, setScore] = useState<TaskScore | null>(null);
  const [iterations, setIterations] = useState<TaskScoreIteration[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form states
  const [selfScore, setSelfScore] = useState<string>('');
  const [selfRationale, setSelfRationale] = useState('');
  const [reviewScore, setReviewScore] = useState<string>('');
  const [reviewRationale, setReviewRationale] = useState('');
  const [overrideScore, setOverrideScore] = useState<string>('');
  const [overrideRationale, setOverrideRationale] = useState('');
  
  const { toast } = useToast();

  useEffect(() => {
    fetchTaskScore();
    fetchScoreHistory();
  }, [taskId]);

  const fetchTaskScore = async () => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/score`);
      if (response.ok) {
        const data = await response.json();
        setScore(data);
      }
    } catch (error) {
      console.error('Failed to fetch task score:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchScoreHistory = async () => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/score/history`);
      if (response.ok) {
        const data = await response.json();
        setIterations(data);
      }
    } catch (error) {
      console.error('Failed to fetch score history:', error);
    }
  };

  const submitSelfScore = async () => {
    if (!selfScore || !isAssigned) return;
    
    setSubmitting(true);
    try {
      const response = await fetch('/api/scoring/self', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: taskId,
          value: parseInt(selfScore),
          rationale: selfRationale.trim() || undefined
        })
      });

      if (response.ok) {
        toast({
          title: 'Self Score Submitted',
          description: 'Your self-assessment has been recorded.',
        });
        
        setSelfScore('');
        setSelfRationale('');
        await fetchTaskScore();
        await fetchScoreHistory();
        onScoreUpdate?.();
      } else {
        const error = await response.json();
        throw new Error(error.error);
      }
    } catch (error: any) {
      toast({
        title: 'Submission Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const submitReview = async () => {
    if (!reviewScore || !canReview) return;
    
    setSubmitting(true);
    try {
      const response = await fetch('/api/scoring/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: taskId,
          value: parseInt(reviewScore),
          rationale: reviewRationale.trim() || undefined
        })
      });

      if (response.ok) {
        toast({
          title: 'Review Submitted',
          description: 'Your review score has been recorded.',
        });
        
        setReviewScore('');
        setReviewRationale('');
        await fetchTaskScore();
        await fetchScoreHistory();
        onScoreUpdate?.();
      } else {
        const error = await response.json();
        throw new Error(error.error);
      }
    } catch (error: any) {
      toast({
        title: 'Review Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const submitOverride = async () => {
    if (!overrideScore || !overrideRationale.trim() || !canOverride) return;
    
    setSubmitting(true);
    try {
      const response = await fetch('/api/scoring/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: taskId,
          value: parseInt(overrideScore),
          rationale: overrideRationale.trim()
        })
      });

      if (response.ok) {
        toast({
          title: 'Override Applied',
          description: 'Score override has been applied with your rationale.',
        });
        
        setOverrideScore('');
        setOverrideRationale('');
        await fetchTaskScore();
        await fetchScoreHistory();
        onScoreUpdate?.();
      } else {
        const error = await response.json();
        throw new Error(error.error);
      }
    } catch (error: any) {
      toast({
        title: 'Override Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getScoreColor = (value: number) => {
    const colors = {
      1: 'text-red-600',
      2: 'text-orange-600',
      3: 'text-yellow-600',
      4: 'text-blue-600',
      5: 'text-green-600'
    };
    return colors[value as keyof typeof colors] || 'text-gray-600';
  };

  const getScoreLabel = (value: number) => {
    const labels = {
      1: 'Not Done',
      2: 'Partial',
      3: 'As Required',
      4: 'Exceeded',
      5: 'Company Benchmark'
    };
    return labels[value as keyof typeof labels] || 'Unknown';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span>Loading task scores...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Scores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Star className="h-5 w-5" />
            <span>Task Score: {taskTitle}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">Self Score</div>
              {score?.self_score ? (
                <div>
                  <div className={`text-2xl font-bold ${getScoreColor(score.self_score)}`}>
                    {score.self_score}
                  </div>
                  <div className="text-xs text-gray-500">
                    {getScoreLabel(score.self_score)}
                  </div>
                </div>
              ) : (
                <div className="text-gray-400">Not scored</div>
              )}
            </div>

            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">Review Score</div>
              {score?.review_score ? (
                <div>
                  <div className={`text-2xl font-bold ${getScoreColor(score.review_score)}`}>
                    {score.review_score}
                  </div>
                  <div className="text-xs text-gray-500">
                    {getScoreLabel(score.review_score)}
                  </div>
                </div>
              ) : (
                <div className="text-gray-400">Not reviewed</div>
              )}
            </div>

            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">Override</div>
              {score?.override_score ? (
                <div>
                  <div className={`text-2xl font-bold ${getScoreColor(score.override_score)}`}>
                    {score.override_score}
                  </div>
                  <div className="text-xs text-gray-500">
                    {getScoreLabel(score.override_score)}
                  </div>
                </div>
              ) : (
                <div className="text-gray-400">No override</div>
              )}
            </div>

            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">Final Score</div>
              {score?.final_score ? (
                <div>
                  <div className={`text-3xl font-bold ${getScoreColor(score.final_score)}`}>
                    {score.final_score}
                  </div>
                  <div className="text-xs text-gray-500">
                    {getScoreLabel(score.final_score)}
                  </div>
                </div>
              ) : (
                <div className="text-gray-400">No score</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Score Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Self Score */}
        {isAssigned && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Self Assessment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Your Score (1-5)</label>
                <Select value={selfScore} onValueChange={setSelfScore}>
                  <SelectTrigger data-testid="select-self-score">
                    <SelectValue placeholder="Select score" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Not Done</SelectItem>
                    <SelectItem value="2">2 - Partial</SelectItem>
                    <SelectItem value="3">3 - As Required</SelectItem>
                    <SelectItem value="4">4 - Exceeded</SelectItem>
                    <SelectItem value="5">5 - Company Benchmark</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Rationale (Optional)</label>
                <Textarea
                  placeholder="Explain your self-assessment..."
                  value={selfRationale}
                  onChange={(e) => setSelfRationale(e.target.value)}
                  className="min-h-[80px]"
                  data-testid="textarea-self-rationale"
                />
              </div>
              
              <Button
                onClick={submitSelfScore}
                disabled={!selfScore || submitting}
                className="w-full"
                data-testid="button-submit-self-score"
              >
                Submit Self Score
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Review Score */}
        {canReview && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Lead Review</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Review Score (1-5)</label>
                <Select value={reviewScore} onValueChange={setReviewScore}>
                  <SelectTrigger data-testid="select-review-score">
                    <SelectValue placeholder="Select score" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Not Done</SelectItem>
                    <SelectItem value="2">2 - Partial</SelectItem>
                    <SelectItem value="3">3 - As Required</SelectItem>
                    <SelectItem value="4">4 - Exceeded</SelectItem>
                    <SelectItem value="5">5 - Company Benchmark</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Review Comments (Optional)</label>
                <Textarea
                  placeholder="Provide feedback on the work..."
                  value={reviewRationale}
                  onChange={(e) => setReviewRationale(e.target.value)}
                  className="min-h-[80px]"
                  data-testid="textarea-review-rationale"
                />
              </div>
              
              <Button
                onClick={submitReview}
                disabled={!reviewScore || submitting}
                className="w-full"
                data-testid="button-submit-review"
              >
                Submit Review
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Override Score */}
        {canOverride && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <span>Score Override</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Override Score (1-5)</label>
                <Select value={overrideScore} onValueChange={setOverrideScore}>
                  <SelectTrigger data-testid="select-override-score">
                    <SelectValue placeholder="Select score" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Not Done</SelectItem>
                    <SelectItem value="2">2 - Partial</SelectItem>
                    <SelectItem value="3">3 - As Required</SelectItem>
                    <SelectItem value="4">4 - Exceeded</SelectItem>
                    <SelectItem value="5">5 - Company Benchmark</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Rationale (Required)</label>
                <Textarea
                  placeholder="Explain why you're overriding the score..."
                  value={overrideRationale}
                  onChange={(e) => setOverrideRationale(e.target.value)}
                  className="min-h-[80px]"
                  data-testid="textarea-override-rationale"
                />
              </div>
              
              <Button
                onClick={submitOverride}
                disabled={!overrideScore || !overrideRationale.trim() || submitting}
                className="w-full bg-orange-600 hover:bg-orange-700"
                data-testid="button-submit-override"
              >
                Apply Override
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Score History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <RotateCcw className="h-5 w-5" />
            <span>Score History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {iterations.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No score history available</p>
          ) : (
            <div className="space-y-4">
              {iterations.map((iteration, index) => (
                <div key={iteration.id} className="border-l-4 border-blue-200 pl-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="capitalize">
                        {iteration.type}
                      </Badge>
                      <span className="font-medium">
                        {iteration.actor.first_name} {iteration.actor.last_name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Clock className="h-4 w-4" />
                      <span>{new Date(iteration.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 mb-2">
                    {iteration.from_value !== null ? (
                      <span className={getScoreColor(iteration.from_value)}>
                        {iteration.from_value}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                    <span>→</span>
                    <span className={getScoreColor(iteration.to_value)}>
                      {iteration.to_value}
                    </span>
                  </div>
                  
                  {iteration.reason && (
                    <p className="text-sm text-gray-600 italic">"{iteration.reason}"</p>
                  )}
                  
                  {index < iterations.length - 1 && (
                    <Separator className="mt-4" />
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}