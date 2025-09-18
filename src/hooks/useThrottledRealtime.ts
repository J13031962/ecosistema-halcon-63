import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";

// Hook para manejar actualizaciones en tiempo real con throttling
export const useThrottledRealtime = (initialData: any[] = []) => {
  const [realtimeData, setRealtimeData] = useState(initialData);
  const updateQueueRef = useRef<any[]>([]);
  const isProcessingRef = useRef(false);

  // Process updates in batches to prevent excessive re-renders
  const processUpdates = useCallback(() => {
    if (isProcessingRef.current || updateQueueRef.current.length === 0) {
      return;
    }

    isProcessingRef.current = true;
    const updates = [...updateQueueRef.current];
    updateQueueRef.current = [];

    // Apply all updates at once
    setRealtimeData(prev => {
      let newData = [...prev];
      
      updates.forEach(payload => {
        if (payload.eventType === 'UPDATE') {
          newData = newData.map(item => 
            item.id === payload.new.id 
              ? { ...item, ...payload.new }
              : item
          );
        } else if (payload.eventType === 'INSERT') {
          // Avoid duplicates
          if (!newData.some(item => item.id === payload.new.id)) {
            newData = [payload.new as any, ...newData];
          }
        } else if (payload.eventType === 'DELETE') {
          newData = newData.filter(item => item.id !== payload.old.id);
        }
      });
      
      return newData;
    });

    // Reset processing flag after a delay
    setTimeout(() => {
      isProcessingRef.current = false;
      // Process any new updates that came in while we were processing
      if (updateQueueRef.current.length > 0) {
        processUpdates();
      }
    }, 50);
  }, []);

  // Queue update for processing
  const queueUpdate = useCallback((payload: any) => {
    updateQueueRef.current.push(payload);
    
    // Throttle processing to every 200ms
    if (!isProcessingRef.current) {
      setTimeout(processUpdates, 200);
    }
  }, [processUpdates]);

  // Update when initial data changes
  useEffect(() => {
    setRealtimeData(initialData);
  }, [initialData]);

  // Setup realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('alarmas_operador_realtime_optimized')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'alarmas'
        },
        queueUpdate
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queueUpdate]);

  return realtimeData;
};