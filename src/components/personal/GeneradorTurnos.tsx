import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { CalendarDays, Clock, Users, Settings, RefreshCw, Download, Save } from "lucide-react";
import { format, addDays, startOfWeek, endOfWeek } from "date-fns";
import { es } from "date-fns/locale";

// Empleados disponibles con más información
const empleadosDisponibles = [
  { id: 1, nombre: "Ana García", cargo: "Operador de Alarmas", experiencia: "Senior", disponibilidad: ["manana", "tarde"] },
  { id: 2, nombre: "Luis Martín", cargo: "Despachador de Patrullas", experiencia: "Senior", disponibilidad: ["manana", "tarde", "noche"] },
  { id: 3, nombre: "María López", cargo: "Supervisor Motorizado", experiencia: "Senior", disponibilidad: ["manana", "tarde", "noche"] },
  { id: 4, nombre: "Carlos Ruiz", cargo: "Técnico", experiencia: "Junior", disponibilidad: ["manana", "tarde"] },
  { id: 5, nombre: "Sandra Morales", cargo: "Operador de Alarmas", experiencia: "Senior", disponibilidad: ["tarde", "noche"] },
  { id: 6, nombre: "Pedro Silva", cargo: "Guardia de Seguridad", experiencia: "Junior", disponibilidad: ["noche"] },
  { id: 7, nombre: "Laura Torres", cargo: "Coordinador", experiencia: "Senior", disponibilidad: ["manana", "tarde"] },
  { id: 8, nombre: "Miguel Ángel", cargo: "Supervisor Motorizado", experiencia: "Senior", disponibilidad: ["manana", "tarde", "noche"] }
];

// Tipos de turno mejorados
const tiposTurno = {
  manana: { 
    label: "Mañana", 
    horario: "06:00-14:00", 
    color: "bg-blue-100 text-blue-800 border-blue-200",
    codigo: "M",
    horas: 8
  },
  tarde: { 
    label: "Tarde", 
    horario: "14:00-22:00", 
    color: "bg-green-100 text-green-800 border-green-200",
    codigo: "T", 
    horas: 8
  },
  noche: { 
    label: "Noche", 
    horario: "18:00-06:00", 
    color: "bg-purple-100 text-purple-800 border-purple-200",
    codigo: "N",
    horas: 12
  },
  dia_completo: { 
    label: "Día Completo", 
    horario: "06:00-18:00", 
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    codigo: "DC",
    horas: 12
  },
  descanso: { 
    label: "Descanso", 
    horario: "---", 
    color: "bg-gray-100 text-gray-600 border-gray-200",
    codigo: "D",
    horas: 0
  },
  vacaciones: { 
    label: "Vacaciones", 
    horario: "---", 
    color: "bg-red-100 text-red-800 border-red-200",
    codigo: "V",
    horas: 0
  }
};

// Patrones de rotación predefinidos
const patronesRotacion = {
  rotacion_2_2_2: {
    nombre: "Patrón (2-2-2) - 3 Empleados",
    descripcion: "2 días trabajo día, 2 días trabajo noche, 2 días descanso - rotación perfecta para 3 empleados",
    patron: ["dia", "dia", "noche", "noche", "descanso", "descanso"],
    ciclo: 6
  },
  rotacion_clasica: {
    nombre: "Rotación Clásica (2-2-3)",
    descripcion: "2 días trabajo, 2 días descanso, 3 días trabajo",
    patron: ["trabajo", "trabajo", "descanso", "descanso", "trabajo", "trabajo", "trabajo"],
    ciclo: 7
  },
  continental: {
    nombre: "Continental (4 equipos)",
    descripcion: "Rotación cada 4 días entre 4 equipos",
    patron: ["trabajo", "trabajo", "trabajo", "trabajo", "descanso", "descanso", "descanso"],
    ciclo: 7
  },
  dupont: {
    nombre: "DuPont (12 horas)",
    descripcion: "Turnos de 12 horas con rotación cada 4 semanas",
    patron: ["trabajo", "trabajo", "descanso", "descanso", "trabajo", "trabajo", "descanso"],
    ciclo: 7
  },
  panama: {
    nombre: "Panamá (2-2-3-2-2-3)",
    descripcion: "Alternancia 2-2-3 para cobertura 24/7",
    patron: ["trabajo", "trabajo", "descanso", "descanso", "trabajo", "trabajo", "trabajo"],
    ciclo: 14
  }
};

export function GeneradorTurnos() {
  const { toast } = useToast();
  const [configuracion, setConfiguracion] = useState({
    fechaInicio: format(new Date(), 'yyyy-MM-dd'),
    periodo: 'semanal', // semanal, quincenal, mensual
    patronRotacion: 'rotacion_2_2_2',
    empleadosSeleccionados: [] as number[],
    turnosHabilitados: ['manana', 'tarde', 'noche'],
    cobertura24h: true,
    minimoPersonalTurno: 1,
    maximoHorasSemana: 40,
    descansoMinimoHoras: 12,
    rotacionAutomatica: true
  });

  const [turnosGenerados, setTurnosGenerados] = useState<any[]>([]);
  const [vistaTurnos, setVistaTurnos] = useState<'calendario' | 'resumen' | 'estadisticas'>('calendario');
  const [isGenerating, setIsGenerating] = useState(false);

  const empleadosSeleccionados = empleadosDisponibles.filter(emp => 
    configuracion.empleadosSeleccionados.includes(emp.id)
  );

  const generarTurnos = async () => {
    if (empleadosSeleccionados.length === 0) {
      toast({
        title: "Error",
        description: "Debe seleccionar al menos un empleado",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      // Simular procesamiento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const fechaInicio = new Date(configuracion.fechaInicio);
      const patron = patronesRotacion[configuracion.patronRotacion];
      const diasPeriodo = configuracion.periodo === 'semanal' ? 7 : 
                         configuracion.periodo === 'quincenal' ? 15 : 30;
      
      const nuevosTurnos: any[] = [];
      
      // Generar turnos para cada día del período
      for (let dia = 0; dia < diasPeriodo; dia++) {
        const fecha = addDays(fechaInicio, dia);
        const diaSemana = fecha.getDay();
        
        empleadosSeleccionados.forEach((empleado, index) => {
          // Patrón simple y directo para 3 empleados:
          // Ana (0): días 0,1=Día, días 2,3=Noche, días 4,5=Descanso, luego se repite
          // María (1): días 0,1=Noche, días 2,3=Descanso, días 4,5=Día, luego se repite  
          // Miguel (2): días 0,1=Descanso, días 2,3=Día, días 4,5=Noche, luego se repite
          
          const posicionEnCiclo = dia % 6; // Ciclo de 6 días
          let tipoTurno = 'descanso';
          
          if (index === 0) { // Ana
            if (posicionEnCiclo === 0 || posicionEnCiclo === 1) {
              tipoTurno = 'dia';
            } else if (posicionEnCiclo === 2 || posicionEnCiclo === 3) {
              tipoTurno = 'noche';
            } else {
              tipoTurno = 'descanso';
            }
          } else if (index === 1) { // María  
            if (posicionEnCiclo === 0 || posicionEnCiclo === 1) {
              tipoTurno = 'noche';
            } else if (posicionEnCiclo === 2 || posicionEnCiclo === 3) {
              tipoTurno = 'descanso';
            } else {
              tipoTurno = 'dia';
            }
          } else if (index === 2) { // Miguel
            if (posicionEnCiclo === 0 || posicionEnCiclo === 1) {
              tipoTurno = 'descanso';
            } else if (posicionEnCiclo === 2 || posicionEnCiclo === 3) {
              tipoTurno = 'dia';
            } else {
              tipoTurno = 'noche';
            }
          }
          
          let turnoAsignado = 'descanso';
          
          if (tipoTurno === 'dia') {
            turnoAsignado = 'manana'; // Siempre asignar mañana para "día"
          } else if (tipoTurno === 'noche') {
            turnoAsignado = 'noche';
          }
          // Si es 'descanso', turnoAsignado ya está como 'descanso'
          
          // Aplicar restricciones de fin de semana solo si no es cobertura 24h
          if ((diaSemana === 0 || diaSemana === 6) && !configuracion.cobertura24h && turnoAsignado !== 'descanso') {
            // Reducir probabilidad de trabajo en fin de semana
            turnoAsignado = Math.random() > 0.3 ? 'descanso' : turnoAsignado;
          }
          
          nuevosTurnos.push({
            fecha: format(fecha, 'yyyy-MM-dd'),
            empleadoId: empleado.id,
            empleadoNombre: empleado.nombre,
            turno: turnoAsignado,
            horas: tiposTurno[turnoAsignado]?.horas || 0,
            diaSemana: format(fecha, 'EEEE', { locale: es })
          });
        });
      }
      
      setTurnosGenerados(nuevosTurnos);
      
      toast({
        title: "Turnos generados exitosamente",
        description: `Se generaron ${nuevosTurnos.length} asignaciones de turno`,
      });
      
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron generar los turnos",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const guardarTurnos = async () => {
    if (turnosGenerados.length === 0) {
      toast({
        title: "Error",
        description: "No hay turnos generados para guardar",
        variant: "destructive"
      });
      return;
    }

    try {
      // Aquí se implementaría la lógica para guardar en Supabase
      // Por ahora guardamos en localStorage para persistencia
      const turnosParaGuardar = {
        configuracion,
        turnos: turnosGenerados,
        fechaGeneracion: new Date().toISOString(),
        id: Date.now().toString()
      };
      
      const turnosExistentes = JSON.parse(localStorage.getItem('turnosGenerados') || '[]');
      turnosExistentes.push(turnosParaGuardar);
      localStorage.setItem('turnosGenerados', JSON.stringify(turnosExistentes));
      
      toast({
        title: "Turnos guardados",
        description: "Los turnos han sido guardados exitosamente",
      });
      
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron guardar los turnos",
        variant: "destructive"
      });
    }
  };

  const calcularEstadisticas = () => {
    const stats = {
      totalHoras: 0,
      horasPorEmpleado: {} as { [key: string]: number },
      turnosPorTipo: {} as { [key: string]: number },
      diasDescanso: 0
    };

    turnosGenerados.forEach(turno => {
      stats.totalHoras += turno.horas;
      
      if (!stats.horasPorEmpleado[turno.empleadoNombre]) {
        stats.horasPorEmpleado[turno.empleadoNombre] = 0;
      }
      stats.horasPorEmpleado[turno.empleadoNombre] += turno.horas;
      
      if (!stats.turnosPorTipo[turno.turno]) {
        stats.turnosPorTipo[turno.turno] = 0;
      }
      stats.turnosPorTipo[turno.turno]++;
      
      if (turno.turno === 'descanso') {
        stats.diasDescanso++;
      }
    });

    return stats;
  };

  const exportarTurnos = () => {
    const dataStr = JSON.stringify(turnosGenerados, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `turnos_${configuracion.fechaInicio}.json`;
    link.click();
    
    toast({
      title: "Turnos exportados",
      description: "Los turnos se han descargado como archivo JSON",
    });
  };

  const renderCalendario = () => {
    const fechas = [...new Set(turnosGenerados.map(t => t.fecha))].sort();
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-8 gap-2 text-sm font-medium text-center">
          <div>Empleado</div>
          {fechas.slice(0, 7).map(fecha => (
            <div key={fecha} className="text-xs">
              <div>{format(new Date(fecha), 'EEE', { locale: es })}</div>
              <div>{format(new Date(fecha), 'dd/MM')}</div>
            </div>
          ))}
        </div>
        
        {empleadosSeleccionados.map(empleado => (
          <div key={empleado.id} className="grid grid-cols-8 gap-2 items-center">
            <div className="text-sm font-medium p-2 bg-muted rounded">
              <div>{empleado.nombre}</div>
              <div className="text-xs text-muted-foreground">{empleado.cargo}</div>
            </div>
            {fechas.slice(0, 7).map(fecha => {
              const turno = turnosGenerados.find(t => 
                t.fecha === fecha && t.empleadoId === empleado.id
              );
              const tipoTurno = tiposTurno[turno?.turno] || tiposTurno.descanso;
              
              return (
                <div key={fecha} className="text-center">
                  <Badge 
                    variant="outline" 
                    className={`${tipoTurno.color} text-xs p-1`}
                  >
                    {tipoTurno.label}
                  </Badge>
                  {turno?.horas > 0 && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {turno.horas}h
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  const renderEstadisticas = () => {
    const stats = calcularEstadisticas();
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Horas Totales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.totalHoras}</div>
            <p className="text-sm text-muted-foreground">
              Promedio: {(stats.totalHoras / empleadosSeleccionados.length).toFixed(1)}h por empleado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribución por Turno</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(stats.turnosPorTipo).map(([turno, cantidad]) => (
                <div key={turno} className="flex justify-between items-center">
                  <span className="text-sm">{tiposTurno[turno]?.label || turno}</span>
                  <Badge variant="outline">{cantidad}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Horas por Empleado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {Object.entries(stats.horasPorEmpleado).map(([empleado, horas]) => (
                <div key={empleado} className="flex justify-between items-center text-sm">
                  <span className="truncate">{empleado}</span>
                  <Badge variant="secondary">{horas}h</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Configuración */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuración de Turnos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Período y Fechas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Fecha de Inicio</Label>
              <Input
                type="date"
                value={configuracion.fechaInicio}
                onChange={(e) => setConfiguracion(prev => ({
                  ...prev,
                  fechaInicio: e.target.value
                }))}
              />
            </div>
            <div>
              <Label>Período</Label>
              <Select 
                value={configuracion.periodo} 
                onValueChange={(value) => setConfiguracion(prev => ({
                  ...prev, 
                  periodo: value
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semanal">Semanal (7 días)</SelectItem>
                  <SelectItem value="quincenal">Quincenal (15 días)</SelectItem>
                  <SelectItem value="mensual">Mensual (30 días)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Patrón de Rotación</Label>
              <Select 
                value={configuracion.patronRotacion} 
                onValueChange={(value) => setConfiguracion(prev => ({
                  ...prev, 
                  patronRotacion: value
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(patronesRotacion).map(([key, patron]) => (
                    <SelectItem key={key} value={key}>{patron.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Selección de Empleados */}
          <div>
            <Label className="text-base font-medium">Empleados Participantes</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
              {empleadosDisponibles.map(empleado => (
                <div key={empleado.id} className="flex items-center space-x-2 p-3 border rounded-lg">
                  <Checkbox
                    id={`emp-${empleado.id}`}
                    checked={configuracion.empleadosSeleccionados.includes(empleado.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setConfiguracion(prev => ({
                          ...prev,
                          empleadosSeleccionados: [...prev.empleadosSeleccionados, empleado.id]
                        }));
                      } else {
                        setConfiguracion(prev => ({
                          ...prev,
                          empleadosSeleccionados: prev.empleadosSeleccionados.filter(id => id !== empleado.id)
                        }));
                      }
                    }}
                  />
                  <div className="flex-1">
                    <label 
                      htmlFor={`emp-${empleado.id}`} 
                      className="text-sm font-medium cursor-pointer"
                    >
                      {empleado.nombre}
                    </label>
                    <div className="text-xs text-muted-foreground">{empleado.cargo}</div>
                    <div className="text-xs text-blue-600">{empleado.experiencia}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Configuración Avanzada */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Turnos Habilitados</Label>
              <div className="space-y-2 mt-2">
                {['manana', 'tarde', 'noche', 'dia_completo'].map(turno => (
                  <div key={turno} className="flex items-center space-x-2">
                    <Checkbox
                      id={`turno-${turno}`}
                      checked={configuracion.turnosHabilitados.includes(turno)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setConfiguracion(prev => ({
                            ...prev,
                            turnosHabilitados: [...prev.turnosHabilitados, turno]
                          }));
                        } else {
                          setConfiguracion(prev => ({
                            ...prev,
                            turnosHabilitados: prev.turnosHabilitados.filter(t => t !== turno)
                          }));
                        }
                      }}
                    />
                    <Label htmlFor={`turno-${turno}`} className="text-sm">
                      {tiposTurno[turno].label} ({tiposTurno[turno].horario})
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="cobertura24h"
                  checked={configuracion.cobertura24h}
                  onCheckedChange={(checked) => setConfiguracion(prev => ({
                    ...prev,
                    cobertura24h: !!checked
                  }))}
                />
                <Label htmlFor="cobertura24h">Cobertura 24 horas</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rotacionAuto"
                  checked={configuracion.rotacionAutomatica}
                  onCheckedChange={(checked) => setConfiguracion(prev => ({
                    ...prev,
                    rotacionAutomatica: !!checked
                  }))}
                />
                <Label htmlFor="rotacionAuto">Rotación automática</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botones de Acción */}
      <div className="flex gap-3">
        <Button 
          onClick={generarTurnos} 
          className="flex-1"
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Generando Turnos...
            </>
          ) : (
            <>
              <CalendarDays className="h-4 w-4 mr-2" />
              Generar Turnos
            </>
          )}
        </Button>
        
        {turnosGenerados.length > 0 && (
          <>
            <Button variant="outline" onClick={exportarTurnos}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button variant="outline" onClick={guardarTurnos}>
              <Save className="h-4 w-4 mr-2" />
              Guardar
            </Button>
          </>
        )}
      </div>

      {/* Resultados */}
      {turnosGenerados.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Turnos Generados
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant={vistaTurnos === 'calendario' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setVistaTurnos('calendario')}
                >
                  Calendario
                </Button>
                <Button
                  variant={vistaTurnos === 'estadisticas' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setVistaTurnos('estadisticas')}
                >
                  Estadísticas
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {vistaTurnos === 'calendario' && renderCalendario()}
            {vistaTurnos === 'estadisticas' && renderEstadisticas()}
          </CardContent>
        </Card>
      )}
    </div>
  );
}