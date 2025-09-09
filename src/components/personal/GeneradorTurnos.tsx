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
  tipo: 'dia' | 'mañana' | 'tarde' | 'noche' | 'descanso';
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
    return turnosAsignados.find(t => isSameDay(t.fecha, fecha));
  };

  const asignarTurno = (fecha: Date, tipo: 'dia' | 'mañana' | 'tarde' | 'noche' | 'descanso') => {
    setTurnosAsignados(prev => {
      const existing = prev.findIndex(t => isSameDay(t.fecha, fecha));
      if (existing >= 0) {
        // Reemplazar turno existente
        const newArray = [...prev];
        newArray[existing] = { fecha, tipo };
        return newArray;
      } else {
        // Agregar nuevo turno
        return [...prev, { fecha, tipo }];
      }
    });
  };

  const handleGenerate = async () => {
    if (!operadorSeleccionado || !fechaInicio || turnosAsignados.length === 0) {
      toast.error('Debe seleccionar operador, fecha de inicio y asignar al menos un turno');
      return;
    }

    try {
      setIsGenerating(true);
      
      // Convertir turnos asignados al formato esperado
      const turnosParaGenerar = turnosAsignados.filter(t => t.tipo !== 'descanso').map(turno => {
        const tipoTurno = TIPOS_TURNO[turno.tipo];
        const operador = operadores.find(op => op.id === operadorSeleccionado);
        
        return {
          fecha: turno.fecha,
          operador_id: operadorSeleccionado,
          operador_nombre: `${operador?.nombres} ${operador?.apellidos}`,
          hora_inicio: tipoTurno.horario.split('-')[0],
          hora_fin: tipoTurno.horario.split('-')[1],
          tipo: tipoTurno.tipo === 'nocturno' ? 'nocturno' : 'diurno',
          horas_diurnas: tipoTurno.tipo === 'diurno' ? tipoTurno.horas : tipoTurno.tipo === 'mixto' ? 5 : 0,
          horas_nocturnas: tipoTurno.tipo === 'nocturno' ? tipoTurno.horas : tipoTurno.tipo === 'mixto' ? 3 : 0,
          horas_domingo: isWeekend(turno.fecha) && turno.fecha.getDay() === 0 ? tipoTurno.horas : 0,
          horas_feriado: 0, // Se puede mejorar con lógica de feriados
          es_domingo: isWeekend(turno.fecha) && turno.fecha.getDay() === 0,
          es_feriado: false
        };
      });

      await onGenerate({ turnos: turnosParaGenerar });
      toast.success('Turnos generados exitosamente');
      
      // Limpiar formulario
      setOperadorSeleccionado('');
      setTurnosAsignados([]);
      onClose();
    } catch (error) {
      console.error('Error al generar turnos:', error);
      toast.error('Error al generar los turnos');
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
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar operador" />
                </SelectTrigger>
                <SelectContent>
                  {operadores.map((operador) => (
                    <SelectItem key={operador.id} value={operador.id}>
                      {operador.nombres} {operador.apellidos}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Operador Seleccionado */}
          {operadorSeleccionadoData && (
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-blue-800 dark:text-blue-200">
                  Asignando turnos para: {operadorSeleccionadoData.nombres} {operadorSeleccionadoData.apellidos}
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
                  Haga clic en los días para asignar turnos
                </h3>
              </div>
              
              <div className="grid grid-cols-7 gap-2">
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(dia => (
                  <div key={dia} className="text-center font-semibold p-2 text-sm">
                    {dia}
                  </div>
                ))}
                
                {getDiasDelPeriodo().map((fecha) => {
                  const turnoAsignado = getTurnoParaFecha(fecha);
                  const esDomingo = fecha.getDay() === 0;
                  
                  return (
                    <div key={fecha.toISOString()} className="space-y-1">
                      <div className={cn(
                        "text-center p-2 border rounded font-medium text-sm",
                        esDomingo && "bg-blue-50 dark:bg-blue-950/20 border-blue-300"
                      )}>
                        {format(fecha, 'dd')}
                        {esDomingo && <div className="text-xs text-blue-600">Dom</div>}
                      </div>
                      
                      <Select
                        value={turnoAsignado?.tipo || ''}
                        onValueChange={(tipo: 'dia' | 'mañana' | 'tarde' | 'noche' | 'descanso') => 
                          asignarTurno(fecha, tipo)
                        }
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Turno" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="descanso">Descanso</SelectItem>
                          <SelectItem value="dia">Día</SelectItem>
                          <SelectItem value="mañana">Mañana</SelectItem>
                          <SelectItem value="tarde">Tarde</SelectItem>
                          <SelectItem value="noche">Noche</SelectItem>
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
          )}

          {/* Resumen */}
          {turnosAsignados.length > 0 && (
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Resumen de Turnos Asignados:</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                {Object.entries(TIPOS_TURNO).map(([key, turno]) => {
                  const count = turnosAsignados.filter(t => t.tipo === key).length;
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
              disabled={isGenerating || !operadorSeleccionado || !fechaInicio || turnosAsignados.length === 0}
            >
              {isGenerating ? 'Generando...' : 'Generar Turnos'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};