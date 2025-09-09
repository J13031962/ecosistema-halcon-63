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
  
  // Convertir horarios a minutos desde medianoche
  const [horaInicioH, horaInicioM] = hora_inicio.split(':').map(Number);
  const [horaFinH, horaFinM] = hora_fin.split(':').map(Number);
  
  let inicioMinutos = horaInicioH * 60 + horaInicioM;
  let finMinutos = horaFinH * 60 + horaFinM;
  
  // Si el turno cruza medianoche
  if (finMinutos <= inicioMinutos) {
    finMinutos += 24 * 60; // Agregar 24 horas
  }
  
  const duracionTotalMinutos = finMinutos - inicioMinutos;
  const duracionTotalHoras = duracionTotalMinutos / 60;
  
  // Definir rangos en minutos
  const inicioDiurno = HORA_INICIO_DIURNO * 60; // 06:00 = 360 minutos
  const finDiurno = HORA_FIN_DIURNO * 60;       // 19:00 = 1140 minutos
  const medianoche = 24 * 60;                   // 24:00 = 1440 minutos
  
  let horas_diurnas = 0;
  let horas_nocturnas = 0;
  let horas_domingo = 0;
  let horas_feriado = 0;
  
  if (es_domingo) {
    // Para domingos, solo contar hasta medianoche
    const finTurnoParaDomingo = Math.min(finMinutos, medianoche);
    const duracionDomingo = (finTurnoParaDomingo - inicioMinutos) / 60;
    horas_domingo = Math.max(0, duracionDomingo);
    
    // Horas después de medianoche son nocturnas ordinarias
    if (finMinutos > medianoche) {
      horas_nocturnas = (finMinutos - medianoche) / 60;
    }
    
  } else if (es_feriado) {
    // Para festivos, solo contar hasta medianoche
    const finTurnoParaFeriado = Math.min(finMinutos, medianoche);
    const duracionFeriado = (finTurnoParaFeriado - inicioMinutos) / 60;
    horas_feriado = Math.max(0, duracionFeriado);
    
    // Horas después de medianoche son nocturnas ordinarias
    if (finMinutos > medianoche) {
      horas_nocturnas = (finMinutos - medianoche) / 60;
    }
    
  } else {
    // Día ordinario - calcular diurnas y nocturnas
    
    // Calcular intersección con horario diurno (06:00-19:00)
    const inicioInterseccion = Math.max(inicioMinutos, inicioDiurno);
    const finInterseccion = Math.min(finMinutos, finDiurno);
    
    if (inicioInterseccion < finInterseccion) {
      horas_diurnas = (finInterseccion - inicioInterseccion) / 60;
    }
    
    // El resto son horas nocturnas
    horas_nocturnas = duracionTotalHoras - horas_diurnas;
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