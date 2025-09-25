import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SupervisorObservacion {
  id: string;
  alarma_id: string;
  supervisor_id: string;
  supervisor_nombre: string;
  observacion_texto?: string;
  foto_url?: string;
  tipo_observacion: 'texto' | 'foto' | 'mixta';
  created_at: string;
  updated_at: string;
}

interface CreateObservacionData {
  alarma_id: string;
  supervisor_id: string;
  supervisor_nombre: string;
  observacion_texto?: string;
  foto_url?: string;
  tipo_observacion: 'texto' | 'foto' | 'mixta';
}

export const useSupabaseObservacionesSupervisor = (alarmaId?: string) => {
  const [observaciones, setObservaciones] = useState<SupervisorObservacion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchObservaciones = async () => {
    if (!alarmaId) return;
    
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('supervisor_observaciones_alarma')
        .select('*')
        .eq('alarma_id', alarmaId)
        .order('created_at', { ascending: true });

      const { data, error } = await query;

      if (error) throw error;

      setObservaciones((data || []) as SupervisorObservacion[]);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching observaciones:', err);
    } finally {
      setLoading(false);
    }
  };

  const agregarObservacion = async (observacionData: CreateObservacionData) => {
    try {
      setError(null);

      const { data, error } = await supabase
        .from('supervisor_observaciones_alarma')
        .insert([observacionData])
        .select()
        .single();

      if (error) throw error;

      setObservaciones(prev => [...prev, data as SupervisorObservacion]);
      
      toast({
        title: "Observación agregada",
        description: "La observación ha sido guardada exitosamente",
      });

      return data;
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error",
        description: err.message || "No se pudo agregar la observación",
        variant: "destructive"
      });
      throw err;
    }
  };

  const subirFoto = async (file: File, supervisorId: string): Promise<string> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${supervisorId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('supervisor-observaciones')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('supervisor-observaciones')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (err: any) {
      toast({
        title: "Error subiendo foto",
        description: err.message || "No se pudo subir la foto",
        variant: "destructive"
      });
      throw err;
    }
  };

  const eliminarObservacion = async (observacionId: string) => {
    try {
      setError(null);

      const { error } = await supabase
        .from('supervisor_observaciones_alarma')
        .delete()
        .eq('id', observacionId);

      if (error) throw error;

      setObservaciones(prev => prev.filter(obs => obs.id !== observacionId));
      
      toast({
        title: "Observación eliminada",
        description: "La observación ha sido eliminada exitosamente",
      });
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error",
        description: err.message || "No se pudo eliminar la observación",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (alarmaId) {
      fetchObservaciones();

      // Set up real-time subscription
      const channel = supabase
        .channel('supervisor_observaciones_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'supervisor_observaciones_alarma',
            filter: `alarma_id=eq.${alarmaId}`,
          },
          () => {
            fetchObservaciones();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [alarmaId]);

  const refetch = () => {
    if (alarmaId) {
      fetchObservaciones();
    }
  };

  return {
    observaciones,
    loading,
    error,
    agregarObservacion,
    subirFoto,
    eliminarObservacion,
    refetch
  };
};