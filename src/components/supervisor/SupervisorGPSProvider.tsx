import { useEffect, useState } from 'react';
import { useAuthConsolidatedContext } from '@/contexts/AuthContextConsolidated';
import { useSupervisorGPSTracking } from '@/hooks/useSupervisorGPSTracking';
import { supabase } from '@/integrations/supabase/client';

export const SupervisorGPSProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthenticated } = useAuthConsolidatedContext();
  const isSupervisor = user?.role === 'supervisor_motorizado';
  const [activeAlarmaId, setActiveAlarmaId] = useState<string | null>(null);
  
  const {
    startTracking,
    stopTracking,
    isTracking,
    hasPermission,
    error
  } = useSupervisorGPSTracking({
    supervisorId: user?.id || '',
    alarmaId: activeAlarmaId || undefined,
    isActive: isAuthenticated && isSupervisor && Boolean(activeAlarmaId),
    updateInterval: 60000 // 1 minuto para servicios activos
  });

  // Detectar alarma activa del supervisor
  useEffect(() => {
    if (!isAuthenticated || !isSupervisor || !user?.id) {
      setActiveAlarmaId(null);
      return;
    }

    const fetchActiveAlarm = async () => {
      const { data, error } = await supabase
        .from('alarmas')
        .select('id, estado')
        .eq('supervisor_id', user.id)
        .eq('estado', 'en_proceso')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data && !error) {
        console.log('🎯 Alarma activa detectada:', data.id);
        setActiveAlarmaId(data.id);
      } else if (activeAlarmaId) {
        console.log('🛑 No hay alarma activa');
        setActiveAlarmaId(null);
      }
    };

    fetchActiveAlarm();

    // Suscripción en tiempo real a cambios en alarmas del supervisor
    const channel = supabase
      .channel('supervisor-alarmas-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'alarmas',
          filter: `supervisor_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔔 Cambio en alarma del supervisor:', payload);
          
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const newRecord = payload.new as any;
            
            if (newRecord.estado === 'en_proceso') {
              console.log('🚀 Alarma entró en proceso:', newRecord.id);
              setActiveAlarmaId(newRecord.id);
            } else if (activeAlarmaId === newRecord.id && newRecord.estado !== 'en_proceso') {
              console.log('🏁 Alarma finalizó o cambió de estado:', newRecord.id);
              setActiveAlarmaId(null);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated, isSupervisor, user?.id, activeAlarmaId]);

  // Auto-activar GPS cuando hay alarma activa
  useEffect(() => {
    if (isAuthenticated && isSupervisor && user?.id && activeAlarmaId) {
      console.log('📍 Alarma activa detectada, iniciando GPS tracking...');
      console.log('🎯 Tracking para alarma:', activeAlarmaId);
      
      if (!isTracking && hasPermission !== false) {
        console.log('🔄 Iniciando GPS tracking automático...');
        startTracking();
      }
    } else if (activeAlarmaId === null && isTracking) {
      console.log('🛑 No hay alarma activa, deteniendo GPS...');
      stopTracking();
    }
  }, [isAuthenticated, isSupervisor, user?.id, activeAlarmaId, isTracking, hasPermission, startTracking, stopTracking]);

  // Log estado del GPS para debugging
  useEffect(() => {
    if (isSupervisor) {
      console.log('📊 Estado GPS Supervisor:', {
        isTracking,
        hasPermission,
        error,
        supervisorId: user?.id,
        activeAlarmaId: activeAlarmaId || 'ninguna'
      });
    }
  }, [isTracking, hasPermission, error, isSupervisor, user?.id, activeAlarmaId]);

  return <>{children}</>;
};