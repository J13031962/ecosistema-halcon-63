import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Eye, Trash2, Download } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// Tipos de turno con colores - mismos que el generador
const tiposTurno = {
  manana: { 
    label: "Día", 
    horario: "06:00-14:00", 
    color: "bg-yellow-200 text-yellow-900 border-yellow-300",
    codigo: "Día",
    horas: 8
  },
  tarde: { 
    label: "Día", 
    horario: "14:00-22:00", 
    color: "bg-yellow-200 text-yellow-900 border-yellow-300",
    codigo: "Día", 
    horas: 8
  },
  noche: { 
    label: "Noche", 
    horario: "18:00-06:00", 
    color: "bg-purple-200 text-purple-900 border-purple-300",
    codigo: "Noche",
    horas: 12
  },
  dia_completo: { 
    label: "Día", 
    horario: "06:00-18:00", 
    color: "bg-yellow-200 text-yellow-900 border-yellow-300",
    codigo: "Día",
    horas: 12
  },
  descanso: { 
    label: "Descanso", 
    horario: "---", 
    color: "bg-orange-200 text-orange-900 border-orange-300",
    codigo: "Descanso",
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

interface TurnoGenerado {
  configuracion: any;
  turnos: any[];
  fechaGeneracion: string;
  id: string;
}

export function CalendarioTurnosGenerados() {
  const [turnosGuardados, setTurnosGuardados] = useState<TurnoGenerado[]>([]);
  const [turnosSeleccionados, setTurnosSeleccionados] = useState<TurnoGenerado | null>(null);
  const [vistaTurnos, setVistaTurnos] = useState<'lista' | 'calendario'>('lista');

  useEffect(() => {
    cargarTurnosGuardados();
  }, []);

  const cargarTurnosGuardados = () => {
    try {
      const turnos = JSON.parse(localStorage.getItem('turnosGenerados') || '[]');
      setTurnosGuardados(turnos);
      if (turnos.length > 0 && !turnosSeleccionados) {
        setTurnosSeleccionados(turnos[turnos.length - 1]); // Mostrar el más reciente
      }
    } catch (error) {
      console.error('Error cargando turnos:', error);
    }
  };

  const eliminarTurnos = (id: string) => {
    const turnosActualizados = turnosGuardados.filter(t => t.id !== id);
    setTurnosGuardados(turnosActualizados);
    localStorage.setItem('turnosGenerados', JSON.stringify(turnosActualizados));
    
    if (turnosSeleccionados?.id === id) {
      setTurnosSeleccionados(turnosActualizados.length > 0 ? turnosActualizados[0] : null);
    }
  };

  const exportarTurnos = (turnos: TurnoGenerado) => {
    const dataStr = JSON.stringify(turnos, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `turnos_${turnos.configuracion.fechaInicio}_${turnos.id}.json`;
    link.click();
  };

  const renderCalendario = () => {
    if (!turnosSeleccionados) return null;

    const fechas = [...new Set(turnosSeleccionados.turnos.map(t => t.fecha))].sort();
    const empleados = [...new Set(turnosSeleccionados.turnos.map(t => ({ id: t.empleadoId, nombre: t.empleadoNombre })))];
    
    // Determinar días a mostrar según el período generado
    const periodo = turnosSeleccionados.configuracion?.periodo || 'semanal';
    const diasAMostrar = periodo === 'semanal' ? 7 : periodo === 'quincenal' ? 15 : 30;
    const fechasAMostrar = fechas.slice(0, Math.min(diasAMostrar, fechas.length));
    
    const cambiarTurno = (empleadoId: number, fecha: string, nuevoTurno: string) => {
      const turnosActualizados = { ...turnosSeleccionados };
      const indice = turnosActualizados.turnos.findIndex(t => 
        t.empleadoId === empleadoId && t.fecha === fecha
      );
      
      if (indice >= 0) {
        turnosActualizados.turnos[indice] = {
          ...turnosActualizados.turnos[indice],
          turno: nuevoTurno,
          horas: tiposTurno[nuevoTurno]?.horas || 0
        };
        
        // Actualizar en localStorage
        const todosLosTurnos = JSON.parse(localStorage.getItem('turnosGenerados') || '[]');
        const indiceTurnos = todosLosTurnos.findIndex(t => t.id === turnosSeleccionados.id);
        if (indiceTurnos >= 0) {
          todosLosTurnos[indiceTurnos] = turnosActualizados;
          localStorage.setItem('turnosGenerados', JSON.stringify(todosLosTurnos));
          setTurnosSeleccionados(turnosActualizados);
          setTurnosGuardados(todosLosTurnos);
        }
      }
    };

    // Calcular columnas dinámicamente
    const numColumnas = fechasAMostrar.length + 1;
    const gridCols = `grid-cols-${Math.min(numColumnas, 16)}`;
    
    return (
      <div className="space-y-4 overflow-x-auto">
        <div className={`grid ${gridCols} gap-1 text-sm font-medium text-center min-w-max`}>
          <div className="p-2 font-semibold">Empleado</div>
          {fechasAMostrar.map(fecha => (
            <div key={fecha} className="text-xs p-1 min-w-[80px]">
              <div className="font-medium">{format(new Date(fecha), 'EEE', { locale: es })}</div>
              <div>{format(new Date(fecha), 'dd/MM')}</div>
            </div>
          ))}
        </div>
        
        {empleados.map(empleado => (
          <div key={empleado.id} className={`grid ${gridCols} gap-1 items-center min-w-max`}>
            <div className="text-sm font-medium p-2 bg-muted rounded min-w-[120px]">
              <div className="truncate">{empleado.nombre}</div>
            </div>
            {fechasAMostrar.map(fecha => {
              const turno = turnosSeleccionados.turnos.find(t => 
                t.fecha === fecha && t.empleadoId === empleado.id
              );
              const tipoTurno = tiposTurno[turno?.turno] || tiposTurno.descanso;
              
              return (
                <div key={fecha} className="text-center min-w-[80px]">
                  <Select 
                    value={turno?.turno || 'descanso'}
                    onValueChange={(value) => cambiarTurno(empleado.id, fecha, value)}
                  >
                    <SelectTrigger className="h-12 w-full border-none p-1">
                      <Badge 
                        variant="outline" 
                        className={`${tipoTurno.color} text-xs p-1 border cursor-pointer w-full justify-center`}
                      >
                        {tipoTurno.codigo}
                      </Badge>
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(tiposTurno).map(([key, tipo]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={`${tipo.color} text-xs`}>
                              {tipo.codigo}
                            </Badge>
                            <span>{tipo.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

  if (turnosGuardados.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">No hay turnos generados aún.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Usa el Generador de Turnos para crear nuevas programaciones.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Turnos Generados</h3>
          <p className="text-sm text-muted-foreground">
            Visualiza y gestiona los turnos generados automáticamente
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={vistaTurnos === 'lista' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setVistaTurnos('lista')}
          >
            Lista
          </Button>
          <Button
            variant={vistaTurnos === 'calendario' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setVistaTurnos('calendario')}
          >
            Calendario
          </Button>
        </div>
      </div>

      {vistaTurnos === 'lista' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {turnosGuardados.map((turnos) => (
            <Card key={turnos.id} className={`cursor-pointer transition-colors ${
              turnosSeleccionados?.id === turnos.id ? 'ring-2 ring-primary' : ''
            }`}>
              <CardHeader>
                <CardTitle className="text-base">
                  Turnos {turnos.configuracion.periodo}
                </CardTitle>
                <CardDescription>
                  Desde: {format(new Date(turnos.configuracion.fechaInicio), 'dd/MM/yyyy')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Empleados:</span>
                    <span className="font-medium">{turnos.configuracion.empleadosSeleccionados.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Patrón:</span>
                    <span className="font-medium truncate ml-2">
                      {turnos.configuracion.patronRotacion.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total turnos:</span>
                    <span className="font-medium">{turnos.turnos.length}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Generado: {format(new Date(turnos.fechaGeneracion), 'dd/MM/yyyy HH:mm')}
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTurnosSeleccionados(turnos)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Ver
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportarTurnos(turnos)}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Exportar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => eliminarTurnos(turnos.id)}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Eliminar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  Calendario de Turnos {turnosSeleccionados ? `- ${turnosSeleccionados.configuracion.periodo}` : ''}
                </CardTitle>
                <CardDescription>
                  {turnosSeleccionados && 
                    `Desde ${format(new Date(turnosSeleccionados.configuracion.fechaInicio), 'dd/MM/yyyy')}`
                  }
                </CardDescription>
              </div>
              <Select 
                value={turnosSeleccionados?.id || ''} 
                onValueChange={(value) => {
                  const turnos = turnosGuardados.find(t => t.id === value);
                  setTurnosSeleccionados(turnos || null);
                }}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Seleccionar turnos" />
                </SelectTrigger>
                <SelectContent>
                  {turnosGuardados.map(turnos => (
                    <SelectItem key={turnos.id} value={turnos.id}>
                      {turnos.configuracion.periodo} - {format(new Date(turnos.configuracion.fechaInicio), 'dd/MM/yyyy')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {/* Leyenda de colores */}
            <div className="mb-6 flex flex-wrap gap-4">
              {Object.entries(tiposTurno).map(([key, tipo]) => (
                <div key={key} className="flex items-center gap-2">
                  <Badge variant="outline" className={`${tipo.color} text-xs`}>
                    {tipo.codigo}
                  </Badge>
                  <span className="text-sm">{tipo.label}</span>
                </div>
              ))}
            </div>
            
            {renderCalendario()}
          </CardContent>
        </Card>
      )}
    </div>
  );
}