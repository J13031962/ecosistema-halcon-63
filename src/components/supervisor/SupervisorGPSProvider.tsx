import { useEffect } from 'react';
import { useAuthConsolidatedContext } from '@/contexts/AuthContextConsolidated';
import { useSupervisorGPSTracking } from '@/hooks/useSupervisorGPSTracking';

export const SupervisorGPSProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthenticated } = useAuthConsolidatedContext();
  const isSupervisor = user?.role === 'supervisor_motorizado';
  
  const {
    startTracking,
    stopTracking,
    isTracking,
    hasPermission,
    error
  } = useSupervisorGPSTracking({
    supervisorId: user?.id || '',
    isActive: isAuthenticated && isSupervisor,
    updateInterval: 180000 // 3 minutos
  });

  // Escuchar evento de login de supervisor
  useEffect(() => {
    const handleSupervisorLogin = (event: CustomEvent) => {
      const { supervisorId } = event.detail;
      console.log('🎯 Evento supervisor-login detectado:', supervisorId);
      
      if (user?.id === supervisorId && isSupervisor) {
        console.log('🚀 Activando GPS automáticamente para supervisor...');
        startTracking();
      }
    };

    window.addEventListener('supervisor-login', handleSupervisorLogin as EventListener);
    
    return () => {
      window.removeEventListener('supervisor-login', handleSupervisorLogin as EventListener);
    };
  }, [user?.id, isSupervisor, startTracking]);

  // Auto-activar GPS para supervisores autenticados
  useEffect(() => {
    if (isAuthenticated && isSupervisor && user?.id) {
      console.log('📍 Supervisor autenticado detectado, verificando GPS...');
      
      // Solo iniciar si no está ya rastreando
      if (!isTracking && hasPermission !== false) {
        console.log('🔄 Iniciando GPS tracking automático...');
        startTracking();
      }
    } else if (!isSupervisor && isTracking) {
      console.log('🛑 Usuario no es supervisor, deteniendo GPS...');
      stopTracking();
    }
  }, [isAuthenticated, isSupervisor, user?.id, isTracking, hasPermission, startTracking, stopTracking]);

  // Log estado del GPS para debugging
  useEffect(() => {
    if (isSupervisor) {
      console.log('📊 Estado GPS Supervisor:', {
        isTracking,
        hasPermission,
        error,
        supervisorId: user?.id
      });
    }
  }, [isTracking, hasPermission, error, isSupervisor, user?.id]);

  return <>{children}</>;
};