import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSupabaseTurnos } from '@/hooks/useSupabaseTurnos';
import { useAuthConsolidated } from '@/hooks/useAuthConsolidated';
import { Calendar, Clock, Sun, Moon, AlertTriangle, CalendarDays } from 'lucide-react';
import { format, parseISO, isSunday, startOfWeek, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';

interface TurnoExtendido {
  id: string;
  fecha: string;
  turno: string;
  horario_inicio: string;
  horario_fin: string;
  horasDiurnas: number;
  horasNocturnas: number;
  horasDominicales: number;
  horasFestivas: number;
  totalHoras: number;
  esDomingo: boolean;
  esFestivo: boolean;
}

const TIPOS_TURNO = {
  mañana: { 
    label: 'Mañana', 
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Sun
  },
  tarde: { 
    label: 'Tarde', 
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: Clock
  },
  noche: { 
    label: 'Noche', 
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: Moon
  },
  descanso: { 
    label: 'Descanso', 
    color: 'bg-gray-100 text-gray-600 border-gray-200',
    icon: Calendar
  }
};

// Días festivos Colombia 2025
const DIAS_FESTIVOS_2025 = [
  '2025-01-01', '2025-01-06', '2025-03-24', '2025-04-17', '2025-04-18',
  '2025-05-01', '2025-06-02', '2025-06-23', '2025-06-30', '2025-07-20',
  '2025-08-07', '2025-08-18', '2025-10-13', '2025-11-03', '2025-11-17',
  '2025-12-08', '2025-12-25'
];

const JORNADA_MAXIMA = 48;

export function VisualizadorTurnosOperador() {
  const { user } = useAuthConsolidated();
  const { turnosOperador, loading } = useSupabaseTurnos();
  const [turnosExtendidos, setTurnosExtendidos] = useState<TurnoExtendido[]>([]);
  const [semanaActual, setSemanaActual] = useState(new Date());

  const esFestivo = (fecha: string) => DIAS_FESTIVOS_2025.includes(fecha);

  const calcularHoras = (horaInicio: string, horaFin: string, fecha: string) => {
    if (!horaInicio || !horaFin) {
      return { horasDiurnas: 0, horasNocturnas: 0, horasDominicales: 0, horasFestivas: 0, totalHoras: 0 };
    }

    const [horaInicioH, horaInicioM] = horaInicio.split(':').map(Number);
    const [horaFinH, horaFinM] = horaFin.split(':').map(Number);
    
    let inicioMinutos = horaInicioH * 60 + horaInicioM;
    let finMinutos = horaFinH * 60 + horaFinM;
    
    if (finMinutos <= inicioMinutos) {
      finMinutos += 24 * 60;
    }
    
    const inicioDiurno = 6 * 60;
    const finDiurno = 19 * 60;
    const medianoche = 24 * 60;
    
    let horasDiurnas = 0;
    let horasNocturnas = 0;
    let horasDominicales = 0;
    let horasFestivas = 0;
    
    const fechaObj = parseISO(fecha);
    const esDom = isSunday(fechaObj);
    const esFest = esFestivo(fecha);
    
    for (let minuto = inicioMinutos; minuto < finMinutos; minuto += 60) {
      const minutoDelDia = minuto % (24 * 60);
      const minutoReal = minuto;
      const esDiurno = minutoDelDia >= inicioDiurno && minutoDelDia < finDiurno;
      
      // Si estamos después de medianoche, son horas ordinarias
      const esDespuesDeMedianoche = minutoReal >= medianoche;
      
      if ((esDom || esFest) && !esDespuesDeMedianoche) {
        // Horas dominicales/festivas solo hasta las 24:00
        if (esDom) {
          horasDominicales++;
        } else if (esFest) {
          horasFestivas++;
        }
      } else {
        // Horas ordinarias
        if (esDiurno) {
          horasDiurnas++;
        } else {
          horasNocturnas++;
        }
      }
    }
    
    const totalHoras = horasDiurnas + horasNocturnas + horasDominicales + horasFestivas;
    
    return { horasDiurnas, horasNocturnas, horasDominicales, horasFestivas, totalHoras };
  };

  useEffect(() => {
    if (!user?.id) return;

    const misTurnos = turnosOperador.filter(turno => turno.operador_id === user.id);
    
    const turnosConCalculos = misTurnos.map(turno => {
      const { horasDiurnas, horasNocturnas, horasDominicales, horasFestivas, totalHoras } = 
        calcularHoras(turno.horario_inicio || '', turno.horario_fin || '', turno.fecha);
      
      const fechaObj = parseISO(turno.fecha);
      
      return {
        id: turno.id,
        fecha: turno.fecha,
        turno: turno.turno,
        horario_inicio: turno.horario_inicio || '',
        horario_fin: turno.horario_fin || '',
        horasDiurnas,
        horasNocturnas,
        horasDominicales,
        horasFestivas,
        totalHoras,
        esDomingo: isSunday(fechaObj),
        esFestivo: esFestivo(turno.fecha)
      };
    });
    
    setTurnosExtendidos(turnosConCalculos);
  }, [turnosOperador, user?.id]);

  const obtenerTurnosSemana = (fecha: Date) => {
    const inicioSemana = startOfWeek(fecha, { weekStartsOn: 1 }); // Lunes
    const finSemana = endOfWeek(fecha, { weekStartsOn: 1 }); // Domingo
    
    return turnosExtendidos.filter(turno => {
      const fechaTurno = parseISO(turno.fecha);
      return fechaTurno >= inicioSemana && fechaTurno <= finSemana;
    });
  };

  const calcularResumenSemanal = () => {
    const turnosSemana = obtenerTurnosSemana(semanaActual);
    const horasSemanales = turnosSemana.reduce((sum, t) => sum + t.totalHoras, 0);
    const horasDiurnas = turnosSemana.reduce((sum, t) => sum + t.horasDiurnas, 0);
    const horasNocturnas = turnosSemana.reduce((sum, t) => sum + t.horasNocturnas, 0);
    const horasDominicales = turnosSemana.reduce((sum, t) => sum + t.horasDominicales, 0);
    const horasFestivas = turnosSemana.reduce((sum, t) => sum + t.horasFestivas, 0);
    const horasExtras = Math.max(0, horasSemanales - JORNADA_MAXIMA);
    
    return {
      horasSemanales,
      horasDiurnas,
      horasNocturnas,
      horasDominicales,
      horasFestivas,
      horasExtras,
      cumpleJornada: horasSemanales >= JORNADA_MAXIMA,
      turnosSemana
    };
  };

  const navegarSemana = (direccion: 'anterior' | 'siguiente') => {
    const nuevaFecha = new Date(semanaActual);
    if (direccion === 'anterior') {
      nuevaFecha.setDate(nuevaFecha.getDate() - 7);
    } else {
      nuevaFecha.setDate(nuevaFecha.getDate() + 7);
    }
    setSemanaActual(nuevaFecha);
  };

  const resumen = calcularResumenSemanal();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Cargando turnos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Mis Turnos Asignados</h2>
          <p className="text-muted-foreground">
            Visualiza tu horario semanal y cálculo de horas trabajadas
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Operador</p>
          <p className="font-medium">{user?.full_name || user?.email}</p>
        </div>
      </div>

      {/* Navegación de semana */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Semana del {format(startOfWeek(semanaActual, { weekStartsOn: 1 }), 'dd', { locale: es })} al {format(endOfWeek(semanaActual, { weekStartsOn: 1 }), 'dd MMMM yyyy', { locale: es })}
            </CardTitle>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navegarSemana('anterior')}
              >
                ← Anterior
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSemanaActual(new Date())}
              >
                Hoy
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navegarSemana('siguiente')}
              >
                Siguiente →
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Resumen semanal */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Semanal</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resumen.horasSemanales}h</div>
            <p className="text-xs text-muted-foreground">
              {resumen.cumpleJornada ? 'Jornada completa' : 'Jornada incompleta'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Horas Diurnas</CardTitle>
            <Sun className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resumen.horasDiurnas}h</div>
            <p className="text-xs text-muted-foreground">06:00 - 19:00</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Horas Nocturnas</CardTitle>
            <Moon className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resumen.horasNocturnas}h</div>
            <p className="text-xs text-muted-foreground">19:00 - 06:00</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dominicales</CardTitle>
            <Calendar className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resumen.horasDominicales}h</div>
            <p className="text-xs text-muted-foreground">Domingos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Horas Extras</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${resumen.horasExtras > 0 ? 'text-orange-600' : ''}`}>
              {resumen.horasExtras}h
            </div>
            <p className="text-xs text-muted-foreground">Sobre {JORNADA_MAXIMA}h</p>
          </CardContent>
        </Card>
      </div>

      {/* Calendario semanal */}
      <Card>
        <CardHeader>
          <CardTitle>Calendario de Turnos</CardTitle>
        </CardHeader>
        <CardContent>
          {resumen.turnosSemana.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay turnos asignados para esta semana</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
              {Array.from({ length: 7 }, (_, index) => {
                const fecha = new Date(startOfWeek(semanaActual, { weekStartsOn: 1 }));
                fecha.setDate(fecha.getDate() + index);
                const fechaStr = format(fecha, 'yyyy-MM-dd');
                
                const turno = resumen.turnosSemana.find(t => t.fecha === fechaStr);
                const tipoTurno = turno ? TIPOS_TURNO[turno.turno] : null;
                const IconComponent = tipoTurno?.icon || Calendar;
                
                return (
                  <div key={index} className="text-center space-y-2">
                    <div className="text-sm font-medium">
                      {format(fecha, 'EEE', { locale: es })}
                    </div>
                    <div className="text-lg font-bold">
                      {format(fecha, 'dd')}
                    </div>
                    
                    {turno ? (
                      <div className="space-y-2">
                        <Badge 
                          variant="outline" 
                          className={`${tipoTurno?.color} w-full justify-center`}
                        >
                          <IconComponent className="h-3 w-3 mr-1" />
                          {tipoTurno?.label}
                        </Badge>
                        
                        {turno.totalHoras > 0 && (
                          <>
                            <div className="text-xs">
                              {turno.horario_inicio} - {turno.horario_fin}
                            </div>
                            <div className="text-xs font-medium">
                              {turno.totalHoras}h
                            </div>
                            
                            {(turno.esDomingo || turno.esFestivo) && (
                              <Badge variant="secondary" className="text-xs">
                                {turno.esDomingo ? 'Domingo' : 'Festivo'}
                              </Badge>
                            )}
                            
                            {/* Desglose de horas */}
                            <div className="text-xs space-y-1">
                              {turno.horasDiurnas > 0 && (
                                <div className="flex items-center justify-center gap-1">
                                  <Sun className="h-3 w-3 text-yellow-500" />
                                  <span>{turno.horasDiurnas}h</span>
                                </div>
                              )}
                              {turno.horasNocturnas > 0 && (
                                <div className="flex items-center justify-center gap-1">
                                  <Moon className="h-3 w-3 text-blue-500" />
                                  <span>{turno.horasNocturnas}h</span>
                                </div>
                              )}
                              {turno.horasDominicales > 0 && (
                                <div className="flex items-center justify-center gap-1">
                                  <Calendar className="h-3 w-3 text-purple-500" />
                                  <span>{turno.horasDominicales}h</span>
                                </div>
                              )}
                              {turno.horasFestivas > 0 && (
                                <div className="flex items-center justify-center gap-1">
                                  <AlertTriangle className="h-3 w-3 text-red-500" />
                                  <span>{turno.horasFestivas}h</span>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Badge variant="outline" className="bg-gray-50 text-gray-500 w-full justify-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          Libre
                        </Badge>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Información legal */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Información Legal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Clasificación de Horas:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• <strong>Diurnas:</strong> 06:00 - 19:00 (recargo del 25%)</li>
                <li>• <strong>Nocturnas:</strong> 19:00 - 06:00 (recargo del 75%)</li>
                <li>• <strong>Dominicales:</strong> Trabajos en domingo (recargo del 75%)</li>
                <li>• <strong>Festivas:</strong> Trabajos en días festivos (recargo del 75%)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Jornada Laboral:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• <strong>Jornada máxima:</strong> {JORNADA_MAXIMA} horas semanales</li>
                <li>• <strong>Horas extras:</strong> Todo exceso sobre {JORNADA_MAXIMA}h semanales</li>
                <li>• <strong>Descanso mínimo:</strong> 12 horas entre turnos</li>
                <li>• <strong>Descanso semanal:</strong> Mínimo 24 horas continuas</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}