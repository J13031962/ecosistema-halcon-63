import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface GPSPosition {
  latitude: number;
  longitude: number;
  precision?: number;
  timestamp: Date;
}

interface SupervisorGPSTrackingOptions {
  supervisorId: string;
  alarmaId?: string; // ID de la alarma activa (opcional)
  isActive?: boolean;
  updateInterval?: number; // in milliseconds, default 180000 (3 minutes)
}

export const useSupervisorGPSTracking = (options: SupervisorGPSTrackingOptions) => {
  const [currentPosition, setCurrentPosition] = useState<GPSPosition | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const { toast } = useToast();
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const watchIdRef = useRef<number | null>(null);
  
  const {
    supervisorId,
    alarmaId,
    isActive = false,
    updateInterval = 180000 // 3 minutos por defecto
  } = options;

  // Request GPS permissions
  const requestGPSPermission = useCallback(async (): Promise<boolean> => {
    try {
      if (!navigator.geolocation) {
        setError('Geolocalización no está disponible en este dispositivo');
        setHasPermission(false);
        return false;
      }

      // Test if we can get location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        });
      });

      setHasPermission(true);
      console.log('✅ Permisos GPS concedidos para supervisor:', supervisorId);
      
      // Save initial position
      const gpsData: GPSPosition = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        precision: position.coords.accuracy,
        timestamp: new Date()
      };
      
      setCurrentPosition(gpsData);
      return true;

    } catch (error: any) {
      let errorMessage = 'Error obteniendo permisos GPS';
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Permisos de ubicación denegados';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Ubicación GPS no disponible';
          break;
        case error.TIMEOUT:
          errorMessage = 'Timeout obteniendo ubicación GPS';
          break;
      }
      
      console.error('❌ Error GPS:', errorMessage, error);
      setError(errorMessage);
      setHasPermission(false);
      return false;
    }
  }, [supervisorId]);

  // Get current GPS position
  const getCurrentPosition = useCallback((): Promise<GPSPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalización no está disponible'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const gpsData: GPSPosition = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            precision: position.coords.accuracy,
            timestamp: new Date()
          };
          resolve(gpsData);
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 30000
        }
      );
    });
  }, []);

  // Save GPS position to database (with specific alarm ID when in service)
  const saveGPSPosition = useCallback(async (position: GPSPosition) => {
    if (!supervisorId) {
      console.warn('⚠️ No se puede guardar GPS sin supervisor_id');
      return;
    }

    // Solo guardar si hay alarmaId (modo servicio activo)
    if (!alarmaId) {
      console.log('⏸️ GPS no guardado - esperando alarma activa');
      return;
    }

    try {
      const { error } = await supabase
        .from('supervisor_ubicaciones_tiempo_real')
        .insert({
          supervisor_id: supervisorId,
          alarma_id: alarmaId,
          latitude: position.latitude,
          longitude: position.longitude,
          precision_meters: position.precision ? Math.round(position.precision) : null
        });

      if (error) {
        console.error('❌ Error guardando ubicación GPS:', error);
        setError('Error guardando ubicación GPS');
        
        // Improved error handling with more specific messages
        let errorMessage = "No se pudo guardar la ubicación";
        if (error.code === '42501') {
          errorMessage = "Permisos insuficientes para guardar ubicación. Verifique que tenga una sesión activa de Supabase.";
        } else if (error.code === '23503') {
          errorMessage = "ID de supervisor no válido";
        } else if (error.code !== '23505') { // Ignore duplicate key errors
          errorMessage = error.message || errorMessage;
        }
        
        if (error.code !== '23505') { // Only show toast for non-duplicate errors
          toast({
            title: "Error GPS",
            description: errorMessage,
            variant: "destructive",
          });
        }
      } else {
        setLastUpdate(new Date());
        setError(null); // Clear any previous errors
        console.log('✅ Ubicación GPS guardada:', {
          supervisor_id: supervisorId,
          alarma_id: alarmaId,
          lat: position.latitude.toFixed(6),
          lng: position.longitude.toFixed(6)
        });
      }
    } catch (err) {
      console.error('❌ Error inesperado guardando GPS:', err);
    }
  }, [supervisorId, alarmaId, toast]);

  // Update GPS position
  const updateGPSPosition = useCallback(async (showToast = false) => {
    try {
      const position = await getCurrentPosition();
      setCurrentPosition(position);
      await saveGPSPosition(position);
      
      if (showToast) {
        toast({
          title: "Ubicación actualizada",
          description: "GPS actualizado correctamente",
        });
      }
      
      return position;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error obteniendo ubicación';
      setError(errorMessage);
      
      if (showToast) {
        toast({
          title: "Error GPS",
          description: errorMessage,
          variant: "destructive",
        });
      }
      throw err;
    }
  }, [getCurrentPosition, saveGPSPosition, toast]);

  // Start continuous GPS tracking
  const startTracking = useCallback(async () => {
    if (!supervisorId) {
      console.warn('❌ No se puede iniciar tracking: falta supervisorId');
      return false;
    }

    console.log('🚀 Iniciando tracking GPS para supervisor:', supervisorId);
    
    // First check permissions
    const hasGPSPermission = await requestGPSPermission();
    if (!hasGPSPermission) {
      console.error('❌ No se pudieron obtener permisos GPS');
      return false;
    }

    setIsTracking(true);
    setError(null);
    
    try {
      // Get initial position
      await updateGPSPosition(false);
      
      // Set up interval for automatic updates
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      intervalRef.current = setInterval(async () => {
        try {
          await updateGPSPosition(false);
        } catch (error) {
          console.error('❌ Error en actualización automática GPS:', error);
        }
      }, updateInterval);

      console.log(`✅ GPS tracking iniciado con intervalo de ${updateInterval/1000}s`);
      
      toast({
        title: "GPS Activado",
        description: "Ubicación siendo monitoreada en tiempo real",
      });
      
      return true;
      
    } catch (error) {
      console.error('❌ Error iniciando tracking GPS:', error);
      setIsTracking(false);
      return false;
    }
  }, [supervisorId, requestGPSPermission, updateGPSPosition, updateInterval, toast]);

  // Stop GPS tracking
  const stopTracking = useCallback(() => {
    setIsTracking(false);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    
    console.log('🛑 GPS tracking detenido para supervisor:', supervisorId);
  }, [supervisorId]);

  // Effect to handle activation
  useEffect(() => {
    if (isActive && supervisorId) {
      startTracking();
    } else {
      stopTracking();
    }

    return () => {
      stopTracking();
    };
  }, [isActive, supervisorId, startTracking, stopTracking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  return {
    currentPosition,
    isTracking,
    lastUpdate,
    error,
    hasPermission,
    updateGPSPosition,
    startTracking,
    stopTracking,
    requestGPSPermission
  };
};