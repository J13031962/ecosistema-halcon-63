import { addHours, differenceInMinutes, isAfter, isBefore, parseISO, format } from 'date-fns';

export interface CalculoHoras {
  horas_diurnas: number;
  horas_nocturnas: number;
  horas_domingo: number;
  horas_feriado: number;
  total_horas: number;
}

export interface TurnoCompleto {
  fecha: Date;
  hora_inicio: string;
  hora_fin: string;
  es_domingo: boolean;
  es_feriado: boolean;
}

// Horarios de referencia
const HORA_INICIO_DIURNO = 6; // 06:00
const HORA_FIN_DIURNO = 19; // 19:00

// Lista de feriados configurables (formato YYYY-MM-DD)
const FERIADOS_2025 = [
  '2025-01-01', // Año Nuevo
  '2025-01-06', // Reyes Magos
  '2025-03-24', // San José
  '2025-04-17', // Jueves Santo
  '2025-04-18', // Viernes Santo
  '2025-05-01', // Día del Trabajo
  '2025-05-29', // Ascensión del Señor
  '2025-06-19', // Corpus Christi
  '2025-06-23', // Sagrado Corazón
  '2025-07-20', // Día de la Independencia
  '2025-08-07', // Batalla de Boyacá
  '2025-08-18', // Asunción de la Virgen
  '2025-10-13', // Día de la Raza
  '2025-11-03', // Todos los Santos
  '2025-11-17', // Independencia de Cartagena
  '2025-12-08', // Inmaculada Concepción
  '2025-12-25', // Navidad
];

export const esFeriado = (fecha: Date): boolean => {
  const fechaString = format(fecha, 'yyyy-MM-dd');
  return FERIADOS_2025.includes(fechaString);
};

export const esDomingo = (fecha: Date): boolean => {
  return fecha.getDay() === 0;
};

export const calcularHorasTurno = (turno: TurnoCompleto): CalculoHoras => {
  const { fecha, hora_inicio, hora_fin, es_domingo, es_feriado } = turno;
  
  // Crear objetos Date para inicio y fin del turno
  const [horaInicioH, horaInicioM] = hora_inicio.split(':').map(Number);
  const [horaFinH, horaFinM] = hora_fin.split(':').map(Number);
  
  let fechaInicio = new Date(fecha);
  fechaInicio.setHours(horaInicioH, horaInicioM, 0, 0);
  
  let fechaFin = new Date(fecha);
  fechaFin.setHours(horaFinH, horaFinM, 0, 0);
  
  // Si la hora de fin es menor que la de inicio, el turno cruza la medianoche
  if (horaFinH < horaInicioH || (horaFinH === horaInicioH && horaFinM < horaInicioM)) {
    fechaFin = addHours(fechaFin, 24);
  }
  
  // Calcular duración total en minutos
  const duracionTotalMinutos = differenceInMinutes(fechaFin, fechaInicio);
  const duracionTotalHoras = duracionTotalMinutos / 60;
  
  // Definir horarios de referencia para el día
  const inicioDiurno = new Date(fecha);
  inicioDiurno.setHours(HORA_INICIO_DIURNO, 0, 0, 0);
  
  const finDiurno = new Date(fecha);
  finDiurno.setHours(HORA_FIN_DIURNO, 0, 0, 0);
  
  let horas_diurnas = 0;
  let horas_nocturnas = 0;
  
  // Calcular horas diurnas y nocturnas
  horas_diurnas = 0;
  horas_nocturnas = 0;
  
  if (fechaFin.getDate() !== fechaInicio.getDate()) {
    // Turno cruza medianoche - calcular por partes
    const medianoche = new Date(fecha);
    medianoche.setHours(24, 0, 0, 0);
    
    // Parte del primer día (hasta medianoche)
    // Verificar si hay overlap con horario diurno del primer día
    if (isBefore(fechaInicio, finDiurno)) {
      const finPrimerDia = isBefore(medianoche, finDiurno) ? medianoche : finDiurno;
      horas_diurnas += Math.max(0, differenceInMinutes(finPrimerDia, fechaInicio) / 60);
    }
    
    // Parte del segundo día (desde medianoche)
    const siguienteDia = new Date(fechaFin);
    const inicioDiurnoSiguiente = new Date(siguienteDia);
    inicioDiurnoSiguiente.setHours(HORA_INICIO_DIURNO, 0, 0, 0);
    
    // Verificar si el turno termina después del inicio del horario diurno del segundo día
    if (isAfter(fechaFin, inicioDiurnoSiguiente)) {
      horas_diurnas += differenceInMinutes(fechaFin, inicioDiurnoSiguiente) / 60;
    }
    
    horas_nocturnas = duracionTotalHoras - horas_diurnas;
  } else {
    // Turno no cruza medianoche - calcular normalmente
    const inicioTurnoEnDiurno = isBefore(fechaInicio, inicioDiurno) ? inicioDiurno : fechaInicio;
    const finTurnoEnDiurno = isAfter(fechaFin, finDiurno) ? finDiurno : fechaFin;
    
    if (isBefore(inicioTurnoEnDiurno, finTurnoEnDiurno)) {
      horas_diurnas = differenceInMinutes(finTurnoEnDiurno, inicioTurnoEnDiurno) / 60;
    }
    
    horas_nocturnas = duracionTotalHoras - horas_diurnas;
  }
  
  // Asegurar que no hay valores negativos
  horas_diurnas = Math.max(0, horas_diurnas);
  horas_nocturnas = Math.max(0, horas_nocturnas);
  
  // Calcular horas especiales (domingo/feriado)
  let horas_domingo = 0;
  let horas_feriado = 0;
  
  if (es_domingo) {
    // Para turnos dominicales, solo contar hasta medianoche (24:00)
    const medianoche = new Date(fecha);
    medianoche.setHours(24, 0, 0, 0);
    
    if (fechaFin.getDate() !== fechaInicio.getDate()) {
      // Turno cruza medianoche - solo contar hasta las 24:00 del domingo
      horas_domingo = differenceInMinutes(medianoche, fechaInicio) / 60;
    } else {
      // Turno no cruza medianoche - todas las horas son dominicales
      horas_domingo = duracionTotalHoras;
    }
  }
  
  if (es_feriado) {
    horas_feriado = duracionTotalHoras;
  }
  
  return {
    horas_diurnas: Math.round(horas_diurnas * 100) / 100,
    horas_nocturnas: Math.round(horas_nocturnas * 100) / 100,
    horas_domingo: Math.round(horas_domingo * 100) / 100,
    horas_feriado: Math.round(horas_feriado * 100) / 100,
    total_horas: Math.round(duracionTotalHoras * 100) / 100
  };
};

export const generarTurnosAutomaticos = (
  fechaInicio: Date,
  duracionDias: number,
  operadores: string[],
  configuracion: {
    turno_diurno_inicio: string;
    turno_diurno_fin: string;
    turno_nocturno_inicio: string;
    turno_nocturno_fin: string;
  }
): any[] => {
  const turnos = [];
  const totalOperadores = operadores.length;
  
  for (let dia = 0; dia < duracionDias; dia++) {
    const fecha = new Date(fechaInicio);
    fecha.setDate(fecha.getDate() + dia);
    
    const esDomingoHoy = esDomingo(fecha);
    const esFeriadoHoy = esFeriado(fecha);
    
    // Asignar turno diurno
    const operadorDiurno = operadores[dia % totalOperadores];
    const turnoDiurno = {
      fecha,
      hora_inicio: configuracion.turno_diurno_inicio,
      hora_fin: configuracion.turno_diurno_fin,
      es_domingo: esDomingoHoy,
      es_feriado: esFeriadoHoy
    };
    
    const calculoDiurno = calcularHorasTurno(turnoDiurno);
    
    turnos.push({
      id: `diurno-${dia}`,
      fecha,
      operador_id: operadorDiurno,
      hora_inicio: configuracion.turno_diurno_inicio,
      hora_fin: configuracion.turno_diurno_fin,
      tipo: 'diurno' as const,
      es_domingo: esDomingoHoy,
      es_feriado: esFeriadoHoy,
      ...calculoDiurno
    });
    
    // Asignar turno nocturno (al siguiente operador en la rotación)
    const operadorNocturno = operadores[(dia + 1) % totalOperadores];
    const turnoNocturno = {
      fecha,
      hora_inicio: configuracion.turno_nocturno_inicio,
      hora_fin: configuracion.turno_nocturno_fin,
      es_domingo: esDomingoHoy,
      es_feriado: esFeriadoHoy
    };
    
    const calculoNocturno = calcularHorasTurno(turnoNocturno);
    
    turnos.push({
      id: `nocturno-${dia}`,
      fecha,
      operador_id: operadorNocturno,
      hora_inicio: configuracion.turno_nocturno_inicio,
      hora_fin: configuracion.turno_nocturno_fin,
      tipo: 'nocturno' as const,
      es_domingo: esDomingoHoy,
      es_feriado: esFeriadoHoy,
      ...calculoNocturno
    });
  }
  
  return turnos;
};