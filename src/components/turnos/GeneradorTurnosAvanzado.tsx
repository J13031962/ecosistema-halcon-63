import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseTurnos } from '@/hooks/useSupabaseTurnos';
import { Calendar as CalendarIcon, Clock, Users, Settings, Save, Download, Edit2, Plus, Sun, Moon, AlertTriangle } from 'lucide-react';
import { format, addDays, startOfWeek, endOfWeek, parseISO, isSunday } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface TurnoGenerado {
  id: string;
  fecha: string;
  operador_id: string;
  operador_nombre: string;
  turno: string;
  horario_inicio: string;
  horario_fin: string;
  horasDiurnas: number;
  horasNocturnas: number;
  horasDominicales: number;
  horasFestivas: number;
  totalHoras: number;
  esDomingo: boolean;
  esFestivo: boolean;
  esEditado?: boolean;
}

interface ConfiguracionTurnos {
  fechaInicio: Date;
  periodo: 'semanal' | 'quincenal' | 'mensual';
  tiposPeriodo: {
    dias: number;
    descripcion: string;
  };
  operadoresSeleccionados: string[];
  patronRotacion: string;
  cobertura24h: boolean;
  generarDomingos: boolean;
  generarFestivos: boolean;
}

const OPERADORES_DISPONIBLES = [
  { id: '1', nombre: 'Juan Pérez', experiencia: 'Senior', disponibilidad: ['mañana', 'tarde', 'noche'] },
  { id: '2', nombre: 'María García', experiencia: 'Senior', disponibilidad: ['mañana', 'tarde'] },
  { id: '3', nombre: 'Carlos López', experiencia: 'Junior', disponibilidad: ['tarde', 'noche'] },
  { id: '4', nombre: 'Ana Martín', experiencia: 'Senior', disponibilidad: ['mañana', 'tarde', 'noche'] },
  { id: '5', nombre: 'Luis Fernández', experiencia: 'Junior', disponibilidad: ['noche'] },
  { id: '6', nombre: 'Elena Torres', experiencia: 'Senior', disponibilidad: ['mañana', 'tarde'] }
];

const TIPOS_TURNO = {
  mañana: { 
    label: 'Mañana', 
    horario: '06:00-14:00', 
    inicio: '06:00', 
    fin: '14:00',
    color: 'bg-blue-100 text-blue-800 border-blue-200' 
  },
  tarde: { 
    label: 'Tarde', 
    horario: '14:00-22:00', 
    inicio: '14:00', 
    fin: '22:00',
    color: 'bg-green-100 text-green-800 border-green-200' 
  },
  noche: { 
    label: 'Noche', 
    horario: '22:00-06:00', 
    inicio: '22:00', 
    fin: '06:00',
    color: 'bg-purple-100 text-purple-800 border-purple-200' 
  },
  descanso: { 
    label: 'Descanso', 
    horario: '---', 
    inicio: '', 
    fin: '',
    color: 'bg-gray-100 text-gray-600 border-gray-200' 
  }
};

const PATRONES_ROTACION = {
  '2-2-3': { 
    nombre: 'Patrón 2-2-3', 
    descripcion: '2 días trabajo, 2 descanso, 3 trabajo',
    ciclo: ['trabajo', 'trabajo', 'descanso', 'descanso', 'trabajo', 'trabajo', 'trabajo'],
    empleadosOptimo: 4
  },
  '4-4-4': { 
    nombre: 'Patrón 4-4-4', 
    descripcion: '4 días trabajo, 4 descanso, 4 noches',
    ciclo: ['trabajo', 'trabajo', 'trabajo', 'trabajo', 'descanso', 'descanso', 'descanso', 'descanso'],
    empleadosOptimo: 3
  },
  panama: { 
    nombre: 'Panamá', 
    descripcion: 'Rotación 2-2-3-2-2-3',
    ciclo: ['trabajo', 'trabajo', 'descanso', 'descanso', 'trabajo', 'trabajo', 'trabajo', 'descanso', 'descanso', 'trabajo', 'trabajo', 'trabajo', 'descanso', 'descanso'],
    empleadosOptimo: 4
  }
};

// Días festivos Colombia 2025
const DIAS_FESTIVOS_2025 = [
  '2025-01-01', '2025-01-06', '2025-03-24', '2025-04-17', '2025-04-18',
  '2025-05-01', '2025-06-02', '2025-06-23', '2025-06-30', '2025-07-20',
  '2025-08-07', '2025-08-18', '2025-10-13', '2025-11-03', '2025-11-17',
  '2025-12-08', '2025-12-25'
];

const JORNADA_MAXIMA = 48; // Horas semanales máximas

export function GeneradorTurnosAvanzado() {
  const { toast } = useToast();
  const { addTurnoOperador, turnosOperador, refetch } = useSupabaseTurnos();
  
  const [configuracion, setConfiguracion] = useState<ConfiguracionTurnos>({
    fechaInicio: new Date(),
    periodo: 'semanal',
    tiposPeriodo: { dias: 7, descripcion: 'Semanal (7 días)' },
    operadoresSeleccionados: [],
    patronRotacion: '2-2-3',
    cobertura24h: true,
    generarDomingos: true,
    generarFestivos: false
  });

  const [turnosGenerados, setTurnosGenerados] = useState<TurnoGenerado[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [editandoTurno, setEditandoTurno] = useState<string | null>(null);
  const [turnoEditado, setTurnoEditado] = useState({ turno: '', horario_inicio: '', horario_fin: '' });
  const [vistaActual, setVistaActual] = useState<'configuracion' | 'calendario' | 'resumen'>('configuracion');

  const esFestivo = (fecha: string) => DIAS_FESTIVOS_2025.includes(fecha);

  const calcularHoras = (horaInicio: string, horaFin: string, fecha: string) => {
    if (!horaInicio || !horaFin) {
      return { horasDiurnas: 0, horasNocturnas: 0, horasDominicales: 0, horasFestivas: 0, totalHoras: 0 };
    }

    const [horaInicioH, horaInicioM] = horaInicio.split(':').map(Number);
    const [horaFinH, horaFinM] = horaFin.split(':').map(Number);
    
    let inicioMinutos = horaInicioH * 60 + horaInicioM;
    let finMinutos = horaFinH * 60 + horaFinM;
    
    if (finMinutos <= inicioMinutos) {
      finMinutos += 24 * 60;
    }
    
    const inicioDiurno = 6 * 60;
    const finDiurno = 19 * 60;
    
    let horasDiurnas = 0;
    let horasNocturnas = 0;
    let horasDominicales = 0;
    let horasFestivas = 0;
    
    const fechaObj = parseISO(fecha);
    const esDom = isSunday(fechaObj);
    const esFest = esFestivo(fecha);
    
    for (let minuto = inicioMinutos; minuto < finMinutos; minuto += 60) {
      const minutoDelDia = minuto % (24 * 60);
      const esDiurno = minutoDelDia >= inicioDiurno && minutoDelDia < finDiurno;
      
      if (esDom) {
        horasDominicales++;
      } else if (esFest) {
        horasFestivas++;
      } else if (esDiurno) {
        horasDiurnas++;
      } else {
        horasNocturnas++;
      }
    }
    
    const totalHoras = horasDiurnas + horasNocturnas + horasDominicales + horasFestivas;
    
    return { horasDiurnas, horasNocturnas, horasDominicales, horasFestivas, totalHoras };
  };

  const generarTurnos = async () => {
    if (configuracion.operadoresSeleccionados.length === 0) {
      toast({
        title: "Error",
        description: "Debe seleccionar al menos un operador",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const operadoresSeleccionados = OPERADORES_DISPONIBLES.filter(op => 
        configuracion.operadoresSeleccionados.includes(op.id)
      );
      
      const patron = PATRONES_ROTACION[configuracion.patronRotacion];
      const nuevosTurnos: TurnoGenerado[] = [];
      
      for (let dia = 0; dia < configuracion.tiposPeriodo.dias; dia++) {
        const fecha = addDays(configuracion.fechaInicio, dia);
        const fechaStr = format(fecha, 'yyyy-MM-dd');
        const esDom = isSunday(fecha);
        const esFest = esFestivo(fechaStr);
        
        // Saltar días no habilitados
        if ((esDom && !configuracion.generarDomingos) || (esFest && !configuracion.generarFestivos)) {
          continue;
        }
        
        operadoresSeleccionados.forEach((operador, index) => {
          const posicionPatron = (dia + index) % patron.ciclo.length;
          const estadoPatron = patron.ciclo[posicionPatron];
          
          let tipoTurno = 'descanso';
          
          if (estadoPatron === 'trabajo') {
            if (configuracion.cobertura24h) {
              const turnos = ['mañana', 'tarde', 'noche'];
              tipoTurno = turnos[index % turnos.length];
            } else {
              tipoTurno = index % 2 === 0 ? 'mañana' : 'tarde';
            }
          }
          
          const turnoInfo = TIPOS_TURNO[tipoTurno];
          const { horasDiurnas, horasNocturnas, horasDominicales, horasFestivas, totalHoras } = 
            calcularHoras(turnoInfo.inicio, turnoInfo.fin, fechaStr);
          
          nuevosTurnos.push({
            id: `${operador.id}-${fechaStr}`,
            fecha: fechaStr,
            operador_id: operador.id,
            operador_nombre: operador.nombre,
            turno: tipoTurno,
            horario_inicio: turnoInfo.inicio,
            horario_fin: turnoInfo.fin,
            horasDiurnas,
            horasNocturnas,
            horasDominicales,
            horasFestivas,
            totalHoras,
            esDomingo: esDom,
            esFestivo: esFest
          });
        });
      }
      
      setTurnosGenerados(nuevosTurnos);
      setVistaActual('calendario');
      
      toast({
        title: "Turnos generados exitosamente",
        description: `Se generaron ${nuevosTurnos.length} asignaciones de turnos`,
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
      for (const turno of turnosGenerados) {
        if (turno.turno !== 'descanso') {
          await addTurnoOperador({
            fecha: turno.fecha,
            turno: turno.turno,
            operador_id: turno.operador_id,
            operador_nombre: turno.operador_nombre,
            horario_inicio: turno.horario_inicio,
            horario_fin: turno.horario_fin
          });
        }
      }
      
      toast({
        title: "Turnos guardados exitosamente",
        description: "Los turnos han sido guardados en la base de datos",
      });
      
      await refetch();
      
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron guardar algunos turnos",
        variant: "destructive"
      });
    }
  };

  const editarTurno = (turno: TurnoGenerado) => {
    setEditandoTurno(turno.id);
    setTurnoEditado({
      turno: turno.turno,
      horario_inicio: turno.horario_inicio,
      horario_fin: turno.horario_fin
    });
  };

  const guardarEdicion = () => {
    if (!editandoTurno) return;
    
    const turnoActual = turnosGenerados.find(t => t.id === editandoTurno);
    if (!turnoActual) return;
    
    const tipoTurno = TIPOS_TURNO[turnoEditado.turno];
    const horariosFinales = {
      inicio: turnoEditado.horario_inicio || tipoTurno?.inicio || '',
      fin: turnoEditado.horario_fin || tipoTurno?.fin || ''
    };
    
    const { horasDiurnas, horasNocturnas, horasDominicales, horasFestivas, totalHoras } = 
      calcularHoras(horariosFinales.inicio, horariosFinales.fin, turnoActual.fecha);
    
    setTurnosGenerados(prev => prev.map(turno => 
      turno.id === editandoTurno 
        ? {
            ...turno,
            turno: turnoEditado.turno,
            horario_inicio: horariosFinales.inicio,
            horario_fin: horariosFinales.fin,
            horasDiurnas,
            horasNocturnas,
            horasDominicales,
            horasFestivas,
            totalHoras,
            esEditado: true
          }
        : turno
    ));
    
    setEditandoTurno(null);
    toast({
      title: "Turno actualizado",
      description: "El turno ha sido modificado exitosamente"
    });
  };

  const calcularResumenOperador = (operadorId: string) => {
    const turnosOperador = turnosGenerados.filter(t => t.operador_id === operadorId);
    const horasSemanales = turnosOperador.reduce((sum, t) => sum + t.totalHoras, 0);
    const horasDiurnas = turnosOperador.reduce((sum, t) => sum + t.horasDiurnas, 0);
    const horasNocturnas = turnosOperador.reduce((sum, t) => sum + t.horasNocturnas, 0);
    const horasDominicales = turnosOperador.reduce((sum, t) => sum + t.horasDominicales, 0);
    const horasFestivas = turnosOperador.reduce((sum, t) => sum + t.horasFestivas, 0);
    const horasExtras = Math.max(0, horasSemanales - JORNADA_MAXIMA);
    
    return {
      horasSemanales,
      horasDiurnas,
      horasNocturnas,
      horasDominicales,
      horasFestivas,
      horasExtras,
      cumpleJornada: horasSemanales >= JORNADA_MAXIMA
    };
  };

  const exportarTurnos = () => {
    const dataStr = JSON.stringify({
      configuracion,
      turnos: turnosGenerados,
      resumen: OPERADORES_DISPONIBLES
        .filter(op => configuracion.operadoresSeleccionados.includes(op.id))
        .map(op => ({
          operador: op.nombre,
          ...calcularResumenOperador(op.id)
        })),
      fechaGeneracion: new Date().toISOString()
    }, null, 2);
    
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `turnos_${format(configuracion.fechaInicio, 'yyyy-MM-dd')}.json`;
    link.click();
    
    toast({
      title: "Turnos exportados",
      description: "Los turnos se han descargado como archivo JSON",
    });
  };

  return (
    <div className="space-y-6">
      {/* Navegación de vistas */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1">
          <Button
            variant={vistaActual === 'configuracion' ? 'default' : 'ghost'}
            onClick={() => setVistaActual('configuracion')}
            size="sm"
          >
            <Settings className="h-4 w-4 mr-2" />
            Configuración
          </Button>
          <Button
            variant={vistaActual === 'calendario' ? 'default' : 'ghost'}
            onClick={() => setVistaActual('calendario')}
            size="sm"
            disabled={turnosGenerados.length === 0}
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            Calendario
          </Button>
          <Button
            variant={vistaActual === 'resumen' ? 'default' : 'ghost'}
            onClick={() => setVistaActual('resumen')}
            size="sm"
            disabled={turnosGenerados.length === 0}
          >
            <Users className="h-4 w-4 mr-2" />
            Resumen
          </Button>
        </div>

        {turnosGenerados.length > 0 && (
          <div className="flex items-center gap-2">
            <Button onClick={exportarTurnos} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button onClick={guardarTurnos} size="sm">
              <Save className="h-4 w-4 mr-2" />
              Guardar en BD
            </Button>
          </div>
        )}
      </div>

      {vistaActual === 'configuracion' && (
        <Card>
          <CardHeader>
            <CardTitle>Configuración de Generación de Turnos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Configuración básica */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Fecha de Inicio</Label>
                <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !configuracion.fechaInicio && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {configuracion.fechaInicio ? (
                        format(configuracion.fechaInicio, "PPP", { locale: es })
                      ) : (
                        <span>Seleccionar fecha</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={configuracion.fechaInicio}
                      onSelect={(date) => {
                        if (date) {
                          setConfiguracion(prev => ({ ...prev, fechaInicio: date }));
                          setShowCalendar(false);
                        }
                      }}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label>Período</Label>
                <Select 
                  value={configuracion.periodo} 
                  onValueChange={(value: 'semanal' | 'quincenal' | 'mensual') => {
                    const tiposPeriodo = {
                      semanal: { dias: 7, descripcion: 'Semanal (7 días)' },
                      quincenal: { dias: 15, descripcion: 'Quincenal (15 días)' },
                      mensual: { dias: 30, descripcion: 'Mensual (30 días)' }
                    };
                    setConfiguracion(prev => ({
                      ...prev, 
                      periodo: value,
                      tiposPeriodo: tiposPeriodo[value]
                    }));
                  }}
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
                    {Object.entries(PATRONES_ROTACION).map(([key, patron]) => (
                      <SelectItem key={key} value={key}>
                        {patron.nombre} - {patron.descripcion}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Opciones avanzadas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="cobertura24h"
                  checked={configuracion.cobertura24h}
                  onCheckedChange={(checked) => 
                    setConfiguracion(prev => ({ ...prev, cobertura24h: !!checked }))
                  }
                />
                <Label htmlFor="cobertura24h">Cobertura 24h</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="generarDomingos"
                  checked={configuracion.generarDomingos}
                  onCheckedChange={(checked) => 
                    setConfiguracion(prev => ({ ...prev, generarDomingos: !!checked }))
                  }
                />
                <Label htmlFor="generarDomingos">Incluir domingos</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="generarFestivos"
                  checked={configuracion.generarFestivos}
                  onCheckedChange={(checked) => 
                    setConfiguracion(prev => ({ ...prev, generarFestivos: !!checked }))
                  }
                />
                <Label htmlFor="generarFestivos">Incluir festivos</Label>
              </div>
            </div>

            {/* Selección de operadores */}
            <div>
              <Label className="text-base font-medium">Operadores Participantes</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                {OPERADORES_DISPONIBLES.map(operador => (
                  <div key={operador.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <Checkbox
                      id={`operador-${operador.id}`}
                      checked={configuracion.operadoresSeleccionados.includes(operador.id)}
                      onCheckedChange={(checked) => {
                        setConfiguracion(prev => ({
                          ...prev,
                          operadoresSeleccionados: checked
                            ? [...prev.operadoresSeleccionados, operador.id]
                            : prev.operadoresSeleccionados.filter(id => id !== operador.id)
                        }));
                      }}
                    />
                    <div className="flex-1">
                      <Label htmlFor={`operador-${operador.id}`} className="font-medium">
                        {operador.nombre}
                      </Label>
                      <p className="text-sm text-muted-foreground">{operador.experiencia}</p>
                      <div className="flex gap-1 mt-1">
                        {operador.disponibilidad.map(turno => (
                          <Badge key={turno} variant="secondary" className="text-xs">
                            {TIPOS_TURNO[turno]?.label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center">
              <Button 
                onClick={generarTurnos} 
                disabled={isGenerating || configuracion.operadoresSeleccionados.length === 0}
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Generar Turnos
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {vistaActual === 'calendario' && turnosGenerados.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Calendario de Turnos Generados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Leyenda */}
              <div className="flex flex-wrap gap-2">
                {Object.entries(TIPOS_TURNO).map(([key, tipo]) => (
                  <Badge key={key} variant="outline" className={tipo.color}>
                    {tipo.label} {tipo.horario}
                  </Badge>
                ))}
              </div>

              {/* Calendario */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border p-2 text-left">Operador</th>
                      {Array.from(new Set(turnosGenerados.map(t => t.fecha))).sort().map(fecha => (
                        <th key={fecha} className="border p-2 text-center min-w-32">
                          <div className="text-xs">
                            {format(parseISO(fecha), 'EEE', { locale: es })}
                          </div>
                          <div className="text-sm font-medium">
                            {format(parseISO(fecha), 'dd/MM')}
                          </div>
                          {(isSunday(parseISO(fecha)) || esFestivo(fecha)) && (
                            <div className="text-xs text-red-600">
                              {isSunday(parseISO(fecha)) ? 'Dom' : 'Fest'}
                            </div>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {OPERADORES_DISPONIBLES
                      .filter(op => configuracion.operadoresSeleccionados.includes(op.id))
                      .map(operador => (
                        <tr key={operador.id}>
                          <td className="border p-2">
                            <div className="font-medium">{operador.nombre}</div>
                            <div className="text-xs text-muted-foreground">
                              {calcularResumenOperador(operador.id).horasSemanales}h total
                            </div>
                          </td>
                          {Array.from(new Set(turnosGenerados.map(t => t.fecha))).sort().map(fecha => {
                            const turno = turnosGenerados.find(t => 
                              t.fecha === fecha && t.operador_id === operador.id
                            );
                            
                            if (!turno) {
                              return <td key={fecha} className="border p-2"></td>;
                            }
                            
                            const tipoTurno = TIPOS_TURNO[turno.turno];
                            
                            return (
                              <td key={fecha} className="border p-2 text-center">
                                <div className="space-y-1">
                                  <Badge 
                                    variant="outline" 
                                    className={`${tipoTurno.color} text-xs`}
                                  >
                                    {tipoTurno.label}
                                  </Badge>
                                  {turno.totalHoras > 0 && (
                                    <div className="text-xs">
                                      {turno.horario_inicio}-{turno.horario_fin}
                                    </div>
                                  )}
                                  {turno.totalHoras > 0 && (
                                    <div className="text-xs text-muted-foreground">
                                      {turno.totalHoras}h
                                    </div>
                                  )}
                                  {turno.esEditado && (
                                    <div className="text-xs text-blue-600">Editado</div>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => editarTurno(turno)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {vistaActual === 'resumen' && turnosGenerados.length > 0 && (
        <div className="space-y-6">
          {/* Estadísticas generales */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Horas</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {turnosGenerados.reduce((sum, t) => sum + t.totalHoras, 0)}
                </div>
                <p className="text-xs text-muted-foreground">horas programadas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Horas Diurnas</CardTitle>
                <Sun className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {turnosGenerados.reduce((sum, t) => sum + t.horasDiurnas, 0)}
                </div>
                <p className="text-xs text-muted-foreground">06:00 - 19:00</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Horas Nocturnas</CardTitle>
                <Moon className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {turnosGenerados.reduce((sum, t) => sum + t.horasNocturnas, 0)}
                </div>
                <p className="text-xs text-muted-foreground">19:00 - 06:00</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Horas Extras</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {OPERADORES_DISPONIBLES
                    .filter(op => configuracion.operadoresSeleccionados.includes(op.id))
                    .reduce((sum, op) => sum + calcularResumenOperador(op.id).horasExtras, 0)}
                </div>
                <p className="text-xs text-muted-foreground">sobre {JORNADA_MAXIMA}h</p>
              </CardContent>
            </Card>
          </div>

          {/* Resumen por operador */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen Detallado por Operador</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {OPERADORES_DISPONIBLES
                  .filter(op => configuracion.operadoresSeleccionados.includes(op.id))
                  .map(operador => {
                    const resumen = calcularResumenOperador(operador.id);
                    
                    return (
                      <div key={operador.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium">
                            {operador.nombre.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="font-medium">{operador.nombre}</p>
                            <p className="text-sm text-muted-foreground">
                              Total: {resumen.horasSemanales}h
                              {resumen.horasExtras > 0 && (
                                <span className="text-orange-600 ml-1">
                                  (+{resumen.horasExtras}h extra)
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground">Diurnas</div>
                            <div className="font-medium">{resumen.horasDiurnas}h</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground">Nocturnas</div>
                            <div className="font-medium">{resumen.horasNocturnas}h</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground">Dominicales</div>
                            <div className="font-medium">{resumen.horasDominicales}h</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground">Festivas</div>
                            <div className="font-medium">{resumen.horasFestivas}h</div>
                          </div>
                        </div>
                        
                        <Badge 
                          variant={resumen.cumpleJornada ? "default" : "secondary"}
                        >
                          {resumen.cumpleJornada ? "Completa" : "Incompleta"}
                        </Badge>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de edición de turno */}
      <Dialog open={!!editandoTurno} onOpenChange={() => setEditandoTurno(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Turno</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tipo de Turno</Label>
              <Select 
                value={turnoEditado.turno} 
                onValueChange={(value) => {
                  const tipoTurno = TIPOS_TURNO[value];
                  setTurnoEditado(prev => ({
                    ...prev,
                    turno: value,
                    horario_inicio: tipoTurno?.inicio || '',
                    horario_fin: tipoTurno?.fin || ''
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TIPOS_TURNO).map(([key, tipo]) => (
                    <SelectItem key={key} value={key}>
                      {tipo.label} - {tipo.horario}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Hora Inicio</Label>
                <Input
                  type="time"
                  value={turnoEditado.horario_inicio}
                  onChange={(e) => setTurnoEditado(prev => ({
                    ...prev,
                    horario_inicio: e.target.value
                  }))}
                />
              </div>
              <div>
                <Label>Hora Fin</Label>
                <Input
                  type="time"
                  value={turnoEditado.horario_fin}
                  onChange={(e) => setTurnoEditado(prev => ({
                    ...prev,
                    horario_fin: e.target.value
                  }))}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditandoTurno(null)}>
                Cancelar
              </Button>
              <Button onClick={guardarEdicion}>
                Guardar Cambios
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}