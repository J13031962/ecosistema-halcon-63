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

  const getTurnosForDay = (fecha: Date) => {
    return turnos.filter(turno => isSameDay(turno.fecha, fecha));
  };

  const getTipoIcon = (tipo: 'diurno' | 'nocturno') => {
    return tipo === 'diurno' ? <Sun className="h-3 w-3" /> : <Moon className="h-3 w-3" />;
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

  const operadoresUnicos = [...new Set(turnos.map(t => ({ id: t.operador_id, nombre: t.operador_nombre })))];

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

      {/* Vista semanal */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day, index) => {
          const turnosDelDia = getTurnosForDay(day);
          const esDomingo = isWeekend(day) && day.getDay() === 0;
          
          return (
            <Card key={index} className={cn("min-h-[200px]", esDomingo && "bg-blue-50 dark:bg-blue-950/20")}>
              <CardHeader className="p-3">
                <CardTitle className="text-sm">
                  <div className="flex items-center justify-between">
                    <span>{format(day, 'EEE', { locale: es })}</span>
                    <span className="text-xs text-muted-foreground">
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
              <CardContent className="p-3 pt-0 space-y-2">
                {turnosDelDia.map((turno) => (
                  <div
                    key={turno.id}
                    className={cn(
                      "p-2 rounded-lg border text-xs cursor-pointer hover:bg-accent",
                      turno.tipo === 'diurno' ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20' : 'bg-blue-50 border-blue-200 dark:bg-blue-950/20'
                    )}
                    onClick={() => onEditTurno(turno)}
                  >
                    <div className="flex items-center gap-1 mb-1">
                      {getTipoIcon(turno.tipo)}
                      <span className="font-medium">
                        {turno.hora_inicio} - {turno.hora_fin}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span className="truncate">{turno.operador_nombre}</span>
                    </div>
                    <div className="mt-1 text-xs">
                      <span className="font-medium">
                        {turno.horas_diurnas + turno.horas_nocturnas}h total
                      </span>
                    </div>
                  </div>
                ))}
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
              return (
                <div key={operador.id} className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-3">{operador.nombre}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Horas Diurnas:</span>
                      <span className="font-medium">{horas.diurnas}h</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Horas Nocturnas:</span>
                      <span className="font-medium">{horas.nocturnas}h</span>
                    </div>
                    {horas.domingo > 0 && (
                      <div className="flex justify-between text-blue-600">
                        <span>Horas Domingo:</span>
                        <span className="font-medium">{horas.domingo}h</span>
                      </div>
                    )}
                    {horas.feriado > 0 && (
                      <div className="flex justify-between text-purple-600">
                        <span>Horas Feriado:</span>
                        <span className="font-medium">{horas.feriado}h</span>
                      </div>
                    )}
                    <div className="border-t pt-2 flex justify-between font-semibold">
                      <span>Total:</span>
                      <span>{horas.total}h</span>
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