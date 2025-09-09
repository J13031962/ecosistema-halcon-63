import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar, Users, AlertCircle } from "lucide-react";

// Tipos de turno con horarios y colores
const tiposTurno = {
  dia: { 
    label: "Día", 
    horario: "06:00-18:00", 
    color: "bg-yellow-100 text-yellow-800 border-yellow-200" 
  },
  manana: { 
    label: "Mañana", 
    horario: "06:00-14:00", 
    color: "bg-blue-100 text-blue-800 border-blue-200" 
  },
  tarde: { 
    label: "Tarde", 
    horario: "14:00-22:00", 
    color: "bg-green-100 text-green-800 border-green-200" 
  },
  noche: { 
    label: "Noche", 
    horario: "18:00-06:00", 
    color: "bg-purple-100 text-purple-800 border-purple-200" 
  },
  descanso: { 
    label: "Descanso", 
    horario: "---", 
    color: "bg-gray-100 text-gray-600 border-gray-200" 
  },
  vacaciones: { 
    label: "Vacaciones", 
    horario: "---", 
    color: "bg-red-100 text-red-800 border-red-200" 
  }
};

// Función para cargar turnos guardados del localStorage
const cargarTurnosGuardados = () => {
  try {
    const turnosGuardados = localStorage.getItem('turnosGenerados');
    if (turnosGuardados) {
      const data = JSON.parse(turnosGuardados);
      return Array.isArray(data) ? data : [];
    }
  } catch (error) {
    console.error('Error cargando turnos guardados:', error);
  }
  return [];
};

export function CalendarioTurnosQuincenal() {
  const [fechaActual, setFechaActual] = useState(new Date());
  const [quincenaActual, setQuincenaActual] = useState<1 | 2>(1);
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<string>("todos");
  const [editMode, setEditMode] = useState(false);
  const [turnosGuardados, setTurnosGuardados] = useState<any[]>([]);
  const [turnoSeleccionado, setTurnoSeleccionado] = useState<any>(null);

  useEffect(() => {
    const turnos = cargarTurnosGuardados();
    setTurnosGuardados(turnos);
    if (turnos.length > 0) {
      setTurnoSeleccionado(turnos[0]);
    }
  }, []);

  const year = fechaActual.getFullYear();
  const month = fechaActual.getMonth();

  const nombreMes = fechaActual.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  const startDay = quincenaActual === 1 ? 1 : 16;
  const endDay = quincenaActual === 1 ? 15 : new Date(year, month + 1, 0).getDate();

  const navegarQuincena = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (quincenaActual === 1) {
        setFechaActual(new Date(year, month - 1, 1));
        setQuincenaActual(2);
      } else {
        setQuincenaActual(1);
      }
    } else {
      if (quincenaActual === 2) {
        setFechaActual(new Date(year, month + 1, 1));
        setQuincenaActual(1);
      } else {
        setQuincenaActual(2);
      }
    }
  };

  const getDayName = (day: number) => {
    const date = new Date(year, month, day);
    return date.toLocaleDateString('es-ES', { weekday: 'short' });
  };

  // Obtener empleados y turnos del turno seleccionado
  const empleadosDisponibles = turnoSeleccionado?.configuracion?.empleadosSeleccionados || [];
  const turnosData = turnoSeleccionado?.turnos || [];
  const periodoGenerado = turnoSeleccionado?.configuracion?.duracion || 7; // días, quincena o mes
  const tipoGeneracion = turnoSeleccionado?.configuracion?.tipoGeneracion || 'semanal';
  
  const empleadosFiltrados = empleadoSeleccionado === "todos" 
    ? empleadosDisponibles 
    : empleadosDisponibles.filter(emp => emp.nombre.toLowerCase() === empleadoSeleccionado);

  // Determinar cuántos días mostrar según el tipo de generación
  let diasAMostrar = turnosData.length;
  if (tipoGeneracion === 'semanal') {
    diasAMostrar = Math.min(7, turnosData.length);
  } else if (tipoGeneracion === 'quincenal') {
    diasAMostrar = Math.min(15, turnosData.length);
  } else if (tipoGeneracion === 'mensual') {
    diasAMostrar = turnosData.length; // Mostrar todo el mes
  }

  // Si no hay turnos guardados, mostrar mensaje
  if (turnosGuardados.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay turnos generados aún</h3>
            <p className="text-muted-foreground">
              Usa el Generador de Turnos para crear nuevas programaciones.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header del calendario */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <CardTitle>
                  Calendario de Turnos - {turnoSeleccionado?.configuracion?.tipoGeneracion || 'Personalizado'}
                </CardTitle>
              </div>
              <Badge variant="outline" className="text-sm">
                {turnoSeleccionado ? `${diasAMostrar} días generados` : 'Sin turnos'}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditMode(!editMode)}
                className={editMode ? "bg-blue-100" : ""}
              >
                {editMode ? "Guardar" : "Editar"}
              </Button>
              <Button variant="outline" size="sm" onClick={() => navegarQuincena('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => navegarQuincena('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex items-center gap-4 pt-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Turnos guardados:</span>
            </div>
            <Select 
              value={turnoSeleccionado?.id || ""} 
              onValueChange={(value) => {
                const turno = turnosGuardados.find(t => t.id === value);
                setTurnoSeleccionado(turno);
              }}
            >
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Seleccionar turnos" />
              </SelectTrigger>
              <SelectContent>
                {turnosGuardados.map(turno => (
                  <SelectItem key={turno.id} value={turno.id}>
                    Turnos generados - {new Date(turno.fechaGeneracion).toLocaleDateString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex items-center gap-2 ml-4">
              <Users className="h-4 w-4" />
              <span className="text-sm font-medium">Filtrar por empleado:</span>
            </div>
            <Select value={empleadoSeleccionado} onValueChange={setEmpleadoSeleccionado}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los empleados</SelectItem>
                {empleadosDisponibles.map(emp => (
                  <SelectItem key={emp.id} value={emp.nombre.toLowerCase()}>
                    {emp.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* Leyenda de turnos */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3">
            <span className="text-sm font-medium">Jornadas:</span>
            {Object.entries(tiposTurno).map(([key, turno]) => (
              <Badge key={key} variant="outline" className={turno.color}>
                {turno.label} {turno.horario !== "---" && `(${turno.horario})`}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Calendario de turnos */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">Jornada / Empleado</th>
                  {turnosData.slice(0, diasAMostrar).map((dia, i) => (
                    <th key={i} className="text-center p-2 font-medium min-w-[60px]">
                      <div className="text-xs text-muted-foreground">{dia.dia}</div>
                      <div className="text-sm">{dia.fecha}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {empleadosFiltrados.map((empleado) => (
                  <tr key={empleado.id} className="border-b hover:bg-muted/30">
                    <td className="p-3 font-medium text-sm">
                      <div className="flex flex-col">
                        <span>{empleado.nombre}</span>
                        <span className="text-xs text-muted-foreground">{empleado.rol}</span>
                      </div>
                    </td>
                    {turnosData.slice(0, diasAMostrar).map((dia, diaIndex) => {
                      const asignacion = dia.asignaciones?.find(a => a.empleadoId === empleado.id);
                      const turnoTipo = asignacion?.turnoId;
                      const tipoInfo = turnoTipo ? tiposTurno[turnoTipo] : null;
                      
                      return (
                        <td key={diaIndex} className="text-center p-1">
                          {tipoInfo ? (
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${tipoInfo.color}`}
                            >
                              {tipoInfo.label}
                              <div className="text-xs mt-1">{tipoInfo.horario !== "---" ? tipoInfo.horario.split('-')[0] : ""}</div>
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">---</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Resumen estadístico */}
      {turnoSeleccionado && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {Object.entries(tiposTurno).slice(1).map(([key, turno]) => {
            const total = turnosData.reduce((sum, dia) => {
              return sum + (dia.asignaciones?.filter(a => a.turnoId === key).length || 0);
            }, 0);
            
            return (
              <Card key={key}>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${turno.color.split(' ')[1]}`}>{total}</div>
                    <div className="text-xs text-muted-foreground">{turno.label}</div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}