import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useSupabaseAlarmasEnhanced } from "@/hooks/useSupabaseAlarmasEnhanced";
import { History, Search, Filter, Download, CalendarIcon, Clock, User, MapPin, Phone } from "lucide-react";
import { format, differenceInSeconds, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { calcularTiemposServicio, formatearTiempoAlarma } from "@/utils/tiemposAlarmas";
import LocationDisplay from "@/components/ui/location-display";

const HistorialServicios = () => {
  const { alarmas } = useSupabaseAlarmasEnhanced();
  const [searchTerm, setSearchTerm] = useState("");
  const [supervisorFilter, setSupervisorFilter] = useState("todos");
  const [prioridadFilter, setPrioridadFilter] = useState("todas");
  const [tipoOrdenamiento, setTipoOrdenamiento] = useState("modificacion");
  const [fechaInicio, setFechaInicio] = useState<Date | undefined>();
  const [fechaFin, setFechaFin] = useState<Date | undefined>();

  // Filtrar servicios completados y cancelados
  const serviciosCompletados = alarmas.filter(a => 
    (a.estado === 'resuelta' || a.estado === 'cancelada') && a.supervisor && a.patrulla_asignada
  );

  // Obtener lista única de supervisores
  const supervisores = useMemo(() => {
    const supervisoresUnicos = Array.from(
      new Set(serviciosCompletados.map(a => a.supervisor).filter(Boolean))
    );
    return supervisoresUnicos.sort();
  }, [serviciosCompletados]);

  // Aplicar filtros
  const serviciosFiltrados = useMemo(() => {
    return serviciosCompletados.filter(servicio => {
      // Filtro de búsqueda
      const matchesSearch = !searchTerm || 
        servicio.clientes?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        servicio.direccion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        servicio.tipo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        servicio.supervisor?.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtro de supervisor
      const matchesSupervisor = supervisorFilter === "todos" || servicio.supervisor === supervisorFilter;

      // Filtro de prioridad
      const matchesPrioridad = prioridadFilter === "todas" || servicio.prioridad === prioridadFilter;

      // Filtro de fechas
      let matchesFecha = true;
      if (fechaInicio && fechaFin) {
        const fechaServicio = new Date(servicio.created_at);
        matchesFecha = isWithinInterval(fechaServicio, {
          start: startOfDay(fechaInicio),
          end: endOfDay(fechaFin)
        });
      }

      return matchesSearch && matchesSupervisor && matchesPrioridad && matchesFecha;
    });
  }, [serviciosCompletados, searchTerm, supervisorFilter, prioridadFilter, fechaInicio, fechaFin]);

  // Ordenar por fecha más reciente
  const serviciosOrdenados = useMemo(() => {
    return [...serviciosFiltrados].sort((a, b) => {
      if (tipoOrdenamiento === "modificacion") {
        // Usar resolved_at si existe, sino created_at
        const fechaA = a.resolved_at ? new Date(a.resolved_at) : new Date(a.created_at);
        const fechaB = b.resolved_at ? new Date(b.resolved_at) : new Date(b.created_at);
        return fechaB.getTime() - fechaA.getTime();
      } else {
        // Ordenar por fecha de creación
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
  }, [serviciosFiltrados, tipoOrdenamiento]);

  // Función para mostrar tiempo o dash si no existe
  const mostrarTiempo = (tiempo: number | null): string => {
    return tiempo !== null ? formatearTiempoAlarma(tiempo) : '—';
  };

  const getPriorityColor = (prioridad: string) => {
    switch (prioridad) {
      case 'alta': return 'destructive';
      case 'media': return 'default';
      case 'baja': return 'secondary';
      default: return 'outline';
    }
  };

  const exportarCSV = () => {
    const headers = [
      'Fecha/Hora',
      'Tipo',
      'Cliente',
      'Dirección',
      'Prioridad',
      'Supervisor',
      'Patrulla',
      'Aceptación Despachador (min)',
      'Despachador Envío (min)',
      'Supervisor Aceptación (min)',
      'Supervisor Llegada (min)',
      'Supervisor Salida (min)',
      'Tiempo Total (min)'
    ];

    const rows = serviciosOrdenados.map(servicio => {
      const tiempos = calcularTiemposServicio(servicio);
      return [
        format(new Date(servicio.created_at), 'dd/MM/yyyy HH:mm:ss'),
        servicio.tipo,
        servicio.clientes?.nombre || 'N/A',
        servicio.direccion || 'N/A',
        servicio.prioridad,
        servicio.supervisor || 'N/A',
        servicio.patrulla_asignada || 'N/A',
        tiempos.aceptacionDespachador !== null ? Math.round(tiempos.aceptacionDespachador / 60) : 0,
        tiempos.despachadorEnvio !== null ? Math.round(tiempos.despachadorEnvio / 60) : 0,
        tiempos.supervisorAceptacion !== null ? Math.round(tiempos.supervisorAceptacion / 60) : 0,
        tiempos.supervisorLlegada !== null ? Math.round(tiempos.supervisorLlegada / 60) : 0,
        tiempos.supervisorSalida !== null ? Math.round(tiempos.supervisorSalida / 60) : 0,
        tiempos.tiempoTotal > 0 ? Math.round(tiempos.tiempoTotal / 60) : 0
      ];
    });

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `historial_servicios_${format(new Date(), 'dd-MM-yyyy')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Historial de Servicios</h1>
        <p className="text-muted-foreground">Servicios completados con información detallada de tiempos</p>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cliente, dirección, tipo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Supervisor</label>
              <Select value={supervisorFilter} onValueChange={setSupervisorFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los supervisores</SelectItem>
                  {supervisores.map(supervisor => (
                    <SelectItem key={supervisor} value={supervisor}>
                      {supervisor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Prioridad</label>
              <Select value={prioridadFilter} onValueChange={setPrioridadFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas las prioridades</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                  <SelectItem value="baja">Baja</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Ordenar por</label>
              <Select value={tipoOrdenamiento} onValueChange={setTipoOrdenamiento}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="modificacion">Última modificación</SelectItem>
                  <SelectItem value="creacion">Fecha de creación</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha Inicio</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[180px] justify-start text-left font-normal",
                      !fechaInicio && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fechaInicio ? format(fechaInicio, "dd/MM/yyyy") : "Seleccionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={fechaInicio}
                    onSelect={setFechaInicio}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha Fin</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[180px] justify-start text-left font-normal",
                      !fechaFin && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fechaFin ? format(fechaFin, "dd/MM/yyyy") : "Seleccionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={fechaFin}
                    onSelect={setFechaFin}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Button 
              onClick={() => {
                setFechaInicio(undefined);
                setFechaFin(undefined);
                setSearchTerm("");
                setSupervisorFilter("todos");
                setPrioridadFilter("todas");
                setTipoOrdenamiento("modificacion");
              }}
              variant="outline"
              className="h-10"
            >
              Limpiar Filtros
            </Button>

            <Button onClick={exportarCSV} variant="default" className="h-10">
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          </div>

        </CardContent>
      </Card>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Servicios</p>
                <p className="text-2xl font-bold">{serviciosFiltrados.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Tiempo Promedio</p>
                <p className="text-2xl font-bold">
                  {serviciosFiltrados.length > 0 ? 
                    formatearTiempoAlarma(
                      Math.round(serviciosFiltrados.reduce((acc, s) => acc + calcularTiemposServicio(s).tiempoTotal, 0) / serviciosFiltrados.length)
                    ) : '—'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Supervisores Activos</p>
                <p className="text-2xl font-bold">{supervisores.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Tiempo Salida Promedio</p>
                 <p className="text-2xl font-bold">
                   {serviciosFiltrados.length > 0 ? 
                     formatearTiempoAlarma(
                       Math.round(serviciosFiltrados.reduce((acc, s) => {
                         const tiempos = calcularTiemposServicio(s);
                         return acc + (tiempos.supervisorSalida || 0);
                       }, 0) / serviciosFiltrados.length)
                     ) : '—'
                   }
                 </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Servicios */}
      <Card>
        <CardHeader>
          <CardTitle>Servicios Completados y Cancelados</CardTitle>
          <CardDescription>
            {serviciosOrdenados.length} servicios encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {serviciosOrdenados.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No hay servicios que coincidan con los filtros</h3>
                <p>Ajusta los filtros para ver más resultados</p>
              </div>
            ) : (
              serviciosOrdenados.map((servicio) => {
                const tiempos = calcularTiemposServicio(servicio);
                return (
                  <Card key={servicio.id} className={`border-l-4 ${servicio.estado === 'cancelada' ? 'border-l-red-500' : 'border-l-green-500'}`}>
                    <CardContent className="p-4">
                      <div className="space-y-4">
                        {/* Header */}
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-lg">{servicio.tipo}</h3>
                              <Badge variant={getPriorityColor(servicio.prioridad)}>
                                {servicio.prioridad}
                              </Badge>
                              <Badge 
                                variant="outline" 
                                className={servicio.estado === 'cancelada' 
                                  ? "text-red-600 border-red-200" 
                                  : "text-green-600 border-green-200"
                                }
                              >
                                {servicio.estado === 'cancelada' ? 'Cancelado' : 'Completado'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(servicio.created_at), 'dd/MM/yyyy HH:mm:ss')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground mb-1">Tiempo Total</p>
                            <p className="font-mono font-bold text-lg text-primary">
                              {tiempos.tiempoTotal > 0 ? formatearTiempoAlarma(tiempos.tiempoTotal) : '—'}
                            </p>
                          </div>
                        </div>

                        {/* Cliente y Detalles */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <h4 className="font-medium">Información del Cliente</h4>
                            <div className="space-y-1 text-sm">
                              <p className="font-medium">{servicio.clientes?.nombre || 'Cliente no especificado'}</p>
                              {servicio.direccion && (
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <MapPin className="h-3 w-3" />
                                  <span>{servicio.direccion}</span>
                                  {servicio.municipio && <span>• {servicio.municipio}</span>}
                                </div>
                              )}
                              {servicio.clientes?.telefono && (
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Phone className="h-3 w-3" />
                                  <span>{servicio.clientes.telefono}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <h4 className="font-medium">Asignación</h4>
                            <div className="space-y-1 text-sm">
                              <p><strong>Supervisor:</strong> {servicio.supervisor}</p>
                              <p><strong>Patrulla:</strong> {servicio.patrulla_asignada}</p>
                            </div>
                          </div>
                        </div>

                         {/* Tiempos Detallados - Los mismos 5 cronómetros que en Servicios Activos */}
                         <div className="bg-muted/50 rounded-lg p-4">
                           <h4 className="font-medium mb-3">Análisis de Tiempos</h4>
                           <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                             <div>
                               <p className="text-xs text-muted-foreground mb-1">Aceptación Despachador</p>
                               <p className="font-mono font-bold text-sm">{mostrarTiempo(tiempos.aceptacionDespachador)}</p>
                             </div>
                             <div>
                               <p className="text-xs text-muted-foreground mb-1">Despachador Envío</p>
                               <p className="font-mono font-bold text-sm">{mostrarTiempo(tiempos.despachadorEnvio)}</p>
                             </div>
                             <div>
                               <p className="text-xs text-muted-foreground mb-1">Supervisor Aceptación</p>
                               <p className="font-mono font-bold text-sm">{mostrarTiempo(tiempos.supervisorAceptacion)}</p>
                             </div>
                             <div>
                               <p className="text-xs text-muted-foreground mb-1">Supervisor Llegada</p>
                               <p className="font-mono font-bold text-sm">{mostrarTiempo(tiempos.supervisorLlegada)}</p>
                             </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Supervisor Salida</p>
                                <p className="font-mono font-bold text-sm">{mostrarTiempo(tiempos.supervisorSalida)}</p>
                              </div>
                            </div>
                          </div>

                          {/* Sección de Verificación GPS */}
                          <div className="border-t pt-4">
                            <LocationDisplay
                              ubicacionLlegada={servicio.ubicacion_supervisor_llegada}
                              ubicacionSalida={servicio.ubicacion_supervisor_salida}
                              tiempoLlegada={servicio.tiempo_llegada_sitio}
                              tiempoSalida={servicio.tiempo_salida_sitio}
                            />
                          </div>
                       </div>
                     </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HistorialServicios;