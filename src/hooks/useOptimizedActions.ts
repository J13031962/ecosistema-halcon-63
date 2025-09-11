import { useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseOptimizedActionsProps {
  onAction?: (id: string) => Promise<void>;
  actionName?: string;
  successMessage?: string;
  errorMessage?: string;
}

export const useOptimizedActions = ({
  onAction,
  actionName = 'acción',
  successMessage = 'Acción completada exitosamente',
  errorMessage = 'Error al ejecutar la acción'
}: UseOptimizedActionsProps = {}) => {
  const { toast } = useToast();
  const pendingActions = useRef<Set<string>>(new Set());
  const abortControllers = useRef<Map<string, AbortController>>(new Map());

  const executeAction = useCallback(async (id: string) => {
    // Prevent duplicate actions
    if (pendingActions.current.has(id)) {
      console.log(`${actionName} already in progress for ${id}`);
      return;
    }

    // Cancel any previous request for this ID
    const existingController = abortControllers.current.get(id);
    if (existingController) {
      existingController.abort();
    }

    // Create new abort controller
    const abortController = new AbortController();
    abortControllers.current.set(id, abortController);
    pendingActions.current.add(id);

    try {
      if (onAction) {
        await onAction(id);
        
        if (!abortController.signal.aborted) {
          toast({
            title: "Éxito",
            description: successMessage,
          });
        }
      }
    } catch (error: any) {
      if (!abortController.signal.aborted) {
        console.error(`Error en ${actionName}:`, error);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive"
        });
      }
    } finally {
      pendingActions.current.delete(id);
      abortControllers.current.delete(id);
    }
  }, [onAction, actionName, successMessage, errorMessage, toast]);

  const throttledAction = useCallback((id: string) => {
    // Simple throttling - prevent multiple calls within 1 second
    const throttleKey = `throttle_${id}`;
    const now = Date.now();
    const lastCall = (executeAction as any)[throttleKey] || 0;
    
    if (now - lastCall < 1000) {
      console.log(`${actionName} throttled for ${id}`);
      return;
    }
    
    (executeAction as any)[throttleKey] = now;
    executeAction(id);
  }, [executeAction, actionName]);

  const isPending = useCallback((id: string) => {
    return pendingActions.current.has(id);
  }, []);

  const cancelAction = useCallback((id: string) => {
    const controller = abortControllers.current.get(id);
    if (controller) {
      controller.abort();
      pendingActions.current.delete(id);
      abortControllers.current.delete(id);
    }
  }, []);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    abortControllers.current.forEach(controller => controller.abort());
    abortControllers.current.clear();
    pendingActions.current.clear();
  }, []);

  return {
    executeAction: throttledAction,
    isPending,
    cancelAction,
    cleanup
  };
};