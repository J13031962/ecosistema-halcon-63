import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SupervisorActividad {
  id: string;
  supervisor_id?: string;
  supervisor_nombre?: string;
  tipo_actividad: string;
  descripcion?: string;
  ubicacion?: string;
  created_at: string;
}

export const useSupabaseActividades = () => {
  const [actividades, setActividades] = useState<SupervisorActividad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchActividades = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('supervisor_actividades')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setActividades(data || []);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error",
        description: "No se pudieron cargar las actividades",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addActividad = async (actividadData: {
    supervisor_id?: string;
    supervisor_nombre?: string;
    tipo_actividad: string;
    descripcion?: string;
    ubicacion?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('supervisor_actividades')
        .insert([actividadData])
        .select()
        .single();

      if (error) throw error;
      
      setActividades(prev => [data, ...prev]);
      toast({
        title: "Actividad registrada",
        description: "La actividad ha sido registrada exitosamente"
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
    fetchActividades();

    // Real-time subscription
    const channel = supabase
      .channel('actividades-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'supervisor_actividades' },
        () => {
          fetchActividades();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    actividades,
    loading,
    error,
    addActividad,
    refetch: fetchActividades
  };
};