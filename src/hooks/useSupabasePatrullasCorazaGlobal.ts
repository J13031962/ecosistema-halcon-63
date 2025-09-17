import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ResumenGlobalEmpresa {
  empresa_nombre: string;
  empresa_id: string;
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

export const useSupabasePatrullasCorazaGlobal = () => {
  const [resumenGlobal, setResumenGlobal] = useState<ResumenGlobalEmpresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResumenGlobal = async (year?: number, month?: number) => {
    try {
      setLoading(true);
      const currentYear = year || new Date().getFullYear();
      const currentMonth = month || new Date().getMonth() + 1;
      
      const { data, error } = await supabase.rpc('get_resumen_global_empresas', {
        year_param: currentYear,
        month_param: currentMonth
      });
      
      if (error) throw error;
      setResumenGlobal(data || []);
      return data || [];
    } catch (err) {
      console.error('Error fetching resumen global:', err);
      setError('Error al cargar resumen global');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getTotalesGlobales = () => {
    return resumenGlobal.reduce((totales, empresa) => {
      return {
        patrullas_disponibles: totales.patrullas_disponibles + empresa.patrullas_disponibles,
        patrullas_usadas: totales.patrullas_usadas + empresa.patrullas_usadas,
        patrullas_restantes: totales.patrullas_restantes + empresa.patrullas_restantes,
        acompanamientos_disponibles: totales.acompanamientos_disponibles + empresa.acompanamientos_disponibles,
        acompanamientos_usados: totales.acompanamientos_usados + empresa.acompanamientos_usados,
        acompanamientos_restantes: totales.acompanamientos_restantes + empresa.acompanamientos_restantes,
        revistas_disponibles: totales.revistas_disponibles + empresa.revistas_disponibles,
        revistas_usadas: totales.revistas_usadas + empresa.revistas_usadas,
        revistas_restantes: totales.revistas_restantes + empresa.revistas_restantes
      };
    }, {
      patrullas_disponibles: 0,
      patrullas_usadas: 0,
      patrullas_restantes: 0,
      acompanamientos_disponibles: 0,
      acompanamientos_usados: 0,
      acompanamientos_restantes: 0,
      revistas_disponibles: 0,
      revistas_usadas: 0,
      revistas_restantes: 0
    });
  };

  useEffect(() => {
    fetchResumenGlobal();
  }, []);

  return {
    resumenGlobal,
    loading,
    error,
    fetchResumenGlobal,
    getTotalesGlobales,
    refetch: fetchResumenGlobal
  };
};