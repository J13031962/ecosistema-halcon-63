import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ElementoCotizable {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  precio: number;
  unidad: string;
  estado: 'activo' | 'inactivo';
  observaciones?: string;
  created_at?: string;
  updated_at?: string;
}

export const useSupabaseElementosCotizables = () => {
  const [elementos, setElementos] = useState<ElementoCotizable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchElementos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('elementos_cotizables')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setElementos((data || []) as ElementoCotizable[]);
    } catch (error) {
      console.error('Error fetching elementos:', error);
      setError('Error al cargar los elementos cotizables');
      toast.error('Error al cargar los elementos cotizables');
    } finally {
      setLoading(false);
    }
  };

  const addElemento = async (elemento: Omit<ElementoCotizable, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('elementos_cotizables')
        .insert([elemento])
        .select()
        .single();

      if (error) throw error;
      
      setElementos(prev => [data as ElementoCotizable, ...prev]);
      toast.success('Elemento agregado exitosamente');
      return data;
    } catch (error) {
      console.error('Error adding elemento:', error);
      toast.error('Error al agregar el elemento');
      throw error;
    }
  };

  const updateElemento = async (id: string, updates: Partial<ElementoCotizable>) => {
    try {
      const { data, error } = await supabase
        .from('elementos_cotizables')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setElementos(prev => prev.map(el => el.id === id ? data as ElementoCotizable : el));
      toast.success('Elemento actualizado exitosamente');
      return data;
    } catch (error) {
      console.error('Error updating elemento:', error);
      toast.error('Error al actualizar el elemento');
      throw error;
    }
  };

  const deleteElemento = async (id: string) => {
    try {
      const { error } = await supabase
        .from('elementos_cotizables')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setElementos(prev => prev.filter(el => el.id !== id));
      toast.success('Elemento eliminado exitosamente');
    } catch (error) {
      console.error('Error deleting elemento:', error);
      toast.error('Error al eliminar el elemento');
      throw error;
    }
  };

  useEffect(() => {
    fetchElementos();
  }, []);

  return {
    elementos,
    loading,
    error,
    addElemento,
    updateElemento,
    deleteElemento,
    refetch: fetchElementos,
  };
};