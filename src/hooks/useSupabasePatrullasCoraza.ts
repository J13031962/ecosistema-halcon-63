import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PatrullaCorazaData {
  id?: string;
  cliente_id: string;
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

  const getClienteServiciosMes = async (
    clienteId: string, 
    year: number = new Date().getFullYear(), 
    month: number = new Date().getMonth() + 1
  ): Promise<ServiciosClienteResumen> => {
    try {
      const { data, error } = await supabase
        .rpc('get_cliente_servicios_mes', {
          cliente_id_param: clienteId,
          year_param: year,
          month_param: month
        });

      if (error) {
        console.error('Error fetching servicios:', error);
        return DEFAULT_SERVICIOS;
      }
      
      return data?.[0] || DEFAULT_SERVICIOS;
    } catch (error) {
      console.error('Error getting cliente servicios mes:', error);
      return DEFAULT_SERVICIOS;
    }
  };

  useEffect(() => {
    fetchPatrullasCoraza();
  }, []);

  return {
    patrullasCoraza,
    loading,
    fetchPatrullasCoraza,
    createPatrullaCoraza,
    updatePatrullaCoraza,
    deletePatrullaCoraza,
    getClienteServiciosMes
  };
};