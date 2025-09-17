import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface EmpresaContratada {
  id: string;
  nombre: string;
  tipo_servicio: string;
  estado: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  descripcion?: string;
  created_at: string;
  updated_at: string;
}

export const useEmpresasContratadas = () => {
  const [empresas, setEmpresas] = useState<EmpresaContratada[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmpresas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('empresas_contratadas')
        .select('*')
        .eq('estado', 'activo')
        .order('nombre');
      
      if (error) throw error;
      setEmpresas(data || []);
    } catch (err) {
      console.error('Error fetching empresas contratadas:', err);
      setError('Error al cargar empresas contratadas');
    } finally {
      setLoading(false);
    }
  };

  const createEmpresa = async (empresaData: Omit<EmpresaContratada, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setLoading(true);
      console.log('🔄 Creando empresa con datos:', empresaData);
      
      const { data, error } = await supabase
        .from('empresas_contratadas')
        .insert(empresaData)
        .select()
        .single();

      console.log('📊 Respuesta de creación:', data);
      console.log('❌ Error de creación:', error);

      if (error) {
        console.error('❌ Error detallado:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw new Error(`Error al crear empresa: ${error.message}`);
      }
      
      setEmpresas(prev => [data, ...prev]);
      return data;
    } catch (error) {
      console.error('❌ Error creating empresa:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al crear empresa';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateEmpresa = async (id: string, empresaData: Partial<EmpresaContratada>) => {
    try {
      setLoading(true);
      console.log('🔄 Actualizando empresa con ID:', id, 'Datos:', empresaData);
      
      const { data, error } = await supabase
        .from('empresas_contratadas')
        .update({ ...empresaData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      console.log('📊 Respuesta de actualización:', data);
      console.log('❌ Error de actualización:', error);

      if (error) {
        console.error('❌ Error detallado:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw new Error(`Error al actualizar empresa: ${error.message}`);
      }
      
      setEmpresas(prev => prev.map(empresa => 
        empresa.id === id ? data : empresa
      ));
      return data;
    } catch (error) {
      console.error('❌ Error updating empresa:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al actualizar empresa';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteEmpresa = async (id: string) => {
    try {
      const { error } = await supabase
        .from('empresas_contratadas')
        .update({ estado: 'inactivo' })
        .eq('id', id);
      
      if (error) throw error;
      await fetchEmpresas();
    } catch (err) {
      console.error('Error deleting empresa:', err);
      throw new Error('Error al eliminar empresa contratada');
    }
  };

  useEffect(() => {
    fetchEmpresas();
  }, []);

  return {
    empresas,
    loading,
    error,
    createEmpresa,
    updateEmpresa,
    deleteEmpresa,
    refetch: fetchEmpresas
  };
};