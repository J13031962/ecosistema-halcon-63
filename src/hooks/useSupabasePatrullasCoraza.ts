import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PatrullaCorazaData {
  id?: string;
  cliente_id?: string | null; // Nullable para configuraciones globales
  year: number;
  month: number;
  patrullas_disponibles: number;
  acompanamientos_disponibles: number;
  revistas_disponibles: number;
  patrullas_usadas?: number;
  acompanamientos_usados?: number;
  revistas_usadas?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ServicioUtilizado {
  id: string;
  fecha_uso: string;
  cliente_nombre: string;
  cliente_numero_cuenta: string;
  tipo_servicio: string;
  tipo_alarma: string;
  operador_nombre: string;
}

export interface ServiciosClienteResumen {
  patrullas_disponibles: number;
  patrullas_usadas: number;
  patrullas_restantes: number;
  acompanamientos_disponibles: number;
  acompanamientos_usados: number;
  acompanamientos_restantes: number;
  revistas_disponibles: number;
  revistas_usadas: number;
  revistas_restantes: number;
}

const DEFAULT_SERVICIOS: ServiciosClienteResumen = {
  patrullas_disponibles: 0,
  patrullas_usadas: 0,
  patrullas_restantes: 0,
  acompanamientos_disponibles: 0,
  acompanamientos_usados: 0,
  acompanamientos_restantes: 0,
  revistas_disponibles: 0,
  revistas_usadas: 0,
  revistas_restantes: 0,
};

export const useSupabasePatrullasCoraza = () => {
  const [patrullasCoraza, setPatrullasCoraza] = useState<PatrullaCorazaData[]>([]);
  const [serviciosUtilizados, setServiciosUtilizados] = useState<ServicioUtilizado[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPatrullasCoraza = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('patrullas_coraza')
        .select(`
          *,
          clientes:cliente_id (
            id,
            nombre,
            numero_cuenta
          )
        `)
        .is('cliente_id', null) // Solo configuraciones globales
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPatrullasCoraza(data || []);
    } catch (error) {
      console.error('Error fetching patrullas coraza:', error);
      toast.error('Error al cargar patrullas coraza');
    } finally {
      setLoading(false);
    }
  };

  const createPatrullaCoraza = async (data: PatrullaCorazaData) => {
    try {
      const { error } = await supabase
        .from('patrullas_coraza')
        .insert([data]);

      if (error) throw error;

      toast.success('Patrulla coraza creada exitosamente');
      await fetchPatrullasCoraza();
      return { success: true };
    } catch (error) {
      console.error('Error creating patrulla coraza:', error);
      toast.error('Error al crear patrulla coraza');
      return { success: false, error };
    }
  };

  const updatePatrullaCoraza = async (id: string, data: Partial<PatrullaCorazaData>) => {
    try {
      const { error } = await supabase
        .from('patrullas_coraza')
        .update(data)
        .eq('id', id);

      if (error) throw error;

      toast.success('Patrulla coraza actualizada exitosamente');
      await fetchPatrullasCoraza();
      return { success: true };
    } catch (error) {
      console.error('Error updating patrulla coraza:', error);
      toast.error('Error al actualizar patrulla coraza');
      return { success: false, error };
    }
  };

  const deletePatrullaCoraza = async (id: string) => {
    try {
      const { error } = await supabase
        .from('patrullas_coraza')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Patrulla coraza eliminada exitosamente');
      await fetchPatrullasCoraza();
      return { success: true };
    } catch (error) {
      console.error('Error deleting patrulla coraza:', error);
      toast.error('Error al eliminar patrulla coraza');
      return { success: false, error };
    }
  };

  const getServiciosGlobalesMes = async (
    year: number = new Date().getFullYear(), 
    month: number = new Date().getMonth() + 1
  ): Promise<ServiciosClienteResumen> => {
    try {
      const { data, error } = await supabase
        .rpc('get_servicios_globales_mes', {
          year_param: year,
          month_param: month
        });

      if (error) {
        console.error('Error fetching servicios globales:', error);
        return DEFAULT_SERVICIOS;
      }
      
      return data?.[0] || DEFAULT_SERVICIOS;
    } catch (error) {
      console.error('Error getting servicios globales mes:', error);
      return DEFAULT_SERVICIOS;
    }
  };

  const getClienteServiciosMes = async (
    clienteId: string, 
    year: number = new Date().getFullYear(), 
    month: number = new Date().getMonth() + 1
  ): Promise<ServiciosClienteResumen> => {
    try {
      // Para compatibilidad, obtenemos servicios globales y filtramos por cliente usando servicios_utilizados
      const serviciosUtilizados = await getHistorialServiciosUtilizados(year, month);
      const serviciosCliente = serviciosUtilizados.filter(s => s.cliente_id === clienteId);
      
      const patrullasUsadas = serviciosCliente.filter(s => s.tipo_servicio === 'patrulla').length;
      const acompanamientosUsados = serviciosCliente.filter(s => s.tipo_servicio === 'acompanamiento').length;
      const revistasUsadas = serviciosCliente.filter(s => s.tipo_servicio === 'revista').length;

      return {
        patrullas_disponibles: 0, // Los servicios ahora son globales
        patrullas_usadas: patrullasUsadas,
        patrullas_restantes: 0,
        acompanamientos_disponibles: 0,
        acompanamientos_usados: acompanamientosUsados,
        acompanamientos_restantes: 0,
        revistas_disponibles: 0,
        revistas_usadas: revistasUsadas,
        revistas_restantes: 0,
      };
    } catch (error) {
      console.error('Error getting cliente servicios mes:', error);
      return DEFAULT_SERVICIOS;
    }
  };

  const getHistorialServiciosUtilizados = async (
    year: number = new Date().getFullYear(), 
    month: number = new Date().getMonth() + 1
  ): Promise<any[]> => {
    try {
      const { data, error } = await supabase
        .rpc('get_historial_servicios_utilizados', {
          year_param: year,
          month_param: month
        });

      if (error) {
        console.error('Error fetching historial servicios:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error getting historial servicios:', error);
      return [];
    }
  };

  const fetchHistorialServicios = async () => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const historial = await getHistorialServiciosUtilizados(currentYear, currentMonth);
    setServiciosUtilizados(historial);
  };

  useEffect(() => {
    fetchPatrullasCoraza();
    fetchHistorialServicios();
  }, []);

  return {
    patrullasCoraza,
    serviciosUtilizados,
    loading,
    fetchPatrullasCoraza,
    createPatrullaCoraza,
    updatePatrullaCoraza,
    deletePatrullaCoraza,
    getClienteServiciosMes,
    getServiciosGlobalesMes,
    getHistorialServiciosUtilizados,
    fetchHistorialServicios
  };
};