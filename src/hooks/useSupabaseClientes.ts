import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Cliente {
  id: string;
  nombre: string;
  direccion: string;
  telefono?: string;
  email?: string;
  municipio: string;
  departamento?: string;
  ciudad?: string;
  latitud?: number;
  longitud?: number;
  contacto_alarma?: string;
  tipo_servicio?: string;
  estado: string;
  numero_cuenta?: string;
  empresa_contratada_id?: string;
  servicios_contratados?: {
    alarmas: number;
    revistas: number;
    acompañamientos: number;
  };
  fecha_contrato?: string;
  observaciones?: string;
  created_at: string;
  updated_at: string;
}

export const useSupabaseClientes = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchClientes = async () => {
    try {
      console.log('🔄 Iniciando fetchClientes...');
      setLoading(true);
      
      // Verificar estado de autenticación primero
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('👤 Usuario autenticado en fetchClientes:', user);
      console.log('❌ Error de auth en fetchClientes:', authError);
      
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('📊 Datos recibidos de Supabase:', data);
      console.log('❌ Error de Supabase:', error);

      if (error) {
        console.error('❌ Error detallado:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
      
      // Transform the data to match our Cliente interface
      const transformedData = (data || []).map(item => {
        console.log('🔄 Transformando item:', item);
        return {
          ...item,
          servicios_contratados: typeof item.servicios_contratados === 'string' 
            ? JSON.parse(item.servicios_contratados) 
            : item.servicios_contratados || { alarmas: 0, revistas: 0, acompañamientos: 0 }
        };
      }) as Cliente[];
      
      console.log('✅ Datos transformados:', transformedData);
      setClientes(transformedData);
      console.log('✅ Estado actualizado, terminando loading...');
    } catch (err: any) {
      console.error('❌ Error en fetchClientes:', err);
      setError(err.message);
      
      // Intentar obtener información más detallada del error
      if (err.code === 'PGRST301') {
        console.error('❌ Error RLS - El usuario no tiene permisos para ver los clientes');
        toast({
          title: "Error de permisos",
          description: "No tienes permisos para ver los clientes. Verifica tu autenticación.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: `No se pudieron cargar los clientes: ${err.message}`,
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
      console.log('🏁 fetchClientes completado');
    }
  };

  const addCliente = async (clienteData: Omit<Cliente, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      console.log('🔄 Iniciando addCliente...');
      console.log('📝 Datos del cliente a insertar:', clienteData);
      
      // Verificar estado de autenticación
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('👤 Usuario autenticado:', user);
      console.log('❌ Error de auth:', authError);
      
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      const { data, error } = await supabase
        .from('clientes')
        .insert(clienteData)
        .select()
        .single();

      console.log('📊 Respuesta de inserción:', data);
      console.log('❌ Error de inserción:', error);

      if (error) throw error;
      
      const transformedData = {
        ...data,
        servicios_contratados: typeof data.servicios_contratados === 'string' 
          ? JSON.parse(data.servicios_contratados) 
          : data.servicios_contratados || { alarmas: 0, revistas: 0, acompañamientos: 0 }
      } as Cliente;
      
      setClientes(prev => [transformedData, ...prev]);
      
      // Registrar en minuta de operaciones automáticamente
      try {
        await supabase.from('minuta_operaciones').insert({
          tipo_entrada: 'general',
          contenido: `Cliente registrado: ${clienteData.nombre} - Tipo: ${clienteData.tipo_servicio || 'No especificado'} - Cuenta: ${clienteData.numero_cuenta || 'Generada automáticamente'}`,
          prioridad: 'normal',
          usuario_id: user.id,
          usuario_nombre: user.email || 'Usuario'
        });
        console.log('✅ Registro en minuta de operaciones exitoso');
      } catch (minutaError) {
        console.error('❌ Error al registrar en minuta:', minutaError);
        // No lanzar error para no afectar el registro del cliente
      }
      
      toast({
        title: "Cliente registrado",
        description: "El cliente ha sido registrado exitosamente"
      });
      return { success: true, data: transformedData };
    } catch (err: any) {
      console.error('❌ Error completo en addCliente:', err);
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      });
      throw err;
    }
  };

  const updateCliente = async (id: string, updates: Partial<Cliente>) => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      const transformedData = {
        ...data,
        servicios_contratados: typeof data.servicios_contratados === 'string' 
          ? JSON.parse(data.servicios_contratados) 
          : data.servicios_contratados || { alarmas: 0, revistas: 0, acompañamientos: 0 }
      } as Cliente;
      
      setClientes(prev => prev.map(cliente => 
        cliente.id === id ? transformedData : cliente
      ));
      toast({
        title: "Cliente actualizado",
        description: "Los datos del cliente han sido actualizados"
      });
      return data;
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      });
      throw err;
    }
  };

  const deleteCliente = async (id: string) => {
    try {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setClientes(prev => prev.filter(cliente => cliente.id !== id));
      toast({
        title: "Cliente eliminado",
        description: "El cliente ha sido eliminado del sistema"
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  return {
    clientes,
    loading,
    error,
    addCliente,
    updateCliente,
    deleteCliente,
    refetch: fetchClientes
  };
};