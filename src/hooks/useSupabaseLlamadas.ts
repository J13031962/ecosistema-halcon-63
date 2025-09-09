import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface LlamadaCliente {
  id: string;
  cliente_id: string;
  operador_id: string | null;
  created_at: string;
  contacto_nombre: string;
  numero_telefono: string;
  tipo_llamada: 'celular' | 'smarturban';
  motivo?: string;
  observaciones?: string;
  duracion_segundos: number;
  estado: 'completada' | 'no_contesto' | 'ocupado' | 'fuera_servicio';
}

interface NuevaLlamada {
  cliente_id: string;
  contacto_nombre: string;
  numero_telefono: string;
  tipo_llamada: 'celular' | 'smarturban';
  motivo?: string;
  observaciones?: string;
  duracion_segundos?: number;
  estado?: 'completada' | 'no_contesto' | 'ocupado' | 'fuera_servicio';
}

export const useSupabaseLlamadas = () => {
  const [llamadas, setLlamadas] = useState<LlamadaCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchLlamadas = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('llamadas_clientes')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error al obtener llamadas:', fetchError);
        setError(fetchError.message);
        return;
      }

      setLlamadas((data || []) as LlamadaCliente[]);
    } catch (error) {
      console.error('Error al obtener llamadas:', error);
      setError('Error al cargar las llamadas');
    } finally {
      setLoading(false);
    }
  };

  const addLlamada = async (llamadaData: NuevaLlamada): Promise<LlamadaCliente | null> => {
    try {
      // Obtener el usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      
      const nuevaLlamada = {
        ...llamadaData,
        operador_id: user?.id || null,
        estado: llamadaData.estado || 'completada',
        duracion_segundos: llamadaData.duracion_segundos || 0
      };

      const { data, error: insertError } = await supabase
        .from('llamadas_clientes')
        .insert([nuevaLlamada])
        .select()
        .single();

      if (insertError) {
        console.error('Error al crear llamada:', insertError);
        toast({
          title: "Error",
          description: "No se pudo registrar la llamada",
          variant: "destructive"
        });
        return null;
      }

      toast({
        title: "Llamada registrada",
        description: "La llamada ha sido registrada exitosamente"
      });

      // Actualizar la lista local
      setLlamadas(prev => [data as LlamadaCliente, ...prev]);
      
      return data as LlamadaCliente;
    } catch (error) {
      console.error('Error al crear llamada:', error);
      toast({
        title: "Error",
        description: "Error al registrar la llamada",
        variant: "destructive"
      });
      return null;
    }
  };

  const getLlamadasByCliente = async (clienteId: string): Promise<LlamadaCliente[]> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('llamadas_clientes')
        .select('*')
        .eq('cliente_id', clienteId)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error al obtener llamadas del cliente:', fetchError);
        return [];
      }

      return (data || []) as LlamadaCliente[];
    } catch (error) {
      console.error('Error al obtener llamadas del cliente:', error);
      return [];
    }
  };

  const getEstadisticasLlamadas = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('llamadas_clientes')
        .select(`
          *,
          clientes!inner(nombre)
        `)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error al obtener estadísticas de llamadas:', fetchError);
        return {
          totalLlamadas: 0,
          llamadasCelular: 0,
          llamadasSmartUrban: 0,
          clientesConMasLlamadas: []
        };
      }

      const totalLlamadas = data?.length || 0;
      const llamadasCelular = data?.filter(l => l.tipo_llamada === 'celular').length || 0;
      const llamadasSmartUrban = data?.filter(l => l.tipo_llamada === 'smarturban').length || 0;

      // Calcular clientes con más llamadas
      const clientesMap = new Map();
      data?.forEach(llamada => {
        const clienteId = llamada.cliente_id;
        const clienteNombre = (llamada as any).clientes?.nombre || 'Cliente desconocido';
        
        if (!clientesMap.has(clienteId)) {
          clientesMap.set(clienteId, {
            cliente_id: clienteId,
            cliente_nombre: clienteNombre,
            total_llamadas: 0,
            llamadas_celular: 0,
            llamadas_smarturban: 0
          });
        }
        
        const cliente = clientesMap.get(clienteId);
        cliente.total_llamadas += 1;
        if (llamada.tipo_llamada === 'celular') {
          cliente.llamadas_celular += 1;
        } else {
          cliente.llamadas_smarturban += 1;
        }
      });

      const clientesConMasLlamadas = Array.from(clientesMap.values())
        .sort((a, b) => b.total_llamadas - a.total_llamadas)
        .slice(0, 10);

      return {
        totalLlamadas,
        llamadasCelular,
        llamadasSmartUrban,
        clientesConMasLlamadas
      };
    } catch (error) {
      console.error('Error al obtener estadísticas de llamadas:', error);
      return {
        totalLlamadas: 0,
        llamadasCelular: 0,
        llamadasSmartUrban: 0,
        clientesConMasLlamadas: []
      };
    }
  };

  useEffect(() => {
    fetchLlamadas();
  }, []);

  return {
    llamadas,
    loading,
    error,
    addLlamada,
    getLlamadasByCliente,
    getEstadisticasLlamadas,
    refetch: fetchLlamadas
  };
};