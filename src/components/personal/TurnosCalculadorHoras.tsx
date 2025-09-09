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
  
  // Inicializar todas las horas en 0
  let horas_diurnas_ordinarias = 0;
  let horas_nocturnas_ordinarias = 0;
  let horas_diurnas_dominicales = 0;
  let horas_nocturnas_dominicales = 0;
  let horas_feriado = 0;
  
  // Determinar el día de la semana (0 = domingo, 6 = sábado)
  const diaSemana = fecha.getDay();
  const esSabado = diaSemana === 6;
  
  // Aplicar reglas exactas según el tipo de turno
  if (hora_inicio === '06:00' && hora_fin === '18:00') {
    // Turno de día 06:00-18:00
    if (es_domingo || es_feriado) {
      // Domingo: 12 horas diurnas dominicales
      horas_diurnas_dominicales = 12;
      if (es_feriado) horas_feriado = 12;
    } else {
      // Lunes a sábado: 12 horas diurnas ordinarias
      horas_diurnas_ordinarias = 12;
    }
  } else if (hora_inicio === '18:00' && hora_fin === '06:00') {
    // Turno de noche 18:00-06:00
    if (es_domingo) {
      // Domingo de noche: 1 hora dominical diurna + 5 horas dominicales nocturnas + 6 horas nocturnas ordinarias
      horas_diurnas_dominicales = 1;
      horas_nocturnas_dominicales = 5;
      horas_nocturnas_ordinarias = 6;
      if (es_feriado) horas_feriado = 6; // Solo las primeras 6 horas del feriado
    } else if (esSabado) {
      // Sábado de noche: 1 hora diurna ordinaria + 5 horas nocturnas ordinarias + 6 horas nocturnas dominicales
      horas_diurnas_ordinarias = 1;
      horas_nocturnas_ordinarias = 5;
      horas_nocturnas_dominicales = 6;
    } else {
      // Lunes a viernes de noche: 1 hora diurna ordinaria + 11 horas nocturnas ordinarias
      horas_diurnas_ordinarias = 1;
      horas_nocturnas_ordinarias = 11;
    }
  } else if (hora_inicio === '06:00' && hora_fin === '14:00') {
    // Turno de mañana 06:00-14:00
    if (es_domingo || es_feriado) {
      // Domingo: 8 horas dominicales diurnas
      horas_diurnas_dominicales = 8;
      if (es_feriado) horas_feriado = 8;
    } else {
      // Lunes a sábado: 8 horas diurnas ordinarias
      horas_diurnas_ordinarias = 8;
    }
  } else if (hora_inicio === '14:00' && hora_fin === '22:00') {
    // Turno de tarde 14:00-22:00
    if (es_domingo || es_feriado) {
      // Domingo: 5 horas dominicales diurnas + 3 horas dominicales nocturnas
      horas_diurnas_dominicales = 5;
      horas_nocturnas_dominicales = 3;
      if (es_feriado) horas_feriado = 8;
    } else {
      // Lunes a sábado: 5 horas diurnas ordinarias + 3 horas nocturnas ordinarias
      horas_diurnas_ordinarias = 5;
      horas_nocturnas_ordinarias = 3;
    }
  } else {
    // Para otros horarios, usar el cálculo genérico anterior
    // (mantener la lógica existente para casos especiales)
    const [horaInicioH, horaInicioM] = hora_inicio.split(':').map(Number);
    const [horaFinH, horaFinM] = hora_fin.split(':').map(Number);
    
    let inicioMinutos = horaInicioH * 60 + horaInicioM;
    let finMinutos = horaFinH * 60 + horaFinM;
    
    if (finMinutos <= inicioMinutos) {
      finMinutos += 24 * 60;
    }
    
    const duracionTotalMinutos = finMinutos - inicioMinutos;
    const inicioDiurno = HORA_INICIO_DIURNO * 60;
    const finDiurno = HORA_FIN_DIURNO * 60;
    
    // Calcular intersecciones para horarios no estándar
    const diurnas = Math.max(0, Math.min(finMinutos, finDiurno) - Math.max(inicioMinutos, inicioDiurno)) / 60;
    const nocturnas = (duracionTotalMinutos / 60) - diurnas;
    
    if (es_domingo || es_feriado) {
      horas_diurnas_dominicales = Math.max(0, diurnas);
      horas_nocturnas_dominicales = Math.max(0, nocturnas);
      if (es_feriado) horas_feriado = duracionTotalMinutos / 60;
    } else {
      horas_diurnas_ordinarias = Math.max(0, diurnas);
      horas_nocturnas_ordinarias = Math.max(0, nocturnas);
    }
  }
  
  const horas_diurnas = horas_diurnas_ordinarias + horas_diurnas_dominicales;
  const horas_nocturnas = horas_nocturnas_ordinarias + horas_nocturnas_dominicales;
  const horas_domingo = horas_diurnas_dominicales + horas_nocturnas_dominicales;
  const total_horas = horas_diurnas + horas_nocturnas;
  
  return {
    horas_diurnas: Math.round(horas_diurnas * 100) / 100,
    horas_nocturnas: Math.round(horas_nocturnas * 100) / 100,
    horas_domingo: Math.round(horas_domingo * 100) / 100,
    horas_feriado: Math.round(horas_feriado * 100) / 100,
    horas_diurnas_ordinarias: Math.round(horas_diurnas_ordinarias * 100) / 100,
    horas_nocturnas_ordinarias: Math.round(horas_nocturnas_ordinarias * 100) / 100,
    horas_diurnas_dominicales: Math.round(horas_diurnas_dominicales * 100) / 100,
    horas_nocturnas_dominicales: Math.round(horas_nocturnas_dominicales * 100) / 100,
    horas_extras: 0, // Se calcula a nivel de quincena
    total_horas: Math.round(total_horas * 100) / 100
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