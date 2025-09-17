import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ConfiguracionEmpresa {
  id: string;
  empresa_contratada_id: string;
  year: number;
  month: number;
  patrullas_disponibles: number;
  acompanamientos_disponibles: number;
  revistas_disponibles: number;
  patrullas_usadas: number;
  acompanamientos_usados: number;
  revistas_usadas: number;
  created_at: string;
  updated_at: string;
}

export interface ServiciosEmpresa {
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

export interface ServicioUtilizado {
  id: string;
  fecha_uso: string;
  cliente_nombre: string;
  cliente_numero_cuenta: string;
  tipo_servicio: string;
  tipo_alarma: string;
  operador_nombre: string;
}

export const useConfiguracionEmpresa = (empresaId: string) => {
  const [configuraciones, setConfiguraciones] = useState<ConfiguracionEmpresa[]>([]);
  const [serviciosUtilizados, setServiciosUtilizados] = useState<ServicioUtilizado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfiguraciones = async () => {
    if (!empresaId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('patrullas_coraza')
        .select('*')
        .eq('empresa_contratada_id', empresaId)
        .is('cliente_id', null)
        .order('year', { ascending: false })
        .order('month', { ascending: false });
      
      if (error) throw error;
      setConfiguraciones(data || []);
    } catch (err) {
      console.error('Error fetching configuraciones:', err);
      setError('Error al cargar configuraciones');
    } finally {
      setLoading(false);
    }
  };

  const getServiciosEmpresa = async (year?: number, month?: number): Promise<ServiciosEmpresa> => {
    const currentYear = year || new Date().getFullYear();
    const currentMonth = month || new Date().getMonth() + 1;
    
    try {
      const { data, error } = await supabase.rpc('get_servicios_por_empresa', {
        empresa_id_param: empresaId,
        year_param: currentYear,
        month_param: currentMonth
      });
      
      if (error) throw error;
      return data?.[0] || {
        patrullas_disponibles: 0,
        patrullas_usadas: 0,
        patrullas_restantes: 0,
        acompanamientos_disponibles: 0,
        acompanamientos_usados: 0,
        acompanamientos_restantes: 0,
        revistas_disponibles: 0,
        revistas_usadas: 0,
        revistas_restantes: 0
      };
    } catch (err) {
      console.error('Error getting servicios empresa:', err);
      throw new Error('Error al obtener servicios de la empresa');
    }
  };

  const getHistorialServicios = async (year?: number, month?: number) => {
    const currentYear = year || new Date().getFullYear();
    const currentMonth = month || new Date().getMonth() + 1;
    
    try {
      const { data, error } = await supabase
        .from('servicios_utilizados')
        .select(`
          id,
          fecha_uso,
          tipo_servicio,
          tipo_alarma,
          operador_nombre,
          clientes!inner(nombre, numero_cuenta)
        `)
        .eq('empresa_contratada_id', empresaId)
        .eq('year', currentYear)
        .eq('month', currentMonth)
        .order('fecha_uso', { ascending: false });
      
      if (error) throw error;
      
      const formattedData = data?.map(item => ({
        id: item.id,
        fecha_uso: item.fecha_uso,
        cliente_nombre: (item.clientes as any)?.nombre || 'Cliente no encontrado',
        cliente_numero_cuenta: (item.clientes as any)?.numero_cuenta || '',
        tipo_servicio: item.tipo_servicio,
        tipo_alarma: item.tipo_alarma,
        operador_nombre: item.operador_nombre || ''
      })) || [];
      
      setServiciosUtilizados(formattedData);
      return formattedData;
    } catch (err) {
      console.error('Error getting historial servicios:', err);
      setServiciosUtilizados([]);
      return [];
    }
  };

  const createConfiguracion = async (configData: Omit<ConfiguracionEmpresa, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('patrullas_coraza')
        .insert([{ ...configData, empresa_contratada_id: empresaId, cliente_id: null }])
        .select()
        .single();
      
      if (error) throw error;
      await fetchConfiguraciones();
      return data;
    } catch (err) {
      console.error('Error creating configuracion:', err);
      throw new Error('Error al crear configuración');
    }
  };

  const updateConfiguracion = async (id: string, configData: Partial<ConfiguracionEmpresa>) => {
    try {
      const { data, error } = await supabase
        .from('patrullas_coraza')
        .update({ ...configData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      await fetchConfiguraciones();
      return data;
    } catch (err) {
      console.error('Error updating configuracion:', err);
      throw new Error('Error al actualizar configuración');
    }
  };

  const deleteConfiguracion = async (id: string) => {
    try {
      const { error } = await supabase
        .from('patrullas_coraza')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await fetchConfiguraciones();
    } catch (err) {
      console.error('Error deleting configuracion:', err);
      throw new Error('Error al eliminar configuración');
    }
  };

  useEffect(() => {
    fetchConfiguraciones();
  }, [empresaId]);

  return {
    configuraciones,
    serviciosUtilizados,
    loading,
    error,
    getServiciosEmpresa,
    getHistorialServicios,
    createConfiguracion,
    updateConfiguracion,
    deleteConfiguracion,
    refetch: fetchConfiguraciones
  };
};