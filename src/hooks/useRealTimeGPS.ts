import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface GPSPosition {
  latitude: number;
  longitude: number;
  precision?: number;
  timestamp: Date;
}

interface RealTimeGPSOptions {
  alarmaId?: string;
  supervisorId?: string;
  isActive?: boolean;
  updateInterval?: number; // in milliseconds, default 60000 (1 minute)
}

export const useRealTimeGPS = (options: RealTimeGPSOptions = {}) => {
  const [currentPosition, setCurrentPosition] = useState<GPSPosition | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const watchIdRef = useRef<number | null>(null);
  
  const {
    alarmaId,
    supervisorId,
    isActive = false,
    updateInterval = 60000
  } = options;

  // Get current GPS position
  const getCurrentPosition = useCallback((): Promise<GPSPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalización no está disponible en este dispositivo'));
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
          let errorMessage = 'Error obteniendo ubicación GPS';
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
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000
        }
      );
    });
  }, []);

  // Save GPS position to database
  const saveGPSPosition = useCallback(async (position: GPSPosition) => {
    if (!alarmaId || !supervisorId) {
      console.warn('No se puede guardar GPS: falta alarmaId o supervisorId');
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
        console.error('Error guardando ubicación GPS:', error);
        setError('Error guardando ubicación GPS');
      } else {
        setLastUpdate(new Date());
        console.log('Ubicación GPS guardada exitosamente');
      }
    } catch (err) {
      console.error('Error inesperado guardando GPS:', err);
      setError('Error inesperado guardando ubicación');
    }
  }, [alarmaId, supervisorId]);

  // Update GPS position (manual or automatic)
  const updateGPSPosition = useCallback(async (showToast = false) => {
    try {
      setError(null);
      const position = await getCurrentPosition();
      setCurrentPosition(position);
      
      if (alarmaId && supervisorId) {
        await saveGPSPosition(position);
        if (showToast) {
          toast({
            title: "Ubicación actualizada",
            description: "GPS actualizado correctamente",
          });
        }
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
  }, [getCurrentPosition, saveGPSPosition, alarmaId, supervisorId, toast]);

  // Start automatic GPS tracking
  const startTracking = useCallback(() => {
    if (!isActive || !alarmaId || !supervisorId) {
      console.warn('No se puede iniciar tracking: condiciones no cumplidas');
      return;
    }

    setIsTracking(true);
    
    // Get initial position
    updateGPSPosition(false);
    
    // Set up interval for automatic updates
    intervalRef.current = setInterval(() => {
      updateGPSPosition(false);
    }, updateInterval);

    console.log(`GPS tracking iniciado con intervalo de ${updateInterval}ms`);
  }, [isActive, alarmaId, supervisorId, updateGPSPosition, updateInterval]);

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
    
    console.log('GPS tracking detenido');
  }, []);

  // Get latest GPS position from database
  const getLatestGPSFromDB = useCallback(async (targetSupervisorId: string, targetAlarmaId: string) => {
    try {
      const { data, error } = await supabase
        .from('supervisor_ubicaciones_tiempo_real')
        .select('*')
        .eq('supervisor_id', targetSupervisorId)
        .eq('alarma_id', targetAlarmaId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      return data ? {
        latitude: Number(data.latitude),
        longitude: Number(data.longitude),
        precision: data.precision_meters,
        timestamp: new Date(data.created_at)
      } : null;
    } catch (err) {
      console.error('Error obteniendo última ubicación GPS:', err);
      return null;
    }
  }, []);

  // Effect to handle tracking state changes
  useEffect(() => {
    if (isActive && alarmaId && supervisorId) {
      startTracking();
    } else {
      stopTracking();
    }

    return () => {
      stopTracking();
    };
  }, [isActive, alarmaId, supervisorId, startTracking, stopTracking]);

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
    updateGPSPosition,
    startTracking,
    stopTracking,
    getLatestGPSFromDB
  };
};