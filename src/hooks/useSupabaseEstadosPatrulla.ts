import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EstadoPatrulla {
  id: string;
  alarma_id: string;
  supervisor_id: string | null;
  supervisor_nombre: string | null;
  estado: 'pendiente' | 'iniciada' | 'finalizada' | 'cancelada';
  tiempo_inicio: string | null;
  tiempo_fin: string | null;
  duracion_segundos: number | null;
  created_at: string;
  updated_at: string;
}

interface CreateEstadoPatrullaData {
  alarma_id: string;
  supervisor_id?: string;
  supervisor_nombre?: string;
  estado?: 'pendiente' | 'iniciada' | 'finalizada' | 'cancelada';
}

interface UpdateEstadoPatrullaData {
  supervisor_id?: string;
  supervisor_nombre?: string;
  estado?: 'pendiente' | 'iniciada' | 'finalizada' | 'cancelada';
  tiempo_inicio?: string;
  tiempo_fin?: string;
}

export const useSupabaseEstadosPatrulla = () => {
  const [estados, setEstados] = useState<EstadoPatrulla[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchEstados = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('estados_patrulla')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEstados((data || []) as EstadoPatrulla[]);
    } catch (error: any) {
      console.error('Error fetching estados patrulla:', error);
      setError(error.message);
      toast({
        title: "Error",
        description: "No se pudieron cargar los estados de patrulla",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getEstadoByAlarmaId = (alarmaId: string): EstadoPatrulla | null => {
    return estados.find(estado => estado.alarma_id === alarmaId) || null;
  };

  const createEstado = async (estadoData: CreateEstadoPatrullaData) => {
    try {
      const { data, error } = await supabase
        .from('estados_patrulla')
        .insert([estadoData])
        .select()
        .single();

      if (error) throw error;

      setEstados(prev => [data as EstadoPatrulla, ...prev]);
      return { success: true, data };
    } catch (error: any) {
      console.error('Error creating estado patrulla:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el estado de patrulla",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    }
  };

  const updateEstado = async (alarmaId: string, updates: UpdateEstadoPatrullaData) => {
    try {
      const { data, error } = await supabase
        .from('estados_patrulla')
        .update(updates)
        .eq('alarma_id', alarmaId)
        .select()
        .single();

      if (error) throw error;

      // Actualizar estado local
      setEstados(prev => 
        prev.map(estado => 
          estado.alarma_id === alarmaId ? data as EstadoPatrulla : estado
        )
      );

      return { success: true, data };
    } catch (error: any) {
      console.error('Error updating estado patrulla:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de patrulla",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    }
  };

  const iniciarPatrulla = async (alarmaId: string, supervisorId: string, supervisorNombre: string) => {
    const now = new Date().toISOString();
    return updateEstado(alarmaId, {
      supervisor_id: supervisorId,
      supervisor_nombre: supervisorNombre,
      estado: 'iniciada',
      tiempo_inicio: now
    });
  };

  const finalizarPatrulla = async (alarmaId: string) => {
    const now = new Date().toISOString();
    return updateEstado(alarmaId, {
      estado: 'finalizada',
      tiempo_fin: now
    });
  };

  const cancelarPatrulla = async (alarmaId: string) => {
    const now = new Date().toISOString();
    return updateEstado(alarmaId, {
      estado: 'cancelada',
      tiempo_fin: now
    });
  };

  // Real-time subscription
  useEffect(() => {
    const subscription = supabase
      .channel('estados_patrulla_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'estados_patrulla'
        },
        (payload) => {
          console.log('Estados patrulla change received:', payload);
          
          if (payload.eventType === 'INSERT') {
            setEstados(prev => {
              const exists = prev.find(estado => estado.id === payload.new.id);
              if (!exists) {
                return [payload.new as EstadoPatrulla, ...prev];
              }
              return prev;
            });
          } else if (payload.eventType === 'UPDATE') {
            setEstados(prev => 
              prev.map(estado => 
                estado.id === payload.new.id ? payload.new as EstadoPatrulla : estado
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setEstados(prev => 
              prev.filter(estado => estado.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    fetchEstados();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  return {
    estados,
    loading,
    error,
    getEstadoByAlarmaId,
    createEstado,
    updateEstado,
    iniciarPatrulla,
    finalizarPatrulla,
    cancelarPatrulla,
    refetch: fetchEstados,
  };
};