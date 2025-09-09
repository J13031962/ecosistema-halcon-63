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
          <h1 className="text-xl sm:text-2xl font-bold">Gestión de Turnos - Operadores</h1>
          <p className="text-sm text-muted-foreground">
            Sistema completo de generación, visualización y gestión de turnos para operadores
          </p>
        </div>
      </div>

      <Tabs defaultValue="visualizar" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="visualizar" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Mis Turnos
          </TabsTrigger>
          <TabsTrigger value="generar" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Generar Turnos
          </TabsTrigger>
          <TabsTrigger value="legacy" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Vista Legacy
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="visualizar" className="mt-6">
          <VisualizadorTurnosOperador />
        </TabsContent>
        
        <TabsContent value="generar" className="mt-6">
          <GeneradorTurnosAvanzado />
        </TabsContent>
        
        <TabsContent value="legacy" className="mt-6">
          <div className="space-y-4">

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Turnos Programados</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">28</div>
            <p className="text-xs text-muted-foreground">Esta semana</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Operadores Activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Personal disponible</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Horas Cubiertas</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98%</div>
            <p className="text-xs text-muted-foreground">Cobertura semanal</p>
          </CardContent>
        </Card>
      </div>

      {/* Calendario de Turnos Generados */}
      {turnosAdaptados.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Calendario de Turnos Asignados</CardTitle>
            <CardDescription>
              Vista semanal de los turnos asignados desde la gestión de personal
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
            <CardTitle>Calendario de Turnos - 15 días</CardTitle>
            <CardDescription>
              {loading ? 'Cargando turnos...' : 'No hay turnos asignados. Los turnos aparecerán aquí una vez generados desde la gestión de personal.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CalendarioTurnosQuincenal />
          </CardContent>
        </Card>
      )}

      {/* Resumen de horas por operador */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Horas por Operador</CardTitle>
          <CardDescription>
            Total de horas trabajadas por cada operador en el período actual
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Juan Pérez</h4>
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium">
                    JP
                  </div>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Horas esta semana:</span>
                    <span className="font-medium">48h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Horas extra:</span>
                    <span className="font-medium text-orange-600">8h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Eficiencia:</span>
                    <span className="font-medium text-green-600">95%</span>
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">María García</h4>
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium">
                    MG
                  </div>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Horas esta semana:</span>
                    <span className="font-medium">40h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Horas extra:</span>
                    <span className="font-medium">0h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Eficiencia:</span>
                    <span className="font-medium text-green-600">98%</span>
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Carlos López</h4>
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium">
                    CL
                  </div>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Horas esta semana:</span>
                    <span className="font-medium">42h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Horas extra:</span>
                    <span className="font-medium text-orange-600">2h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Eficiencia:</span>
                    <span className="font-medium text-green-600">92%</span>
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Ana Martínez</h4>
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium">
                    AM
                  </div>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Horas esta semana:</span>
                    <span className="font-medium">40h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Horas extra:</span>
                    <span className="font-medium">0h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Eficiencia:</span>
                    <span className="font-medium text-green-600">97%</span>
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Diego Rodríguez</h4>
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium">
                    DR
                  </div>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Horas esta semana:</span>
                    <span className="font-medium">38h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Horas extra:</span>
                    <span className="font-medium">0h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Eficiencia:</span>
                    <span className="font-medium text-green-600">94%</span>
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Elena Torres</h4>
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium">
                    ET
                  </div>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Horas esta semana:</span>
                    <span className="font-medium">44h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Horas extra:</span>
                    <span className="font-medium text-orange-600">4h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Eficiencia:</span>
                    <span className="font-medium text-green-600">96%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Resumen total */}
            <div className="mt-6 p-4 bg-muted/30 rounded-lg">
              <h4 className="font-medium mb-3">Resumen Total</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground block">Total Horas:</span>
                  <span className="font-medium text-lg">252h</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Horas Extra:</span>
                  <span className="font-medium text-lg text-orange-600">14h</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Eficiencia Promedio:</span>
                  <span className="font-medium text-lg text-green-600">95%</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Operadores Activos:</span>
                  <span className="font-medium text-lg">6</span>
                </div>
              </div>
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