import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSupabaseTurnos } from '@/hooks/useSupabaseTurnos';
import { Calendar, Clock, Sun, Moon, CalendarDays } from 'lucide-react';
import { format, parseISO, startOfWeek, endOfWeek, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface TurnoExtendido {
  id: string;
  fecha: string;
  supervisor_id: string;
  supervisor_nombre: string;
  turno: string;
  horario_inicio: string;
  horario_fin: string;
}

const TIPOS_TURNO = {
  diurno: { 
    label: 'Día', 
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Sun
  },
  nocturno: { 
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

export function VisualizadorTurnosSupervisor() {
  const { turnosSupervisor, loading } = useSupabaseTurnos();
  const [turnosExtendidos, setTurnosExtendidos] = useState<TurnoExtendido[]>([]);
  const [semanaActual, setSemanaActual] = useState(new Date());

  useEffect(() => {
    const turnosFormateados = turnosSupervisor.map(turno => ({
      id: turno.id,
      fecha: turno.fecha,
      supervisor_id: turno.supervisor_id || '',
      supervisor_nombre: turno.supervisor_nombre || '',
      turno: turno.turno,
      horario_inicio: turno.horario_inicio || '',
      horario_fin: turno.horario_fin || ''
    }));
    
    setTurnosExtendidos(turnosFormateados);
  }, [turnosSupervisor]);

  const obtenerTurnosSemana = (fecha: Date) => {
    const inicioSemana = startOfWeek(fecha, { weekStartsOn: 1 });
    const finSemana = endOfWeek(fecha, { weekStartsOn: 1 });
    
    return turnosExtendidos.filter(turno => {
      const fechaTurno = parseISO(turno.fecha);
      return fechaTurno >= inicioSemana && fechaTurno <= finSemana;
    });
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

  const turnosSemana = obtenerTurnosSemana(semanaActual);
  const supervisoresUnicos = Array.from(new Set(turnosExtendidos.map(t => t.supervisor_nombre))).filter(Boolean);

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
      <div>
        <h2 className="text-2xl font-bold">Turnos de Supervisores</h2>
        <p className="text-muted-foreground">
          Visualiza los horarios semanales de todos los supervisores
        </p>
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

      {/* Calendario semanal por supervisor */}
      <Card>
        <CardHeader>
          <CardTitle>Calendario de Turnos</CardTitle>
        </CardHeader>
        <CardContent>
          {turnosSemana.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay turnos asignados para esta semana</p>
            </div>
          ) : (
            <div className="space-y-6">
              {supervisoresUnicos.map(supervisorNombre => {
                const turnosSupervisor = turnosSemana.filter(t => t.supervisor_nombre === supervisorNombre);
                
                return (
                  <div key={supervisorNombre} className="space-y-3">
                    <h3 className="font-medium text-lg border-b pb-2">{supervisorNombre}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                      {Array.from({ length: 7 }, (_, index) => {
                        const fecha = addDays(startOfWeek(semanaActual, { weekStartsOn: 1 }), index);
                        const fechaStr = format(fecha, 'yyyy-MM-dd');
                        
                        const turno = turnosSupervisor.find(t => t.fecha === fechaStr);
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
                                
                                {turno.horario_inicio && turno.horario_fin && (
                                  <div className="text-xs">
                                    {turno.horario_inicio} - {turno.horario_fin}
                                  </div>
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
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
