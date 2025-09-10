import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, Edit, User, Sun, Moon, Edit2, Users } from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay, isWeekend } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Turno {
  id: string;
  fecha: Date;
  operador_id: string;
  operador_nombre: string;
  hora_inicio: string;
  hora_fin: string;
  tipo: 'diurno' | 'nocturno' | 'descanso';
  horas_diurnas: number;
  horas_nocturnas: number;
  horas_domingo: number;
  horas_feriado: number;
  es_domingo: boolean;
  es_feriado: boolean;
  total_horas?: number;
}

// Paleta de colores para operadores
const COLORES_OPERADORES = [
  { bg: 'bg-blue-100 dark:bg-blue-900/30', border: 'border-blue-300 dark:border-blue-600', text: 'text-blue-800 dark:text-blue-200' },
  { bg: 'bg-green-100 dark:bg-green-900/30', border: 'border-green-300 dark:border-green-600', text: 'text-green-800 dark:text-green-200' },
  { bg: 'bg-purple-100 dark:bg-purple-900/30', border: 'border-purple-300 dark:border-purple-600', text: 'text-purple-800 dark:text-purple-200' },
  { bg: 'bg-orange-100 dark:bg-orange-900/30', border: 'border-orange-300 dark:border-orange-600', text: 'text-orange-800 dark:text-orange-200' },
  { bg: 'bg-pink-100 dark:bg-pink-900/30', border: 'border-pink-300 dark:border-pink-600', text: 'text-pink-800 dark:text-pink-200' },
  { bg: 'bg-indigo-100 dark:bg-indigo-900/30', border: 'border-indigo-300 dark:border-indigo-600', text: 'text-indigo-800 dark:text-indigo-200' },
  { bg: 'bg-teal-100 dark:bg-teal-900/30', border: 'border-teal-300 dark:border-teal-600', text: 'text-teal-800 dark:text-teal-200' },
  { bg: 'bg-red-100 dark:bg-red-900/30', border: 'border-red-300 dark:border-red-600', text: 'text-red-800 dark:text-red-200' },
];

// Tipos de turno disponibles
const tiposTurnos = [
  { label: 'Día (06:00-18:00)', value: 'diurno', horas: '06:00-18:00', tipo: 'diurno' },
  { label: 'Noche (18:00-06:00)', value: 'nocturno', horas: '18:00-06:00', tipo: 'nocturno' },
  { label: 'Descanso', value: 'descanso', horas: '00:00-00:00', tipo: 'descanso' },
];

interface CalendarioTurnosProps {
  turnos: Turno[];
  onEditTurno: (turno: Turno) => void;
  selectedWeek: Date;
  onWeekChange: (date: Date) => void;
  onChangeTurno?: (fecha: Date, turnosDelDia: Turno[]) => void;
}

export const CalendarioTurnos: React.FC<CalendarioTurnosProps> = ({
  turnos,
  onEditTurno,
  selectedWeek,
  onWeekChange,
  onChangeTurno
}) => {
  const [viewMode, setViewMode] = useState<'semanal' | 'detallado'>('semanal');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTurno, setEditingTurno] = useState<{
    fecha: Date;
    operadorId: string;
    currentTurno?: Turno;
  } | null>(null);
  const [selectedOperadorId, setSelectedOperadorId] = useState('');
  const [selectedTurnoTipo, setSelectedTurnoTipo] = useState('');

  const startWeek = startOfWeek(selectedWeek, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startWeek, i));

  // Obtener operadores únicos y asignar colores
  const operadoresUnicos = Array.from(
    new Map(turnos.map(t => [t.operador_id, { id: t.operador_id, nombre: t.operador_nombre }])).values()
  );
  const operadorColores = new Map();
  operadoresUnicos.forEach((operador, index) => {
    operadorColores.set(operador.id, COLORES_OPERADORES[index % COLORES_OPERADORES.length]);
  });

  // Generar turnos completos para cada día (incluyendo descansos)
  const turnosCompletos = useMemo(() => {
    const turnosMap: { [fecha: string]: { [operadorId: string]: Turno } } = {};
    
    weekDays.forEach(dia => {
      const fechaKey = format(dia, 'yyyy-MM-dd');
      turnosMap[fechaKey] = {};
      
      operadoresUnicos.forEach(operador => {
        const turnoExistente = turnos.find(t => 
          isSameDay(new Date(t.fecha), dia) && t.operador_id === operador.id
        );
        
        if (turnoExistente) {
          turnosMap[fechaKey][operador.id] = turnoExistente;
        } else {
          // Si no hay turno asignado, mostrar como descanso
          turnosMap[fechaKey][operador.id] = {
            id: `descanso_${operador.id}_${fechaKey}`,
            fecha: dia,
            operador_id: operador.id,
            operador_nombre: operador.nombre,
            tipo: 'descanso',
            hora_inicio: '00:00',
            hora_fin: '00:00',
            horas_diurnas: 0,
            horas_nocturnas: 0,
            horas_domingo: 0,
            horas_feriado: 0,
            es_domingo: false,
            es_feriado: false,
            total_horas: 0
          };
        }
      });
    });
    
    return turnosMap;
  }, [turnos, weekDays, operadoresUnicos]);

  const getTurnosForDay = (fecha: Date) => {
    return turnos.filter(turno => isSameDay(turno.fecha, fecha));
  };

  const getTipoIcon = (tipo: 'diurno' | 'nocturno' | 'descanso') => {
    if (tipo === 'diurno') return <Sun className="h-4 w-4" />;
    if (tipo === 'nocturno') return <Moon className="h-4 w-4" />;
    return <User className="h-4 w-4" />;
  };

  const getOperadorColor = (operadorId: string) => {
    return operadorColores.get(operadorId) || COLORES_OPERADORES[0];
  };

  const getColorForTipo = (tipo: string) => {
    switch (tipo?.toLowerCase()) {
      case 'diurno':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'nocturno':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'descanso':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleEditClick = (fecha: Date, operadorId?: string) => {
    const turnoExistente = turnos.find(t => 
      isSameDay(new Date(t.fecha), fecha) && 
      (!operadorId || t.operador_id === operadorId)
    );

    setEditingTurno({
      fecha,
      operadorId: operadorId || '',
      currentTurno: turnoExistente
    });
    setSelectedOperadorId(operadorId || '');
    setSelectedTurnoTipo(turnoExistente?.tipo || 'descanso');
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingTurno || !selectedOperadorId || !selectedTurnoTipo) {
      toast.error('Por favor selecciona operador y tipo de turno');
      return;
    }

    const operador = operadoresUnicos.find(op => op.id === selectedOperadorId);
    const tipoTurno = tiposTurnos.find(t => t.value === selectedTurnoTipo);
    
    if (!operador || !tipoTurno) {
      toast.error('Operador o tipo de turno no válido');
      return;
    }

    const [horaInicio, horaFin] = tipoTurno.horas.split('-');
    
    const nuevoTurno: Turno = {
      id: editingTurno.currentTurno?.id || `turno_${Date.now()}`,
      fecha: editingTurno.fecha,
      operador_id: selectedOperadorId,
      operador_nombre: operador.nombre,
      hora_inicio: horaInicio,
      hora_fin: horaFin,
      tipo: selectedTurnoTipo as 'diurno' | 'nocturno' | 'descanso',
      horas_diurnas: selectedTurnoTipo === 'diurno' ? 12 : 0,
      horas_nocturnas: selectedTurnoTipo === 'nocturno' ? 12 : 0,
      horas_domingo: 0,
      horas_feriado: 0,
      es_domingo: false,
      es_feriado: false,
      total_horas: selectedTurnoTipo === 'descanso' ? 0 : 12,
    };

    // Llamar función de edición del padre
    onEditTurno(nuevoTurno);

    setEditDialogOpen(false);
    setEditingTurno(null);
    toast.success('Turno actualizado exitosamente');
  };

  const getTotalHorasOperador = (operadorId: string) => {
    const turnosOperador = turnos.filter(t => t.operador_id === operadorId);

    // Si existen campos detallados, usarlos (corrige cruces sábado-noche → domingo)
    const hasDetalle = turnosOperador.some((t: any) =>
      t.horas_diurnas_ordinarias !== undefined ||
      t.horas_nocturnas_ordinarias !== undefined ||
      t.horas_diurnas_dominicales !== undefined ||
      t.horas_nocturnas_dominicales !== undefined
    );

    if (hasDetalle) {
      const hdo = turnosOperador.reduce((s, t: any) => s + (t.horas_diurnas_ordinarias || 0), 0);
      const hno = turnosOperador.reduce((s, t: any) => s + (t.horas_nocturnas_ordinarias || 0), 0);
      const hdd = turnosOperador.reduce((s, t: any) => s + (t.horas_diurnas_dominicales || 0), 0);
      const hnd = turnosOperador.reduce((s, t: any) => s + (t.horas_nocturnas_dominicales || 0), 0);

      const total = hdo + hno + hdd + hnd;
      const diurnasExtras = Math.max(0, hdo - 88);
      const diurnasOrdinariasLimitadas = Math.min(hdo, 88);

      return {
        diurnasOrdinarias: diurnasOrdinariasLimitadas,
        diurnasExtras,
        nocturnasOrdinarias: hno,
        dominicalesDiurnas: hdd,
        dominicalesNocturnas: hnd,
        festivasDiurnas: 0,
        festivasNocturnas: 0,
        total,
      };
    }

    // Fallback: lógica anterior (si no hay desglose)
    const horasDiurnasOrdinarias = turnosOperador.reduce((sum, t) => {
      if (!t.es_domingo && !t.es_feriado) {
        return sum + t.horas_diurnas;
      }
      return sum;
    }, 0);
    
    const horasExtrasDiurnas = Math.max(0, horasDiurnasOrdinarias - 88);
    const horasDiurnasOrdinariasLimitadas = Math.min(horasDiurnasOrdinarias, 88);
    
    const horasNocturnasOrdinarias = turnosOperador.reduce((sum, t) => {
      if (!t.es_domingo && !t.es_feriado) {
        return sum + t.horas_nocturnas;
      }
      return sum;
    }, 0);
    
    const horasDominicalesDiurnas = turnosOperador.reduce((sum, t) => {
      if (t.es_domingo) {
        return sum + t.horas_diurnas;
      }
      return sum;
    }, 0);
    
    const horasDominicalesNocturnas = turnosOperador.reduce((sum, t) => {
      if (t.es_domingo) {
        return sum + t.horas_nocturnas;
      }
      return sum;
    }, 0);
    
    const horasFestivasDiurnas = turnosOperador.reduce((sum, t) => {
      if (t.es_feriado) {
        return sum + t.horas_diurnas;
      }
      return sum;
    }, 0);
    
    const horasFestivasNocturnas = turnosOperador.reduce((sum, t) => {
      if (t.es_feriado) {
        return sum + t.horas_nocturnas;
      }
      return sum;
    }, 0);
    
    const total = turnosOperador.reduce((sum, t) => sum + t.horas_diurnas + t.horas_nocturnas, 0);
    
    return {
      diurnasOrdinarias: horasDiurnasOrdinariasLimitadas,
      diurnasExtras: horasExtrasDiurnas,
      nocturnasOrdinarias: horasNocturnasOrdinarias,
      dominicalesDiurnas: horasDominicalesDiurnas,
      dominicalesNocturnas: horasDominicalesNocturnas,
      festivasDiurnas: horasFestivasDiurnas,
      festivasNocturnas: horasFestivasNocturnas,
      total
    };
  };

  return (
    <div className="space-y-6">
      {/* Controles de navegación */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => onWeekChange(addDays(selectedWeek, -7))}
          >
            ← Semana Anterior
          </Button>
          <h3 className="text-lg font-semibold">
            Semana del {format(startWeek, 'dd MMM', { locale: es })} - {format(addDays(startWeek, 6), 'dd MMM yyyy', { locale: es })}
          </h3>
          <Button
            variant="outline"
            onClick={() => onWeekChange(addDays(selectedWeek, 7))}
          >
            Siguiente Semana →
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'semanal' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('semanal')}
          >
            Vista Semanal
          </Button>
          <Button
            variant={viewMode === 'detallado' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('detallado')}
          >
            Vista Detallada
          </Button>
        </div>
      </div>

      {viewMode === 'semanal' ? (
        /* Vista semanal original */
        <div className="grid grid-cols-7 gap-3">
          {weekDays.map((day, index) => {
            const turnosDelDia = getTurnosForDay(day);
            const esDomingo = isWeekend(day) && day.getDay() === 0;
            
            return (
              <Card 
                key={format(day, 'yyyy-MM-dd')}
                className={cn("min-h-[180px] cursor-pointer hover:shadow-md transition-shadow", esDomingo && "bg-blue-50 dark:bg-blue-950/20")}
                onClick={() => onChangeTurno && onChangeTurno(day, turnosDelDia)}
              >
                <CardHeader className="p-2">
                  <CardTitle className="text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-base">{format(day, 'EEE', { locale: es })}</span>
                      <span className="text-sm text-muted-foreground font-bold">
                        {format(day, 'dd')}
                      </span>
                    </div>
                    {esDomingo && (
                      <Badge variant="secondary" className="text-xs mt-1">
                        Domingo
                      </Badge>
                    )}
                    <div className="flex items-center gap-1 mt-1">
                      <Edit className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Click para editar</span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2 space-y-2">
                  {turnosDelDia.map((turno) => {
                    const operadorColor = getOperadorColor(turno.operador_id);
                    return (
                      <div
                        key={turno.id}
                        className={cn(
                          "p-3 rounded-lg border cursor-pointer hover:shadow-md transition-shadow group",
                          operadorColor.bg,
                          operadorColor.border
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditTurno(turno);
                        }}
                      >
                        <div className="space-y-2">
                          <div className={cn("font-bold text-base truncate", operadorColor.text)}>
                            {turno.operador_nombre}
                          </div>
                          
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1">
                              {getTipoIcon(turno.tipo)}
                              <span className={cn("font-semibold text-xs", operadorColor.text)}>
                                {turno.hora_inicio}-{turno.hora_fin}
                              </span>
                            </div>
                            <Badge 
                              variant={turno.tipo === 'diurno' ? 'default' : turno.tipo === 'nocturno' ? 'secondary' : 'outline'} 
                              className="text-xs px-2"
                            >
                              {turno.tipo === 'diurno' ? 'D' : turno.tipo === 'nocturno' ? 'N' : 'Desc'}
                            </Badge>
                          </div>
                          
                          <div className={cn("text-xs font-medium text-center", operadorColor.text)}>
                            {(turno.horas_diurnas + turno.horas_nocturnas).toFixed(1)}h
                          </div>

                          {/* Botón de edición visible en hover */}
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditClick(day, turno.operador_id);
                              }}
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {turnosDelDia.length === 0 && (
                    <div className="text-xs text-muted-foreground text-center py-4">
                      Sin turnos
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Vista detallada con matriz operador x día */
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Vista Detallada - Todos los Operadores por Día
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="grid grid-cols-8 gap-2 min-w-max">
                {/* Header */}
                <div className="font-medium text-center p-2 bg-muted rounded">Operador</div>
                {weekDays.map((dia) => (
                  <div key={dia.toString()} className="text-center p-2 bg-muted rounded">
                    <div className="font-medium">{format(dia, 'EEEE', { locale: es })}</div>
                    <div className="text-sm text-muted-foreground">{format(dia, 'dd/MM')}</div>
                  </div>
                ))}

                {/* Filas por operador */}
                {operadoresUnicos.map((operador) => (
                  <React.Fragment key={operador.id}>
                    <div className="font-medium p-2 bg-muted rounded text-sm truncate">
                      {operador.nombre}
                    </div>
                    {weekDays.map((dia) => {
                      const fechaKey = format(dia, 'yyyy-MM-dd');
                      const turno = turnosCompletos[fechaKey]?.[operador.id];
                      const color = getColorForTipo(turno?.tipo || 'descanso');
                      
                      return (
                        <div 
                          key={`${operador.id}-${fechaKey}`} 
                          className="min-h-[80px] border rounded p-2 hover:bg-muted/50 cursor-pointer group relative"
                          onClick={() => handleEditClick(dia, operador.id)}
                        >
                          {turno && (
                            <div className="space-y-1">
                              <Badge
                                variant="outline"
                                className={`${color} text-xs w-full justify-center`}
                              >
                                {turno.tipo === 'descanso' ? 'Desc.' : 
                                 turno.tipo === 'diurno' ? 'Día' : 'Noche'}
                              </Badge>
                              {turno.total_horas && turno.total_horas > 0 && (
                                <div className="text-xs text-center text-muted-foreground">
                                  {turno.total_horas}h
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Botón de edición en hover */}
                          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditClick(dia, operador.id);
                              }}
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Resumen de turnos por día */}
            <div className="mt-6">
              <h4 className="font-medium mb-3">Resumen por Día</h4>
              <div className="grid grid-cols-7 gap-4">
                {weekDays.map((dia) => {
                  const fechaKey = format(dia, 'yyyy-MM-dd');
                  const turnosDelDia = Object.values(turnosCompletos[fechaKey] || {});
                  const turnoDia = turnosDelDia.filter(t => t.tipo === 'diurno').length;
                  const turnoNoche = turnosDelDia.filter(t => t.tipo === 'nocturno').length;
                  const descansos = turnosDelDia.filter(t => t.tipo === 'descanso').length;
                  
                  return (
                    <div key={fechaKey} className="text-center p-3 border rounded">
                      <div className="font-medium text-sm mb-2">
                        {format(dia, 'EEE dd', { locale: es })}
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center justify-center gap-1">
                          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                            {turnoDia} Día
                          </Badge>
                        </div>
                        <div className="flex items-center justify-center gap-1">
                          <Badge variant="outline" className="bg-purple-100 text-purple-800">
                            {turnoNoche} Noche
                          </Badge>
                        </div>
                        <div className="flex items-center justify-center gap-1">
                          <Badge variant="outline" className="bg-orange-100 text-orange-800">
                            {descansos} Desc.
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumen de horas por operador */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Resumen de Horas por Operador
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {operadoresUnicos.map((operador) => {
              const horas = getTotalHorasOperador(operador.id);
              const operadorColor = getOperadorColor(operador.id);
              return (
                <div key={operador.id} className={cn("p-4 border rounded-lg", operadorColor.bg, operadorColor.border)}>
                  <h4 className={cn("font-bold mb-3 text-base", operadorColor.text)}>{operador.nombre}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Horas Diurnas Ordinarias:</span>
                      <span className="font-medium">{horas.diurnasOrdinarias.toFixed(1)}h</span>
                    </div>
                    {horas.diurnasExtras > 0 && (
                      <div className="flex justify-between text-orange-600 dark:text-orange-400">
                        <span>Horas Extras Diurnas:</span>
                        <span className="font-medium">{horas.diurnasExtras.toFixed(1)}h</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Horas Nocturnas:</span>
                      <span className="font-medium">{horas.nocturnasOrdinarias.toFixed(1)}h</span>
                    </div>
                    {horas.dominicalesDiurnas > 0 && (
                      <div className="flex justify-between text-blue-600 dark:text-blue-400">
                        <span>Horas Dominicales Diurnas:</span>
                        <span className="font-medium">{horas.dominicalesDiurnas.toFixed(1)}h</span>
                      </div>
                    )}
                    {horas.dominicalesNocturnas > 0 && (
                      <div className="flex justify-between text-blue-700 dark:text-blue-300">
                        <span>Horas Dominicales Nocturnas:</span>
                        <span className="font-medium">{horas.dominicalesNocturnas.toFixed(1)}h</span>
                      </div>
                    )}
                    {horas.festivasDiurnas > 0 && (
                      <div className="flex justify-between text-purple-600 dark:text-purple-400">
                        <span>Horas Festivas Diurnas:</span>
                        <span className="font-medium">{horas.festivasDiurnas.toFixed(1)}h</span>
                      </div>
                    )}
                    {horas.festivasNocturnas > 0 && (
                      <div className="flex justify-between text-purple-700 dark:text-purple-300">
                        <span>Horas Festivas Nocturnas:</span>
                        <span className="font-medium">{horas.festivasNocturnas.toFixed(1)}h</span>
                      </div>
                    )}
                    <div className="border-t pt-2 flex justify-between font-semibold">
                      <span>Total:</span>
                      <span>{horas.total.toFixed(1)}h</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de edición */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Turno</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Fecha</Label>
              <div className="text-sm text-muted-foreground">
                {editingTurno && format(editingTurno.fecha, 'EEEE, dd MMMM yyyy', { locale: es })}
              </div>
            </div>
            
            <div>
              <Label>Operador</Label>
              <Select value={selectedOperadorId} onValueChange={setSelectedOperadorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar operador" />
                </SelectTrigger>
                <SelectContent>
                  {operadoresUnicos.map((operador) => (
                    <SelectItem key={operador.id} value={operador.id}>
                      {operador.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Tipo de Turno</Label>
              <Select value={selectedTurnoTipo} onValueChange={setSelectedTurnoTipo}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar turno" />
                </SelectTrigger>
                <SelectContent>
                  {tiposTurnos.map((turno) => (
                    <SelectItem key={turno.value} value={turno.value}>
                      {turno.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveEdit}>
                Guardar Cambios
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};