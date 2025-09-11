import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MinutaOperacion {
  id: string;
  usuario_id: string;
  usuario_nombre: string;
  created_at: string;
  tipo_entrada: 'general' | 'cambio_turno' | 'consigna' | 'incidente' | 'mantenimiento';
  contenido: string;
  turno?: string;
  prioridad: 'normal' | 'alta' | 'critica';
}

interface CreateMinutaData {
  tipo_entrada: 'general' | 'cambio_turno' | 'consigna' | 'incidente' | 'mantenimiento';
  contenido: string;
  turno?: string;
  prioridad?: 'normal' | 'alta' | 'critica';
}

export const useSupabaseMinutaOperaciones = () => {
  const [entradas, setEntradas] = useState<MinutaOperacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchEntradas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('minuta_operaciones')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setEntradas((data || []) as MinutaOperacion[]);
    } catch (error) {
      console.error('Error fetching minuta entries:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const addEntrada = async (entradaData: CreateMinutaData) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('Usuario no autenticado');
      }

      const { data, error } = await supabase
        .from('minuta_operaciones')
        .insert([{
          usuario_id: userData.user.id,
          usuario_nombre: userData.user.email || 'Usuario',
          tipo_entrada: entradaData.tipo_entrada,
          contenido: entradaData.contenido,
          turno: entradaData.turno,
          prioridad: entradaData.prioridad || 'normal'
        }])
        .select()
        .single();

      if (error) throw error;

      // Agregar al principio de la lista local
      setEntradas(prev => [data as MinutaOperacion, ...prev]);

      toast({
        title: "Entrada registrada",
        description: "La entrada ha sido agregada a la minuta exitosamente",
      });

      return data;
    } catch (error) {
      console.error('Error adding minuta entry:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar la entrada a la minuta",
        variant: "destructive"
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchEntradas();

    // Configurar suscripción en tiempo real
    const channel = supabase
      .channel('minuta_operaciones_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'minuta_operaciones'
        },
        (payload) => {
          console.log('🔄 Actualización en tiempo real de minuta:', payload);
          
          if (payload.eventType === 'INSERT') {
            setEntradas(prev => [payload.new as MinutaOperacion, ...prev.slice(0, 49)]);
          } else if (payload.eventType === 'UPDATE') {
            setEntradas(prev => 
              prev.map(entrada => 
                entrada.id === payload.new.id 
                  ? { ...entrada, ...payload.new } as MinutaOperacion
                  : entrada
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setEntradas(prev => 
              prev.filter(entrada => entrada.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    entradas,
    loading,
    error,
    addEntrada,
    refetch: fetchEntradas
  };
};