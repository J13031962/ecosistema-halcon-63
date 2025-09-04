import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  RotateCcw, 
  Settings,
  Copy,
  RefreshCw,
  Download,
  Upload,
  Calendar as CalendarIcon,
  Clock,
  User,
  AlertTriangle
} from "lucide-react";

// Tipos de turnos con más opciones
const TIPOS_TURNOS = {
  mañana: { 
    id: 'mañana', 
    name: 'Mañana', 
    hours: '06:00-14:00', 
    color: 'bg-blue-500',
    textColor: 'text-blue-700',
    bgLight: 'bg-blue-50',
    duration: 8 
  },
  tarde: { 
    id: 'tarde', 
    name: 'Tarde', 
    hours: '14:00-22:00', 
    color: 'bg-green-500',
    textColor: 'text-green-700',
    bgLight: 'bg-green-50',
    duration: 8 
  },
  noche: { 
    id: 'noche', 
    name: 'Noche', 
    hours: '22:00-06:00', 
    color: 'bg-purple-500',
    textColor: 'text-purple-700',
    bgLight: 'bg-purple-50',
    duration: 8 
  },
  dia_completo: { 
    id: 'dia_completo', 
    name: 'Día Completo', 
    hours: '08:00-20:00', 
    color: 'bg-yellow-500',
    textColor: 'text-yellow-700',
    bgLight: 'bg-yellow-50',
    duration: 12 
  },
  intensivo: { 
    id: 'intensivo', 
    name: 'Intensivo', 
    hours: '07:00-19:00', 
    color: 'bg-orange-500',
    textColor: 'text-orange-700',
    bgLight: 'bg-orange-50',
    duration: 12 
  },
  partido_mañana: { 
    id: 'partido_mañana', 
    name: 'Partido Mañana', 
    hours: '08:00-12:00 / 16:00-20:00', 
    color: 'bg-cyan-500',
    textColor: 'text-cyan-700',
    bgLight: 'bg-cyan-50',
    duration: 8 
  },
  partido_tarde: { 
    id: 'partido_tarde', 
    name: 'Partido Tarde', 
    hours: '12:00-16:00 / 20:00-24:00', 
    color: 'bg-indigo-500',
    textColor: 'text-indigo-700',
    bgLight: 'bg-indigo-50',
    duration: 8 
  },
  descanso: { 
    id: 'descanso', 
    name: 'Descanso', 
    hours: '', 
    color: 'bg-red-500',
    textColor: 'text-red-700',
    bgLight: 'bg-red-50',
    duration: 0 
  },
  vacaciones: { 
    id: 'vacaciones', 
    name: 'Vacaciones', 
    hours: '', 
    color: 'bg-pink-500',
    textColor: 'text-pink-700',
    bgLight: 'bg-pink-50',
    duration: 0 
  },
  enfermedad: { 
    id: 'enfermedad', 
    name: 'Enfermedad', 
    hours: '', 
    color: 'bg-gray-500',
    textColor: 'text-gray-700',
    bgLight: 'bg-gray-50',
    duration: 0 
  }
};

// Empleados con más información
const EMPLEADOS = [
  { 
    id: '1', 
    nombre: 'Juan Pérez', 
    cargo: 'Operador Senior',
    color: 'bg-blue-100',
    email: 'juan.perez@empresa.com',
    telefono: '+34 600 123 456',
    horasSemanales: 40,
    preferencias: ['mañana', 'tarde'],
    restricciones: ['noche'],
    experiencia: 5
  },
  { 
    id: '2', 
    nombre: 'María García', 
    cargo: 'Despachador',
    color: 'bg-green-100',
    email: 'maria.garcia@empresa.com',
    telefono: '+34 600 123 457',
    horasSemanales: 40,
    preferencias: ['tarde', 'noche'],
    restricciones: [],
    experiencia: 8
  },
  { 
    id: '3', 
    nombre: 'Carlos López', 
    cargo: 'Supervisor',
    color: 'bg-purple-100',
    email: 'carlos.lopez@empresa.com',
    telefono: '+34 600 123 458',
    horasSemanales: 45,
    preferencias: ['dia_completo', 'intensivo'],
    restricciones: ['noche'],
    experiencia: 12
  },
  { 
    id: '4', 
    nombre: 'Ana Martín', 
    cargo: 'Operador',
    color: 'bg-yellow-100',
    email: 'ana.martin@empresa.com',
    telefono: '+34 600 123 459',
    horasSemanales: 40,
    preferencias: ['mañana', 'partido_mañana'],
    restricciones: ['noche'],
    experiencia: 3
  },
  { 
    id: '5', 
    nombre: 'Luis Fernández', 
    cargo: 'Técnico',
    color: 'bg-red-100',
    email: 'luis.fernandez@empresa.com',
    telefono: '+34 600 123 460',
    horasSemanales: 35,
    preferencias: ['mañana', 'tarde'],
    restricciones: [],
    experiencia: 7
  },
  { 
    id: '6', 
    nombre: 'Elena Ruiz', 
    cargo: 'Operador',
    color: 'bg-pink-100',
    email: 'elena.ruiz@empresa.com',
    telefono: '+34 600 123 461',
    horasSemanales: 40,
    preferencias: ['tarde', 'noche'],
    restricciones: ['mañana'],
    experiencia: 4
  }
];

const DIAS_SEMANA = [
  'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'
];

interface TurnoAsignado {
  empleadoId: string;
  turnoId: string;
  dia: string;
  fecha: string;
  notas?: string;
  aprobado?: boolean;
}

export const CalendarTurnosDespachador = () => {
  const [turnos, setTurnos] = useState<TurnoAsignado[]>([]);
  const [selectedEmpleado, setSelectedEmpleado] = useState<string>('');
  const [selectedTurno, setSelectedTurno] = useState<string>('');
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [showConfig, setShowConfig] = useState(false);
  const [showEmpleadoDetail, setShowEmpleadoDetail] = useState(false);
  const [selectedEmpleadoDetail, setSelectedEmpleadoDetail] = useState<string>('');
  const [modoAsignacion, setModoAsignacion] = useState<'individual' | 'masivo'>('individual');
  const [modoVisualizacion, setModoVisualizacion] = useState<'compacto' | 'detallado'>('detallado');

  // Obtener fechas de la semana
  const getWeekDates = (date: Date) => {
    const week = [];
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startOfWeek);
      currentDate.setDate(startOfWeek.getDate() + i);
      week.push(currentDate);
    }
    return week;
  };

  const weekDates = getWeekDates(selectedWeek);

  const handleAsignarTurno = (empleadoId: string, dia: string, fecha: string) => {
    if (!selectedTurno) return;

    const existingIndex = turnos.findIndex(
      t => t.empleadoId === empleadoId && t.dia === dia && t.fecha === fecha
    );

    if (existingIndex >= 0) {
      const newTurnos = [...turnos];
      newTurnos[existingIndex] = {
        ...newTurnos[existingIndex],
        turnoId: selectedTurno,
        aprobado: false
      };
      setTurnos(newTurnos);
    } else {
      setTurnos([...turnos, {
        empleadoId,
        turnoId: selectedTurno,
        dia,
        fecha,
        aprobado: false
      }]);
    }
  };

  const handleAsignacionMasiva = () => {
    if (!selectedEmpleado || !selectedTurno) return;

    weekDates.forEach((date, index) => {
      const dia = DIAS_SEMANA[index];
      const fecha = date.toISOString().split('T')[0];
      handleAsignarTurno(selectedEmpleado, dia, fecha);
    });
  };

  const getTurnoForEmpleadoAndDay = (empleadoId: string, dia: string, fecha: string) => {
    return turnos.find(t => t.empleadoId === empleadoId && t.dia === dia && t.fecha === fecha);
  };

  const getEmpleadoInfo = (empleadoId: string) => {
    return EMPLEADOS.find(e => e.id === empleadoId);
  };

  const getTurnoInfo = (turnoId: string) => {
    return Object.values(TIPOS_TURNOS).find(t => t.id === turnoId);
  };

  const calculateHorasSemanales = (empleadoId: string) => {
    const turnosEmpleado = turnos.filter(t => t.empleadoId === empleadoId);
    return turnosEmpleado.reduce((acc, turno) => {
      const turnoInfo = getTurnoInfo(turno.turnoId);
      return acc + (turnoInfo?.duration || 0);
    }, 0);
  };

  const handleGuardar = () => {
    console.log('Guardando turnos:', turnos);
    alert('Turnos guardados exitosamente');
  };

  const handleReset = () => {
    setTurnos([]);
    setSelectedEmpleado('');
    setSelectedTurno('');
  };

  const copiarSemana = () => {
    // Lógica para copiar turnos a la siguiente semana
    console.log('Copiando turnos a la siguiente semana');
  };

  const exportarPlan = () => {
    // Lógica para exportar plan de turnos
    console.log('Exportando plan de turnos');
  };

  const previousWeek = () => {
    const prevWeek = new Date(selectedWeek);
    prevWeek.setDate(prevWeek.getDate() - 7);
    setSelectedWeek(prevWeek);
  };

  const nextWeek = () => {
    const nextWeek = new Date(selectedWeek);
    nextWeek.setDate(nextWeek.getDate() + 7);
    setSelectedWeek(nextWeek);
  };

  return (
    <div className="space-y-6">
      {/* Header con controles */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={previousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="text-lg font-semibold">
            {weekDates[0]?.toLocaleDateString('es-ES', { 
              day: 'numeric', 
              month: 'long' 
            })} - {weekDates[6]?.toLocaleDateString('es-ES', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            })}
          </div>
          
          <Button variant="outline" size="sm" onClick={nextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={copiarSemana}>
            <Copy className="h-4 w-4 mr-2" />
            Copiar Semana
          </Button>
          
          <Button variant="outline" size="sm" onClick={exportarPlan}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>

          <Dialog open={showConfig} onOpenChange={setShowConfig}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Configurar
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Configuración del Calendario</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Modo de asignación</Label>
                  <Select value={modoAsignacion} onValueChange={(value: 'individual' | 'masivo') => setModoAsignacion(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="masivo">Masivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label>Vista</Label>
                  <Select value={modoVisualizacion} onValueChange={(value: 'compacto' | 'detallado') => setModoVisualizacion(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="compacto">Compacto</SelectItem>
                      <SelectItem value="detallado">Detallado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>

          <Button onClick={handleGuardar}>
            <Save className="h-4 w-4 mr-2" />
            Guardar
          </Button>
        </div>
      </div>

      {/* Controles de selección */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
        <div>
          <Label className="text-sm font-medium mb-2 block">Empleado</Label>
          <Select value={selectedEmpleado} onValueChange={setSelectedEmpleado}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un empleado" />
            </SelectTrigger>
            <SelectContent>
              {EMPLEADOS.map(empleado => (
                <SelectItem key={empleado.id} value={empleado.id}>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${empleado.color}`}></div>
                    {empleado.nombre} - {empleado.cargo}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-sm font-medium mb-2 block">Tipo de Turno</Label>
          <Select value={selectedTurno} onValueChange={setSelectedTurno}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un turno" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(TIPOS_TURNOS).map(turno => (
                <SelectItem key={turno.id} value={turno.id}>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${turno.color}`}></div>
                    {turno.name} {turno.hours && `(${turno.hours})`}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end">
          {modoAsignacion === 'masivo' && (
            <Button 
              onClick={handleAsignacionMasiva}
              disabled={!selectedEmpleado || !selectedTurno}
              className="w-full"
            >
              Asignar Toda la Semana
            </Button>
          )}
        </div>
      </div>

      {/* Leyenda de turnos */}
      <div className="flex flex-wrap gap-4 p-4 bg-background border rounded-lg">
        {Object.values(TIPOS_TURNOS).map(turno => (
          <div key={turno.id} className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded ${turno.color}`}></div>
            <span className="text-sm font-medium">{turno.name}</span>
            {turno.hours && <span className="text-xs text-muted-foreground">({turno.hours})</span>}
          </div>
        ))}
      </div>

      {/* Calendario principal */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-4 min-w-[200px]">Empleado</th>
                  {weekDates.map((date, index) => (
                    <th key={index} className="text-center p-4 min-w-[120px]">
                      <div>
                        <div className="font-medium">{DIAS_SEMANA[index]}</div>
                        <div className="text-sm text-muted-foreground">
                          {date.getDate()}/{date.getMonth() + 1}
                        </div>
                      </div>
                    </th>
                  ))}
                  <th className="text-center p-4 min-w-[100px]">Horas</th>
                </tr>
              </thead>
              <tbody>
                {EMPLEADOS.map((empleado) => (
                  <tr key={empleado.id} className="border-b hover:bg-muted/20">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${empleado.color} flex items-center justify-center text-sm font-medium`}>
                          {empleado.nombre.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="font-medium">{empleado.nombre}</div>
                          <div className="text-sm text-muted-foreground">{empleado.cargo}</div>
                          {modoVisualizacion === 'detallado' && (
                            <div className="text-xs text-muted-foreground">
                              Exp: {empleado.experiencia} años
                            </div>
                          )}
                        </div>
                        <Dialog open={showEmpleadoDetail && selectedEmpleadoDetail === empleado.id} 
                               onOpenChange={(open) => {
                                 setShowEmpleadoDetail(open);
                                 if (!open) setSelectedEmpleadoDetail('');
                               }}>
                          <DialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setSelectedEmpleadoDetail(empleado.id)}
                            >
                              <User className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Detalles de {empleado.nombre}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>Email</Label>
                                <p className="text-sm">{empleado.email}</p>
                              </div>
                              <div>
                                <Label>Teléfono</Label>
                                <p className="text-sm">{empleado.telefono}</p>
                              </div>
                              <div>
                                <Label>Horas semanales objetivo</Label>
                                <p className="text-sm">{empleado.horasSemanales}h</p>
                              </div>
                              <div>
                                <Label>Preferencias de turno</Label>
                                <div className="flex gap-2">
                                  {empleado.preferencias.map(pref => {
                                    const turnoInfo = getTurnoInfo(pref);
                                    return turnoInfo ? (
                                      <Badge key={pref} variant="secondary">
                                        {turnoInfo.name}
                                      </Badge>
                                    ) : null;
                                  })}
                                </div>
                              </div>
                              {empleado.restricciones.length > 0 && (
                                <div>
                                  <Label>Restricciones</Label>
                                  <div className="flex gap-2">
                                    {empleado.restricciones.map(rest => {
                                      const turnoInfo = getTurnoInfo(rest);
                                      return turnoInfo ? (
                                        <Badge key={rest} variant="destructive">
                                          {turnoInfo.name}
                                        </Badge>
                                      ) : null;
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </td>
                    
                    {weekDates.map((date, dayIndex) => {
                      const dia = DIAS_SEMANA[dayIndex];
                      const fecha = date.toISOString().split('T')[0];
                      const turno = getTurnoForEmpleadoAndDay(empleado.id, dia, fecha);
                      const turnoInfo = turno ? getTurnoInfo(turno.turnoId) : null;
                      
                      // Verificar si el turno está en conflicto con las preferencias
                      const isPreferred = turno ? empleado.preferencias.includes(turno.turnoId) : false;
                      const isRestricted = turno ? empleado.restricciones.includes(turno.turnoId) : false;

                      return (
                        <td key={dayIndex} className="p-2">
                          <div
                            className={`
                              min-h-[60px] border-2 border-dashed border-gray-200 rounded-lg 
                              cursor-pointer hover:border-gray-400 transition-colors
                              ${turnoInfo ? `${turnoInfo.bgLight} border-solid ${turnoInfo.color.replace('bg-', 'border-')}` : ''}
                              ${isRestricted ? 'ring-2 ring-red-400' : ''}
                              ${isPreferred ? 'ring-2 ring-green-400' : ''}
                            `}
                            onClick={() => {
                              if (modoAsignacion === 'individual') {
                                handleAsignarTurno(empleado.id, dia, fecha);
                              }
                            }}
                          >
                            {turnoInfo && (
                              <div className="p-2">
                                <div className={`text-xs font-medium ${turnoInfo.textColor}`}>
                                  {turnoInfo.name}
                                </div>
                                {turnoInfo.hours && modoVisualizacion === 'detallado' && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {turnoInfo.hours}
                                  </div>
                                )}
                                {!turno?.aprobado && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <AlertTriangle className="h-3 w-3 text-orange-500" />
                                    <span className="text-xs text-orange-600">Pendiente</span>
                                  </div>
                                )}
                                {isRestricted && (
                                  <div className="text-xs text-red-600 mt-1">⚠ Restricción</div>
                                )}
                                {isPreferred && (
                                  <div className="text-xs text-green-600 mt-1">✓ Preferido</div>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                    
                    <td className="p-4 text-center">
                      <div className="text-sm font-medium">
                        {calculateHorasSemanales(empleado.id)}h
                      </div>
                      <div className="text-xs text-muted-foreground">
                        /{empleado.horasSemanales}h
                      </div>
                      {calculateHorasSemanales(empleado.id) !== empleado.horasSemanales && (
                        <div className="text-xs text-orange-600 mt-1">
                          <AlertTriangle className="h-3 w-3 inline mr-1" />
                          Desvío
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Resumen de horas por día */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Resumen Semanal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-4">
            {DIAS_SEMANA.map((dia, index) => {
              const fecha = weekDates[index]?.toISOString().split('T')[0];
              const turnosDelDia = turnos.filter(t => t.dia === dia && t.fecha === fecha);
              const horasTotales = turnosDelDia.reduce((acc, turno) => {
                const turnoInfo = getTurnoInfo(turno.turnoId);
                return acc + (turnoInfo?.duration || 0);
              }, 0);
              const empleadosAsignados = turnosDelDia.length;

              return (
                <div key={dia} className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="font-medium text-sm">{dia}</div>
                  <div className="text-lg font-bold mt-1">{horasTotales}h</div>
                  <div className="text-xs text-muted-foreground">
                    {empleadosAsignados} empleados
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};