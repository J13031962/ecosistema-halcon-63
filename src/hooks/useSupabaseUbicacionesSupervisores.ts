import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UbicacionSupervisor {
  supervisor_id: string;
  supervisor_name: string;
  supervisor_email: string;
  latitude: number;
  longitude: number;
  precision_meters: number | null;
  created_at: string;
  alarma_id: string | null;
  alarma_direccion: string | null;
  alarma_estado: string | null;
  alarma_tipo: string | null;
  cliente_nombre: string | null;
}

interface SupervisorLocationStatus {
  id: string;
  name: string;
  email: string;
  position: [number, number] | null;
  status: 'disponible' | 'en_servicio' | 'en_ruta' | 'desconectado';
  alarmaId?: string;
  destino?: string;
  ultimaActualizacion: string;
  isOnline: boolean;
  precision?: number;
}

export const useSupabaseUbicacionesSupervisores = () => {
  const [ubicaciones, setUbicaciones] = useState<UbicacionSupervisor[]>([]);
  const [supervisoresStatus, setSupervisoresStatus] = useState<SupervisorLocationStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUbicacionesSupervisores = async () => {
    try {
      setLoading(true);
      console.log('🔍 Obteniendo ubicaciones GPS reales de supervisores...');

      // Obtener las últimas ubicaciones GPS de cada supervisor
      const { data: ubicacionesData, error: ubicacionesError } = await supabase
        .from('supervisor_ubicaciones_tiempo_real')
        .select(`
          supervisor_id,
          latitude,
          longitude,
          precision_meters,
          created_at,
          alarma_id
        `)
        .order('created_at', { ascending: false });

      if (ubicacionesError) {
        console.error('❌ Error obteniendo ubicaciones GPS:', ubicacionesError);
        throw ubicacionesError;
      }

      console.log('📍 Ubicaciones GPS encontradas:', ubicacionesData?.length || 0);

      // Obtener información de supervisores desde profiles
      const { data: supervisoresData, error: supervisoresError } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          user_roles!inner(role)
        `)
        .eq('active', true)
        .eq('user_roles.role', 'supervisor_motorizado');

      if (supervisoresError) {
        console.error('❌ Error obteniendo supervisores:', supervisoresError);
        throw supervisoresError;
      }

      console.log('👥 Supervisores encontrados:', supervisoresData?.length || 0);

      // Obtener información de alarmas activas
      const { data: alarmasData, error: alarmasError } = await supabase
        .from('alarmas')
        .select(`
          id,
          supervisor_id,
          estado,
          tipo,
          direccion,
          clientes(nombre)
        `)
        .in('estado', ['asignada', 'en_proceso']);

      if (alarmasError) {
        console.error('❌ Error obteniendo alarmas:', alarmasError);
      }

      // Procesar datos para crear el estado de cada supervisor
      const supervisoresConEstado: SupervisorLocationStatus[] = [];

      supervisoresData?.forEach(supervisor => {
        // Buscar la última ubicación GPS de este supervisor
        const ultimaUbicacion = ubicacionesData
          ?.filter(loc => loc.supervisor_id === supervisor.id)
          ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

        // Buscar alarma asignada
        const alarmaAsignada = alarmasData?.find(a => a.supervisor_id === supervisor.id);

        // Determinar estado del supervisor
        let status: 'disponible' | 'en_servicio' | 'en_ruta' | 'desconectado' = 'disponible';
        let destino = '';
        
        // Considerar online si tiene una ubicación GPS en los últimos 10 minutos
        const ultimaActualizacion = ultimaUbicacion?.created_at || new Date().toISOString();
        const tiempoLimite = new Date(Date.now() - 10 * 60 * 1000); // 10 minutos
        const isOnline = ultimaUbicacion && new Date(ultimaUbicacion.created_at) > tiempoLimite;

        if (!isOnline) {
          status = 'desconectado';
        } else if (alarmaAsignada) {
          if (alarmaAsignada.estado === 'asignada') {
            status = 'en_ruta';
            destino = alarmaAsignada.direccion || 'Ubicación del cliente';
          } else if (alarmaAsignada.estado === 'en_proceso') {
            status = 'en_servicio';
            destino = alarmaAsignada.direccion || 'En el sitio del cliente';
          }
        }

        supervisoresConEstado.push({
          id: supervisor.id,
          name: supervisor.full_name || supervisor.email,
          email: supervisor.email,
          position: ultimaUbicacion ? [
            Number(ultimaUbicacion.latitude),
            Number(ultimaUbicacion.longitude)
          ] : null,
          status,
          alarmaId: alarmaAsignada?.id,
          destino,
          ultimaActualizacion,
          isOnline: !!isOnline,
          precision: ultimaUbicacion?.precision_meters || undefined
        });
      });

      console.log('✅ Supervisores procesados con estado:', supervisoresConEstado.length);
      console.log('📊 Estado de supervisores:', {
        online: supervisoresConEstado.filter(s => s.isOnline).length,
        offline: supervisoresConEstado.filter(s => !s.isOnline).length,
        enServicio: supervisoresConEstado.filter(s => s.status === 'en_servicio').length,
        enRuta: supervisoresConEstado.filter(s => s.status === 'en_ruta').length
      });

      setSupervisoresStatus(supervisoresConEstado);

    } catch (error) {
      console.error('❌ Error obteniendo ubicaciones de supervisores:', error);
      toast({
        title: "Error GPS",
        description: "No se pudieron cargar las ubicaciones de los supervisores",
        variant: "destructive",
      });
      setSupervisoresStatus([]);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToRealTimeUpdates = () => {
    console.log('🔄 Configurando suscripción en tiempo real para ubicaciones GPS...');
    
    const channel = supabase
      .channel('supervisor-ubicaciones-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'supervisor_ubicaciones_tiempo_real'
        },
        (payload) => {
          console.log('📍 Nueva ubicación GPS recibida:', payload);
          // Refrescar datos cuando llegue una nueva ubicación
          fetchUbicacionesSupervisores();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'alarmas'
        },
        (payload) => {
          console.log('🚨 Alarma actualizada:', payload);
          // Refrescar cuando cambie el estado de una alarma
          fetchUbicacionesSupervisores();
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 Desconectando suscripción de ubicaciones GPS...');
      supabase.removeChannel(channel);
    };
  };

  useEffect(() => {
    fetchUbicacionesSupervisores();
    
    // Configurar actualización automática cada 30 segundos
    const interval = setInterval(fetchUbicacionesSupervisores, 30000);
    
    // Configurar suscripción en tiempo real
    const unsubscribe = subscribeToRealTimeUpdates();
    
    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  return {
    supervisoresStatus,
    loading,
    refetch: fetchUbicacionesSupervisores
  };
};