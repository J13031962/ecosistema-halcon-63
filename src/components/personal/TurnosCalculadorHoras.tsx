import { format } from 'date-fns';

export interface CalculoHoras {
  horas_diurnas: number;
  horas_nocturnas: number;
  horas_domingo: number;
  horas_feriado: number;
  // Detalle por tipo para reglas avanzadas
  horas_diurnas_ordinarias: number;
  horas_nocturnas_ordinarias: number;
  horas_diurnas_dominicales: number;
  horas_nocturnas_dominicales: number;
  horas_extras: number;
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
  
  // Definir rangos en minutos
  const inicioDiurno = HORA_INICIO_DIURNO * 60; // 06:00 = 360 minutos
  const finDiurno = HORA_FIN_DIURNO * 60;       // 19:00 = 1140 minutos
  const medianoche = 24 * 60;                   // 24:00 = 1440 minutos
  
  // Helper para intersecciones
  const overlap = (a1: number, a2: number, b1: number, b2: number) => Math.max(0, Math.min(a2, b2) - Math.max(a1, b1));
  
  let horas_diurnas_ordinarias = 0;
  let horas_nocturnas_ordinarias = 0;
  let horas_diurnas_dominicales = 0;
  let horas_nocturnas_dominicales = 0;
  let minutosFeriado = 0;
  
  // Segmento A: mismo día hasta medianoche
  const aInicio = inicioMinutos;
  const aFin = Math.min(finMinutos, medianoche);
  if (aFin > aInicio) {
    const diurnasA = overlap(aInicio, aFin, inicioDiurno, finDiurno);
    const nocturnasA = (aFin - aInicio) - diurnasA;
    const esDomOFerA = es_domingo || es_feriado;
    if (esDomOFerA) {
      horas_diurnas_dominicales += diurnasA / 60;
      horas_nocturnas_dominicales += nocturnasA / 60;
      if (es_feriado) minutosFeriado += (aFin - aInicio);
    } else {
      horas_diurnas_ordinarias += diurnasA / 60;
      horas_nocturnas_ordinarias += nocturnasA / 60;
    }
  }
  
  // Segmento B: después de medianoche (día siguiente)
  if (finMinutos > medianoche) {
    const bInicio = 0;
    const bFin = finMinutos - medianoche;
    const fechaSiguiente = new Date(fecha);
    fechaSiguiente.setDate(fechaSiguiente.getDate() + 1);
    
    // Regla: si el día de inicio fue domingo o festivo, después de las 24:00 son horas ordinarias
    const diaInicioDomOFer = es_domingo || es_feriado;
    const diaSiguienteDomOFer = esDomingo(fechaSiguiente) || esFeriado(fechaSiguiente);
    const usarDominicalB = !diaInicioDomOFer && diaSiguienteDomOFer;
    
    const diurnasB = overlap(bInicio, bFin, inicioDiurno, finDiurno);
    const nocturnasB = (bFin - bInicio) - diurnasB;
    
    if (usarDominicalB) {
      horas_diurnas_dominicales += diurnasB / 60;
      horas_nocturnas_dominicales += nocturnasB / 60;
      if (esFeriado(fechaSiguiente)) minutosFeriado += (bFin - bInicio);
    } else {
      // Ordinarias (incluye caso domingo/feriado -> después de medianoche)
      horas_diurnas_ordinarias += diurnasB / 60;
      horas_nocturnas_ordinarias += nocturnasB / 60;
    }
  }
  
  const horas_diurnas = Math.round((horas_diurnas_ordinarias + horas_diurnas_dominicales) * 100) / 100;
  const horas_nocturnas = Math.round((horas_nocturnas_ordinarias + horas_nocturnas_dominicales) * 100) / 100;
  const horas_domingo = Math.round((horas_diurnas_dominicales + horas_nocturnas_dominicales) * 100) / 100;
  const horas_feriado = Math.round((minutosFeriado / 60) * 100) / 100;
  const total_horas = Math.round((duracionTotalMinutos / 60) * 100) / 100;
  
  return {
    horas_diurnas,
    horas_nocturnas,
    horas_domingo,
    horas_feriado,
    horas_diurnas_ordinarias: Math.round(horas_diurnas_ordinarias * 100) / 100,
    horas_nocturnas_ordinarias: Math.round(horas_nocturnas_ordinarias * 100) / 100,
    horas_diurnas_dominicales: Math.round(horas_diurnas_dominicales * 100) / 100,
    horas_nocturnas_dominicales: Math.round(horas_nocturnas_dominicales * 100) / 100,
    horas_extras: 0, // Se calcula a nivel de quincena, no por turno individual
    total_horas
  };
};

// Función para calcular horas extras en base a un período
export const calcularHorasExtras = (turnosOperador: any[]): number => {
  const totalHorasDiurnasOrdinarias = turnosOperador.reduce((sum, turno) => {
    return sum + (turno.horas_diurnas_ordinarias || 0);
  }, 0);
  
  const LIMITE_HORAS_ORDINARIAS = 88;
  return Math.max(0, totalHorasDiurnasOrdinarias - LIMITE_HORAS_ORDINARIAS);
};

// Función para calcular resumen de horas por operador en un período
export const calcularResumenOperador = (turnosOperador: any[]) => {
  const totalHorasDiurnasOrdinarias = turnosOperador.reduce((sum, t) => sum + (t.horas_diurnas_ordinarias || 0), 0);
  const totalHorasNocturnasOrdinarias = turnosOperador.reduce((sum, t) => sum + (t.horas_nocturnas_ordinarias || 0), 0);
  const totalHorasDiurnasDOM = turnosOperador.reduce((sum, t) => sum + (t.horas_diurnas_dominicales || 0), 0);
  const totalHorasNocturnasDOM = turnosOperador.reduce((sum, t) => sum + (t.horas_nocturnas_dominicales || 0), 0);
  const totalHorasFeriado = turnosOperador.reduce((sum, t) => sum + (t.horas_feriado || 0), 0);
  
  const horasExtras = calcularHorasExtras(turnosOperador);
  
  return {
    horas_diurnas_ordinarias: Math.round(totalHorasDiurnasOrdinarias * 100) / 100,
    horas_nocturnas_ordinarias: Math.round(totalHorasNocturnasOrdinarias * 100) / 100,
    horas_diurnas_dominicales: Math.round(totalHorasDiurnasDOM * 100) / 100,
    horas_nocturnas_dominicales: Math.round(totalHorasNocturnasDOM * 100) / 100,
    horas_feriado: Math.round(totalHorasFeriado * 100) / 100,
    horas_extras: Math.round(horasExtras * 100) / 100,
    total_horas: Math.round((totalHorasDiurnasOrdinarias + totalHorasNocturnasOrdinarias + totalHorasDiurnasDOM + totalHorasNocturnasDOM + totalHorasFeriado) * 100) / 100
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