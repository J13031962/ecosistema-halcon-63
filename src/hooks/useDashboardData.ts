import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DashboardStats {
  totalAlarmas: number;
  alarmasActivas: number;
  patrullasActivas: number;
  personalActivo: number;
  tiempoRespuestaPromedio: number;
  efectividadPorcentaje: number;
  ingresosHoy: number;
  serviciosCompletados: number;
  clientesInscritos: number;
  clientesConMasAlarmas: Array<{nombre: string, alarmas: number}>;
  revistasCompletadas: number;
  revistasPendientes: number;
  acompanamientosCompletados: number;
  acompanamientosPendientes: number;
}

export interface RecentActivity {
  id: string;
  description: string;
  timestamp: string;
  type: string;
}

export function useDashboardData(periodo: string = 'hoy') {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, [periodo]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const today = new Date().toISOString().split('T')[0];
      const startDate = getStartDate(periodo);

      // Fetch alarmas stats
      const { data: alarmasData, error: alarmasError } = await supabase
        .from('alarmas')
        .select('*')
        .gte('created_at', startDate);

      if (alarmasError) throw alarmasError;

      // Fetch patrullas activas
      const { data: patrullasData, error: patrullasError } = await supabase
        .from('patrullas')
        .select('*')
        .in('estado', ['disponible', 'en_servicio', 'emergencia']);

      if (patrullasError) throw patrullasError;

      // Fetch personal activo
      const { data: personalData, error: personalError } = await supabase
        .from('personal')
        .select('*')
        .eq('estado', 'activo');

      if (personalError) throw personalError;

      // Fetch operaciones del día
      const { data: operacionesData, error: operacionesError } = await supabase
        .from('operaciones_diarias')
        .select('*')
        .eq('fecha', today)
        .single();

      // Fetch servicios técnicos
      const { data: serviciosData, error: serviciosError } = await supabase
        .from('servicios_tecnicos')
        .select('*')
        .gte('created_at', startDate);

      if (serviciosError) throw serviciosError;

      // Fetch clientes
      const { data: clientesData, error: clientesError } = await supabase
        .from('clientes')
        .select('id, nombre')
        .eq('estado', 'activo');

      if (clientesError) throw clientesError;

      // Fetch revistas y acompañamientos
      const { data: revisionsData, error: revisionsError } = await supabase
        .from('supervisor_actividades')
        .select('*')
        .gte('created_at', startDate);

      if (revisionsError) throw revisionsError;

      // Fetch recent events
      const { data: eventosData, error: eventosError } = await supabase
        .from('eventos_sistema')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (eventosError) throw eventosError;

      // Calculate stats
      const alarmasActivas = alarmasData?.filter(a => a.estado === 'activa').length || 0;
      const serviciosCompletados = serviciosData?.filter(s => s.estado === 'completado').length || 0;
      const tiempoRespuestaPromedio = operacionesData?.tiempo_respuesta_promedio || 0;
      const efectividadPorcentaje = operacionesData?.efectividad_porcentaje || 0;

      // Calculate client stats
      const clientesInscritos = clientesData?.length || 0;
      
      // Calculate clients with most alarms
      const clientesAlarmasCount = alarmasData?.reduce((acc: any, alarma: any) => {
        if (alarma.cliente_id) {
          const cliente = clientesData?.find(c => c.id === alarma.cliente_id);
          if (cliente) {
            acc[cliente.nombre] = (acc[cliente.nombre] || 0) + 1;
          }
        }
        return acc;
      }, {});

      const clientesConMasAlarmas = Object.entries(clientesAlarmasCount || {})
        .map(([nombre, alarmas]) => ({ nombre, alarmas: alarmas as number }))
        .sort((a, b) => b.alarmas - a.alarmas)
        .slice(0, 5);

      // Calculate revistas and acompañamientos
      const revistaActivity = revisionsData?.filter(r => r.tipo_actividad === 'revista') || [];
      const acompañamientoActivity = revisionsData?.filter(r => r.tipo_actividad === 'acompañamiento') || [];
      
      const revistasCompletadas = revistaActivity.filter(r => r.descripcion?.includes('completad')).length;
      const revistasPendientes = revistaActivity.length - revistasCompletadas;
      
      const acompanamientosCompletados = acompañamientoActivity.filter(a => a.descripcion?.includes('completad')).length;
      const acompanamientosPendientes = acompañamientoActivity.length - acompanamientosCompletados;

      setStats({
        totalAlarmas: alarmasData?.length || 0,
        alarmasActivas,
        patrullasActivas: patrullasData?.length || 0,
        personalActivo: personalData?.length || 0,
        tiempoRespuestaPromedio,
        efectividadPorcentaje,
        ingresosHoy: operacionesData?.ingresos_dia || 0,
        serviciosCompletados,
        clientesInscritos,
        clientesConMasAlarmas,
        revistasCompletadas,
        revistasPendientes,
        acompanamientosCompletados,
        acompanamientosPendientes
      });

      setRecentActivity(
        eventosData?.map(evento => ({
          id: evento.id,
          description: evento.descripcion,
          timestamp: evento.created_at,
          type: evento.tipo_evento
        })) || []
      );

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStartDate = (periodo: string): string => {
    const now = new Date();
    switch (periodo) {
      case 'semana':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case 'mes':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    }
  };

  return { stats, recentActivity, loading, error, refetch: fetchDashboardData };
}