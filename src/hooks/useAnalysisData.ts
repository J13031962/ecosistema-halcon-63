import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TrendData {
  hora: string;
  alarmas: number;
  respuesta: number;
}

export interface AnalysisInsight {
  tipo: 'patron' | 'oportunidad' | 'alerta' | 'prediccion';
  titulo: string;
  descripcion: string;
  valor?: string;
}

export interface ZonaAnalysis {
  zona: string;
  alarmas: number;
  tiempoRespuesta: number;
  clientes: number;
  resolucion: number;
}

export function useAnalysisData(periodo: string = 'hoy') {
  const [tendenciaAlarmas, setTendenciaAlarmas] = useState<TrendData[]>([]);
  const [rendimientoSemanal, setRendimientoSemanal] = useState<any[]>([]);
  const [analisisZonas, setAnalisisZonas] = useState<ZonaAnalysis[]>([]);
  const [insights, setInsights] = useState<AnalysisInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalysisData();
  }, [periodo]);

  const fetchAnalysisData = async () => {
    try {
      setLoading(true);
      setError(null);

      const startDate = getStartDate(periodo);

      // Fetch alarmas data
      const { data: alarmasData, error: alarmasError } = await supabase
        .from('alarmas')
        .select('*')
        .gte('created_at', startDate);

      if (alarmasError) throw alarmasError;

      // Fetch patrullas data for zones
      const { data: patrullasData, error: patrullasError } = await supabase
        .from('patrullas')
        .select('*');

      if (patrullasError) throw patrullasError;

      // Fetch clientes data for zones
      const { data: clientesData, error: clientesError } = await supabase
        .from('clientes')
        .select('*');

      if (clientesError) throw clientesError;

      // Generate trend data by hour
      const trendData = generateHourlyTrend(alarmasData || []);
      setTendenciaAlarmas(trendData);

      // Generate weekly performance
      const weeklyData = generateWeeklyPerformance(alarmasData || []);
      setRendimientoSemanal(weeklyData);

      // Generate zone analysis
      const zonesData = generateZoneAnalysis(alarmasData || [], patrullasData || [], clientesData || []);
      setAnalisisZonas(zonesData);

      // Generate insights
      const insightsData = generateInsights(alarmasData || [], trendData, zonesData);
      setInsights(insightsData);

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

  const generateHourlyTrend = (alarmas: any[]): TrendData[] => {
    const hourlyData: { [key: string]: { count: number, totalResponse: number } } = {};
    
    for (let i = 0; i < 24; i++) {
      hourlyData[i.toString().padStart(2, '0')] = { count: 0, totalResponse: 0 };
    }

    alarmas.forEach(alarma => {
      const hour = new Date(alarma.created_at).getHours().toString().padStart(2, '0');
      hourlyData[hour].count++;
      if (alarma.tiempo_respuesta_segundos) {
        hourlyData[hour].totalResponse += alarma.tiempo_respuesta_segundos;
      }
    });

    return Object.entries(hourlyData).map(([hora, data]) => ({
      hora: hora + ':00',
      alarmas: data.count,
      respuesta: data.count > 0 ? Math.round(data.totalResponse / data.count / 60) : 0
    }));
  };

  const generateWeeklyPerformance = (alarmas: any[]) => {
    const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    return days.map((dia, index) => ({
      dia,
      alarmas: Math.floor(Math.random() * 50) + 20, // Placeholder
      respuesta: Math.floor(Math.random() * 20) + 10,
      efectividad: Math.floor(Math.random() * 30) + 70
    }));
  };

  const generateZoneAnalysis = (alarmas: any[], patrullas: any[], clientes: any[]): ZonaAnalysis[] => {
    const zones = ['Centro', 'Norte', 'Sur', 'Este', 'Oeste'];
    
    return zones.map(zona => {
      const zonaAlarmas = alarmas.filter(() => Math.random() > 0.7); // Placeholder filtering
      const zonaClientes = Math.floor(clientes.length / zones.length);
      
      return {
        zona,
        alarmas: zonaAlarmas.length,
        tiempoRespuesta: Math.floor(Math.random() * 10) + 8,
        clientes: zonaClientes,
        resolucion: Math.floor(Math.random() * 20) + 80
      };
    });
  };

  const generateInsights = (alarmas: any[], trends: TrendData[], zones: ZonaAnalysis[]): AnalysisInsight[] => {
    const insights: AnalysisInsight[] = [];

    // Pattern detection
    const peakHour = trends.reduce((max, curr) => curr.alarmas > max.alarmas ? curr : max);
    insights.push({
      tipo: 'patron',
      titulo: 'Pico de Actividad Detectado',
      descripcion: `Mayor concentración de alarmas a las ${peakHour.hora}`,
      valor: `${peakHour.alarmas} alarmas`
    });

    // Opportunity detection
    const bestZone = zones.reduce((best, curr) => curr.resolucion > best.resolucion ? curr : best);
    insights.push({
      tipo: 'oportunidad',
      titulo: 'Zona de Alto Rendimiento',
      descripcion: `La zona ${bestZone.zona} muestra excelente efectividad`,
      valor: `${bestZone.resolucion}% resolución`
    });

    // Alert detection
    const worstZone = zones.reduce((worst, curr) => curr.tiempoRespuesta > worst.tiempoRespuesta ? curr : worst);
    if (worstZone.tiempoRespuesta > 15) {
      insights.push({
        tipo: 'alerta',
        titulo: 'Tiempo de Respuesta Elevado',
        descripcion: `La zona ${worstZone.zona} requiere atención inmediata`,
        valor: `${worstZone.tiempoRespuesta} min promedio`
      });
    }

    // Prediction
    const totalAlarmas = alarmas.length;
    const proyeccion = Math.round(totalAlarmas * 1.15);
    insights.push({
      tipo: 'prediccion',
      titulo: 'Proyección Semanal',
      descripcion: 'Incremento esperado en actividad',
      valor: `+${proyeccion - totalAlarmas} alarmas`
    });

    return insights;
  };

  return { 
    tendenciaAlarmas, 
    rendimientoSemanal, 
    analisisZonas, 
    insights, 
    loading, 
    error, 
    refetch: fetchAnalysisData 
  };
}