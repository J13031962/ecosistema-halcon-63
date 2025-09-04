import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MonthlyComparison {
  month: string;
  alarmas_total: number;
  alarmas_resueltas: number;
  servicios_tecnicos: number;
  clientes_nuevos: number;
  ingresos_estimados: number;
}

export interface AlarmsByType {
  tipo: string;
  count: number;
  percentage: number;
}

export interface ClientConsumption {
  cliente_nombre: string;
  total_alarmas: number;
  total_servicios: number;
  score: number;
}

export interface ServiceTechStats {
  pendientes: number;
  en_proceso: number;
  completados: number;
  tiempo_promedio_resolucion: number;
  costo_total_estimado: number;
}

export interface ExecutiveAnalytics {
  monthlyComparisons: MonthlyComparison[];
  alarmsByType: AlarmsByType[];
  topClients: ClientConsumption[];
  serviceTechStats: ServiceTechStats;
  kpis: {
    servicios_tecnicos_propios: number;
    servicios_terceros: number;
    clientes_activos: number;
    llamadas_smart_urban: number;
    crecimiento_mensual: number;
    revistas_rutina: number;
    revistas_pagas: number;
    cantidad_alarmas: number;
    tiempo_respuesta_promedio_mes: number;
  };
}

export const useExecutiveAnalytics = (selectedMonth?: Date) => {
  const [analytics, setAnalytics] = useState<ExecutiveAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Obtener comparativos mensuales (últimos 6 meses)
      const monthlyComparisons = await fetchMonthlyComparisons();
      
      // Obtener alarmas por tipo
      const alarmsByType = await fetchAlarmsByType();
      
      // Obtener top clientes
      const topClients = await fetchTopClients();
      
      // Obtener estadísticas de servicios técnicos
      const serviceTechStats = await fetchServiceTechStats();
      
      // Calcular KPIs principales
      const kpis = await calculateKPIs(selectedMonth);

      setAnalytics({
        monthlyComparisons,
        alarmsByType,
        topClients,
        serviceTechStats,
        kpis
      });
    } catch (error) {
      console.error('Error fetching executive analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyComparisons = async (): Promise<MonthlyComparison[]> => {
    try {
      const { data, error } = await supabase.rpc('get_monthly_comparisons');
      if (error) {
        console.error('Error fetching monthly comparisons:', error);
        return [];
      }
      return (data as MonthlyComparison[]) || [];
    } catch (error) {
      console.error('Exception fetching monthly comparisons:', error);
      return [];
    }
  };

  const fetchAlarmsByType = async (): Promise<AlarmsByType[]> => {
    const { data: alarmas, error } = await supabase
      .from('alarmas')
      .select('tipo')
      .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

    if (error) {
      console.error('Error fetching alarms by type:', error);
      return [];
    }

    const typeCount: Record<string, number> = {};
    alarmas?.forEach(alarm => {
      typeCount[alarm.tipo] = (typeCount[alarm.tipo] || 0) + 1;
    });

    const total = alarmas?.length || 0;
    return Object.entries(typeCount).map(([tipo, count]) => ({
      tipo,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0
    }));
  };

  const fetchTopClients = async (): Promise<ClientConsumption[]> => {
    try {
      const { data: clientStats, error } = await supabase.rpc('get_top_clients_consumption');
      if (error) {
        console.error('Error fetching top clients:', error);
        return [];
      }
      return (clientStats as ClientConsumption[]) || [];
    } catch (error) {
      console.error('Exception fetching top clients:', error);
      return [];
    }
  };

  const fetchServiceTechStats = async (): Promise<ServiceTechStats> => {
    try {
      const { data: stats, error } = await supabase.rpc('get_service_tech_stats');
      if (error) {
        console.error('Error fetching service tech stats:', error);
        return {
          pendientes: 0,
          en_proceso: 0,
          completados: 0,
          tiempo_promedio_resolucion: 0,
          costo_total_estimado: 0
        };
      }
      // La función SQL retorna un array con un objeto, tomamos el primer elemento
      const statsResult = Array.isArray(stats) ? stats[0] : stats;
      return statsResult || {
        pendientes: 0,
        en_proceso: 0,
        completados: 0,
        tiempo_promedio_resolucion: 0,
        costo_total_estimado: 0
      };
    } catch (error) {
      console.error('Exception fetching service tech stats:', error);
      return {
        pendientes: 0,
        en_proceso: 0,
        completados: 0,
        tiempo_promedio_resolucion: 0,
        costo_total_estimado: 0
      };
    }
  };

  const calculateKPIs = async (targetMonth?: Date) => {
    const currentDate = targetMonth || new Date();
    const firstDayCurrentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayCurrentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const firstDayLastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);

    // Servicios técnicos propios del mes seleccionado
    const { count: serviciosPropios } = await supabase
      .from('servicios_tecnicos_asignados')
      .select('*', { count: 'exact' })
      .eq('tecnico_tipo', 'propio')
      .gte('created_at', firstDayCurrentMonth.toISOString())
      .lte('created_at', lastDayCurrentMonth.toISOString());

    // Servicios técnicos de terceros del mes seleccionado
    const { count: serviciosTerceros } = await supabase
      .from('servicios_tecnicos_asignados')
      .select('*', { count: 'exact' })
      .eq('tecnico_tipo', 'externo')
      .gte('created_at', firstDayCurrentMonth.toISOString())
      .lte('created_at', lastDayCurrentMonth.toISOString());

    // Clientes activos totales
    const { count: clientesActivos } = await supabase
      .from('clientes')
      .select('*', { count: 'exact' })
      .eq('estado', 'activo');

    // Llamadas Smart Urban del mes (usando alarmas como proxy)
    const { count: llamadasSmartUrban } = await supabase
      .from('alarmas')
      .select('*', { count: 'exact' })
      .ilike('descripcion', '%smart urban%')
      .gte('created_at', firstDayCurrentMonth.toISOString())
      .lte('created_at', lastDayCurrentMonth.toISOString());

    // Calcular crecimiento mensual basado en total de servicios
    const totalServiciosMesActual = (serviciosPropios || 0) + (serviciosTerceros || 0);
    
    const { count: serviciosMesPasado } = await supabase
      .from('servicios_tecnicos_asignados')
      .select('*', { count: 'exact' })
      .gte('created_at', firstDayLastMonth.toISOString())
      .lt('created_at', firstDayCurrentMonth.toISOString());

    const crecimientoMensual = serviciosMesPasado && serviciosMesPasado > 0
      ? ((totalServiciosMesActual - serviciosMesPasado) / serviciosMesPasado) * 100 
      : 0;

    // Revistas rutina del mes
    const { count: revistasRutina } = await supabase
      .from('supervisor_actividades')
      .select('*', { count: 'exact' })
      .eq('tipo_actividad', 'revista')
      .gte('created_at', firstDayCurrentMonth.toISOString())
      .lte('created_at', lastDayCurrentMonth.toISOString());

    // Revistas pagas del mes (acompañamientos)
    const { count: revistasPagas } = await supabase
      .from('supervisor_actividades')
      .select('*', { count: 'exact' })
      .eq('tipo_actividad', 'acompañamiento')
      .gte('created_at', firstDayCurrentMonth.toISOString())
      .lte('created_at', lastDayCurrentMonth.toISOString());

    // Cantidad de alarmas del mes
    const { count: cantidadAlarmas } = await supabase
      .from('alarmas')
      .select('*', { count: 'exact' })
      .gte('created_at', firstDayCurrentMonth.toISOString())
      .lte('created_at', lastDayCurrentMonth.toISOString());

    // Tiempo de respuesta promedio del mes (en segundos, convertir a minutos)
    const { data: tiemposRespuesta } = await supabase
      .from('alarmas')
      .select('tiempo_respuesta_segundos')
      .not('tiempo_respuesta_segundos', 'is', null)
      .gte('created_at', firstDayCurrentMonth.toISOString())
      .lte('created_at', lastDayCurrentMonth.toISOString());

    const tiempoPromedioSegundos = tiemposRespuesta && tiemposRespuesta.length > 0
      ? tiemposRespuesta.reduce((sum, item) => sum + (item.tiempo_respuesta_segundos || 0), 0) / tiemposRespuesta.length
      : 0;
    
    const tiempoPromedioMinutos = Math.round(tiempoPromedioSegundos / 60);

    return {
      servicios_tecnicos_propios: serviciosPropios || 0,
      servicios_terceros: serviciosTerceros || 0,
      clientes_activos: clientesActivos || 0,
      llamadas_smart_urban: llamadasSmartUrban || 0,
      crecimiento_mensual: crecimientoMensual,
      revistas_rutina: revistasRutina || 0,
      revistas_pagas: revistasPagas || 0,
      cantidad_alarmas: cantidadAlarmas || 0,
      tiempo_respuesta_promedio_mes: tiempoPromedioMinutos
    };
  };

  useEffect(() => {
    fetchAnalytics();
  }, [selectedMonth]);

  return {
    analytics,
    loading,
    refetch: fetchAnalytics
  };
};