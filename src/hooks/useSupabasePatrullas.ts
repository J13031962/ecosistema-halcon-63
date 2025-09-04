import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Patrulla {
  id: string;
  numero_patrulla: string;
  supervisor_id?: string;
  supervisor_nombre?: string;
  estado: string;
  ubicacion?: string;
  created_at: string;
  updated_at: string;
}

export const useSupabasePatrullas = () => {
  const [patrullas, setPatrullas] = useState<Patrulla[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchPatrullas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('patrullas')
        .select('*')
        .order('numero_patrulla', { ascending: true });

      if (error) throw error;
      setPatrullas(data || []);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error",
        description: "No se pudieron cargar las patrullas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addPatrulla = async (patrullaData: {
    numero_patrulla: string;
    supervisor_id?: string;
    supervisor_nombre?: string;
    estado?: string;
    ubicacion?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('patrullas')
        .insert([{
          ...patrullaData,
          estado: patrullaData.estado || 'disponible'
        }])
        .select()
        .single();

      if (error) throw error;
      
      setPatrullas(prev => [...prev, data]);
      toast({
        title: "Patrulla creada",
        description: `Patrulla ${patrullaData.numero_patrulla} creada exitosamente`
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

  const updatePatrulla = async (id: string, updates: Partial<Patrulla>) => {
    try {
      const { data, error } = await supabase
        .from('patrullas')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setPatrullas(prev => prev.map(patrulla => 
        patrulla.id === id ? data : patrulla
      ));
      toast({
        title: "Patrulla actualizada",
        description: "Los datos de la patrulla han sido actualizados"
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

  const deletePatrulla = async (id: string) => {
    try {
      const { error } = await supabase
        .from('patrullas')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setPatrullas(prev => prev.filter(patrulla => patrulla.id !== id));
      toast({
        title: "Patrulla eliminada",
        description: "La patrulla ha sido eliminada del sistema"
      });
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
    fetchPatrullas();
    
    // Suscribirse a cambios en tiempo real
    const subscription = supabase
      .channel('patrullas-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'patrullas' },
        () => {
          fetchPatrullas();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    patrullas,
    loading,
    error,
    addPatrulla,
    updatePatrulla,
    deletePatrulla,
    refetch: fetchPatrullas
  };
};