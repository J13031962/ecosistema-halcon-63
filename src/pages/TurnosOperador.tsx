import { useState, useEffect } from "react";
import { OperationalButton as Button } from "@/components/ui/operational-button";
import { OperationalCard as Card, OperationalCardContent as CardContent, OperationalCardDescription as CardDescription, OperationalCardHeader as CardHeader, OperationalCardTitle as CardTitle } from "@/components/ui/operational-card";
import { OperationalThemeWrapper } from "@/components/layout/OperationalThemeWrapper";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GeneradorTurnos } from "@/components/personal/GeneradorTurnos";
import { GeneradorTurnosAvanzado } from "@/components/turnos/GeneradorTurnosAvanzado";
import { VisualizadorTurnosOperador } from "@/components/turnos/VisualizadorTurnosOperador";
import { useSupabaseTurnos, TurnoOperador } from "@/hooks/useSupabaseTurnos";
import { Plus, Calendar, Users, Clock, Settings, Eye, AlertCircle, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, isAfter, isBefore, isWithinInterval, addDays, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";

// Datos de ejemplo del personal operador para el generador
const personalOperadores = [
  { id: '1', nombres: 'Juan Carlos', apellidos: 'Pérez López', cargo: 'operador' },
  { id: '2', nombres: 'María José', apellidos: 'González Martínez', cargo: 'operador' },
  { id: '3', nombres: 'Luis Fernando', apellidos: 'Ramírez Silva', cargo: 'operador' },
  { id: '4', nombres: 'Ana Carolina', apellidos: 'Torres Ruiz', cargo: 'operador' },
  { id: '5', nombres: 'Carlos Alberto', apellidos: 'Fernández García', cargo: 'operador' },
  { id: '6', nombres: 'Elena Patricia', apellidos: 'Rodríguez Morales', cargo: 'operador' },
];

const TurnosOperador = () => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [showGeneradorModal, setShowGeneradorModal] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [misTurnos, setMisTurnos] = useState<TurnoOperador[]>([]);
  const [selectedTurnoBatch, setSelectedTurnoBatch] = useState<string>("todos");
  const { turnosOperador, loading, error, refetch, addTurnoOperador } = useSupabaseTurnos();
  const { toast } = useToast();

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        console.log('👤 Usuario actual:', user.id, user.email);
        setCurrentUser(user);
        
        // Refrescar los datos de turnos
        await refetch();
      }
    };
    
    getCurrentUser();
  }, [refetch]);

  useEffect(() => {
    if (currentUser && turnosOperador.length >= 0) {
      console.log('📊 Total turnos operador en BD:', turnosOperador.length);
      console.log('📊 Turnos operador completos:', turnosOperador);
      
      // MOSTRAR TODOS LOS TURNOS - sin filtrar por usuario
      setMisTurnos(turnosOperador);
      
      console.log('✅ Mostrando TODOS los turnos para el operador:', turnosOperador.length);
    }
  }, [currentUser, turnosOperador]);

  // Función para manejar la generación de turnos desde el GeneradorTurnos
  const handleGenerarTurnos = async (data: any) => {
    console.log('Generando turnos con:', data);
    
    try {
      // Si viene del nuevo GeneradorTurnos, usar los turnos directamente
      if (data.turnos && Array.isArray(data.turnos)) {
        const turnosGuardados = [];
        
        for (const turno of data.turnos) {
          const fechaString = turno.fecha instanceof Date ? 
            format(turno.fecha, 'yyyy-MM-dd') : 
            turno.fecha;
            
          const turnoGuardado = await addTurnoOperador({
            fecha: fechaString,
            turno: turno.tipo === 'nocturno' ? 'nocturno' : 'diurno',
            operador_id: turno.operador_id,
            operador_nombre: turno.operador_nombre,
            horario_inicio: turno.hora_inicio,
            horario_fin: turno.hora_fin
          });
          
          if (turnoGuardado) {
            turnosGuardados.push(turnoGuardado);
          }
        }
        
        await refetch();
        toast({
          title: "Turnos generados exitosamente",
          description: `Se generaron ${turnosGuardados.length} turnos`
        });
        
        return;
      }
      
      toast({
        title: "Error",
        description: "Formato de datos de turnos no válido",
        variant: "destructive"
      });
    } catch (error) {
      console.error('Error en handleGenerarTurnos:', error);
      toast({
        title: "Error",
        description: "Error al generar los turnos",
        variant: "destructive"
      });
    }
  };

  // Filtrar turnos actuales (que incluyen la fecha de hoy)
  const getTurnosActuales = () => {
    const hoy = startOfDay(new Date());
    return misTurnos.filter(turno => {
      const fechaTurno = new Date(turno.fecha);
      // Un turno es "actual" si su fecha incluye hoy o es futura
      return !isBefore(fechaTurno, hoy);
    }).sort((a, b) => {
      const fechaA = new Date(a.fecha);
      const fechaB = new Date(b.fecha);
      const hoy = new Date();
      
      // Priorizar turnos que incluyen la fecha actual
      const includeHoyA = !isBefore(fechaA, hoy) && !isAfter(fechaA, addDays(hoy, 1));
      const includeHoyB = !isBefore(fechaB, hoy) && !isAfter(fechaB, addDays(hoy, 1));
      
      if (includeHoyA && !includeHoyB) return -1;
      if (!includeHoyA && includeHoyB) return 1;
      
      return fechaA.getTime() - fechaB.getTime();
    });
  };

  // Agrupar turnos por lotes de creación (por fecha de creación)
  const getTurnosBatches = () => {
    const batches = new Map<string, TurnoOperador[]>();
    
    misTurnos.forEach(turno => {
      const fechaCreacion = turno.created_at ? 
        format(new Date(turno.created_at), 'yyyy-MM-dd') : 
        'sin-fecha';
      
      if (!batches.has(fechaCreacion)) {
        batches.set(fechaCreacion, []);
      }
      batches.get(fechaCreacion)!.push(turno);
    });
    
    return Array.from(batches.entries()).map(([fecha, turnos]) => ({
      id: fecha,
      fecha,
      nombre: `Turnos creados el ${format(new Date(fecha), 'dd/MM/yyyy', { locale: es })}`,
      turnos: turnos.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()),
      totalTurnos: turnos.length
    })).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  };

  // Calcular resumen de horas por lote seleccionado
  const getResumenPorLote = () => {
    const batches = getTurnosBatches();
    const turnosSeleccionados = selectedTurnoBatch === "todos" ? 
      misTurnos : 
      batches.find(b => b.id === selectedTurnoBatch)?.turnos || [];
    
    // Agrupar por operador
    const operadoresUnicos = [...new Set(turnosSeleccionados.map(t => t.operador_nombre))];
    
    return operadoresUnicos.map((operadorNombre, index) => {
      const turnosOperador = turnosSeleccionados.filter(t => t.operador_nombre === operadorNombre);
      const horasDiurnas = turnosOperador.filter(t => t.turno === 'diurno').length * 12;
      const horasNocturnas = turnosOperador.filter(t => t.turno === 'nocturno').length * 12;
      const turnosDomingo = turnosOperador.filter(t => new Date(t.fecha).getDay() === 0);
      const horasDominicalesDiurnas = turnosDomingo.filter(t => t.turno === 'diurno').length * 12;
      const horasDominicalesNocturnas = turnosDomingo.filter(t => t.turno === 'nocturno').length * 12;
      const horasExtras = Math.max(0, (horasDiurnas + horasNocturnas) - 160);
      const totalHoras = horasDiurnas + horasNocturnas;
      
      const colorClasses = [
        'bg-blue-50 border-blue-200',
        'bg-green-50 border-green-200', 
        'bg-purple-50 border-purple-200',
        'bg-orange-50 border-orange-200',
        'bg-indigo-50 border-indigo-200',
        'bg-pink-50 border-pink-200'
      ];
      
      return {
        operadorNombre,
        turnosOperador,
        horasDiurnas,
        horasNocturnas,
        horasDominicalesDiurnas,
        horasDominicalesNocturnas,
        horasExtras,
        totalHoras,
        colorClass: colorClasses[index % 6]
      };
    });
  };

  // Convertir TurnoOperador a formato para CalendarioTurnosGenerados
  const CalendarioTurnosActuales = () => {
    const turnosActuales = getTurnosActuales();
    
    if (turnosActuales.length === 0) {
      return (
        <div className="text-center py-8">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground font-medium">No hay turnos actuales</p>
          <p className="text-sm text-muted-foreground mt-2">
            Los turnos aparecerán aquí cuando sean creados para fechas actuales o futuras.
          </p>
        </div>
      );
    }

    // Agrupar turnos por semana para mejor visualización
    const weeks = new Map();
    
    turnosActuales.forEach(turno => {
      const fecha = new Date(turno.fecha);
      const weekStart = new Date(fecha);
      weekStart.setDate(fecha.getDate() - fecha.getDay()); // Inicio de semana (domingo)
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeks.has(weekKey)) {
        weeks.set(weekKey, []);
      }
      weeks.get(weekKey).push(turno);
    });
    
    const todasLasSemanas = Array.from(weeks.entries()).map(([weekStart, turnos]) => ({
      weekStart: new Date(weekStart),
      turnos: turnos.sort((a: any, b: any) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
    })).sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime());

    return (
      <div className="space-y-8">
        {todasLasSemanas.map(({ weekStart, turnos }, weekIndex) => {
          const fechasSemana = [...new Set(turnos.map((t: any) => t.fecha))].sort();
          const empleados = [...new Set(turnos.map((t: any) => t.operador_nombre))].filter(Boolean) as string[];

          return (
            <div key={weekIndex} className="border rounded-lg p-4">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Semana del {format(weekStart, 'dd/MM/yyyy', { locale: es })}
                {weekIndex === 0 && (
                  <Badge variant="default" className="ml-2">ACTUAL</Badge>
                )}
              </h4>
              
              <div className="overflow-x-auto">
                <div className="grid grid-cols-8 gap-2 min-w-max">
                  <div className="p-2 font-semibold text-center">Personal</div>
                  {fechasSemana.map((fecha: string) => (
                    <div key={fecha} className="text-xs p-2 text-center min-w-[100px]">
                      <div className="font-medium">{format(new Date(fecha), 'EEE', { locale: es })}</div>
                      <div>{format(new Date(fecha), 'dd/MM')}</div>
                    </div>
                  ))}
                  
                  {empleados.map((empleado: string) => (
                    <div key={empleado} className="grid grid-cols-8 gap-2 col-span-8">
                      <div className="text-sm font-medium p-2 bg-muted rounded">
                        <div className="truncate">{empleado}</div>
                      </div>
                      {fechasSemana.map((fecha: string) => {
                        const turno = turnos.find((t: any) => 
                          t.operador_nombre === empleado && t.fecha === fecha
                        );
                        
                        if (!turno) {
                          return (
                            <div key={fecha} className="text-center p-2">
                              <Badge variant="outline" className="bg-gray-100 text-gray-600 text-xs">
                                Descanso
                              </Badge>
                            </div>
                          );
                        }

                        const colorClass = turno.turno === 'nocturno' ? 
                          'bg-purple-200 text-purple-900 border-purple-300' : 
                          'bg-yellow-200 text-yellow-900 border-yellow-300';
                        
                        const horario = turno.horario_inicio && turno.horario_fin ? 
                          `${turno.horario_inicio}-${turno.horario_fin}` : 
                          turno.turno === 'nocturno' ? '18:00-06:00' : '06:00-18:00';

                        return (
                          <div key={fecha} className="text-center p-2">
                            <Badge 
                              variant="outline" 
                              className={`${colorClass} text-xs mb-1 w-full justify-center`}
                            >
                              {turno.turno === 'nocturno' ? 'Noche' : 'Día'}
                            </Badge>
                            <div className="text-xs text-muted-foreground">
                              {horario}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <OperationalThemeWrapper>
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold">Gestión de Turnos de Operadores</h1>
          <p className="text-sm text-muted-foreground">
            Crea y consulta turnos de operadores con calendario actualizado
          </p>
          {currentUser && (
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary">
                <User className="w-3 h-3 mr-1" />
                {currentUser.email}
              </Badge>
              <Badge variant="outline">
                {misTurnos.length} turnos totales
              </Badge>
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          <Dialog open={showGeneradorModal} onOpenChange={setShowGeneradorModal}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Crear Turnos
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Crear Nuevos Turnos</DialogTitle>
              </DialogHeader>
              <GeneradorTurnos
                isOpen={showGeneradorModal}
                onClose={() => setShowGeneradorModal(false)}
                onGenerate={handleGenerarTurnos}
                personal={personalOperadores}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="calendar" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendario Actual
          </TabsTrigger>
          <TabsTrigger value="detailed" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Vista Detallada
          </TabsTrigger>
          <TabsTrigger value="create" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Crear Turnos
          </TabsTrigger>
          <TabsTrigger value="summary" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Resumen por Turno
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="calendar" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Turnos Actuales y Futuros
              </CardTitle>
              <CardDescription>
                Visualización de turnos que incluyen la fecha actual y turnos futuros
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CalendarioTurnosActuales />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="detailed" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Vista Detallada de Todos los Turnos
              </CardTitle>
              <CardDescription>
                Historial completo de todos los turnos generados (pasados, presentes y futuros)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VisualizadorTurnosOperador />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Generador de Turnos Avanzado
              </CardTitle>
              <CardDescription>
                Herramienta completa para crear turnos con patrones personalizados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GeneradorTurnosAvanzado />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="summary" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Resumen de Horas por Lote de Turnos
              </CardTitle>
              <CardDescription>
                Consulta resúmenes independientes de horas trabajadas por cada lote de turnos creado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Selector de lote de turnos */}
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium">Seleccionar lote de turnos:</label>
                  <Select value={selectedTurnoBatch} onValueChange={setSelectedTurnoBatch}>
                    <SelectTrigger className="w-80">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los turnos</SelectItem>
                      {getTurnosBatches().map((batch) => (
                        <SelectItem key={batch.id} value={batch.id}>
                          {batch.nombre} ({batch.totalTurnos} turnos)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getResumenPorLote().map((operador) => (
                    <Card key={operador.operadorNombre} className={`${operador.colorClass} p-4`}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-bold">{operador.operadorNombre}</CardTitle>
                        <Badge variant="outline" className="w-fit">
                          {operador.turnosOperador.length} turnos asignados
                        </Badge>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Horas Diurnas Ordinarias:</span>
                          <span className="font-bold">{Math.max(0, operador.horasDiurnas - operador.horasExtras).toFixed(1)}h</span>
                        </div>
                        {operador.horasExtras > 0 && (
                          <div className="flex justify-between">
                            <span className="text-sm text-orange-600">Horas Extras Diurnas:</span>
                            <span className="font-bold text-orange-600">{operador.horasExtras.toFixed(1)}h</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-sm">Horas Nocturnas:</span>
                          <span className="font-bold">{operador.horasNocturnas.toFixed(1)}h</span>
                        </div>
                        {operador.horasDominicalesDiurnas > 0 && (
                          <div className="flex justify-between">
                            <span className="text-sm text-blue-600">Horas Dominicales Diurnas:</span>
                            <span className="font-bold text-blue-600">{operador.horasDominicalesDiurnas.toFixed(1)}h</span>
                          </div>
                        )}
                        {operador.horasDominicalesNocturnas > 0 && (
                          <div className="flex justify-between">
                            <span className="text-sm text-blue-600">Horas Dominicales Nocturnas:</span>
                            <span className="font-bold text-blue-600">{operador.horasDominicalesNocturnas.toFixed(1)}h</span>
                          </div>
                        )}
                        <div className="border-t pt-2 mt-2">
                          <div className="flex justify-between font-bold">
                            <span>Total:</span>
                            <span>{operador.totalHoras.toFixed(1)}h</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Si no hay turnos, mostrar mensaje */}
                {misTurnos.length === 0 && (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500 font-medium">No hay turnos para mostrar resumen</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Los resúmenes aparecerán cuando se generen turnos.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
     </div>
    </OperationalThemeWrapper>
  );
};

export default TurnosOperador;