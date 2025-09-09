import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Edit, User, Sun, Moon } from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay, isWeekend } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Turno {
  id: string;
  fecha: Date;
  operador_id: string;
  operador_nombre: string;
  hora_inicio: string;
  hora_fin: string;
  tipo: 'diurno' | 'nocturno';
  horas_diurnas: number;
  horas_nocturnas: number;
  horas_domingo: number;
  horas_feriado: number;
  es_domingo: boolean;
  es_feriado: boolean;
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

interface CalendarioTurnosProps {
  turnos: Turno[];
  onEditTurno: (turno: Turno) => void;
  selectedWeek: Date;
  onWeekChange: (date: Date) => void;
}

export const CalendarioTurnos: React.FC<CalendarioTurnosProps> = ({
  turnos,
  onEditTurno,
  selectedWeek,
  onWeekChange
}) => {
  const [viewMode, setViewMode] = useState<'semanal' | 'mensual'>('semanal');

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

  const getTurnosForDay = (fecha: Date) => {
    return turnos.filter(turno => isSameDay(turno.fecha, fecha));
  };

  const getTipoIcon = (tipo: 'diurno' | 'nocturno') => {
    return tipo === 'diurno' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />;
  };

  const getOperadorColor = (operadorId: string) => {
    return operadorColores.get(operadorId) || COLORES_OPERADORES[0];
  };

  const getTotalHorasOperador = (operadorId: string) => {
    const turnosOperador = turnos.filter(t => t.operador_id === operadorId);
    return {
      diurnas: turnosOperador.reduce((sum, t) => sum + t.horas_diurnas, 0),
      nocturnas: turnosOperador.reduce((sum, t) => sum + t.horas_nocturnas, 0),
      domingo: turnosOperador.reduce((sum, t) => sum + t.horas_domingo, 0),
      feriado: turnosOperador.reduce((sum, t) => sum + t.horas_feriado, 0),
      total: turnosOperador.reduce((sum, t) => sum + t.horas_diurnas + t.horas_nocturnas, 0)
    };
  };

  // Usar la misma variable que ya tenemos para operadores únicos

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
      </div>

      {/* Vista semanal - más ancha y menos alta */}
      <div className="grid grid-cols-7 gap-3">
        {weekDays.map((day, index) => {
          const turnosDelDia = getTurnosForDay(day);
          const esDomingo = isWeekend(day) && day.getDay() === 0;
          
          return (
            <Card key={index} className={cn("min-h-[180px]", esDomingo && "bg-blue-50 dark:bg-blue-950/20")}>
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
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 space-y-2">
                {turnosDelDia.map((turno) => {
                  const operadorColor = getOperadorColor(turno.operador_id);
                  return (
                    <div
                      key={turno.id}
                      className={cn(
                        "p-3 rounded-lg border cursor-pointer hover:shadow-md transition-shadow",
                        operadorColor.bg,
                        operadorColor.border
                      )}
                      onClick={() => onEditTurno(turno)}
                    >
                      <div className="space-y-2">
                        {/* Operador - Más visible y más ancho */}
                        <div className={cn("font-bold text-base truncate", operadorColor.text)}>
                          {turno.operador_nombre}
                        </div>
                        
                        {/* Tipo de turno y horario en línea horizontal */}
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1">
                            {getTipoIcon(turno.tipo)}
                            <span className={cn("font-semibold text-xs", operadorColor.text)}>
                              {turno.hora_inicio}-{turno.hora_fin}
                            </span>
                          </div>
                          <Badge 
                            variant={turno.tipo === 'diurno' ? 'default' : 'secondary'} 
                            className="text-xs px-2"
                          >
                            {turno.tipo === 'diurno' ? 'D' : 'N'}
                          </Badge>
                        </div>
                        
                        {/* Horas totales */}
                        <div className={cn("text-xs font-medium text-center", operadorColor.text)}>
                          {(turno.horas_diurnas + turno.horas_nocturnas).toFixed(1)}h
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
                      <span>Horas Diurnas:</span>
                      <span className="font-medium">{horas.diurnas.toFixed(1)}h</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Horas Nocturnas:</span>
                      <span className="font-medium">{horas.nocturnas.toFixed(1)}h</span>
                    </div>
                    {horas.domingo > 0 && (
                      <div className="flex justify-between text-blue-600 dark:text-blue-400">
                        <span>Horas Domingo:</span>
                        <span className="font-medium">{horas.domingo.toFixed(1)}h</span>
                      </div>
                    )}
                    {horas.feriado > 0 && (
                      <div className="flex justify-between text-purple-600 dark:text-purple-400">
                        <span>Horas Feriado:</span>
                        <span className="font-medium">{horas.feriado.toFixed(1)}h</span>
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
    </div>
  );
};