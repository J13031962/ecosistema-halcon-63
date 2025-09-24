import { differenceInSeconds } from 'date-fns';

export interface TiemposServicio {
  aceptacionDespachador: number | null;
  despachadorEnvio: number | null;
  supervisorAceptacion: number | null;
  supervisorLlegada: number | null;
  supervisorSalida: number | null;
  tiempoTotal: number;
}

/**
 * Formatea tiempo en segundos a formato MM:SS o HH:MM:SS
 * Usa la misma lógica que useOptimizedCronometer
 */
export function formatearTiempoAlarma(segundos: number): string {
  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  const segs = segundos % 60;
  
  if (horas > 0) {
    return `${horas}:${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
  }
  return `${minutos}:${segs.toString().padStart(2, '0')}`;
}

/**
 * Calcula duración en segundos entre dos fechas
 */
export function calcularDuracionSegundos(fechaInicio: string, fechaFin: string): number {
  return differenceInSeconds(new Date(fechaFin), new Date(fechaInicio));
}

/**
 * Calcula los tiempos de servicio usando la misma lógica que useOptimizedCronometer
 * Solo devuelve tiempos cuando existen ambos timestamps para esa etapa
 */
export function calcularTiemposServicio(alarma: any): TiemposServicio {
  const fechaCreacion = new Date(alarma.created_at);
  const fechaTomaDespachador = alarma.tiempo_toma_despachador ? new Date(alarma.tiempo_toma_despachador) : null;
  const fechaAsignacion = alarma.tiempo_asignacion_supervisor ? new Date(alarma.tiempo_asignacion_supervisor) : null;
  const fechaAceptacion = alarma.tiempo_aceptacion_supervisor ? new Date(alarma.tiempo_aceptacion_supervisor) : null;
  const fechaPrimeraLectura = alarma.tiempo_primera_lectura_qr ? new Date(alarma.tiempo_primera_lectura_qr) : null;
  const fechaSegundaLectura = alarma.tiempo_segunda_lectura_qr ? new Date(alarma.tiempo_segunda_lectura_qr) : null;
  const fechaResolucion = alarma.resolved_at ? new Date(alarma.resolved_at) : null;

  return {
    // Solo calcular si existen ambos timestamps
    aceptacionDespachador: fechaTomaDespachador 
      ? differenceInSeconds(fechaTomaDespachador, fechaCreacion)
      : null,
    
    despachadorEnvio: fechaTomaDespachador && fechaAsignacion 
      ? differenceInSeconds(fechaAsignacion, fechaTomaDespachador)
      : null,
    
    supervisorAceptacion: fechaAsignacion && fechaAceptacion
      ? differenceInSeconds(fechaAceptacion, fechaAsignacion)
      : null,
    
    supervisorLlegada: fechaAceptacion && fechaPrimeraLectura 
      ? differenceInSeconds(fechaPrimeraLectura, fechaAceptacion)
      : null,
    
    supervisorSalida: fechaPrimeraLectura && fechaSegundaLectura 
      ? differenceInSeconds(fechaSegundaLectura, fechaPrimeraLectura)
      : null,
    
    // Tiempo total: desde creación hasta resolución (o segunda lectura QR)
    tiempoTotal: fechaSegundaLectura
      ? differenceInSeconds(fechaSegundaLectura, fechaCreacion)
      : fechaResolucion
        ? differenceInSeconds(fechaResolucion, fechaCreacion)
        : 0
  };
}