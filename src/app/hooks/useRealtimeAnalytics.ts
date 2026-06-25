import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../services/supabase';

let globalChannel: any = null;
const listeners = new Set<() => void>();

// Unified channel setup
function setupGlobalRealtime() {
  if (globalChannel) return;
  
  globalChannel = supabase
    .channel('public:analytics_tables')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'members' }, () => notifyListeners())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => notifyListeners())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, () => notifyListeners())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, () => notifyListeners())
    .subscribe();
}

function notifyListeners() {
  listeners.forEach(fn => fn());
}

export function useRealtimeAnalytics<T>(fetcher: () => Promise<T>, initialData: T | null = null) {
  const [data, setData] = useState<T | null>(initialData);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Cache fetcher to avoid infinite loops from inline functions
  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  const loadData = useCallback(async (isBackground = false) => {
    if (!isBackground) setIsLoading(true);
    try {
      const result = await fetcherRef.current();
      setData(result);
      setError(null);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    setupGlobalRealtime();
    
    // Subscribe to global invalidate events
    const listener = () => loadData(true);
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  }, [loadData]);

  return { data, isLoading, error, refetch: () => loadData() };
}
