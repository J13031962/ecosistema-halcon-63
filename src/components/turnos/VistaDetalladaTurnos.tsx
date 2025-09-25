import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useSupabaseTurnos } from '@/hooks/useSupabaseTurnos';
import { Trash2, Calendar, Clock, User, Filter, Search, ChevronDown, ChevronRight, Users } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

const TIPOS_TURNO = {
  mañana: { 
    label: 'Mañana', 
    color: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  tarde: { 
    label: 'Tarde', 
    color: 'bg-green-100 text-green-800 border-green-200'
  },
  noche: { 
    label: 'Noche', 
    color: 'bg-purple-100 text-purple-800 border-purple-200'
  },
  diurno: { 
    label: 'Diurno', 
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  },
  nocturno: { 
    label: 'Nocturno', 
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200'
  },
  descanso: { 
    label: 'Descanso', 
    color: 'bg-gray-100 text-gray-600 border-gray-200'
  }
};

interface PeriodoTurnos {
  id: string;
  fechaInicio: string;
  fechaFin: string;
  fechaCreacion: string;
  operadores: {
    operador_id: string;
    operador_nombre: string;
    turnos: any[];
  }[];
  totalTurnos: number;
}

export function VistaDetalladaTurnos() {
  const { turnosOperador, loading, deleteTurnoPeriodoOperador } = useSupabaseTurnos();
  const [filtroOperador, setFiltroOperador] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState<string>('');
  const [periodosAbiertos, setPeriodosAbiertos] = useState<Set<string>>(new Set());
  const [operadoresAbiertos, setOperadoresAbiertos] = useState<Set<string>>(new Set());

  // Agrupar turnos por períodos de generación
  const periodosTurnos = useMemo(() => {
    if (!turnosOperador.length) return [];

    // Agrupar por timestamp de creación (con tolerancia de 5 minutos)
    const gruposPorCreacion = new Map<string, any[]>();
    
    turnosOperador.forEach(turno => {
      if (!turno.created_at) return;
      
      const fechaCreacion = new Date(turno.created_at);
      const keyTiempo = Math.floor(fechaCreacion.getTime() / (5 * 60 * 1000)); // Grupos de 5 minutos
      const key = keyTiempo.toString();
      
      if (!gruposPorCreacion.has(key)) {
        gruposPorCreacion.set(key, []);
      }
      gruposPorCreacion.get(key)!.push(turno);
    });

    // Convertir grupos a períodos estructurados
    const periodos: PeriodoTurnos[] = [];
    
    gruposPorCreacion.forEach((turnos, key) => {
      if (turnos.length === 0) return;
      
      // Calcular rango de fechas
      const fechas = turnos.map(t => t.fecha).sort();
      const fechaInicio = fechas[0];
      const fechaFin = fechas[fechas.length - 1];
      
      // Agrupar por operador
      const operadoresMap = new Map<string, any[]>();
      turnos.forEach(turno => {
        const operadorKey = turno.operador_id || 'sin_operador';
        if (!operadoresMap.has(operadorKey)) {
          operadoresMap.set(operadorKey, []);
        }
        operadoresMap.get(operadorKey)!.push(turno);
      });
      
      const operadores = Array.from(operadoresMap.entries()).map(([operador_id, turnosOperador]) => ({
        operador_id,
        operador_nombre: turnosOperador[0]?.operador_nombre || 'Sin asignar',
        turnos: turnosOperador.sort((a, b) => a.fecha.localeCompare(b.fecha))
      }));
      
      periodos.push({
        id: key,
        fechaInicio,
        fechaFin,
        fechaCreacion: turnos[0].created_at,
        operadores,
        totalTurnos: turnos.length
      });
    });
    
    return periodos.sort((a, b) => 
      new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()
    );
  }, [turnosOperador]);

  // Filtrar períodos
  const periodosFiltrados = periodosTurnos.filter(periodo => {
    const coincideBusqueda = !busqueda || 
      periodo.operadores.some(op => op.operador_nombre.toLowerCase().includes(busqueda.toLowerCase())) ||
      periodo.fechaInicio.includes(busqueda) ||
      periodo.fechaFin.includes(busqueda);
    
    const coincideOperador = filtroOperador === 'todos' || 
      periodo.operadores.some(op => op.operador_nombre === filtroOperador);
    
    return coincideBusqueda && coincideOperador;
  });

  // Obtener operadores únicos para el filtro
  const operadoresUnicos = [...new Set(turnosOperador.map(t => t.operador_nombre).filter(Boolean))];

  const togglePeriodo = (periodoId: string) => {
    const nuevosAbiertos = new Set(periodosAbiertos);
    if (nuevosAbiertos.has(periodoId)) {
      nuevosAbiertos.delete(periodoId);
    } else {
      nuevosAbiertos.add(periodoId);
    }
    setPeriodosAbiertos(nuevosAbiertos);
  };

  const toggleOperador = (operadorKey: string) => {
    const nuevosAbiertos = new Set(operadoresAbiertos);
    if (nuevosAbiertos.has(operadorKey)) {
      nuevosAbiertos.delete(operadorKey);
    } else {
      nuevosAbiertos.add(operadorKey);
    }
    setOperadoresAbiertos(nuevosAbiertos);
  };

  const handleEliminarPeriodo = async (periodo: PeriodoTurnos) => {
    try {
      const operadorIds = periodo.operadores.map(op => op.operador_id).filter(id => id !== 'sin_operador');
      await deleteTurnoPeriodoOperador(periodo.fechaInicio, periodo.fechaFin, operadorIds);
    } catch (error) {
      console.error('Error al eliminar período:', error);
    }
  };

  const calcularDuracionPeriodo = (fechaInicio: string, fechaFin: string) => {
    const dias = differenceInDays(parseISO(fechaFin), parseISO(fechaInicio)) + 1;
    if (dias <= 7) return `${dias} día${dias > 1 ? 's' : ''}`;
    if (dias <= 15) return `${Math.round(dias / 7)} semana${Math.round(dias / 7) > 1 ? 's' : ''}`;
    return `${Math.round(dias / 7)} semanas`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Cargando períodos de turnos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas generales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Períodos Generados</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{periodosFiltrados.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Turnos</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {periodosFiltrados.reduce((acc, p) => acc + p.totalTurnos, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Operadores</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{operadoresUnicos.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Operadores Activos</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(periodosFiltrados.flatMap(p => p.operadores.map(op => op.operador_nombre))).size}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por operador o fecha..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Operador</label>
              <Select value={filtroOperador} onValueChange={setFiltroOperador}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar operador" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los operadores</SelectItem>
                  {operadoresUnicos.map(operador => (
                    <SelectItem key={operador} value={operador}>
                      {operador}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Acciones</label>
              <Button 
                variant="outline" 
                onClick={() => {
                  setFiltroOperador('todos');
                  setBusqueda('');
                }}
                className="w-full"
              >
                Limpiar Filtros
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Vista</label>
              <Button 
                variant="outline" 
                onClick={() => {
                  if (periodosAbiertos.size === periodosFiltrados.length) {
                    setPeriodosAbiertos(new Set());
                    setOperadoresAbiertos(new Set());
                  } else {
                    setPeriodosAbiertos(new Set(periodosFiltrados.map(p => p.id)));
                  }
                }}
                className="w-full"
              >
                {periodosAbiertos.size === periodosFiltrados.length ? 'Contraer Todo' : 'Expandir Todo'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de períodos */}
      <Card>
        <CardHeader>
          <CardTitle>Períodos de Turnos Generados ({periodosFiltrados.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {periodosFiltrados.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No se encontraron períodos con los filtros seleccionados</p>
            </div>
          ) : (
            <div className="space-y-4">
              {periodosFiltrados.map((periodo) => {
                const fechaCreacion = format(new Date(periodo.fechaCreacion), 'dd/MM/yyyy HH:mm', { locale: es });
                const fechaInicio = format(new Date(periodo.fechaInicio), 'dd/MM/yyyy', { locale: es });
                const fechaFin = format(new Date(periodo.fechaFin), 'dd/MM/yyyy', { locale: es });
                const duracion = calcularDuracionPeriodo(periodo.fechaInicio, periodo.fechaFin);
                const estaAbierto = periodosAbiertos.has(periodo.id);

                return (
                  <Card key={periodo.id} className="border-2">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => togglePeriodo(periodo.id)}
                            className="p-0 h-auto"
                          >
                            {estaAbierto ? (
                              <ChevronDown className="h-5 w-5" />
                            ) : (
                              <ChevronRight className="h-5 w-5" />
                            )}
                          </Button>
                          <div>
                            <h3 className="text-lg font-semibold">
                              Período {duracion} ({fechaInicio} - {fechaFin})
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>📅 Creado: {fechaCreacion}</span>
                              <span>👥 {periodo.operadores.length} operador{periodo.operadores.length > 1 ? 'es' : ''}</span>
                              <span>🕐 {periodo.totalTurnos} turnos</span>
                            </div>
                          </div>
                        </div>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar Período
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar período completo?</AlertDialogTitle>
                              <AlertDialogDescription>
                                ¿Estás seguro de que deseas eliminar todo el período del <strong>{fechaInicio}</strong> al <strong>{fechaFin}</strong>?
                                <br />
                                <br />
                                Esto eliminará <strong>{periodo.totalTurnos} turnos</strong> de <strong>{periodo.operadores.length} operador{periodo.operadores.length > 1 ? 'es' : ''}</strong>:
                                <ul className="list-disc list-inside mt-2">
                                  {periodo.operadores.map(op => (
                                    <li key={op.operador_id}>
                                      <strong>{op.operador_nombre}</strong> ({op.turnos.length} turnos)
                                    </li>
                                  ))}
                                </ul>
                                <br />
                                Esta acción no se puede deshacer.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleEliminarPeriodo(periodo)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Eliminar Período Completo
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardHeader>

                    <Collapsible open={estaAbierto}>
                      <CollapsibleContent>
                        <CardContent className="pt-0">
                          <div className="space-y-4">
                            {periodo.operadores.map((operador) => {
                              const operadorKey = `${periodo.id}-${operador.operador_id}`;
                              const operadorAbierto = operadoresAbiertos.has(operadorKey);
                              
                              return (
                                <Card key={operadorKey} className="bg-muted/30">
                                  <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => toggleOperador(operadorKey)}
                                          className="p-0 h-auto"
                                        >
                                          {operadorAbierto ? (
                                            <ChevronDown className="h-4 w-4" />
                                          ) : (
                                            <ChevronRight className="h-4 w-4" />
                                          )}
                                        </Button>
                                        <User className="h-4 w-4" />
                                        <span className="font-medium">{operador.operador_nombre}</span>
                                        <Badge variant="secondary">
                                          {operador.turnos.length} turnos
                                        </Badge>
                                      </div>
                                    </div>
                                  </CardHeader>

                                  <Collapsible open={operadorAbierto}>
                                    <CollapsibleContent>
                                      <CardContent className="pt-0">
                                        <div className="grid gap-2">
                                          {operador.turnos.map((turno) => {
                                            const tipoTurno = TIPOS_TURNO[turno.turno as keyof typeof TIPOS_TURNO] || TIPOS_TURNO.descanso;
                                            const fechaTurno = format(new Date(turno.fecha), 'dd/MM/yyyy', { locale: es });
                                            const horario = turno.horario_inicio && turno.horario_fin ? 
                                              `${turno.horario_inicio} - ${turno.horario_fin}` : 
                                              'Sin horario';

                                            return (
                                              <div key={turno.id} className="flex items-center justify-between p-3 bg-background rounded border">
                                                <div className="flex items-center gap-3">
                                                  <span className="font-medium">{fechaTurno}</span>
                                                  <Badge variant="outline" className={tipoTurno.color}>
                                                    {tipoTurno.label}
                                                  </Badge>
                                                  <span className="text-sm text-muted-foreground">{horario}</span>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </CardContent>
                                    </CollapsibleContent>
                                  </Collapsible>
                                </Card>
                              );
                            })}
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}