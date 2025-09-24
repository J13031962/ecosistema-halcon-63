import { useMemo, useCallback } from 'react';
import { differenceInSeconds } from 'date-fns';
import { useGlobalTimer } from './useGlobalTimer';

interface TiempoEstado {
  segundos: number;
  color: 'green' | 'yellow' | 'orange' | 'red' | 'red-blink' | 'text-red-500';
  fase: 'espera_despachador' | 'desplazamiento' | 'en_sitio' | 'finalizada' | 'cancelada';
}

interface CronometroPorFases {
  aceptacion_despachador: { tiempo: number; color: 'green' | 'red' };
  despachador_envio: { tiempo: number; color: 'green' | 'red' };
  supervisor_aceptacion: { tiempo: number; color: 'green' | 'red' };
  supervisor_llegada: { tiempo: number; color: 'green' | 'red' };
  supervisor_salida: { tiempo: number; color: 'green' | 'red' };
}

interface UseOptimizedCronometerProps {
  created_at: string;
  estado: 'activa' | 'asignada' | 'en_proceso' | 'resuelta' | 'cancelada';
  tiempo_toma_despachador?: string;
  tiempo_asignacion_supervisor?: string;
  tiempo_aceptacion_supervisor?: string;
  tiempo_primera_lectura_qr?: string;
  tiempo_segunda_lectura_qr?: string;
  resolved_at?: string;
}

export const useOptimizedCronometer = ({
  created_at,
  estado,
  tiempo_toma_despachador,
  tiempo_asignacion_supervisor,
  tiempo_aceptacion_supervisor,
  tiempo_primera_lectura_qr,
  tiempo_segunda_lectura_qr,
  resolved_at
}: UseOptimizedCronometerProps) => {
  const { currentTime } = useGlobalTimer();

  // Calculate freeze time for cancelled/resolved alarms
  const freezeTime = useMemo(() => {
    if ((estado === 'cancelada' || estado === 'resuelta') && resolved_at) {
      return new Date(resolved_at);
    }
    return new Date(currentTime);
  }, [estado, resolved_at, currentTime]);

  // Memoize date objects to avoid recreation on every render
  const dateObjects = useMemo(() => ({
    fechaCreacion: new Date(created_at),
    fechaTomaDespachador: tiempo_toma_despachador ? new Date(tiempo_toma_despachador) : null,
    fechaAsignacion: tiempo_asignacion_supervisor ? new Date(tiempo_asignacion_supervisor) : null,
    fechaAceptacion: tiempo_aceptacion_supervisor ? new Date(tiempo_aceptacion_supervisor) : null,
    fechaPrimeraLectura: tiempo_primera_lectura_qr ? new Date(tiempo_primera_lectura_qr) : null,
    fechaSegundaLectura: tiempo_segunda_lectura_qr ? new Date(tiempo_segunda_lectura_qr) : null,
  }), [
    created_at,
    tiempo_toma_despachador,
    tiempo_asignacion_supervisor,
    tiempo_aceptacion_supervisor,
    tiempo_primera_lectura_qr,
    tiempo_segunda_lectura_qr
  ]);

  // Memoized function to calculate timer color based on elapsed time and thresholds
  const calculateTimerColor = useCallback((
    segundos: number, 
    thresholds: { yellow: number; orange: number; red: number; redBlink: number }
  ): TiempoEstado['color'] => {
    if (segundos > thresholds.redBlink) return 'red-blink';
    if (segundos > thresholds.red) return 'red';
    if (segundos > thresholds.orange) return 'orange';
    if (segundos > thresholds.yellow) return 'yellow';
    return 'green';
  }, []);

  // Calculate current timer state
  const tiempoActual = useMemo((): TiempoEstado => {
    const ahora = new Date(currentTime);
    const {
      fechaCreacion,
      fechaTomaDespachador,
      fechaAsignacion,
      fechaAceptacion,
      fechaPrimeraLectura,
      fechaSegundaLectura
    } = dateObjects;

    if (estado === 'resuelta') {
      return {
        segundos: fechaSegundaLectura ? differenceInSeconds(fechaSegundaLectura, fechaCreacion) : 0,
        color: 'green',
        fase: 'finalizada' as const
      };
    }

    if (estado === 'cancelada') {
      // Para alarmas canceladas, calcular tiempo hasta la cancelación
      const fechaCancelacion = resolved_at ? new Date(resolved_at) : ahora;
      return {
        segundos: differenceInSeconds(fechaCancelacion, fechaCreacion),
        color: 'text-red-500',
        fase: 'cancelada' as const
      };
    }

    if (fechaSegundaLectura) {
      return {
        segundos: differenceInSeconds(fechaSegundaLectura, fechaCreacion),
        color: 'green',
        fase: 'finalizada'
      };
    }

    if (fechaPrimeraLectura) {
      const segundosEnSitio = differenceInSeconds(ahora, fechaPrimeraLectura);
      const color = calculateTimerColor(segundosEnSitio, {
        yellow: 1800,  // 30 min
        orange: 2400,  // 40 min
        red: 3600,     // 1 hour
        redBlink: 4500 // 1h 15min
      });

      return {
        segundos: segundosEnSitio,
        color,
        fase: 'en_sitio'
      };
    }

    if (fechaAsignacion) {
      const segundosDesplazamiento = differenceInSeconds(ahora, fechaAsignacion);
      const color = calculateTimerColor(segundosDesplazamiento, {
        yellow: 1200,  // 20 min
        orange: 1800,  // 30 min
        red: 2100,     // 35 min
        redBlink: 2400 // 40 min
      });

      return {
        segundos: segundosDesplazamiento,
        color,
        fase: 'desplazamiento'
      };
    }

    if (estado === 'en_proceso' && fechaTomaDespachador) {
      const segundosDesdeAtencion = differenceInSeconds(ahora, fechaTomaDespachador);
      const color = calculateTimerColor(segundosDesdeAtencion, {
        yellow: 60,   // 1 min
        orange: 120,  // 2 min
        red: 180,     // 3 min
        redBlink: 240 // 4 min
      });

      return {
        segundos: segundosDesdeAtencion,
        color,
        fase: 'espera_despachador'
      };
    }

    // Default: waiting for dispatcher attention
    const segundosEspera = differenceInSeconds(ahora, fechaCreacion);
    const color = calculateTimerColor(segundosEspera, {
      yellow: 60,   // 1 min
      orange: 120,  // 2 min
      red: 180,     // 3 min
      redBlink: 240 // 4 min
    });

    return {
      segundos: segundosEspera,
      color,
      fase: 'espera_despachador'
    };
  }, [currentTime, dateObjects, estado, calculateTimerColor]);

  // Calculate total time
  const tiempoTotal = useMemo(() => {
    const { fechaCreacion, fechaSegundaLectura } = dateObjects;
    
    return fechaSegundaLectura
      ? differenceInSeconds(fechaSegundaLectura, fechaCreacion)
      : differenceInSeconds(freezeTime, fechaCreacion);
  }, [freezeTime, dateObjects]);

  // Calculate time until supervisor arrival (freezes when supervisor arrives)
  const tiempoHastaLlegada = useMemo(() => {
    const { fechaCreacion, fechaPrimeraLectura } = dateObjects;
    
    return fechaPrimeraLectura
      ? differenceInSeconds(fechaPrimeraLectura, fechaCreacion)
      : differenceInSeconds(freezeTime, fechaCreacion);
  }, [freezeTime, dateObjects]);

  // Calculate specific phase timers
  const cronometrosEspecificos = useMemo((): CronometroPorFases => {
    const {
      fechaCreacion,
      fechaTomaDespachador,
      fechaAsignacion,
      fechaAceptacion,
      fechaPrimeraLectura,
      fechaSegundaLectura
    } = dateObjects;

    return {
      aceptacion_despachador: {
        tiempo: fechaTomaDespachador 
          ? differenceInSeconds(fechaTomaDespachador, fechaCreacion)
          : differenceInSeconds(freezeTime, fechaCreacion),
        color: (!fechaTomaDespachador && differenceInSeconds(freezeTime, fechaCreacion) > 240) ? 'red' : 'green'
      },
      
      despachador_envio: {
        tiempo: fechaTomaDespachador && fechaAsignacion 
          ? differenceInSeconds(fechaAsignacion, fechaTomaDespachador)
          : fechaTomaDespachador 
            ? differenceInSeconds(freezeTime, fechaTomaDespachador) 
            : 0,
        color: (fechaTomaDespachador && !fechaAsignacion && differenceInSeconds(freezeTime, fechaTomaDespachador) > 360) ? 'red' : 'green'
      },
      
      supervisor_aceptacion: {
        tiempo: fechaAsignacion && fechaAceptacion
          ? differenceInSeconds(fechaAceptacion, fechaAsignacion)
          : fechaAsignacion 
            ? differenceInSeconds(freezeTime, fechaAsignacion) 
            : 0,
        color: (fechaAsignacion && !fechaAceptacion && differenceInSeconds(freezeTime, fechaAsignacion) > 300) ? 'red' : 'green'
      },
      
      supervisor_llegada: {
        tiempo: fechaAceptacion && fechaPrimeraLectura 
          ? differenceInSeconds(fechaPrimeraLectura, fechaAceptacion)
          : fechaAceptacion ? differenceInSeconds(freezeTime, fechaAceptacion) : 0,
        color: (fechaAceptacion && !fechaPrimeraLectura && differenceInSeconds(freezeTime, fechaAceptacion) > 1200) ? 'red' : 'green'
      },
      
      supervisor_salida: {
        tiempo: fechaPrimeraLectura && fechaSegundaLectura 
          ? differenceInSeconds(fechaSegundaLectura, fechaPrimeraLectura)
          : fechaPrimeraLectura ? differenceInSeconds(freezeTime, fechaPrimeraLectura) : 0,
        color: (fechaPrimeraLectura && !fechaSegundaLectura && differenceInSeconds(freezeTime, fechaPrimeraLectura) > 3600) ? 'red' : 'green'
      }
    };
  }, [freezeTime, dateObjects]);

  // Utility functions
  const formatTiempo = useCallback((segundos: number) => {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = segundos % 60;
    
    if (horas > 0) {
      return `${horas}:${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
    }
    return `${minutos}:${segs.toString().padStart(2, '0')}`;
  }, []);

  const getFaseTexto = useCallback(() => {
    switch (tiempoActual.fase) {
      case 'espera_despachador':
        return estado === 'activa' ? 'Esperando atención' : 'Esperando asignación';
      case 'desplazamiento':
        return 'En desplazamiento';
      case 'en_sitio':
        return 'En sitio';
      case 'finalizada':
        return 'Finalizada';
      case 'cancelada':
        return 'Asignación cancelada';
      default:
        return 'Pendiente';
    }
  }, [tiempoActual.fase, estado]);

  return {
    tiempoActual,
    tiempoTotal,
    tiempoHastaLlegada,
    cronometrosEspecificos,
    formatTiempo,
    getFaseTexto
  };
};