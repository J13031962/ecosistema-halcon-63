import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Save, RotateCcw } from "lucide-react";

// Tipos de turnos
const TURNOS = {
  MAÑANA: { id: 'mañana', name: 'Mañana', hours: '06:00 - 14:00', color: 'bg-blue-500' },
  DIA: { id: 'dia', name: 'Día', hours: '06:00 - 18:00', color: 'bg-emerald-500' },
  TARDE: { id: 'tarde', name: 'Tarde', hours: '14:00 - 21:00', color: 'bg-orange-500' },
  NOCHE: { id: 'noche', name: 'Noche', hours: '18:00 - 06:00', color: 'bg-purple-500' },
  DESCANSO: { id: 'descanso', name: 'Descanso', hours: '', color: 'bg-red-500' },
  VACACIONES: { id: 'vacaciones', name: 'Vacaciones', hours: '', color: 'bg-pink-500' },
  PERMISO: { id: 'permiso', name: 'Permiso', hours: '', color: 'bg-yellow-500' },
  CITA_MEDICA: { id: 'cita_medica', name: 'Cita Médica', hours: '', color: 'bg-teal-500' },
};

// Operadores del sistema
const OPERADORES = [
  { id: 'op1', name: 'Juan Pérez', initials: 'JP', role: 'Operador' },
  { id: 'op2', name: 'María García', initials: 'MG', role: 'Operador' },
  { id: 'op3', name: 'Carlos López', initials: 'CL', role: 'Operador' },
];

// Días de la semana
const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

// Turnos predefinidos como en la imagen
const TURNOS_PREDEFINIDOS: TurnoAsignado[] = [
  // Juan Pérez
  { operadorId: 'op1', turnoId: 'noche', dia: 'Lun' },
  { operadorId: 'op1', turnoId: 'noche', dia: 'Mar' },
  { operadorId: 'op1', turnoId: 'descanso', dia: 'Mié' },
  { operadorId: 'op1', turnoId: 'descanso', dia: 'Jue' },
  { operadorId: 'op1', turnoId: 'dia', dia: 'Vie' },
  { operadorId: 'op1', turnoId: 'dia', dia: 'Sáb' },
  { operadorId: 'op1', turnoId: 'noche', dia: 'Dom' },
  
  // María García
  { operadorId: 'op2', turnoId: 'dia', dia: 'Lun' },
  { operadorId: 'op2', turnoId: 'dia', dia: 'Mar' },
  { operadorId: 'op2', turnoId: 'noche', dia: 'Mié' },
  { operadorId: 'op2', turnoId: 'noche', dia: 'Jue' },
  { operadorId: 'op2', turnoId: 'descanso', dia: 'Vie' },
  { operadorId: 'op2', turnoId: 'descanso', dia: 'Sáb' },
  { operadorId: 'op2', turnoId: 'dia', dia: 'Dom' },
  
  // Carlos López
  { operadorId: 'op3', turnoId: 'descanso', dia: 'Lun' },
  { operadorId: 'op3', turnoId: 'descanso', dia: 'Mar' },
  { operadorId: 'op3', turnoId: 'dia', dia: 'Mié' },
  { operadorId: 'op3', turnoId: 'dia', dia: 'Jue' },
  { operadorId: 'op3', turnoId: 'noche', dia: 'Vie' },
  { operadorId: 'op3', turnoId: 'noche', dia: 'Sáb' },
  { operadorId: 'op3', turnoId: 'descanso', dia: 'Dom' },
];

interface TurnoAsignado {
  operadorId: string;
  turnoId: string;
  dia: string;
}

export const CalendarTurnos = () => {
  const [turnos, setTurnos] = useState<TurnoAsignado[]>(TURNOS_PREDEFINIDOS);
  const [selectedOperador, setSelectedOperador] = useState<string>('');
  const [selectedTurno, setSelectedTurno] = useState<string>('');

  const handleAsignarTurno = (dia: string) => {
    if (!selectedOperador || !selectedTurno) return;

    // Verificar si ya existe una asignación para este operador y día
    const existingIndex = turnos.findIndex(
      t => t.operadorId === selectedOperador && t.dia === dia
    );

    if (existingIndex >= 0) {
      // Actualizar turno existente
      const newTurnos = [...turnos];
      newTurnos[existingIndex] = {
        operadorId: selectedOperador,
        turnoId: selectedTurno,
        dia
      };
      setTurnos(newTurnos);
    } else {
      // Crear nuevo turno
      setTurnos([...turnos, {
        operadorId: selectedOperador,
        turnoId: selectedTurno,
        dia
      }]);
    }
  };

  const getTurnoForOperadorAndDay = (operadorId: string, dia: string) => {
    return turnos.find(t => t.operadorId === operadorId && t.dia === dia);
  };


  const getTurnoInfo = (turnoId: string) => {
    return Object.values(TURNOS).find(t => t.id === turnoId);
  };

  const handleGuardar = () => {
    // Aquí se implementaría la lógica para guardar en la base de datos
    console.log('Guardando turnos:', turnos);
    alert('Turnos guardados exitosamente');
  };

  const handleReset = () => {
    setTurnos([]);
    setSelectedOperador('');
    setSelectedTurno('');
  };

  return (
    <div className="space-y-6">
      {/* Controles superiores */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <span className="font-medium">Semana del 26 Agosto - 1 Septiembre, 2024</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleReset} variant="outline" size="sm">
            <RotateCcw className="h-4 w-4 mr-2" />
            Limpiar
          </Button>
          <Button onClick={handleGuardar} size="sm">
            <Save className="h-4 w-4 mr-2" />
            Guardar Cambios
          </Button>
        </div>
      </div>

      {/* Controles de selección */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Seleccionar Operador</label>
          <Select value={selectedOperador} onValueChange={setSelectedOperador}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un operador" />
            </SelectTrigger>
            <SelectContent>
              {OPERADORES.map(operador => (
                <SelectItem key={operador.id} value={operador.id}>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary"></div>
                    {operador.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Seleccionar Turno/Estado</label>
          <Select value={selectedTurno} onValueChange={setSelectedTurno}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un turno" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(TURNOS).map(turno => (
                <SelectItem key={turno.id} value={turno.id}>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${turno.color}`}></div>
                    {turno.name} {turno.hours && `(${turno.hours})`}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Leyenda de turnos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {Object.values(TURNOS).map(turno => (
          <div key={turno.id} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${turno.color}`}></div>
            <span className="text-sm">{turno.name}</span>
            {turno.hours && <span className="text-xs text-muted-foreground">({turno.hours})</span>}
          </div>
        ))}
      </div>

      {/* Calendario semanal */}
      <Card>
        <CardHeader>
          <CardTitle>Programación Semanal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border p-2 bg-muted font-medium text-left w-40">
                    Empleado
                  </th>
                  {DIAS_SEMANA.map((dia, index) => (
                    <th key={dia} className="border p-2 bg-muted font-medium text-center min-w-32">
                      <div>{dia}</div>
                      <div className="text-xs text-muted-foreground">{index + 1}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {OPERADORES.map(operador => (
                  <tr key={operador.id} className="hover:bg-muted/50">
                    <td className="border p-2 font-medium">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium">
                          {operador.initials}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{operador.name}</p>
                          <p className="text-xs text-muted-foreground">{operador.role}</p>
                        </div>
                      </div>
                    </td>
                    {DIAS_SEMANA.map(dia => {
                      const turno = getTurnoForOperadorAndDay(operador.id, dia);
                      const turnoInfo = turno ? getTurnoInfo(turno.turnoId) : null;
                      
                      return (
                        <td key={dia} className="border p-1 text-center">
                          {turnoInfo ? (
                            <div className={`${turnoInfo.color} text-white text-xs p-2 rounded text-center`}>
                              <div className="font-medium">{turnoInfo.name}</div>
                              {turnoInfo.hours && (
                                <div className="text-xs opacity-90 mt-1">
                                  {turnoInfo.hours}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground p-2">
                              -
                            </div>
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

      {/* Resumen de horas */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Horas Programadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-4">
            {DIAS_SEMANA.map(dia => {
              const turnosDelDia = turnos.filter(t => t.dia === dia);
              const horasTotales = turnosDelDia.reduce((acc, turno) => {
                const turnoInfo = getTurnoInfo(turno.turnoId);
                if (turnoInfo?.id === 'mañana') return acc + 8;
                if (turnoInfo?.id === 'tarde') return acc + 7;
                if (turnoInfo?.id === 'noche') return acc + 12;
                if (turnoInfo?.id === 'dia') return acc + 12;
                return acc;
              }, 0);

              return (
                <div key={dia} className="text-center">
                  <div className="font-medium text-sm">{dia}</div>
                  <div className="text-2xl font-bold text-primary">{horasTotales}</div>
                  <div className="text-xs text-muted-foreground">horas</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};