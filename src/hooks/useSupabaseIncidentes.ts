import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Incidente {
  id: string;
  supervisor_id?: string;
  supervisor_nombre?: string;
  tipo_incidente: string;
  descripcion: string;
  ubicacion?: string;
  gravedad: string;
  estado: string;
  created_at: string;
  resolved_at?: string;
}

export const useSupabaseIncidentes = () => {
  const [incidentes, setIncidentes] = useState<Incidente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchIncidentes = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('incidentes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIncidentes(data || []);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error",
        description: "No se pudieron cargar los incidentes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addIncidente = async (incidenteData: {
    supervisor_id?: string;
    supervisor_nombre?: string;
    tipo_incidente: string;
    descripcion: string;
    ubicacion?: string;
    gravedad?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('incidentes')
        .insert([incidenteData])
        .select()
        .single();

      if (error) throw error;
      
      setIncidentes(prev => [data, ...prev]);
      toast({
        title: "Incidente registrado",
        description: "El incidente ha sido registrado exitosamente"
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

  const updateIncidente = async (id: string, updates: Partial<Incidente>) => {
    try {
      const { data, error } = await supabase
        .from('incidentes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setIncidentes(prev => prev.map(incidente => 
        incidente.id === id ? data : incidente
      ));
      toast({
        title: "Incidente actualizado",
        description: "El incidente ha sido actualizado"
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

  const resolveIncidente = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('incidentes')
        .update({ 
          estado: 'resuelto',
          resolved_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setIncidentes(prev => prev.map(incidente => 
        incidente.id === id ? data : incidente
      ));
      toast({
        title: "Incidente resuelto",
        description: "El incidente ha sido marcado como resuelto"
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
    fetchIncidentes();

    // Real-time subscription
    const channel = supabase
      .channel('incidentes-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'incidentes' },
        () => {
          fetchIncidentes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    incidentes,
    loading,
    error,
    addIncidente,
    updateIncidente,
    resolveIncidente,
    refetch: fetchIncidentes
  };
};