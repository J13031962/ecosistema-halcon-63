import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseVisibilityRefreshOptions {
  onRefresh?: () => Promise<void>;
  interval?: number;
}

export const useVisibilityRefresh = ({ onRefresh, interval = 30000 }: UseVisibilityRefreshOptions = {}) => {
  const lastRefreshRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const performRefresh = async () => {
    const now = Date.now();
    if (now - lastRefreshRef.current < interval) {
      return; // Throttle refreshes
    }

    try {
      // Refresh session to ensure it's valid
      await supabase.auth.getSession();
      
      // Call custom refresh function if provided
      if (onRefresh) {
        await onRefresh();
      }
      
      lastRefreshRef.current = now;
      console.log('🔄 Visibility refresh completed');
    } catch (error) {
      console.error('❌ Error during visibility refresh:', error);
    }
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        performRefresh();
      }
    };

    const handleFocus = () => {
      performRefresh();
    };

    // Set up periodic refresh for active tab
    const startPeriodicRefresh = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      
      intervalRef.current = setInterval(() => {
        if (!document.hidden) {
          performRefresh();
        }
      }, interval);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    startPeriodicRefresh();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [interval, onRefresh]);

  return { performRefresh };
};