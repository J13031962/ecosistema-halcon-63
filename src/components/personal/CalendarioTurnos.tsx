import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Datos de ejemplo de operadores
const operadores = [
  { id: 1, nombre: "Ana García", cargo: "Operador de Alarmas" },
  { id: 2, nombre: "Luis Martín", cargo: "Despachador de Patrullas" },
  { id: 3, nombre: "María López", cargo: "Supervisor Motorizado" },
  { id: 4, nombre: "Carlos Ruiz", cargo: "Técnico" },
  { id: 5, nombre: "Sandra Morales", cargo: "Operador de Alarmas" }
];

// Tipos de turno con colores
const tiposTurno = {
  w: { label: "Trabajo", color: "bg-blue-500 text-white" },
  o: { label: "Oficina", color: "bg-yellow-500 text-white" },
  h: { label: "Casa", color: "bg-purple-500 text-white" },
  a: { label: "Ausente", color: "bg-red-500 text-white" },
  v: { label: "Vacaciones", color: "bg-green-500 text-white" }
};

// Generar turnos aleatorios para cada operador
const generarTurnosDelMes = (year: number, month: number) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const turnos: { [key: string]: { [key: number]: string } } = {};
  
  operadores.forEach(operador => {
    turnos[operador.id] = {};
    for (let day = 1; day <= daysInMonth; day++) {
      // Generar turnos aleatorios pero con cierta lógica
      const rand = Math.random();
      if (rand < 0.6) turnos[operador.id][day] = 'w';
      else if (rand < 0.8) turnos[operador.id][day] = 'o';
      else if (rand < 0.9) turnos[operador.id][day] = 'h';
      else if (rand < 0.95) turnos[operador.id][day] = 'v';
      else turnos[operador.id][day] = 'a';
    }
  });
  
  return turnos;
};

export function CalendarioTurnos() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedOperador, setSelectedOperador] = useState<string>("todos");
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  
  const turnos = generarTurnosDelMes(year, month);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const adjustedFirstDay = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Lunes = 0
  
  // Días de la semana
  const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  
  // Obtener días del mes
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  
  const navegarMes = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(month - 1);
    } else {
      newDate.setMonth(month + 1);
    }
    setCurrentDate(newDate);
  };
  
  const operadoresFiltrados = selectedOperador === "todos" 
    ? operadores 
    : operadores.filter(op => op.id.toString() === selectedOperador);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl capitalize">
                Calendario de Turnos - {monthName}
              </CardTitle>
              <CardDescription>
                Gestión de turnos del personal operativo
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <Select value={selectedOperador} onValueChange={setSelectedOperador}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar operador" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los operadores</SelectItem>
                  {operadores.map(operador => (
                    <SelectItem key={operador.id} value={operador.id.toString()}>
                      {operador.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => navegarMes('prev')}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => navegarMes('next')}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Leyenda de colores */}
          <div className="mb-6 flex flex-wrap gap-4">
            {Object.entries(tiposTurno).map(([key, tipo]) => (
              <div key={key} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded ${tipo.color} flex items-center justify-center text-xs font-bold`}>
                  {key}
                </div>
                <span className="text-sm">{tipo.label}</span>
              </div>
            ))}
          </div>
          
          {/* Tabla de turnos */}
          <div className="overflow-x-auto">
            <div className="min-w-full">
              {/* Encabezado con días */}
              <div className="grid grid-cols-32 gap-1 mb-2">
                <div className="col-span-1 font-medium text-sm p-2">Empleado</div>
                {diasSemana.map(dia => (
                  <div key={dia} className="text-center text-xs font-medium p-1 text-muted-foreground">
                    {dia}
                  </div>
                ))}
                {days.map(day => (
                  <div key={day} className="text-center text-xs font-medium p-1">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Filas de empleados */}
              {operadoresFiltrados.map(operador => (
                <div key={operador.id} className="grid grid-cols-32 gap-1 mb-1 items-center">
                  {/* Nombre del empleado */}
                  <div className="col-span-1 p-2 bg-slate-600 text-white text-sm font-medium rounded">
                    <div className="truncate">{operador.nombre}</div>
                    <div className="text-xs opacity-75 truncate">{operador.cargo}</div>
                  </div>
                  
                  {/* Espacios para alinear con días de la semana */}
                  {Array.from({ length: 7 }, (_, i) => (
                    <div key={`spacer-${i}`} className="p-1"></div>
                  ))}
                  
                  {/* Días del mes */}
                  {days.map(day => {
                    const turno = turnos[operador.id]?.[day] || 'w';
                    const tipoTurno = tiposTurno[turno as keyof typeof tiposTurno];
                    const isWeekend = new Date(year, month, day).getDay() === 0 || new Date(year, month, day).getDay() === 6;
                    
                    return (
                      <div 
                        key={day} 
                        className={`
                          text-center p-1 rounded text-xs font-bold cursor-pointer
                          ${tipoTurno.color}
                          ${isWeekend ? 'ring-2 ring-orange-300' : ''}
                          hover:opacity-80 transition-opacity
                        `}
                        title={`${operador.nombre} - ${tipoTurno.label}`}
                      >
                        {turno}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          
          {/* Resumen estadístico */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(tiposTurno).map(([key, tipo]) => {
              const total = operadoresFiltrados.reduce((sum, operador) => {
                return sum + days.filter(day => turnos[operador.id]?.[day] === key).length;
              }, 0);
              
              return (
                <Card key={key}>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded ${tipo.color}`}></div>
                      <div>
                        <div className="text-2xl font-bold">{total}</div>
                        <div className="text-xs text-muted-foreground">{tipo.label}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}