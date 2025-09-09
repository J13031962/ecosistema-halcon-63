import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Clock, User } from 'lucide-react';
import { format, addDays, startOfWeek, eachDayOfInterval, endOfWeek, isSameDay, isWeekend } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface TurnoAsignado {
  fecha: Date;
  tipo: 'dia' | 'mañana' | 'tarde' | 'noche' | 'descanso' | 'sin-asignar';
  operador_id: string;
}

interface OperadorConTurnos {
  operador_id: string;
  operador_nombre: string;
  turnos: TurnoAsignado[];
}

interface GeneradorTurnosProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (data: any) => Promise<void>;
  personal: Array<{ id: string; nombres: string; apellidos: string; cargo: string }>;
}

const TIPOS_TURNO = {
  dia: { nombre: 'Día', horario: '06:00-18:00', tipo: 'diurno', horas: 12, color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  mañana: { nombre: 'Mañana', horario: '06:00-14:00', tipo: 'diurno', horas: 8, color: 'bg-blue-100 text-blue-800 border-blue-300' },
  tarde: { nombre: 'Tarde', horario: '14:00-22:00', tipo: 'mixto', horas: 8, color: 'bg-orange-100 text-orange-800 border-orange-300' },
  noche: { nombre: 'Noche', horario: '18:00-06:00', tipo: 'nocturno', horas: 12, color: 'bg-purple-100 text-purple-800 border-purple-300' },
  descanso: { nombre: 'Descanso', horario: '-', tipo: 'descanso', horas: 0, color: 'bg-gray-100 text-gray-800 border-gray-300' }
};

export const GeneradorTurnos: React.FC<GeneradorTurnosProps> = ({
  isOpen,
  onClose,
  onGenerate,
  personal
}) => {
  const [periodicidad, setPeriodicidad] = useState<'semanal' | 'quincenal' | 'mensual'>('quincenal');
  const [fechaInicio, setFechaInicio] = useState<Date>();
  const [operadorSeleccionado, setOperadorSeleccionado] = useState<string>('');
  const [operadoresConTurnos, setOperadoresConTurnos] = useState<OperadorConTurnos[]>([]);
  const [turnosAsignados, setTurnosAsignados] = useState<TurnoAsignado[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const operadores = personal.filter(p => p.cargo === 'operador');

  const getDiasDelPeriodo = () => {
    if (!fechaInicio) return [];
    
    const dias = periodicidad === 'semanal' ? 7 : periodicidad === 'quincenal' ? 15 : 30;
    return eachDayOfInterval({
      start: fechaInicio,
      end: addDays(fechaInicio, dias - 1)
    });
  };

  const getTurnoParaFecha = (fecha: Date) => {
    return turnosAsignados.find(t => isSameDay(t.fecha, fecha) && t.operador_id === operadorSeleccionado);
  };

  const asignarTurno = (fecha: Date, tipo: 'dia' | 'mañana' | 'tarde' | 'noche' | 'descanso' | 'sin-asignar') => {
    if (!operadorSeleccionado) return;
    
    setTurnosAsignados(prev => {
      const existing = prev.findIndex(t => isSameDay(t.fecha, fecha) && t.operador_id === operadorSeleccionado);
      if (existing >= 0) {
        if (tipo === 'sin-asignar') {
          // Remover turno si se selecciona sin asignar
          return prev.filter((_, index) => index !== existing);
        }
        // Reemplazar turno existente
        const newArray = [...prev];
        newArray[existing] = { fecha, tipo, operador_id: operadorSeleccionado };
        return newArray;
      } else if (tipo !== 'sin-asignar') {
        // Agregar nuevo turno solo si no está sin asignar
        return [...prev, { fecha, tipo, operador_id: operadorSeleccionado }];
      }
      return prev;
    });
  };

  const añadirOperadorConTurnos = () => {
    if (!operadorSeleccionado) {
      toast.error('Debe seleccionar un operador');
      return;
    }

    const operador = operadores.find(op => op.id === operadorSeleccionado);
    if (!operador) return;

    const turnosDelOperador = turnosAsignados.filter(t => t.operador_id === operadorSeleccionado);
    
    if (turnosDelOperador.length === 0) {
      toast.error('Debe asignar al menos un turno al operador');
      return;
    }

    const nuevoOperadorConTurnos: OperadorConTurnos = {
      operador_id: operadorSeleccionado,
      operador_nombre: `${operador.nombres} ${operador.apellidos}`,
      turnos: turnosDelOperador
    };

    setOperadoresConTurnos(prev => {
      const existing = prev.findIndex(op => op.operador_id === operadorSeleccionado);
      if (existing >= 0) {
        // Actualizar operador existente
        const newArray = [...prev];
        newArray[existing] = nuevoOperadorConTurnos;
        return newArray;
      } else {
        // Agregar nuevo operador
        return [...prev, nuevoOperadorConTurnos];
      }
    });

    // Limpiar selección actual
    setOperadorSeleccionado('');
    setTurnosAsignados(prev => prev.filter(t => t.operador_id !== operadorSeleccionado));
    toast.success(`Turnos asignados para ${operador.nombres} ${operador.apellidos}`);
  };

  const removerOperador = (operadorId: string) => {
    setOperadoresConTurnos(prev => prev.filter(op => op.operador_id !== operadorId));
    setTurnosAsignados(prev => prev.filter(t => t.operador_id !== operadorId));
  };

  const editarOperador = (operadorId: string) => {
    const operadorData = operadoresConTurnos.find(op => op.operador_id === operadorId);
    if (!operadorData) return;

    // Cargar los turnos del operador en el estado de edición
    setOperadorSeleccionado(operadorId);
    setTurnosAsignados(prev => [
      ...prev.filter(t => t.operador_id !== operadorId), // Remover turnos existentes del operador
      ...operadorData.turnos // Agregar los turnos del operador a editar
    ]);

    // Remover el operador de la lista de operadores con turnos asignados temporalmente
    setOperadoresConTurnos(prev => prev.filter(op => op.operador_id !== operadorId));
    
    toast.info(`Editando turnos de ${operadorData.operador_nombre}`);
  };

  const handleGenerate = async () => {
    if (!fechaInicio) {
      toast.error('Debe seleccionar fecha de inicio');
      return;
    }
    
    if (operadoresConTurnos.length === 0) {
      toast.error('Debe agregar al menos un operador con turnos asignados');
      return;
    }

    try {
      setIsGenerating(true);
      
      // Convertir todos los turnos de todos los operadores al formato esperado
      const todosLosTurnos = [];
      
      for (const operadorData of operadoresConTurnos) {
        // Validar que operadorData existe y tiene las propiedades necesarias
        if (!operadorData || !operadorData.operador_id || !operadorData.operador_nombre) {
          console.error('Datos de operador inválidos:', operadorData);
          continue;
        }

        // Validar que operadorData.turnos existe y es un array
        if (!operadorData.turnos || !Array.isArray(operadorData.turnos)) {
          console.error('Turnos no válidos para operador:', operadorData.operador_nombre);
          continue;
        }

        // Procesar turnos del operador
        const turnosOperador = operadorData.turnos
          .filter(t => t && t.tipo && t.tipo !== 'descanso' && t.tipo !== 'sin-asignar')
          .map(turno => {
            const tipoTurno = TIPOS_TURNO[turno.tipo as keyof typeof TIPOS_TURNO];
            
            if (!tipoTurno) {
              console.error('Tipo de turno no encontrado:', turno.tipo);
              return null;
            }
            
            // Validar que el turno tiene fecha
            if (!turno.fecha) {
              console.error('Turno sin fecha:', turno);
              return null;
            }
            
            const [horaInicio, horaFin] = tipoTurno.horario.includes('-') 
              ? tipoTurno.horario.split('-') 
              : ['00:00', '00:00'];
            
            return {
              fecha: turno.fecha,
              operador_id: operadorData.operador_id,
              operador_nombre: operadorData.operador_nombre,
              hora_inicio: horaInicio,
              hora_fin: horaFin,
              tipo: tipoTurno.tipo === 'nocturno' ? 'nocturno' : 'diurno',
              horas_diurnas: tipoTurno.tipo === 'diurno' ? tipoTurno.horas : tipoTurno.tipo === 'mixto' ? 5 : 0,
              horas_nocturnas: tipoTurno.tipo === 'nocturno' ? tipoTurno.horas : tipoTurno.tipo === 'mixto' ? 3 : 0,
              horas_domingo: isWeekend(turno.fecha) && turno.fecha.getDay() === 0 ? tipoTurno.horas : 0,
              horas_feriado: 0,
              es_domingo: isWeekend(turno.fecha) && turno.fecha.getDay() === 0,
              es_feriado: false
            };
          })
          .filter(turno => turno !== null);

        todosLosTurnos.push(...turnosOperador);
      }

      if (todosLosTurnos.length === 0) {
        toast.error('No hay turnos válidos para generar');
        return;
      }

      console.log('Turnos a generar:', todosLosTurnos);
      await onGenerate({ turnos: todosLosTurnos });
      toast.success('Turnos generados exitosamente');
      
      // Limpiar formulario
      setOperadorSeleccionado('');
      setOperadoresConTurnos([]);
      setTurnosAsignados([]);
      onClose();
    } catch (error) {
      console.error('Error al generar turnos:', error);
      toast.error(`Error al generar los turnos: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const operadorSeleccionadoData = operadores.find(op => op.id === operadorSeleccionado);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Asignar Turnos por Operador
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Configuración Básica */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Período</Label>
              <Select value={periodicidad} onValueChange={(value: 'semanal' | 'quincenal' | 'mensual') => setPeriodicidad(value)}>
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

            <div className="space-y-2">
              <Label>Fecha de Inicio</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !fechaInicio && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fechaInicio ? format(fechaInicio, "PPP", { locale: es }) : "Seleccionar fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={fechaInicio}
                    onSelect={setFechaInicio}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Operador</Label>
              <Select value={operadorSeleccionado} onValueChange={setOperadorSeleccionado}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Seleccionar operador" />
                </SelectTrigger>
                <SelectContent className="bg-background border z-50">
                  {operadores
                    .filter(op => !operadoresConTurnos.find(oct => oct.operador_id === op.id))
                    .map((operador) => (
                    <SelectItem key={operador.id} value={operador.id} className="bg-background hover:bg-muted">
                      {operador.nombres} {operador.apellidos}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Operadores ya agregados */}
          {operadoresConTurnos.length > 0 && (
            <div className="space-y-3">
              <Label>Operadores con turnos asignados:</Label>
              <div className="space-y-2">
                {operadoresConTurnos.map((operadorData) => (
                  <div key={operadorData.operador_id} className="flex items-center justify-between bg-green-50 dark:bg-green-950/20 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-800 dark:text-green-200">
                        {operadorData.operador_nombre}
                      </span>
                      <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                        {operadorData.turnos.filter(t => t.tipo !== 'descanso').length} turnos
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => editarOperador(operadorData.operador_id)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        Editar
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removerOperador(operadorData.operador_id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remover
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Operador Seleccionado */}
          {operadorSeleccionado && (
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-blue-800 dark:text-blue-200">
                  Asignando turnos para: {operadores.find(op => op.id === operadorSeleccionado)?.nombres} {operadores.find(op => op.id === operadorSeleccionado)?.apellidos}
                </h3>
              </div>
            </div>
          )}

          {/* Tipos de Turno Disponibles */}
          <div className="space-y-2">
            <Label>Tipos de Turno Disponibles</Label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(TIPOS_TURNO).map(([key, turno]) => (
                <Badge key={key} variant="outline" className={cn("cursor-default", turno.color)}>
                  {turno.nombre} {turno.horario && `(${turno.horario})`}
                </Badge>
              ))}
            </div>
          </div>

          {/* Calendario Interactivo */}
          {fechaInicio && operadorSeleccionado && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                <h3 className="text-lg font-semibold">
                  Haga clic en los días para asignar turnos - Período: {periodicidad === 'semanal' ? '7 días' : periodicidad === 'quincenal' ? '15 días' : '30 días'}
                </h3>
              </div>
              
              {/* Mostrar todos los días del período seleccionado */}
              <div className="space-y-4">
                {Array.from({ length: Math.ceil(getDiasDelPeriodo().length / 7) }, (_, weekIndex) => {
                  const weekStart = weekIndex * 7;
                  const weekEnd = Math.min(weekStart + 7, getDiasDelPeriodo().length);
                  const weekDays = getDiasDelPeriodo().slice(weekStart, weekEnd);
                  
                  return (
                    <div key={weekIndex} className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2 text-sm text-muted-foreground">
                        Semana {weekIndex + 1} - {format(weekDays[0], 'dd/MM')} al {format(weekDays[weekDays.length - 1], 'dd/MM')}
                      </h4>
                      
                      <div className="grid grid-cols-7 gap-2">
                        {/* Headers de días */}
                        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(dia => (
                          <div key={dia} className="text-center font-semibold p-2 text-sm">
                            {dia}
                          </div>
                        ))}
                        
                        {/* Días de la semana */}
                        {Array.from({ length: 7 }, (_, dayIndex) => {
                          const fecha = weekDays[dayIndex];
                          if (!fecha) {
                            return <div key={`empty-${dayIndex}`} className="h-20"></div>;
                          }
                          
                          const turnoAsignado = getTurnoParaFecha(fecha);
                          const esDomingo = fecha.getDay() === 0;
                          
                          return (
                            <div key={fecha.toISOString()} className="space-y-1">
                              <div className={cn(
                                "text-center p-2 border rounded font-medium text-sm",
                                esDomingo && "bg-blue-50 dark:bg-blue-950/20 border-blue-300"
                              )}>
                                {format(fecha, 'dd/MM')}
                                {esDomingo && <div className="text-xs text-blue-600">Dom</div>}
                              </div>
                              
                              <Select
                                value={turnoAsignado?.tipo || 'sin-asignar'}
                                onValueChange={(tipo: 'dia' | 'mañana' | 'tarde' | 'noche' | 'descanso' | 'sin-asignar') => 
                                  asignarTurno(fecha, tipo)
                                }
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue placeholder="Turno" />
                                </SelectTrigger>
                                <SelectContent className="bg-background border z-50">
                                  <SelectItem value="sin-asignar" className="bg-background hover:bg-muted">Sin asignar</SelectItem>
                                  <SelectItem value="descanso" className="bg-background hover:bg-muted">Descanso</SelectItem>
                                  <SelectItem value="dia" className="bg-background hover:bg-muted">Día (06:00-18:00)</SelectItem>
                                  <SelectItem value="mañana" className="bg-background hover:bg-muted">Mañana (06:00-14:00)</SelectItem>
                                  <SelectItem value="tarde" className="bg-background hover:bg-muted">Tarde (14:00-22:00)</SelectItem>
                                  <SelectItem value="noche" className="bg-background hover:bg-muted">Noche (18:00-06:00)</SelectItem>
                                </SelectContent>
                              </Select>
                              
                              {turnoAsignado && turnoAsignado.tipo !== 'descanso' && (
                                <div className={cn(
                                  "text-xs p-1 rounded text-center border",
                                  TIPOS_TURNO[turnoAsignado.tipo].color
                                )}>
                                  {TIPOS_TURNO[turnoAsignado.tipo].horario}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Botón para añadir operador */}
          {operadorSeleccionado && turnosAsignados.filter(t => t.operador_id === operadorSeleccionado && t.tipo !== 'descanso').length > 0 && (
            <div className="flex justify-center">
              <Button
                type="button"
                onClick={añadirOperadorConTurnos}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <User className="h-4 w-4 mr-2" />
                Añadir Operador
              </Button>
            </div>
          )}

          {/* Resumen */}
          {operadorSeleccionado && turnosAsignados.filter(t => t.operador_id === operadorSeleccionado).length > 0 && (
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Resumen de Turnos del Operador Actual:</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                {Object.entries(TIPOS_TURNO).map(([key, turno]) => {
                  const count = turnosAsignados.filter(t => t.tipo === key && t.operador_id === operadorSeleccionado).length;
                  return (
                    <div key={key} className="flex justify-between">
                      <span>{turno.nombre}:</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isGenerating}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleGenerate} 
              disabled={isGenerating || !fechaInicio || operadoresConTurnos.length === 0}
            >
              {isGenerating ? 'Generando...' : 'Generar Turnos'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};