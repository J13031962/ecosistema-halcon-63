import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TurnoOperador {
  id: string;
  fecha: string;
  turno: string;
  operador_id?: string;
  operador_nombre?: string;
  horario_inicio?: string;
  horario_fin?: string;
  created_at: string;
}

export interface TurnoSupervisor {
  id: string;
  fecha: string;
  turno: string;
  supervisor_id?: string;
  supervisor_nombre?: string;
  horario_inicio?: string;
  horario_fin?: string;
  created_at: string;
}

export const useSupabaseTurnos = () => {
  const [turnosOperador, setTurnosOperador] = useState<TurnoOperador[]>([]);
  const [turnosSupervisor, setTurnosSupervisor] = useState<TurnoSupervisor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchTurnos = async () => {
    try {
      setLoading(true);
      
      const [operadorData, supervisorData] = await Promise.all([
        supabase
          .from('turnos_operador')
          .select('*')
          .order('fecha', { ascending: true }),
        supabase
          .from('turnos_supervisor')
          .select('*')
          .order('fecha', { ascending: true })
      ]);

      if (operadorData.error) throw operadorData.error;
      if (supervisorData.error) throw supervisorData.error;

      setTurnosOperador(operadorData.data || []);
      setTurnosSupervisor(supervisorData.data || []);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error",
        description: "No se pudieron cargar los turnos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addTurnoOperador = async (turnoData: {
    fecha: string;
    turno: string;
    operador_id?: string;
    operador_nombre?: string;
    horario_inicio?: string;
    horario_fin?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('turnos_operador')
        .insert([turnoData])
        .select()
        .single();

      if (error) throw error;
      
      setTurnosOperador(prev => [...prev, data]);
      toast({
        title: "Turno asignado",
        description: "Turno de operador asignado exitosamente"
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

  const addTurnoSupervisor = async (turnoData: {
    fecha: string;
    turno: string;
    supervisor_id?: string;
    supervisor_nombre?: string;
    horario_inicio?: string;
    horario_fin?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('turnos_supervisor')
        .insert([turnoData])
        .select()
        .single();

      if (error) throw error;
      
      setTurnosSupervisor(prev => [...prev, data]);
      toast({
        title: "Turno asignado",
        description: "Turno de supervisor asignado exitosamente"
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

  const updateTurnoOperador = async (id: string, updates: Partial<TurnoOperador>) => {
    try {
      const { data, error } = await supabase
        .from('turnos_operador')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setTurnosOperador(prev => prev.map(turno => 
        turno.id === id ? data : turno
      ));
      toast({
        title: "Turno actualizado",
        description: "El turno del operador ha sido actualizado"
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

  const updateTurnoSupervisor = async (id: string, updates: Partial<TurnoSupervisor>) => {
    try {
      const { data, error } = await supabase
        .from('turnos_supervisor')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setTurnosSupervisor(prev => prev.map(turno => 
        turno.id === id ? data : turno
      ));
      toast({
        title: "Turno actualizado",
        description: "El turno del supervisor ha sido actualizado"
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

  const deleteTurnoOperador = async (id: string) => {
    try {
      const { error } = await supabase
        .from('turnos_operador')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setTurnosOperador(prev => prev.filter(turno => turno.id !== id));
      toast({
        title: "Turno eliminado",
        description: "El turno del operador ha sido eliminado exitosamente"
      });
      return true;
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      });
      throw err;
    }
  };

  const deleteTurnoSupervisor = async (id: string) => {
    try {
      const { error } = await supabase
        .from('turnos_supervisor')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setTurnosSupervisor(prev => prev.filter(turno => turno.id !== id));
      toast({
        title: "Turno eliminado",
        description: "El turno del supervisor ha sido eliminado exitosamente"
      });
      return true;
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      });
      throw err;
    }
  };

  const deleteTurnoPeriodoOperador = async (fechaInicio: string, fechaFin: string, operadorIds: string[]) => {
    try {
      const { error } = await supabase
        .from('turnos_operador')
        .delete()
        .gte('fecha', fechaInicio)
        .lte('fecha', fechaFin)
        .in('operador_id', operadorIds);

      if (error) throw error;
      
      setTurnosOperador(prev => prev.filter(turno => 
        !(turno.fecha >= fechaInicio && turno.fecha <= fechaFin && operadorIds.includes(turno.operador_id || ''))
      ));
      
      toast({
        title: "Período eliminado",
        description: `Turnos del período ${fechaInicio} al ${fechaFin} eliminados exitosamente`
      });
      return true;
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      });
      throw err;
    }
  };

  const deleteTurnoPeriodoSupervisor = async (fechaInicio: string, fechaFin: string, supervisorIds: string[]) => {
    try {
      const { error } = await supabase
        .from('turnos_supervisor')
        .delete()
        .gte('fecha', fechaInicio)
        .lte('fecha', fechaFin)
        .in('supervisor_id', supervisorIds);

      if (error) throw error;
      
      setTurnosSupervisor(prev => prev.filter(turno => 
        !(turno.fecha >= fechaInicio && turno.fecha <= fechaFin && supervisorIds.includes(turno.supervisor_id || ''))
      ));
      
      toast({
        title: "Período eliminado",
        description: `Turnos del período ${fechaInicio} al ${fechaFin} eliminados exitosamente`
      });
      return true;
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
    fetchTurnos();

    // Configurar tiempo real para turnos_operador
    const turnosOperadorChannel = supabase
      .channel('turnos_operador_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'turnos_operador'
        },
        (payload) => {
          console.log('Cambio en turnos_operador:', payload);
          if (payload.eventType === 'INSERT') {
            setTurnosOperador(prev => [...prev, payload.new as TurnoOperador]);
          } else if (payload.eventType === 'UPDATE') {
            setTurnosOperador(prev => prev.map(turno => 
              turno.id === payload.new.id ? payload.new as TurnoOperador : turno
            ));
          } else if (payload.eventType === 'DELETE') {
            setTurnosOperador(prev => prev.filter(turno => turno.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Configurar tiempo real para turnos_supervisor
    const turnosSupervisorChannel = supabase
      .channel('turnos_supervisor_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'turnos_supervisor'
        },
        (payload) => {
          console.log('Cambio en turnos_supervisor:', payload);
          if (payload.eventType === 'INSERT') {
            setTurnosSupervisor(prev => [...prev, payload.new as TurnoSupervisor]);
          } else if (payload.eventType === 'UPDATE') {
            setTurnosSupervisor(prev => prev.map(turno => 
              turno.id === payload.new.id ? payload.new as TurnoSupervisor : turno
            ));
          } else if (payload.eventType === 'DELETE') {
            setTurnosSupervisor(prev => prev.filter(turno => turno.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(turnosOperadorChannel);
      supabase.removeChannel(turnosSupervisorChannel);
    };
  }, []);

  return {
    turnosOperador,
    turnosSupervisor,
    loading,
    error,
    addTurnoOperador,
    addTurnoSupervisor,
    updateTurnoOperador,
    updateTurnoSupervisor,
    deleteTurnoOperador,
    deleteTurnoSupervisor,
    deleteTurnoPeriodoOperador,
    deleteTurnoPeriodoSupervisor,
    refetch: fetchTurnos
  };
};