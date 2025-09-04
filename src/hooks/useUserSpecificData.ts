import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthConsolidatedContext } from '@/contexts/AuthContextConsolidated';
import { useToast } from '@/hooks/use-toast';

interface UseUserSpecificDataOptions {
  table: string;
  userIdField?: string;
  additionalFilters?: Record<string, any>;
  enabled?: boolean;
}

export const useUserSpecificData = ({
  table,
  userIdField = 'user_id',
  additionalFilters = {},
  enabled = true
}: UseUserSpecificDataOptions) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthConsolidatedContext();
  const { toast } = useToast();
  const isMountedRef = useRef(true);
  const lastFetchRef = useRef<string>('');

  const fetchData = useCallback(async () => {
    if (!user?.id || !enabled || !isMountedRef.current) return;

    // Evitar peticiones duplicadas
    const fetchKey = `${table}-${user.id}-${JSON.stringify(additionalFilters)}`;
    if (lastFetchRef.current === fetchKey && loading) return;
    lastFetchRef.current = fetchKey;

    try {
      setLoading(true);
      setError(null);
      
      // Construir consulta dinámica basada en rol y tabla
      const buildQuery = () => {
        const baseQuery = supabase.from(table as any).select('*');
        
        // Si es administrador, devolver todos los datos
        if (user.role === 'administrador') {
          return baseQuery;
        }

        // Filtros específicos por rol y tabla
        if (table === 'alarmas') {
          if (user.role === 'supervisor_motorizado') {
            // DEBUG: Log para verificar qué se está consultando
            console.log('🔍 Consultando alarmas para supervisor:', {
              user_id: user.id,
              full_name: user.full_name,
              role: user.role
            });
            // Buscar por supervisor_id O por supervisor (nombre)
            return baseQuery.or(`supervisor_id.eq.${user.id},supervisor.eq.${user.full_name || ''}`);
          } else if (user.role === 'operador_alarmas') {
            return baseQuery.eq('operador_id', user.id);
          } else if (user.role === 'despachador_patrullas') {
            return baseQuery.eq('despachador_id', user.id);
          }
        }

        if (table.includes('turnos_operador')) {
          return baseQuery.eq('operador_id', user.id);
        }

        if (table.includes('turnos_supervisor')) {
          return baseQuery.eq('supervisor_id', user.id);
        }

        if (table.includes('historial_patrullas')) {
          if (user.role === 'supervisor_motorizado') {
            return baseQuery.eq('supervisor_id', user.id);
          }
        }

        if (table === 'supervisor_actividades') {
          return baseQuery.eq('supervisor_id', user.id);
        }

        if (table === 'incidentes') {
          return baseQuery.eq('supervisor_id', user.id);
        }

        if (table === 'servicios_tecnicos') {
          return baseQuery.eq('tecnico_id', user.id);
        }

        if (table === 'cotizaciones') {
          return baseQuery.eq('user_id', user.id);
        }

        // Filtro genérico por campo de usuario
        if (userIdField) {
          return baseQuery.eq(userIdField, user.id);
        }

        return baseQuery;
      };

      let query = buildQuery();

      // Aplicar filtros adicionales
      Object.entries(additionalFilters).forEach(([field, value]) => {
        query = query.eq(field, value);
      });

      const { data: result, error } = await query.order('created_at', { ascending: false });

      // DEBUG: Log para verificar resultados
      if (table === 'alarmas' && user.role === 'supervisor_motorizado') {
        console.log('📊 Resultado de consulta de alarmas:', {
          total_encontradas: result?.length || 0,
          alarmas: result,
          error: error?.message
        });
      }

      if (error) throw error;
      
      if (isMountedRef.current) {
        setData(result || []);
      }
    } catch (error: any) {
      console.error(`Error fetching ${table} data:`, error);
      
      if (isMountedRef.current) {
        setError(error.message || 'Error desconocido');
        
        // Solo mostrar toast para errores críticos, no para problemas de red temporales
        if (!error.message?.includes('Failed to fetch')) {
          toast({
            title: "Error",
            description: `No se pudieron cargar los datos de ${table}: ${error.message}`,
            variant: "destructive",
          });
        }
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [user?.id, user?.role, table, userIdField, additionalFilters, enabled, toast, loading]);

  const insertData = useCallback(async (newData: any) => {
    if (!user?.id) return { success: false, error: 'Usuario no autenticado' };

    try {
      // Agregar campos específicos según el rol y tabla
      const dataToInsert = {
        ...newData,
        ...(userIdField && { [userIdField]: user.id }),
        // Campos específicos por rol
        ...(user.role === 'operador_alarmas' && table === 'alarmas' && { 
          operador_id: user.id,
          operador_nombre: user.full_name 
        }),
        ...(user.role === 'supervisor_motorizado' && table === 'alarmas' && { 
          supervisor_id: user.id,
          supervisor: user.full_name 
        }),
        ...(user.role === 'despachador_patrullas' && table === 'alarmas' && { 
          despachador_id: user.id,
          despachador_nombre: user.full_name 
        }),
      };

      const { data: result, error } = await supabase
        .from(table as any)
        .insert(dataToInsert)
        .select()
        .single();

      if (error) throw error;

      await fetchData();
      
      return { success: true, data: result };
    } catch (error: any) {
      console.error(`Error inserting ${table} data:`, error);
      return { success: false, error: error.message };
    }
  }, [user?.id, user?.role, user?.full_name, table, userIdField, fetchData]);

  const updateData = useCallback(async (id: string, updates: any) => {
    if (!user?.id) return { success: false, error: 'Usuario no autenticado' };

    try {
      let query = supabase
        .from(table as any)
        .update(updates)
        .eq('id', id);

      // Verificar que el usuario solo puede actualizar sus propios datos
      if (user.role !== 'administrador' && userIdField) {
        query = query.eq(userIdField, user.id);
      }

      const { error } = await query;

      if (error) throw error;

      await fetchData();
      
      return { success: true };
    } catch (error: any) {
      console.error(`Error updating ${table} data:`, error);
      return { success: false, error: error.message };
    }
  }, [user?.id, user?.role, table, userIdField, fetchData]);

  const deleteData = useCallback(async (id: string) => {
    if (!user?.id) return { success: false, error: 'Usuario no autenticado' };

    try {
      let query = supabase
        .from(table as any)
        .delete()
        .eq('id', id);

      // Verificar que el usuario solo puede eliminar sus propios datos
      if (user.role !== 'administrador' && userIdField) {
        query = query.eq(userIdField, user.id);
      }

      const { error } = await query;

      if (error) throw error;

      await fetchData();
      
      return { success: true };
    } catch (error: any) {
      console.error(`Error deleting ${table} data:`, error);
      return { success: false, error: error.message };
    }
  }, [user?.id, user?.role, table, userIdField, fetchData]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchData();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    fetchData,
    insertData,
    updateData,
    deleteData,
    refetch: fetchData
  };
};