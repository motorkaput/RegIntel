import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface SessionActivity {
  id: string;
  sessionId: string;
  activityType: string;
  data: any;
  createdAt: string;
}

interface Session {
  id: string;
  userId: string;
  name: string;
  status: 'active' | 'ended';
  startedAt: string;
  endedAt: string | null;
  activities: SessionActivity[];
}

interface SessionContextType {
  activeSession: Session | null;
  lastCompletedSession: Session | null;
  isLoading: boolean;
  startSession: (name: string) => Promise<void>;
  endSession: () => Promise<Session | null>;
  addActivity: (activityType: string, data: any) => Promise<void>;
  hasActiveSession: boolean;
  clearLastCompletedSession: () => void;
}

const SessionContext = createContext<SessionContextType | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [lastCompletedSession, setLastCompletedSession] = useState<Session | null>(null);

  const { data, isLoading } = useQuery<{ session: Session | null }>({
    queryKey: ['/api/regtech/sessions/active'],
    refetchInterval: 30000,
  });

  const activeSession = data?.session || null;

  const startSessionMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await apiRequest('/api/regtech/sessions', 'POST', { name });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/regtech/sessions/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/regtech/sessions'] });
    },
  });

  const endSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await apiRequest(`/api/regtech/sessions/${sessionId}/end`, 'POST');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/regtech/sessions/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/regtech/sessions'] });
    },
  });

  const addActivityMutation = useMutation({
    mutationFn: async ({ activityType, data }: { activityType: string; data: any }) => {
      const response = await apiRequest('/api/regtech/sessions/activity', 'POST', { activityType, data });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/regtech/sessions/active'] });
    },
  });

  const startSession = useCallback(async (name: string) => {
    await startSessionMutation.mutateAsync(name);
    setLastCompletedSession(null);
  }, [startSessionMutation]);

  const endSession = useCallback(async () => {
    if (!activeSession) {
      console.warn('No active session to end');
      return null;
    }
    const sessionToComplete = { ...activeSession };
    await endSessionMutation.mutateAsync(activeSession.id);
    setLastCompletedSession({ ...sessionToComplete, status: 'ended', endedAt: new Date().toISOString() });
    return sessionToComplete;
  }, [endSessionMutation, activeSession]);

  const clearLastCompletedSession = useCallback(() => {
    setLastCompletedSession(null);
  }, []);

  const addActivity = useCallback(async (activityType: string, data: any) => {
    if (!activeSession) return;
    await addActivityMutation.mutateAsync({ activityType, data });
  }, [activeSession, addActivityMutation]);

  return (
    <SessionContext.Provider
      value={{
        activeSession,
        lastCompletedSession,
        isLoading,
        startSession,
        endSession,
        addActivity,
        hasActiveSession: !!activeSession,
        clearLastCompletedSession,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
