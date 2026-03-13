import { useState } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Play, Square, Clock, Activity, FileDown, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

function formatDuration(startTime: string): string {
  const start = new Date(startTime);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  
  if (diffHours > 0) {
    return `${diffHours}h ${mins}m`;
  }
  return `${diffMins}m`;
}

function getDefaultSessionName(): string {
  const now = new Date();
  const date = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `Session - ${date} ${time}`;
}

export function SessionBar() {
  const { activeSession, lastCompletedSession, startSession, endSession, hasActiveSession, isLoading, clearLastCompletedSession } = useSession();
  const { toast } = useToast();
  const [sessionName, setSessionName] = useState('');
  const [startDialogOpen, setStartDialogOpen] = useState(false);
  const [endDialogOpen, setEndDialogOpen] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  // Use active session or last completed session for archive operations
  const sessionForArchive = activeSession || lastCompletedSession;

  const handleArchiveSession = async () => {
    if (!sessionForArchive) return;
    
    setIsArchiving(true);
    try {
      const response = await fetch(`/api/regtech/sessions/${sessionForArchive.id}/archive`, {
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
      link.setAttribute('download', `RegIntel_Session_${sessionForArchive.name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.docx`);
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

  const handleStartSession = async () => {
    const name = sessionName.trim() || getDefaultSessionName();
    setIsStarting(true);
    try {
      await startSession(name);
      setSessionName('');
      setStartDialogOpen(false);
      toast({
        title: 'Session Started',
        description: `Recording activities in "${name}"`,
      });
    } catch (error: any) {
      console.error('Failed to start session:', error);
      toast({
        title: 'Failed to start session',
        description: error?.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsStarting(false);
    }
  };

  const handleEndSession = async () => {
    setIsEnding(true);
    try {
      await endSession();
      setEndDialogOpen(false);
    } catch (error) {
      console.error('Failed to end session:', error);
    } finally {
      setIsEnding(false);
    }
  };

  if (isLoading) {
    return null;
  }

  return (
    <div className="bg-slate-800 text-white border-b border-slate-700">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-2 flex items-center justify-between">
        {hasActiveSession && activeSession ? (
          <>
            <div className="flex items-center gap-3">
              <Badge className="bg-green-600 hover:bg-green-600 text-white flex items-center gap-1.5">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                Recording
              </Badge>
              <span className="text-sm font-medium">{activeSession.name}</span>
              <div className="flex items-center gap-1.5 text-slate-300 text-xs">
                <Clock className="h-3 w-3" />
                <span>{formatDuration(activeSession.startedAt)}</span>
              </div>
              {activeSession.activities && activeSession.activities.length > 0 && (
                <div className="flex items-center gap-1.5 text-slate-300 text-xs">
                  <Activity className="h-3 w-3" />
                  <span>{activeSession.activities.length} activities</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Dialog open={endDialogOpen} onOpenChange={setEndDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:text-white hover:bg-slate-800 flex items-center gap-1.5"
                    data-testid="button-end-session"
                  >
                    <Square className="h-3.5 w-3.5 text-white" />
                    <span className="text-white">End Session</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>End Session</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to end the current session "{activeSession.name}"?
                      This will stop recording your activities.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setEndDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleEndSession} disabled={isEnding}>
                      {isEnding ? 'Ending...' : 'End Session'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Activity className="h-4 w-4" />
                <span>{lastCompletedSession ? `Completed: ${lastCompletedSession.name}` : 'No active session'}</span>
              </div>
              {lastCompletedSession && (
                <Badge className="bg-blue-600 hover:bg-blue-600 text-white text-xs">
                  Ready to export
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {lastCompletedSession && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:text-white hover:bg-slate-800 flex items-center gap-1.5"
                    onClick={handleArchiveSession}
                    disabled={isArchiving}
                    data-testid="button-archive-completed-session"
                  >
                    {isArchiving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                    ) : (
                      <FileDown className="h-3.5 w-3.5 text-white" />
                    )}
                    <span className="text-white">{isArchiving ? 'Archiving...' : 'Download'}</span>
                  </Button>
                </>
              )}
              <Dialog open={startDialogOpen} onOpenChange={setStartDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:text-white hover:bg-slate-800 flex items-center gap-1.5"
                    data-testid="button-start-session"
                    onClick={() => {
                      if (lastCompletedSession) {
                        clearLastCompletedSession();
                      }
                    }}
                  >
                    <Play className="h-3.5 w-3.5 text-white" />
                    <span className="text-white">Start New Session</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Start New Session</DialogTitle>
                    <DialogDescription>
                      Start recording your activities. All queries, document comparisons, and analyses will be tracked.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Session Name</label>
                      <Input
                        value={sessionName}
                        onChange={(e) => setSessionName(e.target.value)}
                        placeholder={getDefaultSessionName()}
                        data-testid="input-session-name"
                      />
                      <p className="text-xs text-slate-500">Leave blank for auto-generated name with timestamp</p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setStartDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleStartSession} disabled={isStarting}>
                      {isStarting ? 'Starting...' : 'Start Session'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
