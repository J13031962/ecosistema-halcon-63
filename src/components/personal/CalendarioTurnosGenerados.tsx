import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Eye, Trash2, Download } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useSupabaseTurnos } from "@/hooks/useSupabaseTurnos";

// Tipos de turno con colores - mismos que el generador
const tiposTurno = {
  manana: { 
    label: "Día", 
    horario: "06:00-18:00", 
    color: "bg-yellow-200 text-yellow-900 border-yellow-300",
    codigo: "Día",
    horas: 12
  },
  tarde: { 
    label: "Día", 
    horario: "06:00-18:00", 
    color: "bg-yellow-200 text-yellow-900 border-yellow-300",
    codigo: "Día", 
    horas: 12
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
  const { turnosOperador, turnosSupervisor, loading } = useSupabaseTurnos();
  const [vistaTurnos, setVistaTurnos] = useState<'lista' | 'calendario'>('calendario');

  // Agrupar turnos por semana para mejor visualización
  const agruparTurnosPorSemana = () => {
    const weeks = new Map();
    
    [...turnosOperador, ...turnosSupervisor].forEach(turno => {
      const fecha = new Date(turno.fecha);
      const weekStart = new Date(fecha);
      weekStart.setDate(fecha.getDate() - fecha.getDay()); // Inicio de semana (domingo)
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeks.has(weekKey)) {
        weeks.set(weekKey, []);
      }
      weeks.get(weekKey).push(turno);
    });
    
    return Array.from(weeks.entries()).map(([weekStart, turnos]) => ({
      weekStart: new Date(weekStart),
      turnos: turnos.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
    })).sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime());
  };

  const renderCalendario = () => {
    const todasLasSemanas = agruparTurnosPorSemana();
    
    if (todasLasSemanas.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No hay turnos registrados</p>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        {todasLasSemanas.map(({ weekStart, turnos }, weekIndex) => {
          // Obtener fechas únicas de la semana
          const fechasSemana = [...new Set(turnos.map((t: any) => t.fecha))].sort();
          
          // Obtener empleados únicos (operadores y supervisores)
          const empleados = [...new Set(turnos.map((t: any) => 
            t.operador_nombre || t.supervisor_nombre
          ))].filter(Boolean) as string[];

          return (
            <div key={weekIndex} className="border rounded-lg p-4">
              <h4 className="font-semibold mb-4">
                Semana del {format(weekStart, 'dd/MM/yyyy', { locale: es })}
              </h4>
              
              <div className="overflow-x-auto">
                <div className="grid grid-cols-8 gap-2 min-w-max">
                  {/* Header */}
                  <div className="p-2 font-semibold text-center">Personal</div>
                  {fechasSemana.map((fecha: string) => (
                    <div key={fecha} className="text-xs p-2 text-center min-w-[100px]">
                      <div className="font-medium">{format(new Date(fecha), 'EEE', { locale: es })}</div>
                      <div>{format(new Date(fecha), 'dd/MM')}</div>
                    </div>
                  ))}
                  
                  {/* Filas de empleados */}
                  {empleados.map((empleado: string) => (
                    <div key={empleado} className="grid grid-cols-8 gap-2 col-span-8">
                      <div className="text-sm font-medium p-2 bg-muted rounded">
                        <div className="truncate">{empleado}</div>
                      </div>
                      {fechasSemana.map((fecha: string) => {
                        const turno = turnos.find((t: any) => 
                          (t.operador_nombre === empleado || t.supervisor_nombre === empleado) && 
                          t.fecha === fecha
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

                        const tipoTurno = tiposTurno[turno.turno as keyof typeof tiposTurno] || tiposTurno.descanso;
                        const horario = turno.horario_inicio && turno.horario_fin 
                          ? `${turno.horario_inicio}-${turno.horario_fin}`
                          : tipoTurno.horario;

                        return (
                          <div key={fecha} className="text-center p-2">
                            <Badge 
                              variant="outline" 
                              className={`${tipoTurno.color} text-xs mb-1 w-full justify-center`}
                            >
                              {tipoTurno.codigo}
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

  if (loading) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">Cargando turnos...</p>
        </CardContent>
      </Card>
    );
  }

  if (turnosOperador.length === 0 && turnosSupervisor.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">No hay turnos registrados aún.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Los turnos aparecerán aquí cuando el director los genere.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Turnos de Todo el Personal</h3>
          <p className="text-sm text-muted-foreground">
            Consulta los turnos de todos los operadores y supervisores
          </p>
          <div className="flex gap-4 mt-2">
            <Badge variant="secondary">
              {turnosOperador.length} turnos de operadores
            </Badge>
            <Badge variant="secondary">
              {turnosSupervisor.length} turnos de supervisores
            </Badge>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Calendario de Turnos</CardTitle>
          <CardDescription>
            Visualización de todos los turnos programados por semana
          </CardDescription>
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
    </div>
  );
}