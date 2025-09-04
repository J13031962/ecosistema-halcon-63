import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuthConsolidatedContext } from '@/contexts/AuthContextConsolidated';

export interface Alarma {
  id: string;
  cliente_id: string;
  tipo: string;
  estado: string;
  prioridad: string;
  descripcion?: string;
  direccion?: string;
  municipio?: string;
  operador_id?: string;
  patrulla_asignada?: string;
  supervisor?: string;
  tiempo_respuesta_segundos?: number;
  created_at: string;
  attended_at?: string;
  resolved_at?: string;
  clientes?: {
    nombre: string;
    direccion: string;
    municipio: string;
  };
}

export const useSupabaseAlarmas = () => {
  const [alarmas, setAlarmas] = useState<Alarma[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuthConsolidatedContext();

  const fetchAlarmas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('alarmas')
        .select(`
          *,
          clientes (
            nombre,
            direccion,
            municipio
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAlarmas(data || []);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error",
        description: "No se pudieron cargar las alarmas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addAlarma = async (alarmaData: {
    cliente_id: string;
    tipo: string;
    prioridad?: string;
    descripcion?: string;
    direccion?: string;
    municipio?: string;
  }) => {
    try {
      console.log('🔄 Iniciando inserción de alarma:', alarmaData);
      
      const alarmaToInsert: any = {
        ...alarmaData,
        estado: 'activa',
        prioridad: alarmaData.prioridad || 'media'
      };
      
      // Agregar datos del operador si está disponible
      if (user?.id) {
        alarmaToInsert.operador_id = user.id;
        if (user.full_name) {
          alarmaToInsert.operador_nombre = user.full_name;
        } else if (user.email) {
          alarmaToInsert.operador_nombre = user.email.split('@')[0];
        }
      }
      
      console.log('📝 Datos a insertar:', alarmaToInsert);
      
      const { data, error } = await supabase
        .from('alarmas')
        .insert([alarmaToInsert])
        .select(`
          *,
          clientes (
            nombre,
            direccion,
            municipio
          )
        `)
        .single();

      if (error) {
        console.error('❌ Error de Supabase:', error);
        console.error('❌ Código de error:', error.code);
        console.error('❌ Mensaje:', error.message);
        console.error('❌ Detalles:', error.details);
        console.error('❌ Hint:', error.hint);
        throw new Error(`Error de base de datos: ${error.message} (${error.code})`);
      }
      
      console.log('✅ Alarma creada exitosamente:', data);
      
      setAlarmas(prev => [data, ...prev]);
      toast({
        title: "Alarma generada",
        description: `Alarma de tipo "${alarmaData.tipo}" creada exitosamente`
      });
      return data;
    } catch (err: any) {
      console.error('❌ Error completo:', err);
      const errorMessage = err.message || 'Error desconocido al generar la alarma';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      throw err;
    }
  };

  const attendAlarma = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('alarmas')
        .update({ 
          estado: 'en_proceso',
          attended_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          clientes (
            nombre,
            direccion,
            municipio
          )
        `)
        .single();

      if (error) throw error;
      
      setAlarmas(prev => prev.map(alarma => 
        alarma.id === id ? data : alarma
      ));
      toast({
        title: "Alarma atendida",
        description: "La alarma ha sido marcada como en proceso"
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

  const assignPatrulla = async (id: string, patrullaData: {
    patrulla_asignada: string;
    supervisor?: string;
    supervisor_id?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('alarmas')
        .update({ 
          ...patrullaData,
          estado: 'asignada'
        })
        .eq('id', id)
        .select(`
          *,
          clientes (
            nombre,
            direccion,
            municipio
          )
        `)
        .single();

      if (error) throw error;
      
      setAlarmas(prev => prev.map(alarma => 
        alarma.id === id ? data : alarma
      ));
      toast({
        title: "Patrulla asignada",
        description: `Patrulla ${patrullaData.patrulla_asignada} asignada a la alarma`
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

  const resolveAlarma = async (id: string, tiempoRespuesta?: number) => {
    try {
      const { data, error } = await supabase
        .from('alarmas')
        .update({ 
          estado: 'resuelta',
          resolved_at: new Date().toISOString(),
          tiempo_respuesta_segundos: tiempoRespuesta
        })
        .eq('id', id)
        .select(`
          *,
          clientes (
            nombre,
            direccion,
            municipio
          )
        `)
        .single();

      if (error) throw error;
      
      setAlarmas(prev => prev.map(alarma => 
        alarma.id === id ? data : alarma
      ));
      toast({
        title: "Alarma resuelta",
        description: "La alarma ha sido marcada como resuelta"
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

  const cancelAlarma = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('alarmas')
        .update({ 
          estado: 'cancelada'
        })
        .eq('id', id)
        .select(`
          *,
          clientes (
            nombre,
            direccion,
            municipio
          )
        `)
        .single();

      if (error) throw error;
      
      setAlarmas(prev => prev.map(alarma => 
        alarma.id === id ? data : alarma
      ));
      toast({
        title: "Alarma cancelada",
        description: "La alarma ha sido cancelada exitosamente"
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
    fetchAlarmas();
    
    // Suscribirse a cambios en tiempo real
    const subscription = supabase
      .channel('alarmas-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'alarmas' },
        () => {
          fetchAlarmas();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    alarmas,
    loading,
    error,
    addAlarma,
    attendAlarma,
    assignPatrulla,
    resolveAlarma,
    cancelAlarma,
    refetch: fetchAlarmas
  };
};