import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface ServicioTecnico {
  id: string;
  cliente_id: string;
  cliente_razon_social: string;
  cliente_direccion: string;
  cliente_telefono?: string;
  cliente_email?: string;
  persona_encargada: string;
  motivo_servicio: string;
  descripcion_detallada?: string;
  tipo_servicio: string;
  tecnico_id?: string;
  tecnico_tipo?: 'propio' | 'externo';
  estado: 'pendiente' | 'aceptado' | 'en_progreso' | 'completado' | 'cancelado';
  prioridad: 'baja' | 'media' | 'alta' | 'urgente';
  fecha_asignacion: string;
  fecha_aceptacion?: string;
  fecha_inicio?: string;
  fecha_finalizacion?: string;
  observaciones_tecnico?: string;
  firma_tecnico?: string;
  firma_cliente?: string;
  materiales_utilizados?: any[];
  tiempo_estimado_horas?: number;
  costo_estimado?: number;
  created_at: string;
  updated_at: string;
}

export interface ObservacionServicio {
  id: string;
  servicio_id: string;
  tecnico_id: string;
  observacion: string;
  tipo_observacion: 'general' | 'inicio' | 'progreso' | 'material' | 'problema' | 'finalizacion';
  created_at: string;
}

export const useServiciosTecnicos = () => {
  const [servicios, setServicios] = useState<ServicioTecnico[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchServicios = async () => {
    try {
      console.log('🔍 Fetching servicios técnicos...');
      
      // Obtener el usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      console.log('👤 Usuario actual en fetch:', user?.id);
      
      // Solo hacer la consulta si tenemos un usuario válido
      if (!user?.id) {
        console.log('❌ No hay usuario autenticado');
        setServicios([]);
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('servicios_tecnicos_asignados')
        .select('*')
        .eq('tecnico_id', user.id) // Filtrar por el usuario actual
        .order('fecha_asignacion', { ascending: false });

      console.log('📊 Servicios data:', data);
      console.log('❌ Servicios error:', error);
      
      if (error) throw error;
      setServicios((data || []) as ServicioTecnico[]);
    } catch (error) {
      console.error('Error fetching servicios:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los servicios técnicos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const aceptarServicio = async (servicioId: string) => {
    try {
      const { error } = await supabase
        .from('servicios_tecnicos_asignados')
        .update({
          estado: 'aceptado',
          fecha_aceptacion: new Date().toISOString(),
          fecha_inicio: new Date().toISOString()
        })
        .eq('id', servicioId);

      if (error) throw error;

      toast({
        title: "Servicio aceptado",
        description: "Has aceptado el servicio técnico exitosamente"
      });

      fetchServicios();
    } catch (error) {
      console.error('Error aceptando servicio:', error);
      toast({
        title: "Error",
        description: "No se pudo aceptar el servicio",
        variant: "destructive"
      });
    }
  };

  const iniciarServicio = async (servicioId: string) => {
    try {
      const { error } = await supabase
        .from('servicios_tecnicos_asignados')
        .update({
          estado: 'en_progreso',
          fecha_inicio: new Date().toISOString()
        })
        .eq('id', servicioId);

      if (error) throw error;

      toast({
        title: "Servicio iniciado",
        description: "El servicio ha sido marcado como en progreso"
      });

      fetchServicios();
    } catch (error) {
      console.error('Error iniciando servicio:', error);
      toast({
        title: "Error",
        description: "No se pudo iniciar el servicio",
        variant: "destructive"
      });
    }
  };

  const completarServicio = async (servicioId: string, observaciones?: string, firma?: string) => {
    try {
      const updateData: any = {
        estado: 'completado',
        fecha_finalizacion: new Date().toISOString()
      };

      if (observaciones) updateData.observaciones_tecnico = observaciones;
      if (firma) updateData.firma_tecnico = firma;

      const { error } = await supabase
        .from('servicios_tecnicos_asignados')
        .update(updateData)
        .eq('id', servicioId);

      if (error) throw error;

      toast({
        title: "Servicio completado",
        description: "El servicio ha sido marcado como completado"
      });

      fetchServicios();
    } catch (error) {
      console.error('Error completando servicio:', error);
      toast({
        title: "Error",
        description: "No se pudo completar el servicio",
        variant: "destructive"
      });
    }
  };

  const agregarObservacion = async (servicioId: string, observacion: string, tipo: ObservacionServicio['tipo_observacion'] = 'general') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { error } = await supabase
        .from('observaciones_servicios_tecnicos')
        .insert({
          servicio_id: servicioId,
          tecnico_id: user.id,
          observacion,
          tipo_observacion: tipo
        });

      if (error) throw error;

      toast({
        title: "Observación agregada",
        description: "La observación ha sido registrada exitosamente"
      });

      return true;
    } catch (error) {
      console.error('Error agregando observación:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar la observación",
        variant: "destructive"
      });
      return false;
    }
  };

  const obtenerObservaciones = async (servicioId: string): Promise<ObservacionServicio[]> => {
    try {
      const { data, error } = await supabase
        .from('observaciones_servicios_tecnicos')
        .select('*')
        .eq('servicio_id', servicioId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []) as ObservacionServicio[];
    } catch (error) {
      console.error('Error obteniendo observaciones:', error);
      return [];
    }
  };

  useEffect(() => {
    fetchServicios();
  }, []);

  return {
    servicios,
    loading,
    fetchServicios,
    aceptarServicio,
    iniciarServicio,
    completarServicio,
    agregarObservacion,
    obtenerObservaciones
  };
};