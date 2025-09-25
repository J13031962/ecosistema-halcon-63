import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useSupabaseTurnos } from '@/hooks/useSupabaseTurnos';
import { Trash2, Calendar, Clock, User, Filter, Search } from 'lucide-react';
import { format } from 'date-fns';
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

export function VistaDetalladaTurnos() {
  const { turnosOperador, loading, deleteTurnoOperador } = useSupabaseTurnos();
  const [filtroOperador, setFiltroOperador] = useState<string>('todos');
  const [filtroTurno, setFiltroTurno] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState<string>('');

  // Obtener operadores únicos para el filtro
  const operadoresUnicos = [...new Set(turnosOperador.map(t => t.operador_nombre).filter(Boolean))];

  // Filtrar turnos
  const turnosFiltrados = turnosOperador.filter(turno => {
    const coincideBusqueda = !busqueda || 
      turno.operador_nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      turno.fecha.includes(busqueda);
    
    const coincideOperador = filtroOperador === 'todos' || turno.operador_nombre === filtroOperador;
    const coincideTurno = filtroTurno === 'todos' || turno.turno === filtroTurno;
    
    return coincideBusqueda && coincideOperador && coincideTurno;
  }).sort((a, b) => {
    // Ordenar por fecha de creación (más recientes primero)
    const fechaA = new Date(a.created_at || 0);
    const fechaB = new Date(b.created_at || 0);
    return fechaB.getTime() - fechaA.getTime();
  });

  const handleEliminarTurno = async (id: string, operadorNombre: string, fecha: string) => {
    try {
      await deleteTurnoOperador(id);
    } catch (error) {
      console.error('Error al eliminar turno:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Cargando turnos...</p>
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
            <CardTitle className="text-sm font-medium">Total Turnos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{turnosFiltrados.length}</div>
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
            <CardTitle className="text-sm font-medium">Turnos Diurnos</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {turnosFiltrados.filter(t => t.turno === 'diurno' || t.turno === 'mañana' || t.turno === 'tarde').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Turnos Nocturnos</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {turnosFiltrados.filter(t => t.turno === 'nocturno' || t.turno === 'noche').length}
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
              <label className="text-sm font-medium">Tipo de Turno</label>
              <Select value={filtroTurno} onValueChange={setFiltroTurno}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar turno" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los turnos</SelectItem>
                  {Object.entries(TIPOS_TURNO).map(([key, tipo]) => (
                    <SelectItem key={key} value={key}>
                      {tipo.label}
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
                  setFiltroTurno('todos');
                  setBusqueda('');
                }}
                className="w-full"
              >
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de turnos */}
      <Card>
        <CardHeader>
          <CardTitle>Turnos Generados ({turnosFiltrados.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {turnosFiltrados.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No se encontraron turnos con los filtros seleccionados</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Header de tabla (visible solo en desktop) */}
              <div className="hidden md:grid md:grid-cols-6 gap-4 pb-2 border-b text-sm font-medium text-muted-foreground">
                <div>Fecha</div>
                <div>Operador</div>
                <div>Turno</div>
                <div>Horario</div>
                <div>Creado</div>
                <div>Acciones</div>
              </div>

              {/* Lista de turnos */}
              {turnosFiltrados.map((turno) => {
                const tipoTurno = TIPOS_TURNO[turno.turno as keyof typeof TIPOS_TURNO] || TIPOS_TURNO.descanso;
                const fechaCreacion = turno.created_at ? format(new Date(turno.created_at), 'dd/MM/yyyy HH:mm', { locale: es }) : 'Sin fecha';
                const fechaTurno = format(new Date(turno.fecha), 'dd/MM/yyyy', { locale: es });
                const horario = turno.horario_inicio && turno.horario_fin ? 
                  `${turno.horario_inicio} - ${turno.horario_fin}` : 
                  'Sin horario';

                return (
                  <div key={turno.id} className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    {/* Mobile layout */}
                    <div className="md:hidden space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{turno.operador_nombre}</p>
                          <p className="text-sm text-muted-foreground">{fechaTurno}</p>
                        </div>
                        <Badge variant="outline" className={tipoTurno.color}>
                          {tipoTurno.label}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p>Horario: {horario}</p>
                        <p>Creado: {fechaCreacion}</p>
                      </div>
                      <div className="flex justify-end">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar turno?</AlertDialogTitle>
                              <AlertDialogDescription>
                                ¿Estás seguro de que deseas eliminar el turno de <strong>{turno.operador_nombre}</strong> para el <strong>{fechaTurno}</strong>?
                                <br />
                                Esta acción no se puede deshacer.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleEliminarTurno(turno.id, turno.operador_nombre || '', fechaTurno)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>

                    {/* Desktop layout */}
                    <div className="hidden md:block">
                      <p className="font-medium">{fechaTurno}</p>
                    </div>
                    <div className="hidden md:block">
                      <p className="font-medium">{turno.operador_nombre}</p>
                    </div>
                    <div className="hidden md:block">
                      <Badge variant="outline" className={tipoTurno.color}>
                        {tipoTurno.label}
                      </Badge>
                    </div>
                    <div className="hidden md:block">
                      <p className="text-sm">{horario}</p>
                    </div>
                    <div className="hidden md:block">
                      <p className="text-sm text-muted-foreground">{fechaCreacion}</p>
                    </div>
                    <div className="hidden md:block">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar turno?</AlertDialogTitle>
                            <AlertDialogDescription>
                              ¿Estás seguro de que deseas eliminar el turno de <strong>{turno.operador_nombre}</strong> para el <strong>{fechaTurno}</strong>?
                              <br />
                              Esta acción no se puede deshacer.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleEliminarTurno(turno.id, turno.operador_nombre || '', fechaTurno)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}