import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Search, Filter, Users, Clock, Download, Trash2 } from 'lucide-react';
import { useSupabaseTurnos } from '@/hooks/useSupabaseTurnos';
import { useSupabaseUsuarios } from '@/hooks/useSupabaseUsuarios';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

interface HistorialTurnosProps {
  onClose?: () => void;
}

export const HistorialTurnos: React.FC<HistorialTurnosProps> = ({ onClose }) => {
  const { turnosOperador, turnosSupervisor, loading } = useSupabaseTurnos();
  const { users } = useSupabaseUsuarios();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOperador, setSelectedOperador] = useState<string>('');
  const [selectedTipoTurno, setSelectedTipoTurno] = useState<string>('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [tipoPersonal, setTipoPersonal] = useState<'todos' | 'operador' | 'supervisor'>('todos');

  // Combinar todos los turnos
  const todosTurnos = [
    ...turnosOperador.map(turno => ({
      ...turno,
      tipo_personal: 'operador' as const,
      nombre: turno.operador_nombre,
      persona_id: turno.operador_id
    })),
    ...turnosSupervisor.map(turno => ({
      ...turno,
      tipo_personal: 'supervisor' as const,
      nombre: turno.supervisor_nombre,
      persona_id: turno.supervisor_id
    }))
  ];

  // Filtrar turnos
  const turnosFiltrados = todosTurnos.filter(turno => {
    // Filtro por texto de búsqueda
    const matchesSearch = !searchTerm || 
      turno.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      turno.fecha.toLowerCase().includes(searchTerm.toLowerCase());

    // Filtro por operador específico
    const matchesOperador = !selectedOperador || turno.persona_id === selectedOperador;

    // Filtro por tipo de turno
    const matchesTipoTurno = !selectedTipoTurno || turno.turno === selectedTipoTurno;

    // Filtro por tipo de personal
    const matchesTipoPersonal = tipoPersonal === 'todos' || turno.tipo_personal === tipoPersonal;

    // Filtro por rango de fechas
    let matchesFechas = true;
    if (fechaInicio && fechaFin) {
      const fechaTurno = parseISO(turno.fecha);
      const inicio = startOfDay(parseISO(fechaInicio));
      const fin = endOfDay(parseISO(fechaFin));
      matchesFechas = isWithinInterval(fechaTurno, { start: inicio, end: fin });
    }

    return matchesSearch && matchesOperador && matchesTipoTurno && matchesTipoPersonal && matchesFechas;
  });

  // Estadísticas
  const stats = {
    total: turnosFiltrados.length,
    operadores: turnosFiltrados.filter(t => t.tipo_personal === 'operador').length,
    supervisores: turnosFiltrados.filter(t => t.tipo_personal === 'supervisor').length,
    porTipo: turnosFiltrados.reduce((acc, turno) => {
      acc[turno.turno] = (acc[turno.turno] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  };

  const getTurnoColor = (turno: string) => {
    switch (turno) {
      case 'mañana': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'tarde': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'noche': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'completo': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const limpiarFiltros = () => {
    setSearchTerm('');
    setSelectedOperador('');
    setSelectedTipoTurno('');
    setFechaInicio('');
    setFechaFin('');
    setTipoPersonal('todos');
  };

  const exportarCSV = () => {
    const headers = ['Fecha', 'Nombre', 'Tipo Personal', 'Turno', 'Horario Inicio', 'Horario Fin'];
    const csvContent = [
      headers.join(','),
      ...turnosFiltrados.map(turno => [
        turno.fecha,
        turno.nombre || '',
        turno.tipo_personal,
        turno.turno,
        turno.horario_inicio || '',
        turno.horario_fin || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historial_turnos_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Historial de Turnos</h2>
          <p className="text-muted-foreground">
            Consulta y busca todos los turnos generados anteriormente
          </p>
        </div>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        )}
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium">Total Turnos</span>
            </div>
            <div className="text-2xl font-bold mt-1">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium">Operadores</span>
            </div>
            <div className="text-2xl font-bold mt-1">{stats.operadores}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium">Supervisores</span>
            </div>
            <div className="text-2xl font-bold mt-1">{stats.supervisores}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium">Más Común</span>
            </div>
            <div className="text-2xl font-bold mt-1">
              {Object.entries(stats.porTipo).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros de Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar por nombre o fecha</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Personal</label>
              <Select value={tipoPersonal} onValueChange={(value: any) => setTipoPersonal(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="operador">Operadores</SelectItem>
                  <SelectItem value="supervisor">Supervisores</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Persona específica</label>
              <Select value={selectedOperador} onValueChange={setSelectedOperador}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar persona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas las personas</SelectItem>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name} ({user.user_roles?.[0]?.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Turno</label>
              <Select value={selectedTipoTurno} onValueChange={setSelectedTipoTurno}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los turnos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos los turnos</SelectItem>
                  <SelectItem value="mañana">Mañana</SelectItem>
                  <SelectItem value="tarde">Tarde</SelectItem>
                  <SelectItem value="noche">Noche</SelectItem>
                  <SelectItem value="completo">Día Completo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha Inicio</label>
              <Input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha Fin</label>
              <Input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={limpiarFiltros}>
              <Trash2 className="w-4 h-4 mr-2" />
              Limpiar Filtros
            </Button>
            <Button variant="outline" onClick={exportarCSV}>
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Turnos */}
      <Card>
        <CardHeader>
          <CardTitle>
            Turnos Encontrados ({turnosFiltrados.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p>Cargando turnos...</p>
            </div>
          ) : turnosFiltrados.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No se encontraron turnos con los filtros aplicados</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {turnosFiltrados
                .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                .map((turno, index) => (
                  <div key={`${turno.tipo_personal}-${turno.id}-${index}`} 
                       className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium">{turno.nombre}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(parseISO(turno.fecha), 'EEEE, dd MMMM yyyy', { locale: es })}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {turno.tipo_personal}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <Badge className={getTurnoColor(turno.turno)}>
                          {turno.turno}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {turno.horario_inicio} - {turno.horario_fin}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HistorialTurnos;