import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AlarmaEnhanced {
  id: string;
  cliente_id: string | null;
  operador_id: string | null;
  operador_nombre: string | null;
  despachador_id: string | null;
  despachador_nombre: string | null;
  supervisor_id: string | null;
  tipo: string;
  descripcion: string | null;
  direccion: string | null;
  municipio: string | null;
  prioridad: string;
  estado: string;
  patrulla_asignada: string | null;
  supervisor: string | null;
  numero_zona: string | null;
  nombre_zona: string | null;
  tipo_sensor: string | null;
  tiempo_atencion: string | null;
  tiempo_asignacion: string | null;
  tiempo_toma_despachador: string | null;
  tiempo_asignacion_supervisor: string | null;
  tiempo_aceptacion_supervisor: string | null;
  tiempo_primera_lectura_qr: string | null;
  tiempo_segunda_lectura_qr: string | null;
  tiempo_llegada_sitio: string | null;
  tiempo_salida_sitio: string | null;
  attended_at: string | null;
  resolved_at: string | null;
  tiempo_respuesta_segundos: number | null;
  observaciones_count: number;
  created_at: string;
  // Relaciones
  clientes?: {
    nombre: string;
    telefono: string | null;
  } | null;
}

interface CreateAlarmaData {
  cliente_id?: string;
  operador_id: string;
  operador_nombre: string;
  tipo: string;
  descripcion?: string;
  direccion?: string;
  municipio?: string;
  prioridad?: string;
  numero_zona?: string;
  nombre_zona?: string;
  tipo_sensor?: string;
}

interface AsignacionPatrullaData {
  patrulla_asignada: string;
  supervisor: string;
  supervisor_id?: string | null;
  despachador_id: string | null;
  despachador_nombre: string | null;
}

export const useSupabaseAlarmasEnhanced = () => {
  const [alarmas, setAlarmas] = useState<AlarmaEnhanced[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchAlarmas = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('alarmas')
        .select(`
          *,
          clientes (
            nombre,
            telefono
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAlarmas(data || []);
    } catch (error: any) {
      console.error('Error fetching alarmas:', error);
      setError(error.message);
      toast({
        title: "Error",
        description: "No se pudieron cargar las alarmas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createAlarma = async (alarmaData: CreateAlarmaData) => {
    try {
      const { data, error } = await supabase
        .from('alarmas')
        .insert([{
          ...alarmaData,
          estado: 'activa',
          prioridad: alarmaData.prioridad || 'media'
        }])
        .select(`
          *,
          clientes (
            nombre,
            telefono
          )
        `)
        .single();

      if (error) throw error;

      // Crear estado de patrulla inicial
      await supabase
        .from('estados_patrulla')
        .insert([{
          alarma_id: data.id,
          estado: 'pendiente'
        }]);

      setAlarmas(prev => [data, ...prev]);

      toast({
        title: "Alarma creada",
        description: "La alarma se ha registrado exitosamente",
      });

      return { success: true, data };
    } catch (error: any) {
      console.error('Error creating alarma:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la alarma",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    }
  };

  const atenderAlarma = async (alarmaId: string, despachadorId: string, despachadorNombre: string) => {
    try {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('alarmas')
        .update({
          estado: 'en_proceso',
          despachador_id: despachadorId,
          despachador_nombre: despachadorNombre,
          tiempo_atencion: now,
          attended_at: now
        })
        .eq('id', alarmaId)
        .select(`
          *,
          clientes (
            nombre,
            telefono
          )
        `)
        .single();

      if (error) throw error;

      // Actualizar estado local
      setAlarmas(prev => 
        prev.map(alarma => 
          alarma.id === alarmaId ? data : alarma
        )
      );

      toast({
        title: "Alarma atendida",
        description: "La alarma ha sido marcada como en proceso",
      });

      return { success: true, data };
    } catch (error: any) {
      console.error('Error attending alarma:', error);
      toast({
        title: "Error",
        description: "No se pudo atender la alarma",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    }
  };

  const asignarPatrulla = async (alarmaId: string, asignacionData: AsignacionPatrullaData) => {
    try {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('alarmas')
        .update({
          supervisor: asignacionData.supervisor,
          supervisor_id: asignacionData.supervisor_id ?? null,
          patrulla_asignada: asignacionData.patrulla_asignada,
          despachador_id: asignacionData.despachador_id ?? null,
          despachador_nombre: asignacionData.despachador_nombre,
          estado: 'asignada',
          tiempo_asignacion_supervisor: now // Cronómetro 1: "Aceptación Despachador" se detiene aquí
        })
        .eq('id', alarmaId)
        .select(`
          *,
          clientes (
            nombre,
            telefono
          )
        `)
        .single();

      if (error) throw error;

      // Actualizar estado de patrulla
      await supabase
        .from('estados_patrulla')
        .update({
          supervisor_nombre: asignacionData.supervisor,
          estado: 'pendiente'
        })
        .eq('alarma_id', alarmaId);

      // Actualizar estado local o refetch si no hubo retorno
      if (data) {
        setAlarmas(prev => 
          prev.some(a => a.id === alarmaId)
            ? prev.map(alarma => alarma.id === alarmaId ? data : alarma)
            : [data, ...prev]
        );
      } else {
        await fetchAlarmas();
      }

      toast({
        title: "Patrulla asignada",
        description: `Patrulla ${asignacionData.patrulla_asignada} asignada exitosamente`,
      });

      return { success: true, data };
    } catch (error: any) {
      console.error('Error assigning patrol:', error);
      toast({
        title: "Error",
        description: "No se pudo asignar la patrulla",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    }
  };

  const resolverAlarma = async (alarmaId: string, tiempoRespuestaSegundos?: number) => {
    try {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('alarmas')
        .update({
          estado: 'resuelta',
          resolved_at: now,
          ...(tiempoRespuestaSegundos && { tiempo_respuesta_segundos: tiempoRespuestaSegundos })
        })
        .eq('id', alarmaId)
        .select(`
          *,
          clientes (
            nombre,
            telefono
          )
        `)
        .single();

      if (error) throw error;

      // Finalizar estado de patrulla
      await supabase
        .from('estados_patrulla')
        .update({
          estado: 'finalizada',
          tiempo_fin: now
        })
        .eq('alarma_id', alarmaId);

      // Actualizar estado local
      setAlarmas(prev => 
        prev.map(alarma => 
          alarma.id === alarmaId ? data : alarma
        )
      );

      toast({
        title: "Alarma resuelta",
        description: "La alarma ha sido marcada como resuelta",
      });

      return { success: true, data };
    } catch (error: any) {
      console.error('Error resolving alarma:', error);
      toast({
        title: "Error",
        description: "No se pudo resolver la alarma",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    }
  };

  // Getters para diferentes tipos de alarmas
  const getAlarmasActivas = () => alarmas.filter(alarma => alarma.estado === 'activa');
  const getAlarmasEnProceso = () => alarmas.filter(alarma => alarma.estado === 'en_proceso');
  const getAlarmasAsignadas = () => alarmas.filter(alarma => alarma.estado === 'asignada');
  const getAlarmasResueltas = () => alarmas.filter(alarma => alarma.estado === 'resuelta');

  // Optimized real-time subscription with debouncing
  useEffect(() => {
    let updateTimeoutId: NodeJS.Timeout;
    let isSubscriptionActive = true;
    
    const subscription = supabase
      .channel('alarmas_enhanced_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'alarmas'
        },
        (payload) => {
          if (!isSubscriptionActive) return;
          
          console.log('Alarma change received:', payload);
          
          // Debounce rapid updates
          clearTimeout(updateTimeoutId);
          updateTimeoutId = setTimeout(() => {
            if (!isSubscriptionActive) return;
            
            if (payload.eventType === 'INSERT') {
              // Optimized: only refetch if we don't have the data
              setAlarmas(prev => {
                const exists = prev.some(a => a.id === payload.new.id);
                if (exists) return prev;
                fetchAlarmas(); // Refetch to get complete data with relations
                return prev;
              });
            } else if (payload.eventType === 'UPDATE') {
              setAlarmas(prev => 
                prev.map(alarma => 
                  alarma.id === payload.new.id 
                    ? { ...alarma, ...payload.new }
                    : alarma
                )
              );
            } else if (payload.eventType === 'DELETE') {
              setAlarmas(prev => 
                prev.filter(alarma => alarma.id !== payload.old.id)
              );
            }
          }, 150); // 150ms debounce
        }
      )
      .subscribe();

    fetchAlarmas();

    return () => {
      isSubscriptionActive = false;
      clearTimeout(updateTimeoutId);
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, []);

  // Nueva función para que el supervisor acepte un servicio
  const aceptarServicio = async (alarmaId: string, supervisorId: string) => {
    try {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('alarmas')
        .update({
          tiempo_aceptacion_supervisor: now,
          estado: 'en_proceso' // Cambia de 'asignada' a 'en_proceso'
        })
        .eq('id', alarmaId)
        .select(`
          *,
          clientes (
            nombre,
            telefono
          )
        `)
        .single();

      if (error) throw error;

      // Actualizar estado local
      setAlarmas(prev => prev.map(alarma => 
        alarma.id === alarmaId 
          ? data
          : alarma
      ));

      toast({
        title: "Servicio Aceptado",
        description: "Has aceptado el servicio y ahora está en proceso",
      });

      return { success: true, data };
    } catch (error: any) {
      console.error('Error accepting service:', error);
      toast({
        title: "Error",
        description: "No se pudo aceptar el servicio",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    }
  };

  return {
    alarmas,
    loading,
    error,
    createAlarma,
    atenderAlarma,
    asignarPatrulla,
    resolverAlarma,
    aceptarServicio, // Nueva función
    getAlarmasActivas,
    getAlarmasEnProceso,
    getAlarmasAsignadas,
    getAlarmasResueltas,
    refetch: fetchAlarmas,
  };
};