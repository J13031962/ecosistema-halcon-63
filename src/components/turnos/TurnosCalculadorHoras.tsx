import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Clock, Edit2, Save, X, Sun, Moon, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TurnoConHoras {
  id: string;
  empleadoId: string;
  empleadoNombre: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  horasDiurnas: number;
  horasNocturnas: number;
  totalHoras: number;
  esEditado: boolean;
}

interface EmpleadoResumen {
  id: string;
  nombre: string;
  horasSemanales: number;
  horasDiurnas: number;
  horasNocturnas: number;
  cumpleJornada: boolean;
}

// Empleados de ejemplo
const EMPLEADOS = [
  { id: '1', nombre: 'Juan Pérez' },
  { id: '2', nombre: 'María García' },
  { id: '3', nombre: 'Carlos López' },
  { id: '4', nombre: 'Ana Martín' },
  { id: '5', nombre: 'Luis Fernández' }
];

// Horarios predefinidos por tipo de turno
const HORARIOS_PREDEFINIDOS = {
  mañana: { inicio: '06:00', fin: '14:00' },
  tarde: { inicio: '14:00', fin: '22:00' },
  noche: { inicio: '22:00', fin: '06:00' },
  dia_completo: { inicio: '06:00', fin: '18:00' }
};

const TurnosCalculadorHoras = () => {
  const [turnos, setTurnos] = useState<TurnoConHoras[]>([]);
  const [empleadosResumen, setEmpleadosResumen] = useState<EmpleadoResumen[]>([]);
  const [editando, setEditando] = useState<string | null>(null);
  const [horarioEditado, setHorarioEditado] = useState({ inicio: '', fin: '' });
  const { toast } = useToast();

  // Función para calcular horas diurnas y nocturnas
  const calcularHoras = (horaInicio: string, horaFin: string) => {
    const [horaInicioH, horaInicioM] = horaInicio.split(':').map(Number);
    const [horaFinH, horaFinM] = horaFin.split(':').map(Number);
    
    let inicioMinutos = horaInicioH * 60 + horaInicioM;
    let finMinutos = horaFinH * 60 + horaFinM;
    
    // Si el turno cruza medianoche
    if (finMinutos <= inicioMinutos) {
      finMinutos += 24 * 60;
    }
    
    // Horarios de referencia en minutos
    const inicioDiurno = 6 * 60; // 06:00
    const finDiurno = 19 * 60;   // 19:00
    
    let horasDiurnas = 0;
    let horasNocturnas = 0;
    
    // Calcular por cada hora del turno
    for (let minuto = inicioMinutos; minuto < finMinutos; minuto += 60) {
      const minutoDelDia = minuto % (24 * 60);
      
      if (minutoDelDia >= inicioDiurno && minutoDelDia < finDiurno) {
        horasDiurnas++;
      } else {
        horasNocturnas++;
      }
    }
    
    const totalHoras = horasDiurnas + horasNocturnas;
    
    return { horasDiurnas, horasNocturnas, totalHoras };
  };

  // Generar turnos de ejemplo
  useEffect(() => {
    const turnosEjemplo: TurnoConHoras[] = [];
    const fechasBase = [
      '2024-12-09', '2024-12-10', '2024-12-11', '2024-12-12', 
      '2024-12-13', '2024-12-14', '2024-12-15'
    ];
    
    EMPLEADOS.forEach((empleado, empIndex) => {
      fechasBase.forEach((fecha, fechaIndex) => {
        // Rotar tipos de turnos para cada empleado
        const tiposTurno = Object.keys(HORARIOS_PREDEFINIDOS);
        const tipoTurno = tiposTurno[(empIndex + fechaIndex) % tiposTurno.length];
        const horario = HORARIOS_PREDEFINIDOS[tipoTurno as keyof typeof HORARIOS_PREDEFINIDOS];
        
        if (!horario) return;
        
        const { horasDiurnas, horasNocturnas, totalHoras } = calcularHoras(horario.inicio, horario.fin);
        
        turnosEjemplo.push({
          id: `${empleado.id}-${fecha}`,
          empleadoId: empleado.id,
          empleadoNombre: empleado.nombre,
          fecha,
          horaInicio: horario.inicio,
          horaFin: horario.fin,
          horasDiurnas,
          horasNocturnas,
          totalHoras,
          esEditado: false
        });
      });
    });
    
    setTurnos(turnosEjemplo);
  }, []);

  // Calcular resumen por empleado
  useEffect(() => {
    const resumen = EMPLEADOS.map(empleado => {
      const turnosEmpleado = turnos.filter(t => t.empleadoId === empleado.id);
      const horasSemanales = turnosEmpleado.reduce((sum, t) => sum + t.totalHoras, 0);
      const horasDiurnas = turnosEmpleado.reduce((sum, t) => sum + t.horasDiurnas, 0);
      const horasNocturnas = turnosEmpleado.reduce((sum, t) => sum + t.horasNocturnas, 0);
      
      return {
        id: empleado.id,
        nombre: empleado.nombre,
        horasSemanales,
        horasDiurnas,
        horasNocturnas,
        cumpleJornada: horasSemanales >= 46
      };
    });
    
    setEmpleadosResumen(resumen);
  }, [turnos]);

  const iniciarEdicion = (turno: TurnoConHoras) => {
    setEditando(turno.id);
    setHorarioEditado({ inicio: turno.horaInicio, fin: turno.horaFin });
  };

  const guardarEdicion = () => {
    if (!editando) return;
    
    const { horasDiurnas, horasNocturnas, totalHoras } = calcularHoras(
      horarioEditado.inicio, 
      horarioEditado.fin
    );
    
    setTurnos(prev => prev.map(turno => 
      turno.id === editando 
        ? {
            ...turno,
            horaInicio: horarioEditado.inicio,
            horaFin: horarioEditado.fin,
            horasDiurnas,
            horasNocturnas,
            totalHoras,
            esEditado: true
          }
        : turno
    ));
    
    setEditando(null);
    toast({
      title: "Horario actualizado",
      description: "El horario se ha modificado exitosamente"
    });
  };

  const cancelarEdicion = () => {
    setEditando(null);
    setHorarioEditado({ inicio: '', fin: '' });
  };

  return (
    <div className="space-y-6">
      {/* Resumen General */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jornada Objetivo</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">46</div>
            <p className="text-xs text-muted-foreground">horas semanales</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empleados Completos</CardTitle>
            <Sun className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {empleadosResumen.filter(e => e.cumpleJornada).length}
            </div>
            <p className="text-xs text-muted-foreground">
              de {empleadosResumen.length} empleados
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Turnos Editados</CardTitle>
            <Edit2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {turnos.filter(t => t.esEditado).length}
            </div>
            <p className="text-xs text-muted-foreground">modificaciones manuales</p>
          </CardContent>
        </Card>
      </div>

      {/* Resumen por Empleado */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Horas por Empleado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {empleadosResumen.map(empleado => (
              <div key={empleado.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium">
                    {empleado.nombre.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-medium">{empleado.nombre}</p>
                    <p className="text-sm text-muted-foreground">
                      Total: {empleado.horasSemanales}h
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-sm">
                    <Sun className="h-4 w-4 text-yellow-500" />
                    <span>{empleado.horasDiurnas}h</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <Moon className="h-4 w-4 text-blue-500" />
                    <span>{empleado.horasNocturnas}h</span>
                  </div>
                  <Badge 
                    variant={empleado.cumpleJornada ? "default" : "destructive"}
                    className="flex items-center gap-1"
                  >
                    {empleado.cumpleJornada ? (
                      <>✓ Completo</>
                    ) : (
                      <>
                        <AlertTriangle className="h-3 w-3" />
                        Faltan {46 - empleado.horasSemanales}h
                      </>
                    )}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detalle de Turnos */}
      <Card>
        <CardHeader>
          <CardTitle>Detalle de Turnos - Semana Actual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Empleado</th>
                  <th className="text-left p-2">Fecha</th>
                  <th className="text-center p-2">Horario</th>
                  <th className="text-center p-2">Diurnas</th>
                  <th className="text-center p-2">Nocturnas</th>
                  <th className="text-center p-2">Total</th>
                  <th className="text-center p-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {turnos.map(turno => (
                  <tr key={turno.id} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-medium">{turno.empleadoNombre}</td>
                    <td className="p-2">
                      {new Date(turno.fecha).toLocaleDateString('es-ES', {
                        weekday: 'short',
                        day: '2-digit',
                        month: '2-digit'
                      })}
                    </td>
                    <td className="p-2 text-center">
                      {editando === turno.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="time"
                            value={horarioEditado.inicio}
                            onChange={(e) => setHorarioEditado(prev => ({ ...prev, inicio: e.target.value }))}
                            className="w-20"
                          />
                          <span>-</span>
                          <Input
                            type="time"
                            value={horarioEditado.fin}
                            onChange={(e) => setHorarioEditado(prev => ({ ...prev, fin: e.target.value }))}
                            className="w-20"
                          />
                        </div>
                      ) : (
                        <span className={turno.esEditado ? 'text-blue-600 font-medium' : ''}>
                          {turno.horaInicio} - {turno.horaFin}
                          {turno.esEditado && <span className="text-xs ml-1">(editado)</span>}
                        </span>
                      )}
                    </td>
                    <td className="p-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Sun className="h-4 w-4 text-yellow-500" />
                        <span>{turno.horasDiurnas}h</span>
                      </div>
                    </td>
                    <td className="p-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Moon className="h-4 w-4 text-blue-500" />
                        <span>{turno.horasNocturnas}h</span>
                      </div>
                    </td>
                    <td className="p-2 text-center font-medium">{turno.totalHoras}h</td>
                    <td className="p-2 text-center">
                      {editando === turno.id ? (
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={guardarEdicion}
                          >
                            <Save className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={cancelarEdicion}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => iniciarEdicion(turno)}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Leyenda */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-8 text-sm">
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4 text-yellow-500" />
              <span>Horas Diurnas (06:00 - 19:00)</span>
            </div>
            <div className="flex items-center gap-2">
              <Moon className="h-4 w-4 text-blue-500" />
              <span>Horas Nocturnas (19:00 - 06:00)</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>Jornada Objetivo: 46 horas semanales</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TurnosCalculadorHoras;