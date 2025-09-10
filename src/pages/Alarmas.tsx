import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Clock, MapPin, User, Phone, CheckCircle, Siren } from "lucide-react";
import { useSupabaseAlarmas } from "@/hooks/useSupabaseAlarmas";
import { format } from "date-fns";
import { useAuthConsolidated } from "@/hooks/useAuthConsolidated";

const Alarmas = () => {
  const { user } = useAuthConsolidated();
  const { alarmas, loading } = useSupabaseAlarmas();
  const [filtroEstado, setFiltroEstado] = useState("todas");
  const [filtroPrioridad, setFiltroPrioridad] = useState("todas");
  const [busqueda, setBusqueda] = useState("");

  const getPriorityColor = (prioridad: string) => {
    switch (prioridad) {
      case "crítica": return "bg-red-100 text-red-800 border-red-200";
      case "alta": return "bg-orange-100 text-orange-800 border-orange-200";
      case "media": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "baja": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
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

  const alarmasFiltradas = alarmas.filter(alarma => {
    const matchesEstado = filtroEstado === "todas" || alarma.estado === filtroEstado;
    const matchesPrioridad = filtroPrioridad === "todas" || alarma.prioridad === filtroPrioridad;
    const matchesBusqueda = (alarma.clientes?.nombre || '').toLowerCase().includes(busqueda.toLowerCase()) ||
                           (alarma.direccion || '').toLowerCase().includes(busqueda.toLowerCase());
    return matchesEstado && matchesPrioridad && matchesBusqueda;
  });

  const totalAlarmas = alarmas.length;
  const alarmasActivas = alarmas.filter(a => a.estado === "activa").length;
  const alarmasEnProceso = alarmas.filter(a => a.estado === "en_proceso").length;
  const alarmasResueltas = alarmas.filter(a => a.estado === "resuelta").length;

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Siren className="h-8 w-8 text-primary" />
            Historial de Alarmas
          </h2>
          <p className="text-muted-foreground">
            Monitoreo y gestión de todas las alarmas del sistema
          </p>
        </div>
        <Button onClick={() => window.location.href = '/generar-alarma'}>
          <AlertTriangle className="h-4 w-4 mr-2" />
          Nueva Alarma
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alarmas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAlarmas}</div>
            <p className="text-xs text-muted-foreground">Últimas 24 horas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activas</CardTitle>
            <Clock className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{alarmasActivas}</div>
            <p className="text-xs text-muted-foreground">Requieren atención</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Proceso</CardTitle>
            <User className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{alarmasEnProceso}</div>
            <p className="text-xs text-muted-foreground">Siendo atendidas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resueltas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{alarmasResueltas}</div>
            <p className="text-xs text-muted-foreground">Completadas hoy</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por cliente o dirección..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <div className="w-full md:w-48">
              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
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
            <div className="w-full md:w-48">
              <Select value={filtroPrioridad} onValueChange={setFiltroPrioridad}>
                <SelectTrigger>
                  <SelectValue placeholder="Prioridad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas las prioridades</SelectItem>
                  <SelectItem value="crítica">Crítica</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                  <SelectItem value="baja">Baja</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de alarmas */}
      <Card>
        <CardHeader>
          <CardTitle>Alarmas Activas</CardTitle>
          <CardDescription>
            Lista completa de todas las alarmas del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Dirección</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Operador</TableHead>
                <TableHead>Patrulla</TableHead>
                <TableHead>Fecha/Hora</TableHead>
                <TableHead>Tiempo Resp.</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alarmasFiltradas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8">
                    <div className="text-muted-foreground">
                      <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                      <p>No se encontraron alarmas</p>
                      <p className="text-sm">Ajusta los filtros o genera nuevas alarmas</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                alarmasFiltradas.map((alarma) => (
                  <TableRow key={alarma.id}>
                    <TableCell className="font-medium">
                      {alarma.clientes?.nombre || 'Cliente no especificado'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <MapPin className="h-3 w-3 mr-1 text-muted-foreground" />
                        {alarma.direccion || 'Sin dirección'}
                      </div>
                    </TableCell>
                    <TableCell>{alarma.tipo}</TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(alarma.prioridad)}>
                        {alarma.prioridad}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(alarma.estado)}>
                        {alarma.estado.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <User className="h-3 w-3 mr-1 text-muted-foreground" />
                        {alarma.operador_id || 'Sin asignar'}
                      </div>
                    </TableCell>
                    <TableCell>{alarma.patrulla_asignada || 'Sin asignar'}</TableCell>
                    <TableCell>
                      {format(new Date(alarma.created_at), 'dd/MM/yyyy HH:mm')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {alarma.tiempo_respuesta_segundos 
                          ? `${Math.floor(alarma.tiempo_respuesta_segundos / 60)}m ${alarma.tiempo_respuesta_segundos % 60}s`
                          : 'Pendiente'
                        }
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" title="Contactar cliente">
                          <Phone className="h-3 w-3" />
                        </Button>
                        <Button variant="outline" size="sm" title="Ver ubicación">
                          <MapPin className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Alarmas;