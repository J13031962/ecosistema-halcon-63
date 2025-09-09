import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GeneradorTurnosAvanzado } from "@/components/turnos/GeneradorTurnosAvanzado";
import { VisualizadorTurnosOperador } from "@/components/turnos/VisualizadorTurnosOperador";
import { CalendarTurnos } from "@/components/turnos/CalendarTurnos";
import { CalendarioTurnosQuincenal } from "@/components/personal/CalendarioTurnosQuincenal";
import { CalendarioTurnos as CalendarioTurnosPersonal } from "@/components/personal/CalendarioTurnos";
import { useSupabaseTurnos } from "@/hooks/useSupabaseTurnos";
import { Plus, Calendar, Users, Clock, Settings, Eye } from "lucide-react";

const TurnosOperador = () => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const { turnosOperador, loading, error } = useSupabaseTurnos();

  // Convertir TurnoOperador a formato Turno para el calendario
  const turnosAdaptados = turnosOperador.map(turno => ({
    id: turno.id?.toString() || '',
    fecha: new Date(turno.fecha),
    operador_id: turno.operador_id || '',
    operador_nombre: turno.operador_nombre || `Operador ${turno.operador_id}`,
    hora_inicio: turno.horario_inicio || '08:00',
    hora_fin: turno.horario_fin || '16:00',
    tipo: (turno.turno === 'nocturno' ? 'nocturno' : 'diurno') as 'diurno' | 'nocturno',
    horas_diurnas: 8,
    horas_nocturnas: turno.turno === 'nocturno' ? 8 : 0,
    horas_domingo: 0,
    horas_feriado: 0,
    horas_extra: 0,
    total_horas: 8,
    es_domingo: false,
    es_feriado: false
  }));

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold">Mis Turnos - Operador</h1>
          <p className="text-sm text-muted-foreground">
            Consulta y visualización de tus turnos asignados
          </p>
        </div>
      </div>

      <Tabs defaultValue="calendar" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendario de Turnos
          </TabsTrigger>
          <TabsTrigger value="summary" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Resumen de Horas
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="calendar" className="mt-6">
          {/* Calendario de Turnos Principal */}
          {turnosAdaptados.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Calendario de Turnos Asignados</CardTitle>
                <CardDescription>
                  Vista semanal de tus turnos asignados. Los cambios realizados por dirección central se reflejan automáticamente aquí.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CalendarioTurnosPersonal
                  turnos={turnosAdaptados}
                  onEditTurno={(turno) => {
                    console.log('Ver detalles del turno:', turno);
                  }}
                  selectedWeek={selectedWeek}
                  onWeekChange={setSelectedWeek}
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Calendario de Turnos</CardTitle>
                <CardDescription>
                  {loading ? 'Cargando turnos...' : 'No hay turnos asignados. Los turnos aparecerán aquí una vez generados desde la gestión de personal.'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CalendarioTurnosQuincenal />
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="summary" className="mt-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mis Turnos</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{turnosOperador.length}</div>
                <p className="text-xs text-muted-foreground">Turnos asignados</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Horas Esta Semana</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">40h</div>
                <p className="text-xs text-muted-foreground">Horas programadas</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Próximo Turno</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Mañana</div>
                <p className="text-xs text-muted-foreground">06:00 - 14:00</p>
              </CardContent>
            </Card>
          </div>

          {/* Mi resumen personal */}
          <div className="space-y-4">
            <div className="p-4 bg-muted/30 rounded-lg">
              <h4 className="font-medium mb-3">Mi Resumen Personal</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground block">Horas Esta Semana:</span>
                  <span className="font-medium text-lg">40h</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Horas Extra:</span>
                  <span className="font-medium text-lg text-orange-600">0h</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Turnos Asignados:</span>
                  <span className="font-medium text-lg">{turnosOperador.length}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Próximo Turno:</span>
                  <span className="font-medium text-lg">Mañana 06:00</span>
                </div>
              </div>
            </div>
            
            {/* Historial de cambios */}
            <Card>
              <CardHeader>
                <CardTitle>Historial de Cambios</CardTitle>
                <CardDescription>
                  Modificaciones realizadas por dirección central en tus turnos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div>
                      <p className="font-medium">Cambio de turno - 15 Ene 2025</p>
                      <p className="text-sm text-muted-foreground">Turno cambiado de noche (22:00-06:00) a día (06:00-14:00)</p>
                    </div>
                    <div className="text-sm text-blue-600">Hace 2h</div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <p className="font-medium">Turno asignado - 10 Ene 2025</p>
                      <p className="text-sm text-muted-foreground">Nuevo turno día (06:00-14:00) asignado</p>
                    </div>
                    <div className="text-sm text-green-600">Hace 5d</div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div>
                      <p className="font-medium">Modificación de horario - 8 Ene 2025</p>
                      <p className="text-sm text-muted-foreground">Horario ajustado: 07:00-15:00 → 06:00-14:00</p>
                    </div>
                    <div className="text-sm text-orange-600">Hace 7d</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TurnosOperador;