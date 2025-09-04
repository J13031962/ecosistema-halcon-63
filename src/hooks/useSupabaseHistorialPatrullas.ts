import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface HistorialPatrulla {
  id: string;
  patrulla_numero: string;
  supervisor_nombre?: string;
  actividad: string;
  ubicacion?: string;
  fecha_inicio: string;
  fecha_fin?: string;
  duracion_minutos?: number;
  created_at: string;
}

export const useSupabaseHistorialPatrullas = (tipo: 'operador' | 'despachador') => {
  const [historial, setHistorial] = useState<HistorialPatrulla[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const tableName = tipo === 'operador' ? 'historial_patrullas_operador' : 'historial_patrullas_despachador';

  const fetchHistorial = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistorial(data || []);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error",
        description: "No se pudo cargar el historial",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addHistorial = async (historialData: {
    patrulla_numero: string;
    supervisor_nombre?: string;
    actividad: string;
    ubicacion?: string;
    fecha_inicio?: string;
    fecha_fin?: string;
    duracion_minutos?: number;
  }) => {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .insert([historialData])
        .select()
        .single();

      if (error) throw error;
      
      setHistorial(prev => [data, ...prev]);
      toast({
        title: "Registro agregado",
        description: "El registro ha sido agregado al historial"
      });
      return data;
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchHistorial();

    // Real-time subscription
    const channel = supabase
      .channel(`${tableName}-changes`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: tableName },
        () => {
          fetchHistorial();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    historial,
    loading,
    error,
    addHistorial,
    refetch: fetchHistorial
  };
};