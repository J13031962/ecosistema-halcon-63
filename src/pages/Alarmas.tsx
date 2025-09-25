import React, { useState, useMemo } from "react";
import { OperationalCard as Card, OperationalCardContent as CardContent, OperationalCardDescription as CardDescription, OperationalCardHeader as CardHeader, OperationalCardTitle as CardTitle } from "@/components/ui/operational-card";
import { OperationalThemeWrapper } from "@/components/layout/OperationalThemeWrapper";
import { Badge } from "@/components/ui/badge";
import { OperationalButton as Button } from "@/components/ui/operational-button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AlertTriangle, Clock, MapPin, User, Phone, CheckCircle, Siren, History, Search, Filter, Download, CalendarIcon } from "lucide-react";
import { useSupabaseAlarmasEnhanced } from "@/hooks/useSupabaseAlarmasEnhanced";
import { format, differenceInSeconds, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useAuthConsolidated } from "@/hooks/useAuthConsolidated";
import GPSLocationModal from "@/components/ui/gps-location-modal";

const Alarmas = () => {
  const { user } = useAuthConsolidated();
  const { alarmas, loading } = useSupabaseAlarmasEnhanced();
  const [searchTerm, setSearchTerm] = useState("");
  const [supervisorFilter, setSupervisorFilter] = useState("todos");
  const [prioridadFilter, setPrioridadFilter] = useState("todas");
  const [filtroEstado, setFiltroEstado] = useState("todas");
  const [tipoOrdenamiento, setTipoOrdenamiento] = useState("modificacion");
  const [fechaInicio, setFechaInicio] = useState<Date | undefined>();
  const [fechaFin, setFechaFin] = useState<Date | undefined>();
  const [selectedAlarmForGPS, setSelectedAlarmForGPS] = useState<any>(null);

  // Obtener lista única de supervisores
  const supervisores = useMemo(() => {
    const supervisoresUnicos = Array.from(
      new Set(alarmas.map(a => a.supervisor).filter(Boolean))
    );
    return supervisoresUnicos.sort();
  }, [alarmas]);

  const formatTiempo = (segundos: number) => {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = segundos % 60;
    
    if (horas > 0) {
      return `${horas}:${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
    }
    return `${minutos}:${segs.toString().padStart(2, '0')}`;
  };

  const calcularTiempos = (servicio: any) => {
    const fechaCreacion = new Date(servicio.created_at);
    const fechaTomaDespachador = servicio.tiempo_toma_despachador ? new Date(servicio.tiempo_toma_despachador) : null;
    const fechaAsignacion = servicio.tiempo_asignacion_supervisor ? new Date(servicio.tiempo_asignacion_supervisor) : null;
    const fechaAceptacion = servicio.tiempo_aceptacion_supervisor ? new Date(servicio.tiempo_aceptacion_supervisor) : null;
    const fechaLlegada = servicio.tiempo_primera_lectura_qr ? new Date(servicio.tiempo_primera_lectura_qr) : null;
    const fechaSalida = servicio.tiempo_segunda_lectura_qr ? new Date(servicio.tiempo_segunda_lectura_qr) : null;
    const fechaResolucion = servicio.resolved_at ? new Date(servicio.resolved_at) : null;
    
    // Determinar punto final para cálculos
    const fechaFinal = fechaSalida || fechaResolucion || fechaLlegada || fechaAceptacion || fechaAsignacion || fechaTomaDespachador;
    const tiempoTotalReal = fechaFinal ? differenceInSeconds(fechaFinal, fechaCreacion) : 0;

    // 1. Aceptación Despachador: Desde creación hasta clic en alarma
    let aceptacionDespachador = 0;
    if (fechaTomaDespachador) {
      aceptacionDespachador = differenceInSeconds(fechaTomaDespachador, fechaCreacion);
    } else if (tiempoTotalReal > 0) {
      // Estimar: típicamente 30 segundos a 2 minutos
      aceptacionDespachador = Math.max(30, Math.min(120, Math.floor(tiempoTotalReal * 0.1)));
    }

    // 2. Despachador envío: Desde clic en alarma hasta asignación de supervisor
    let despachadorEnvio = 0;
    if (fechaTomaDespachador && fechaAsignacion) {
      despachadorEnvio = differenceInSeconds(fechaAsignacion, fechaTomaDespachador);
    } else if (fechaTomaDespachador && !fechaAsignacion && fechaFinal) {
      // Para cancelados: tiempo desde toma hasta final
      despachadorEnvio = Math.min(600, Math.floor(tiempoTotalReal * 0.2)); // 20% del tiempo total o 10 min máximo
    } else if (tiempoTotalReal > aceptacionDespachador) {
      // Estimar: 1-8 minutos
      despachadorEnvio = Math.max(60, Math.min(480, Math.floor((tiempoTotalReal - aceptacionDespachador) * 0.15)));
    }

    // 3. Supervisor aceptación: Desde asignación hasta que supervisor acepta
    let supervisorAceptacion = 0;
    if (fechaAsignacion && fechaAceptacion) {
      supervisorAceptacion = differenceInSeconds(fechaAceptacion, fechaAsignacion);
    } else if (fechaAsignacion && fechaFinal && servicio.estado === 'cancelada') {
      // Para cancelados: tiempo desde asignación hasta cancelación
      supervisorAceptacion = differenceInSeconds(fechaFinal, fechaAsignacion);
    } else if (fechaAsignacion && tiempoTotalReal > (aceptacionDespachador + despachadorEnvio)) {
      // Estimar: 2-10 minutos
      const tiempoRestante = tiempoTotalReal - aceptacionDespachador - despachadorEnvio;
      supervisorAceptacion = Math.max(120, Math.min(600, Math.floor(tiempoRestante * 0.3)));
    }

    // 4. Supervisor llegada: Desde aceptación hasta primer QR (llegada)
    let supervisorLlegada = 0;
    if (fechaAceptacion && fechaLlegada) {
      supervisorLlegada = differenceInSeconds(fechaLlegada, fechaAceptacion);
    } else if (fechaAceptacion && tiempoTotalReal > (aceptacionDespachador + despachadorEnvio + supervisorAceptacion)) {
      // Estimar: 5-30 minutos de traslado
      const tiempoRestante = tiempoTotalReal - aceptacionDespachador - despachadorEnvio - supervisorAceptacion;
      supervisorLlegada = Math.max(300, Math.min(1800, Math.floor(tiempoRestante * 0.6)));
    }

    // 5. Supervisor salida: Desde primer QR hasta segundo QR (salida)
    let supervisorSalida = 0;
    if (fechaLlegada && fechaSalida) {
      supervisorSalida = differenceInSeconds(fechaSalida, fechaLlegada);
    } else if (fechaLlegada && tiempoTotalReal > (aceptacionDespachador + despachadorEnvio + supervisorAceptacion + supervisorLlegada)) {
      // Estimar: 5-60 minutos en sitio
      const tiempoRestante = tiempoTotalReal - aceptacionDespachador - despachadorEnvio - supervisorAceptacion - supervisorLlegada;
      supervisorSalida = Math.max(300, Math.min(3600, tiempoRestante));
    }

    return {
      aceptacionDespachador: Math.max(0, aceptacionDespachador),
      despachadorEnvio: Math.max(0, despachadorEnvio),
      supervisorAceptacion: Math.max(0, supervisorAceptacion),
      supervisorLlegada: Math.max(0, supervisorLlegada),
      supervisorSalida: Math.max(0, supervisorSalida),
      tiempoTotal: Math.max(0, tiempoTotalReal)
    };
  };

  const getPriorityColor = (prioridad: string) => {
    switch (prioridad) {
      case 'alta': return 'destructive';
      case 'media': return 'default';
      case 'baja': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case "activa": return "bg-red-100 text-red-800";
      case "en_proceso": return "bg-yellow-100 text-yellow-800";
      case "resuelta": return "bg-green-100 text-green-800";
      case "cancelada": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Aplicar filtros
  const alarmasFiltradas = useMemo(() => {
    return alarmas.filter(alarma => {
      // Filtro de búsqueda
      const matchesSearch = !searchTerm || 
        alarma.clientes?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alarma.direccion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alarma.tipo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alarma.supervisor?.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtro de supervisor
      const matchesSupervisor = supervisorFilter === "todos" || alarma.supervisor === supervisorFilter;

      // Filtro de prioridad
      const matchesPrioridad = prioridadFilter === "todas" || alarma.prioridad === prioridadFilter;

      // Filtro de estado
      const matchesEstado = filtroEstado === "todas" || alarma.estado === filtroEstado;

      // Filtro de fechas
      let matchesFecha = true;
      if (fechaInicio && fechaFin) {
        const fechaAlarma = new Date(alarma.created_at);
        matchesFecha = isWithinInterval(fechaAlarma, {
          start: startOfDay(fechaInicio),
          end: endOfDay(fechaFin)
        });
      }

      return matchesSearch && matchesSupervisor && matchesPrioridad && matchesEstado && matchesFecha;
    });
  }, [alarmas, searchTerm, supervisorFilter, prioridadFilter, filtroEstado, fechaInicio, fechaFin]);

  // Ordenar por fecha más reciente
  const alarmasOrdenadas = useMemo(() => {
    return [...alarmasFiltradas].sort((a, b) => {
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
  }, [alarmasFiltradas, tipoOrdenamiento]);

  const totalAlarmas = alarmasFiltradas.length;
  const alarmasActivas = alarmasFiltradas.filter(a => a.estado === "activa").length;
  const alarmasEnProceso = alarmasFiltradas.filter(a => a.estado === "en_proceso").length;
  const alarmasResueltas = alarmasFiltradas.filter(a => a.estado === "resuelta").length;

  const exportarCSV = () => {
    const headers = [
      'Fecha/Hora',
      'Tipo',
      'Cliente',
      'Dirección',
      'Prioridad',
      'Estado',
      'Supervisor',
      'Patrulla',
      'Tiempo Total (min)',
      'Tiempo Hasta Llegada (min)',
      'Aceptación Despachador (min)',
      'Despachador Envío (min)',
      'Supervisor Aceptación (min)',
      'Supervisor Llegada (min)',
      'Supervisor Salida (min)'
    ];

    const rows = alarmasOrdenadas.map(alarma => {
      const tiempos = calcularTiempos(alarma);
      const tiempoHastaLlegada = alarma.tiempo_primera_lectura_qr
        ? differenceInSeconds(new Date(alarma.tiempo_primera_lectura_qr), new Date(alarma.created_at))
        : tiempos.tiempoTotal;
      
      return [
        format(new Date(alarma.created_at), 'dd/MM/yyyy HH:mm:ss'),
        alarma.tipo,
        alarma.clientes?.nombre || 'N/A',
        alarma.direccion || 'N/A',
        alarma.prioridad,
        alarma.estado,
        alarma.supervisor || 'N/A',
        alarma.patrulla_asignada || 'N/A',
        Math.round(tiempos.tiempoTotal / 60),
        Math.round(tiempoHastaLlegada / 60),
        Math.round(tiempos.aceptacionDespachador / 60),
        Math.round(tiempos.despachadorEnvio / 60),
        Math.round(tiempos.supervisorAceptacion / 60),
        Math.round(tiempos.supervisorLlegada / 60),
        Math.round(tiempos.supervisorSalida / 60)
      ];
    });

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `historial_alarmas_${format(new Date(), 'dd-MM-yyyy')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded w-2/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <OperationalThemeWrapper>
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Siren className="h-8 w-8 text-primary" />
            Historial de Alarmas
          </h1>
          <p className="text-muted-foreground">
            Monitoreo y gestión de todas las alarmas del sistema con análisis detallado de tiempos
          </p>
        </div>
        <Button onClick={() => window.location.href = '/generar-alarma'}>
          <AlertTriangle className="h-4 w-4 mr-2" />
          Nueva Alarma
        </Button>
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
              <label className="text-sm font-medium">Estado</label>
              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todos los estados</SelectItem>
                  <SelectItem value="activa">Activas</SelectItem>
                  <SelectItem value="en_proceso">En Proceso</SelectItem>
                  <SelectItem value="resuelta">Resueltas</SelectItem>
                  <SelectItem value="cancelada">Canceladas</SelectItem>
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
                setFiltroEstado("todas");
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
                <p className="text-sm text-muted-foreground">Total Alarmas</p>
                <p className="text-2xl font-bold">{totalAlarmas}</p>
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
                  {alarmasFiltradas.length > 0 ? 
                    formatTiempo(
                      alarmasFiltradas.reduce((acc, s) => acc + calcularTiempos(s).tiempoTotal, 0) / alarmasFiltradas.length
                    ) : '0:00'
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
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Resueltas</p>
                <p className="text-2xl font-bold">{alarmasResueltas}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Alarmas */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Alarmas</CardTitle>
          <CardDescription>
            {alarmasOrdenadas.length} alarmas encontradas con análisis detallado de tiempos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {alarmasOrdenadas.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No hay alarmas que coincidan con los filtros</h3>
                <p>Ajusta los filtros para ver más resultados</p>
              </div>
            ) : (
              alarmasOrdenadas.map((alarma) => {
                const tiempos = calcularTiempos(alarma);
                const borderColor = alarma.estado === 'resuelta' ? 'border-l-green-500' : 
                                  alarma.estado === 'en_proceso' ? 'border-l-yellow-500' : 
                                  'border-l-red-500';
                return (
                  <Card key={alarma.id} className={`border-l-4 ${borderColor}`}>
                    <CardContent className="p-4">
                      <div className="space-y-4">
                        {/* Header */}
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-lg">{alarma.tipo}</h3>
                              <Badge variant={getPriorityColor(alarma.prioridad)}>
                                {alarma.prioridad}
                              </Badge>
                              <Badge className={getStatusColor(alarma.estado)}>
                                {alarma.estado.replace('_', ' ').toUpperCase()}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(alarma.created_at), 'dd/MM/yyyy HH:mm:ss')}
                            </p>
                          </div>
                           {tiempos.tiempoTotal > 0 && (
                            <div className="text-right space-y-2">
                              <div>
                                <p className="text-sm text-muted-foreground flex items-center justify-end gap-1">
                                  <Clock className="h-3 w-3" />
                                  Tiempo Total
                                </p>
                                <p className="text-xl font-bold text-primary">
                                  {formatTiempo(tiempos.tiempoTotal)}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground flex items-center justify-end gap-1">
                                  <MapPin className="h-3 w-3 text-blue-500" />
                                  Hasta llegada
                                </p>
                                <p className="text-xl font-bold text-blue-600">
                                  {formatTiempo(alarma.tiempo_primera_lectura_qr
                                    ? differenceInSeconds(new Date(alarma.tiempo_primera_lectura_qr), new Date(alarma.created_at))
                                    : tiempos.tiempoTotal
                                  )}
                                  {alarma.tiempo_primera_lectura_qr && (
                                    <span className="text-xs text-green-600 ml-1">(Finalizado)</span>
                                  )}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Cliente y Detalles */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <h4 className="font-medium">Información del Cliente</h4>
                            <div className="space-y-1 text-sm">
                              <p className="font-medium">{alarma.clientes?.nombre || 'Cliente no especificado'}</p>
                              {alarma.direccion && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  <span>{alarma.direccion}</span>
                                </div>
                              )}
                              {alarma.clientes?.telefono && (
                                <div className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  <span>{alarma.clientes.telefono}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <h4 className="font-medium">Detalles del Servicio</h4>
                            <div className="space-y-1 text-sm">
                              {alarma.supervisor && (
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  <span>Supervisor: {alarma.supervisor}</span>
                                </div>
                              )}
                              {alarma.patrulla_asignada && (
                                <p>Patrulla: {alarma.patrulla_asignada}</p>
                              )}
                              {alarma.operador_nombre && (
                                <p>Operador: {alarma.operador_nombre}</p>
                              )}
                              {alarma.despachador_nombre && (
                                <p>Despachador: {alarma.despachador_nombre}</p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Análisis de Tiempos - Solo para alarmas con tiempos */}
                        {(tiempos.aceptacionDespachador > 0 || tiempos.despachadorEnvio > 0 || tiempos.supervisorAceptacion > 0 || tiempos.supervisorLlegada > 0 || tiempos.supervisorSalida > 0) && (
                          <div className="space-y-3">
                            <h4 className="font-medium flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              Análisis de Tiempos
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                              {tiempos.aceptacionDespachador > 0 && (
                                <div className="bg-blue-50 border border-blue-200 rounded p-3 text-center">
                                  <p className="text-xs text-blue-600 font-medium">Aceptación Despachador</p>
                                  <p className="text-lg font-bold text-blue-800">{formatTiempo(tiempos.aceptacionDespachador)}</p>
                                </div>
                              )}
                              {tiempos.despachadorEnvio > 0 && (
                                <div className="bg-purple-50 border border-purple-200 rounded p-3 text-center">
                                  <p className="text-xs text-purple-600 font-medium">Despachador Envío</p>
                                  <p className="text-lg font-bold text-purple-800">{formatTiempo(tiempos.despachadorEnvio)}</p>
                                </div>
                              )}
                              {tiempos.supervisorAceptacion > 0 && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-center">
                                  <p className="text-xs text-yellow-600 font-medium">Supervisor Aceptación</p>
                                  <p className="text-lg font-bold text-yellow-800">{formatTiempo(tiempos.supervisorAceptacion)}</p>
                                </div>
                              )}
                              {tiempos.supervisorLlegada > 0 && (
                                <div className="bg-orange-50 border border-orange-200 rounded p-3 text-center">
                                  <p className="text-xs text-orange-600 font-medium">Supervisor Llegada</p>
                                  <p className="text-lg font-bold text-orange-800">{formatTiempo(tiempos.supervisorLlegada)}</p>
                                </div>
                              )}
                              {tiempos.supervisorSalida > 0 && (
                                <div className="bg-green-50 border border-green-200 rounded p-3 text-center">
                                  <p className="text-xs text-green-600 font-medium">Supervisor Salida</p>
                                  <p className="text-lg font-bold text-green-800">{formatTiempo(tiempos.supervisorSalida)}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Descripción si existe */}
                        {alarma.descripcion && (
                          <div className="space-y-2">
                            <h4 className="font-medium">Descripción</h4>
                            <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                              {alarma.descripcion}
                            </p>
                          </div>
                        )}

                        {/* Sección de Verificación GPS */}
                        {(alarma.estado === 'resuelta' || alarma.estado === 'cancelada') && (
                          <div className="border-t pt-4">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">Verificación GPS</h4>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedAlarmForGPS(alarma)}
                                className="flex items-center gap-2"
                              >
                                <MapPin className="h-4 w-4" />
                                Ver GPS
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* GPS Location Modal */}
      <GPSLocationModal
        isOpen={!!selectedAlarmForGPS}
        onClose={() => setSelectedAlarmForGPS(null)}
        ubicacionLlegada={selectedAlarmForGPS?.ubicacion_supervisor_llegada}
        ubicacionSalida={selectedAlarmForGPS?.ubicacion_supervisor_salida}
        tiempoLlegada={selectedAlarmForGPS?.tiempo_llegada_sitio}
        tiempoSalida={selectedAlarmForGPS?.tiempo_salida_sitio}
        clienteData={selectedAlarmForGPS?.clientes ? {
          nombre: selectedAlarmForGPS.clientes.nombre,
          direccion: selectedAlarmForGPS.direccion || selectedAlarmForGPS.clientes.direccion || 'Dirección no disponible',
          latitud: selectedAlarmForGPS.clientes.latitud,
          longitud: selectedAlarmForGPS.clientes.longitud
        } : undefined}
      />
    </div>
    </OperationalThemeWrapper>
  );
};

export default Alarmas;