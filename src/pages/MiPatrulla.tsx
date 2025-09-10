import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Car, MapPin, Clock, Battery, Fuel, Navigation, AlertTriangle, Camera, Phone, Flame, Eye, UserCheck, Shield } from "lucide-react";
import { useSupabaseAlarmas } from "@/hooks/useSupabaseAlarmas";
import { useAuthConsolidated } from "@/hooks/useAuthConsolidated";
import { format } from "date-fns";

const MiPatrulla = () => {
  const { user } = useAuthConsolidated();
  const { alarmas, loading } = useSupabaseAlarmas();
  
  const [patrullaInfo] = useState({
    unit: "Patrulla 05",
    officer: user?.full_name || "Supervisor Motorizado",
    vehicleModel: "Chevrolet Aveo 2020",
    licensePlate: "ABC-123",
    status: "En Servicio",
    currentLocation: "Sector Norte - Av. Principal Km 15",
    battery: 78,
    fuel: 85,
    speed: 35,
    odometer: 145832,
    lastMaintenance: "2024-01-15",
    nextMaintenance: "2024-02-15"
  });

  // Historial completo de alarmas atendidas por el supervisor desde el inicio
  const historialCompleto = alarmas.filter(
    alarma => 
      // Supervisor específico por ID o nombre
      alarma.supervisor_id === user?.id || 
      (alarma.supervisor && alarma.supervisor === user?.full_name) ||
      // Si el supervisor está en el campo patrulla_asignada (formato legacy)
      (alarma.patrulla_asignada && alarma.patrulla_asignada.includes(user?.full_name || ''))
  ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); // Más recientes primero

  const getAlarmTypeIcon = (tipo: string) => {
    switch (tipo) {
      case "Fuego": return <Flame className="h-4 w-4" />;
      case "Pánico": return <Shield className="h-4 w-4" />;
      case "Revisión": return <Eye className="h-4 w-4" />;
      case "Acompañamiento": return <UserCheck className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "En Servicio": return "default";
      case "Disponible": return "secondary";
      case "Fuera de Servicio": return "outline";
      case "Emergencia": return "destructive";
      default: return "outline";
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "asignada": return "default";
      case "en_proceso": return "secondary";
      case "resuelta": return "outline";
      case "activa": return "destructive";
      default: return "outline";
    }
  };

  const getEstadoDisplay = (estado: string) => {
    switch (estado) {
      case 'asignada': return 'Asignada';
      case 'en_proceso': return 'En Proceso';
      case 'resuelta': return 'Finalizada';
      case 'activa': return 'Pendiente';
      default: return estado;
    }
  };

  const getPriorityColor = (prioridad: string) => {
    switch (prioridad) {
      case "alta": return "destructive";
      case "media": return "default";
      case "baja": return "secondary";
      default: return "outline";
    }
  };

  const getBatteryColor = (battery: number) => {
    if (battery > 70) return "text-green-600";
    if (battery > 30) return "text-yellow-600";
    return "text-red-600";
  };

  const getFuelColor = (fuel: number) => {
    if (fuel > 50) return "text-green-600";
    if (fuel > 25) return "text-yellow-600";
    return "text-red-600";
  };

  const calcularTiempoRespuesta = (createdAt: string, resolvedAt?: string) => {
    const inicio = new Date(createdAt);
    const fin = resolvedAt ? new Date(resolvedAt) : new Date();
    const diferencia = Math.floor((fin.getTime() - inicio.getTime()) / 60000); // en minutos
    
    if (diferencia < 60) {
      return `${diferencia}min`;
    } else {
      const horas = Math.floor(diferencia / 60);
      const minutos = diferencia % 60;
      return `${horas}h ${minutos}min`;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded w-2/3"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="h-96 bg-muted rounded"></div>
            <div className="lg:col-span-2 space-y-6">
              <div className="h-32 bg-muted rounded"></div>
              <div className="h-64 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Mi Patrulla</h1>
        <p className="text-muted-foreground">Estado y control de mi unidad asignada - Historial completo de servicios</p>
      </div>

      {/* Estadísticas del Supervisor */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Atendidas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{historialCompleto.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Finalizadas</CardTitle>
            <Shield className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {historialCompleto.filter(a => a.estado === 'resuelta').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Proceso</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {historialCompleto.filter(a => ['asignada', 'en_proceso'].includes(a.estado)).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alta Prioridad</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {historialCompleto.filter(a => a.prioridad === 'alta').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información de la Patrulla */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Car className="h-5 w-5" />
                <span>{patrullaInfo.unit}</span>
              </CardTitle>
              <CardDescription>
                <Badge variant={getStatusColor(patrullaInfo.status)}>
                  {patrullaInfo.status}
                </Badge>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Información del oficial */}
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Oficial Asignado</h4>
                <p className="font-semibold">{patrullaInfo.officer}</p>
              </div>

              {/* Información del vehículo */}
              <div className="space-y-2">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Vehículo</h4>
                  <p className="font-medium">{patrullaInfo.vehicleModel}</p>
                  <p className="text-sm text-muted-foreground">Placa: {patrullaInfo.licensePlate}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Odómetro</h4>
                  <p className="font-medium">{patrullaInfo.odometer.toLocaleString()} km</p>
                </div>
              </div>

              {/* Estado técnico */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <Battery className="h-4 w-4" />
                    <span className="text-sm font-medium">Batería</span>
                  </div>
                  <p className={`font-bold ${getBatteryColor(patrullaInfo.battery)}`}>
                    {patrullaInfo.battery}%
                  </p>
                </div>
                
                <div>
                  <div className="flex items-center space-x-2">
                    <Fuel className="h-4 w-4" />
                    <span className="text-sm font-medium">Combustible</span>
                  </div>
                  <p className={`font-bold ${getFuelColor(patrullaInfo.fuel)}`}>
                    {patrullaInfo.fuel}%
                  </p>
                </div>
              </div>

              {/* Velocidad actual */}
              <div>
                <div className="flex items-center space-x-2">
                  <Navigation className="h-4 w-4" />
                  <span className="text-sm font-medium">Velocidad Actual</span>
                </div>
                <p className="font-bold text-lg">{patrullaInfo.speed} km/h</p>
              </div>

              {/* Mantenimiento */}
              <div className="pt-2 border-t">
                <h4 className="font-medium text-sm text-muted-foreground mb-2">Mantenimiento</h4>
                <div className="text-sm space-y-1">
                  <p>Último: {patrullaInfo.lastMaintenance}</p>
                  <p>Próximo: {patrullaInfo.nextMaintenance}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Historial de Servicios */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ubicación Actual */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Ubicación Actual</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{patrullaInfo.currentLocation}</p>
                  <p className="text-sm text-muted-foreground">
                    Última actualización: hace 2 minutos
                  </p>
                </div>
                <Button variant="outline">
                  <Navigation className="h-4 w-4 mr-2" />
                  Ver en Mapa
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Controles Rápidos */}
          <Card>
            <CardHeader>
              <CardTitle>Controles Rápidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-16 flex-col">
                  <AlertTriangle className="h-6 w-6 mb-1" />
                  <span className="text-xs">Emergencia</span>
                </Button>
                
                <Button variant="outline" className="h-16 flex-col">
                  <Clock className="h-6 w-6 mb-1" />
                  <span className="text-xs">Punto Control</span>
                </Button>
                
                <Button variant="outline" className="h-16 flex-col">
                  <Camera className="h-6 w-6 mb-1" />
                  <span className="text-xs">Foto/Video</span>
                </Button>
                
                <Button variant="outline" className="h-16 flex-col">
                  <MapPin className="h-6 w-6 mb-1" />
                  <span className="text-xs">Marcar Ubicación</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Historial Completo de Servicios */}
          <Card>
            <CardHeader>
              <CardTitle>Historial Completo de Servicios</CardTitle>
              <CardDescription>Todas las alarmas atendidas desde el inicio de la cuenta</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {historialCompleto.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No hay servicios registrados</h3>
                    <p>Los servicios asignados aparecerán aquí</p>
                  </div>
                ) : (
                  historialCompleto.map((alarma, index) => (
                    <div key={alarma.id} className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex flex-col items-center min-w-[60px]">
                        <div className="flex items-center justify-center p-2 rounded-full bg-muted mb-1">
                          {getAlarmTypeIcon(alarma.tipo)}
                        </div>
                        <Badge variant={getEstadoColor(alarma.estado)} className="text-xs">
                          {getEstadoDisplay(alarma.estado)}
                        </Badge>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <h5 className="font-semibold truncate">{alarma.clientes?.nombre || 'Cliente no especificado'}</h5>
                            <Badge variant={getPriorityColor(alarma.prioridad)} className="text-xs">
                              {alarma.prioridad}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(alarma.created_at), 'dd/MM/yyyy HH:mm')}
                          </div>
                        </div>
                        
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Tipo:</span>
                            <span>{alarma.tipo}</span>
                          </div>
                          
                          {alarma.direccion && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              <span className="truncate">{alarma.direccion}</span>
                              {alarma.municipio && <span className="text-muted-foreground">• {alarma.municipio}</span>}
                            </div>
                          )}
                          
                          {alarma.clientes?.telefono && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <span>{alarma.clientes.telefono}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-muted-foreground">
                              Patrulla: {alarma.patrulla_asignada || 'No asignada'}
                            </span>
                            <span className="text-xs font-mono text-blue-600">
                              Duración: {calcularTiempoRespuesta(alarma.created_at, alarma.resolved_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MiPatrulla;