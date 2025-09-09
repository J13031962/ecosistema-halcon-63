import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Clock, Edit2, Save, X, Sun, Moon, AlertTriangle, Calendar } from 'lucide-react';
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
  horasDominicalesDiurnas: number;
  horasDominicalesNocturnas: number;
  horasFestivasDiurnas: number;
  horasFestivasNocturnas: number;
  totalHoras: number;
  esDomingo: boolean;
  esFestivo: boolean;
  esEditado: boolean;
}

interface EmpleadoResumen {
  id: string;
  nombre: string;
  horasSemanales: number;
  horasDiurnas: number;
  horasNocturnas: number;
  horasDominicalesDiurnas: number;
  horasDominicalesNocturnas: number;
  horasFestivasDiurnas: number;
  horasFestivasNocturnas: number;
  horasExtras: number;
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

// Días festivos de Colombia 2025 (ejemplo)
const DIAS_FESTIVOS_2025 = [
  '2025-01-01', // Año Nuevo
  '2025-01-06', // Reyes Magos
  '2025-03-24', // San José
  '2025-04-17', // Jueves Santo
  '2025-04-18', // Viernes Santo
  '2025-05-01', // Día del Trabajo
  '2025-06-02', // Ascensión
  '2025-06-23', // Corpus Christi
  '2025-06-30', // Sagrado Corazón
  '2025-07-20', // Independencia
  '2025-08-07', // Batalla de Boyacá
  '2025-08-18', // Asunción
  '2025-10-13', // Día de la Raza
  '2025-11-03', // Todos los Santos
  '2025-11-17', // Independencia de Cartagena
  '2025-12-08', // Inmaculada
  '2025-12-25'  // Navidad
];

const JORNADA_MAXIMA_2025 = 44; // Nueva jornada máxima para 2025

const TurnosCalculadorHoras = () => {
  const [turnos, setTurnos] = useState<TurnoConHoras[]>([]);
  const [empleadosResumen, setEmpleadosResumen] = useState<EmpleadoResumen[]>([]);
  const [editando, setEditando] = useState<string | null>(null);
  const [horarioEditado, setHorarioEditado] = useState({ inicio: '', fin: '' });
  const { toast } = useToast();

  // Función para verificar si es domingo
  const esDomingo = (fecha: string) => {
    const date = new Date(fecha);
    return date.getDay() === 0; // 0 = domingo
  };

  // Función para verificar si es festivo
  const esFestivo = (fecha: string) => {
    return DIAS_FESTIVOS_2025.includes(fecha);
  };

  // Función para calcular horas diurnas y nocturnas con clasificaciones
  const calcularHoras = (horaInicio: string, horaFin: string, fecha: string) => {
    const [horaInicioH, horaInicioM] = horaInicio.split(':').map(Number);
    const [horaFinH, horaFinM] = horaFin.split(':').map(Number);
    
    let inicioMinutos = horaInicioH * 60 + horaInicioM;
    let finMinutos = horaFinH * 60 + horaFinM;
    
    // Si el turno cruza medianoche
    if (finMinutos <= inicioMinutos) {
      finMinutos += 24 * 60;
    }
    
    const duracionTotalMinutos = finMinutos - inicioMinutos;
    const duracionTotalHoras = duracionTotalMinutos / 60;
    
    // Horarios de referencia en minutos
    const inicioDiurno = 6 * 60;  // 06:00 = 360 minutos
    const finDiurno = 19 * 60;    // 19:00 = 1140 minutos
    const medianoche = 24 * 60;   // 24:00 = 1440 minutos
    
    let horasDiurnas = 0;
    let horasNocturnas = 0;
    let horasDominicalesDiurnas = 0;
    let horasDominicalesNocturnas = 0;
    let horasFestivasDiurnas = 0;
    let horasFestivasNocturnas = 0;
    
    const esDom = esDomingo(fecha);
    const esFest = esFestivo(fecha);
    
    if (esDom) {
      // Para domingos, calcular solo hasta medianoche
      const finTurnoParaDomingo = Math.min(finMinutos, medianoche);
      const duracionDomingo = finTurnoParaDomingo - inicioMinutos;
      
      // Calcular intersección con horario diurno para domingos
      const inicioInterseccionDom = Math.max(inicioMinutos, inicioDiurno);
      const finInterseccionDom = Math.min(finTurnoParaDomingo, finDiurno);
      
      if (inicioInterseccionDom < finInterseccionDom) {
        horasDominicalesDiurnas = (finInterseccionDom - inicioInterseccionDom) / 60;
      }
      
      horasDominicalesNocturnas = (duracionDomingo / 60) - horasDominicalesDiurnas;
      
      // Horas después de medianoche son nocturnas ordinarias
      if (finMinutos > medianoche) {
        horasNocturnas = (finMinutos - medianoche) / 60;
      }
      
    } else if (esFest) {
      // Para festivos, calcular solo hasta medianoche
      const finTurnoParaFeriado = Math.min(finMinutos, medianoche);
      const duracionFeriado = finTurnoParaFeriado - inicioMinutos;
      
      // Calcular intersección con horario diurno para festivos
      const inicioInterseccionFest = Math.max(inicioMinutos, inicioDiurno);
      const finInterseccionFest = Math.min(finTurnoParaFeriado, finDiurno);
      
      if (inicioInterseccionFest < finInterseccionFest) {
        horasFestivasDiurnas = (finInterseccionFest - inicioInterseccionFest) / 60;
      }
      
      horasFestivasNocturnas = (duracionFeriado / 60) - horasFestivasDiurnas;
      
      // Horas después de medianoche son nocturnas ordinarias
      if (finMinutos > medianoche) {
        horasNocturnas = (finMinutos - medianoche) / 60;
      }
      
    } else {
      // Día ordinario
      // Calcular intersección con horario diurno (06:00-19:00)
      const inicioInterseccion = Math.max(inicioMinutos, inicioDiurno);
      const finInterseccion = Math.min(finMinutos, finDiurno);
      
      if (inicioInterseccion < finInterseccion) {
        horasDiurnas = (finInterseccion - inicioInterseccion) / 60;
      }
      
      // El resto son horas nocturnas
      horasNocturnas = duracionTotalHoras - horasDiurnas;
    }
    
    const totalHoras = horasDiurnas + horasNocturnas + horasDominicalesDiurnas + horasDominicalesNocturnas + horasFestivasDiurnas + horasFestivasNocturnas;
    
    return { 
      horasDiurnas, 
      horasNocturnas, 
      horasDominicalesDiurnas, 
      horasDominicalesNocturnas,
      horasFestivasDiurnas,
      horasFestivasNocturnas,
      totalHoras,
      esDomingo: esDom,
      esFestivo: esFest
    };
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
        
        const { 
          horasDiurnas, 
          horasNocturnas, 
          horasDominicalesDiurnas, 
          horasDominicalesNocturnas,
          horasFestivasDiurnas,
          horasFestivasNocturnas,
          totalHoras,
          esDomingo: esDom,
          esFestivo: esFest
        } = calcularHoras(horario.inicio, horario.fin, fecha);
        
        turnosEjemplo.push({
          id: `${empleado.id}-${fecha}`,
          empleadoId: empleado.id,
          empleadoNombre: empleado.nombre,
          fecha,
          horaInicio: horario.inicio,
          horaFin: horario.fin,
          horasDiurnas,
          horasNocturnas,
          horasDominicalesDiurnas,
          horasDominicalesNocturnas,
          horasFestivasDiurnas,
          horasFestivasNocturnas,
          totalHoras,
          esDomingo: esDom,
          esFestivo: esFest,
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
      const horasDominicalesDiurnas = turnosEmpleado.reduce((sum, t) => sum + t.horasDominicalesDiurnas, 0);
      const horasDominicalesNocturnas = turnosEmpleado.reduce((sum, t) => sum + t.horasDominicalesNocturnas, 0);
      const horasFestivasDiurnas = turnosEmpleado.reduce((sum, t) => sum + t.horasFestivasDiurnas, 0);
      const horasFestivasNocturnas = turnosEmpleado.reduce((sum, t) => sum + t.horasFestivasNocturnas, 0);
      const horasExtras = Math.max(0, horasSemanales - JORNADA_MAXIMA_2025);
      
      return {
        id: empleado.id,
        nombre: empleado.nombre,
        horasSemanales,
        horasDiurnas,
        horasNocturnas,
        horasDominicalesDiurnas,
        horasDominicalesNocturnas,
        horasFestivasDiurnas,
        horasFestivasNocturnas,
        horasExtras,
        cumpleJornada: horasSemanales >= JORNADA_MAXIMA_2025
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
    
    const { 
      horasDiurnas, 
      horasNocturnas, 
      horasDominicalesDiurnas, 
      horasDominicalesNocturnas,
      horasFestivasDiurnas,
      horasFestivasNocturnas,
      totalHoras,
      esDomingo: esDom,
      esFestivo: esFest
    } = calcularHoras(horarioEditado.inicio, horarioEditado.fin, turnos.find(t => t.id === editando)?.fecha || '');
    
    setTurnos(prev => prev.map(turno => 
      turno.id === editando 
        ? {
            ...turno,
            horaInicio: horarioEditado.inicio,
            horaFin: horarioEditado.fin,
            horasDiurnas,
            horasNocturnas,
            horasDominicalesDiurnas,
            horasDominicalesNocturnas,
            horasFestivasDiurnas,
            horasFestivasNocturnas,
            totalHoras,
            esDomingo: esDom,
            esFestivo: esFest,
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
            <CardTitle className="text-sm font-medium">Jornada Máxima 2025</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{JORNADA_MAXIMA_2025}</div>
            <p className="text-xs text-muted-foreground">horas semanales máximas</p>
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
            <CardTitle className="text-sm font-medium">Horas Extras Totales</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {empleadosResumen.reduce((sum, e) => sum + e.horasExtras, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              horas sobre {JORNADA_MAXIMA_2025}h semanales
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Resumen Detallado */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Horas Totales Semanales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm flex items-center gap-1">
                  <Sun className="h-3 w-3 text-yellow-500" />
                  Diurnas:
                </span>
                <span className="font-medium">
                  {empleadosResumen.reduce((sum, e) => sum + e.horasDiurnas, 0)}h
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm flex items-center gap-1">
                  <Moon className="h-3 w-3 text-blue-500" />
                  Nocturnas:
                </span>
                <span className="font-medium">
                  {empleadosResumen.reduce((sum, e) => sum + e.horasNocturnas, 0)}h
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Horas Dominicales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm flex items-center gap-1">
                  <Sun className="h-3 w-3 text-yellow-500" />
                  Diurnas:
                </span>
                <span className="font-medium">
                  {empleadosResumen.reduce((sum, e) => sum + e.horasDominicalesDiurnas, 0)}h
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm flex items-center gap-1">
                  <Moon className="h-3 w-3 text-blue-500" />
                  Nocturnas:
                </span>
                <span className="font-medium">
                  {empleadosResumen.reduce((sum, e) => sum + e.horasDominicalesNocturnas, 0)}h
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Horas Festivas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm flex items-center gap-1">
                  <Sun className="h-3 w-3 text-yellow-500" />
                  Diurnas:
                </span>
                <span className="font-medium">
                  {empleadosResumen.reduce((sum, e) => sum + e.horasFestivasDiurnas, 0)}h
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm flex items-center gap-1">
                  <Moon className="h-3 w-3 text-blue-500" />
                  Nocturnas:
                </span>
                <span className="font-medium">
                  {empleadosResumen.reduce((sum, e) => sum + e.horasFestivasNocturnas, 0)}h
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Horas Extras</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Total:</span>
                <span className="font-medium text-orange-600">
                  {empleadosResumen.reduce((sum, e) => sum + e.horasExtras, 0)}h
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">Empleados con extras:</span>
                <span className="text-xs">
                  {empleadosResumen.filter(e => e.horasExtras > 0).length}
                </span>
              </div>
            </div>
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
                  {empleado.horasDominicalesDiurnas + empleado.horasDominicalesNocturnas > 0 && (
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-4 w-4 text-purple-500" />
                      <span>{empleado.horasDominicalesDiurnas + empleado.horasDominicalesNocturnas}h Dom</span>
                    </div>
                  )}
                  {empleado.horasFestivasDiurnas + empleado.horasFestivasNocturnas > 0 && (
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-4 w-4 text-green-500" />
                      <span>{empleado.horasFestivasDiurnas + empleado.horasFestivasNocturnas}h Fest</span>
                    </div>
                  )}
                  {empleado.horasExtras > 0 && (
                    <div className="flex items-center gap-1 text-sm">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      <span>{empleado.horasExtras}h Extra</span>
                    </div>
                  )}
                  <Badge 
                    variant={empleado.cumpleJornada ? "default" : "destructive"}
                    className="flex items-center gap-1"
                  >
                    {empleado.cumpleJornada ? (
                      <>✓ Completo</>
                    ) : (
                      <>
                        <AlertTriangle className="h-3 w-3" />
                        Faltan {JORNADA_MAXIMA_2025 - empleado.horasSemanales}h
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
                  <th className="text-center p-2">Tipo</th>
                  <th className="text-center p-2">Diurnas</th>
                  <th className="text-center p-2">Nocturnas</th>
                  <th className="text-center p-2">Dom/Fest</th>
                  <th className="text-center p-2">Total</th>
                  <th className="text-center p-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {turnos.map(turno => (
                  <tr key={turno.id} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-medium">{turno.empleadoNombre}</td>
                    <td className="p-2">
                      <div className="flex items-center gap-1">
                        {new Date(turno.fecha).toLocaleDateString('es-ES', {
                          weekday: 'short',
                          day: '2-digit',
                          month: '2-digit'
                        })}
                        {turno.esDomingo && <Badge variant="outline" className="text-xs">Dom</Badge>}
                        {turno.esFestivo && <Badge variant="secondary" className="text-xs">Fest</Badge>}
                      </div>
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
                        {turno.esDomingo && <span className="text-purple-600 text-xs">Dom</span>}
                        {turno.esFestivo && <span className="text-green-600 text-xs">Fest</span>}
                        {!turno.esDomingo && !turno.esFestivo && <span className="text-gray-500 text-xs">Normal</span>}
                      </div>
                    </td>
                    <td className="p-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Sun className="h-4 w-4 text-yellow-500" />
                        <span>{turno.horasDiurnas + turno.horasDominicalesDiurnas + turno.horasFestivasDiurnas}h</span>
                      </div>
                    </td>
                    <td className="p-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Moon className="h-4 w-4 text-blue-500" />
                        <span>{turno.horasNocturnas + turno.horasDominicalesNocturnas + turno.horasFestivasNocturnas}h</span>
                      </div>
                    </td>
                    <td className="p-2 text-center">
                      <div className="text-xs space-y-1">
                        {(turno.horasDominicalesDiurnas + turno.horasDominicalesNocturnas) > 0 && (
                          <div className="text-purple-600">
                            Dom: {turno.horasDominicalesDiurnas + turno.horasDominicalesNocturnas}h
                          </div>
                        )}
                        {(turno.horasFestivasDiurnas + turno.horasFestivasNocturnas) > 0 && (
                          <div className="text-green-600">
                            Fest: {turno.horasFestivasDiurnas + turno.horasFestivasNocturnas}h
                          </div>
                        )}
                        {(turno.horasDominicalesDiurnas + turno.horasDominicalesNocturnas + turno.horasFestivasDiurnas + turno.horasFestivasNocturnas) === 0 && (
                          <span className="text-gray-400">-</span>
                        )}
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
              <Calendar className="h-4 w-4 text-purple-500" />
              <span>Dominicales (Domingo)</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-green-500" />
              <span>Festivas (Días festivos)</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <span>Extras (Sobre {JORNADA_MAXIMA_2025}h)</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>Jornada Máxima 2025: {JORNADA_MAXIMA_2025} horas semanales</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TurnosCalculadorHoras;