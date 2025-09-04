import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ObservacionAlarma {
  id: string;
  alarma_id: string;
  supervisor_id: string;
  supervisor_nombre: string;
  observacion: string;
  created_at: string;
}

interface CreateObservacionData {
  alarma_id: string;
  supervisor_id: string;
  supervisor_nombre: string;
  observacion: string;
}

export const useSupabaseObservaciones = (alarmaId?: string) => {
  const [observaciones, setObservaciones] = useState<ObservacionAlarma[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchObservaciones = async (targetAlarmaId?: string) => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('observaciones_alarmas')
        .select('*')
        .order('created_at', { ascending: true });

      if (targetAlarmaId || alarmaId) {
        query = query.eq('alarma_id', targetAlarmaId || alarmaId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setObservaciones(data || []);
    } catch (error: any) {
      console.error('Error fetching observaciones:', error);
      setError(error.message);
      toast({
        title: "Error",
        description: "No se pudieron cargar las observaciones",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addObservacion = async (observacionData: CreateObservacionData) => {
    try {
      const { data, error } = await supabase
        .from('observaciones_alarmas')
        .insert([observacionData])
        .select()
        .single();

      if (error) throw error;

      // Actualizar lista local inmediatamente
      setObservaciones(prev => [...prev, data]);

      toast({
        title: "Observación agregada",
        description: "La observación se ha registrado exitosamente",
      });

      return { success: true, data };
    } catch (error: any) {
      console.error('Error adding observacion:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar la observación",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    }
  };

  // Real-time subscription para observaciones
  useEffect(() => {
    let subscription: any;

    const setupSubscription = () => {
      const baseChannel = supabase
        .channel('observaciones_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'observaciones_alarmas',
            ...(alarmaId && { filter: `alarma_id=eq.${alarmaId}` })
          },
          (payload) => {
            console.log('Observaciones change received:', payload);
            
            if (payload.eventType === 'INSERT') {
              setObservaciones(prev => {
                const exists = prev.find(obs => obs.id === payload.new.id);
                if (!exists) {
                  return [...prev, payload.new as ObservacionAlarma];
                }
                return prev;
              });
            } else if (payload.eventType === 'DELETE') {
              setObservaciones(prev => 
                prev.filter(obs => obs.id !== payload.old.id)
              );
            }
          }
        )
        .subscribe();

      subscription = baseChannel;
    };

    setupSubscription();
    fetchObservaciones();

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [alarmaId]);

  return {
    observaciones,
    loading,
    error,
    addObservacion,
    refetch: fetchObservaciones,
  };
};