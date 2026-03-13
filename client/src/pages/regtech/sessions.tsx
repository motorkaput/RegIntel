import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import RegTechLayout from "./layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileDown, Clock, Activity, Calendar, Trash2, History } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { PageLoadingSkeleton, EmptyState, ErrorState } from "@/components/ui/loading-skeleton";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface SessionActivity {
  id: string;
  sessionId: string;
  activityType: string;
  data: any;
  createdAt: string;
}

interface Session {
  id: string;
  name: string;
  status: 'active' | 'completed';
  startedAt: string;
  endedAt: string | null;
  activities: SessionActivity[];
}

function formatDateTime(date: string) {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

function formatDuration(startedAt: string, endedAt: string | null) {
  const start = new Date(startedAt);
  const end = endedAt ? new Date(endedAt) : new Date();
  const diffMs = end.getTime() - start.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  
  if (diffHours > 0) {
    return `${diffHours}h ${mins}m`;
  }
  return `${diffMins}m`;
}

function SessionCard({ session }: { session: Session }) {
  const { toast } = useToast();
  const [isArchiving, setIsArchiving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await apiRequest(`/api/regtech/sessions/${session.id}`, 'DELETE');
      
      if (!response.ok) {
        throw new Error('Failed to delete session');
      }
      
      toast({
        title: 'Session Deleted',
        description: 'The session has been permanently deleted.',
      });
      
      // Refresh the sessions list
      queryClient.invalidateQueries({ queryKey: ['/api/regtech/sessions'] });
    } catch (error) {
      console.error('Failed to delete session:', error);
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete the session. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleArchive = async () => {
    setIsArchiving(true);
    try {
      const response = await fetch(`/api/regtech/sessions/${session.id}/archive`, {
        method: 'POST',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to archive session');
      }
      
      const blob = await response.blob();
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `RegIntel_Session_${session.name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.docx`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Session Archived',
        description: 'Your session has been downloaded as a Word document.',
      });
    } catch (error) {
      console.error('Failed to archive session:', error);
      toast({
        title: 'Archive Failed',
        description: 'Failed to archive the session. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <Card className="bg-slate-900 border-slate-800 rounded-2xl transition-colors hover:border-slate-700">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-white">{session.name}</CardTitle>
          <Badge variant={session.status === 'active' ? 'default' : 'secondary'} className="rounded-xl">
            {session.status === 'active' ? 'Active' : 'Completed'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <Calendar className="h-4 w-4" />
            <span>{formatDateTime(session.startedAt)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <Clock className="h-4 w-4" />
            <span>{formatDuration(session.startedAt, session.endedAt)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <Activity className="h-4 w-4" />
            <span>{session.activities?.length || 0} activities</span>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleArchive}
              disabled={isArchiving}
              className="bg-slate-700 text-white border-slate-600 hover:bg-slate-600 hover:text-white rounded-xl transition-colors"
            >
              {isArchiving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4 mr-2" />
              )}
              {isArchiving ? 'Archiving...' : 'Download Word'}
            </Button>
          </div>
        </div>

        {session.activities && session.activities.length > 0 && (
          <div className="border-t border-slate-800 pt-3 mt-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium mb-2">Activity Summary</p>
                <div className="flex flex-wrap gap-2">
                  {['query', 'console', 'diff'].map(type => {
                    const count = session.activities.filter(a => a.activityType === type).length;
                    if (count === 0) return null;
                    const colorClass = type === 'query' ? 'text-blue-400 border-blue-600' :
                      type === 'console' ? 'text-green-400 border-green-600' :
                      'text-orange-400 border-orange-600';
                    return (
                      <Badge key={type} variant="outline" className={`${colorClass} rounded-xl`}>
                        {type}: {count}
                      </Badge>
                    );
                  })}
                </div>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={isDeleting}
                    className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Session</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{session.name}"? This will permanently remove the session and all its activities. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function SessionsPage() {
  const { data, isLoading, isError, refetch } = useQuery<{ sessions: Session[] }>({
    queryKey: ['/api/regtech/sessions'],
  });

  const sessions = data?.sessions || data || [];
  const sessionList = Array.isArray(sessions) ? sessions : [];

  return (
    <RegTechLayout>
      <div className="page-enter space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Session History</h1>
          <p className="text-slate-600">
            View and download your past analysis sessions as Word documents.
          </p>
        </div>

        {isLoading ? (
          <PageLoadingSkeleton />
        ) : isError ? (
          <ErrorState
            title="Failed to load sessions"
            description="We couldn't load your session history. Please try again."
            onRetry={() => refetch()}
          />
        ) : sessionList.length === 0 ? (
          <EmptyState
            icon={History}
            title="No sessions yet"
            description="Start a new session from the session bar above to begin tracking your research activities."
          />
        ) : (
          <div className="space-y-4">
            {sessionList
              .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
              .map(session => (
                <SessionCard key={session.id} session={session} />
              ))}
          </div>
        )}
      </div>
    </RegTechLayout>
  );
}
