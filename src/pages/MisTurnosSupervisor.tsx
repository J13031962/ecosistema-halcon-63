import React, { useState, useEffect } from 'react';
import { OperationalThemeWrapper } from '@/components/layout/OperationalThemeWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSupabaseTurnos } from '@/hooks/useSupabaseTurnos';
import { useAuthConsolidated } from '@/hooks/useAuthConsolidated';
import { Calendar, Clock, Sun, Moon, CalendarDays, Users } from 'lucide-react';
import { format, parseISO, startOfWeek, endOfWeek, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

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

export default function MisTurnosSupervisor() {
  const { user } = useAuthConsolidated();
  const { turnosSupervisor, loading } = useSupabaseTurnos();
  const [semanaActual, setSemanaActual] = useState(new Date());

  const obtenerTurnosSemana = (fecha: Date) => {
    const inicioSemana = startOfWeek(fecha, { weekStartsOn: 1 });
    const finSemana = endOfWeek(fecha, { weekStartsOn: 1 });
    
    return turnosSupervisor.filter(turno => {
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
  const misTurnos = turnosSemana.filter(t => t.supervisor_id === user?.id);
  const supervisoresUnicos = Array.from(new Set(turnosSemana.map(t => t.supervisor_nombre))).filter(Boolean);

  if (loading) {
    return (
      <OperationalThemeWrapper>
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <Clock className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p>Cargando turnos...</p>
          </div>
        </div>
      </OperationalThemeWrapper>
    );
  }

  return (
    <OperationalThemeWrapper>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Calendar className="h-8 w-8" />
              Mis Turnos Asignados
            </h1>
            <p className="text-muted-foreground mt-2">
              Visualiza tu horario semanal y el de tus compañeros supervisores
            </p>
          </div>
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Supervisor</div>
              <div className="font-semibold">{user?.full_name || user?.email}</div>
            </CardContent>
          </Card>
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

        {/* Mis Turnos de la Semana */}
        <Card>
          <CardHeader>
            <CardTitle>Mis Turnos Esta Semana</CardTitle>
          </CardHeader>
          <CardContent>
            {misTurnos.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No tienes turnos asignados para esta semana</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                {Array.from({ length: 7 }, (_, index) => {
                  const fecha = addDays(startOfWeek(semanaActual, { weekStartsOn: 1 }), index);
                  const fechaStr = format(fecha, 'yyyy-MM-dd');
                  
                  const turno = misTurnos.find(t => t.fecha === fechaStr);
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
                            className={`${tipoTurno?.color} w-full justify-center py-2`}
                          >
                            <IconComponent className="h-4 w-4 mr-1" />
                            {tipoTurno?.label}
                          </Badge>
                          
                          {turno.horario_inicio && turno.horario_fin && (
                            <div className="text-xs font-medium">
                              {turno.horario_inicio} - {turno.horario_fin}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Badge variant="outline" className="bg-gray-50 text-gray-500 w-full justify-center py-2">
                            <Calendar className="h-4 w-4 mr-1" />
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

        {/* Turnos de Todos los Supervisores */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Turnos de Todos los Supervisores
            </CardTitle>
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
                  const esMiTurno = turnosSupervisor.some(t => t.supervisor_id === user?.id);
                  
                  return (
                    <div key={supervisorNombre} className="space-y-3">
                      <h3 className={`font-medium text-lg border-b pb-2 ${esMiTurno ? 'text-primary' : ''}`}>
                        {supervisorNombre} {esMiTurno && '(Yo)'}
                      </h3>
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

        {/* Información */}
        <Card>
          <CardHeader>
            <CardTitle>Información sobre Turnos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Tipos de Turno:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• <strong>Día:</strong> 06:00 - 18:00 (12 horas)</li>
                  <li>• <strong>Noche:</strong> 18:00 - 06:00 (12 horas)</li>
                  <li>• <strong>Descanso:</strong> Día libre sin asignación</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Notas Importantes:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Los turnos son asignados por el despachador</li>
                  <li>• Puedes ver los turnos de tus compañeros</li>
                  <li>• Consulta cualquier duda con tu supervisor</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </OperationalThemeWrapper>
  );
}
