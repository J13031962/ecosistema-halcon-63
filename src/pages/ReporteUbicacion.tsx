import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Users, Activity, Route, RefreshCw, Navigation, ExternalLink, Bike } from 'lucide-react';
import { useSupabaseUbicacionesSupervisores } from '@/hooks/useSupabaseUbicacionesSupervisores';
import { format } from 'date-fns';
import SupervisorMap from '@/components/map/SupervisorMap';

interface SupervisorLocation {
  id: string;
  name: string;
  position: [number, number] | null;
  status: 'disponible' | 'en_servicio' | 'en_ruta' | 'desconectado';
  alarmaId?: string;
  destino?: string;
  ultimaActualizacion: string;
  isOnline: boolean;
  precision?: number;
}

interface SupervisorEvent {
  id: string;
  supervisorId: string;
  supervisorName: string;
  evento: string;
  ubicacionOrigen: [number, number];
  ubicacionDestino?: [number, number];
  timestamp: string;
  alarmaId?: string;
  clienteNombre?: string;
}

const ReporteUbicacion = () => {
  const { supervisoresStatus, loading } = useSupabaseUbicacionesSupervisores();
  const [activeTab, setActiveTab] = useState('eventos');

  // Generar eventos de supervisores activos basados en datos reales
  const eventosSupervision: SupervisorEvent[] = supervisoresStatus
    .filter(supervisor => supervisor.position && (supervisor.status === 'en_ruta' || supervisor.status === 'en_servicio'))
    .map(supervisor => ({
      id: `evento-${supervisor.id}`,
      supervisorId: supervisor.id,
      supervisorName: supervisor.name,
      evento: supervisor.status === 'en_ruta' ? 'Dirigiéndose al cliente' : 'Atendiendo cliente',
      ubicacionOrigen: supervisor.position!,
      ubicacionDestino: supervisor.status === 'en_ruta' ? [
        supervisor.position![0] + 0.001,
        supervisor.position![1] + 0.001
      ] : undefined,
      timestamp: supervisor.ultimaActualizacion,
      alarmaId: supervisor.alarmaId,
      clienteNombre: supervisor.destino
    }));

  const getStatusColor = (status: string, isOnline: boolean) => {
    if (!isOnline) return 'destructive';
    switch (status) {
      case 'disponible': return 'secondary';
      case 'en_ruta': return 'default';
      case 'en_servicio': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusText = (status: string, isOnline: boolean) => {
    if (!isOnline) return 'Desconectado';
    switch (status) {
      case 'disponible': return 'Disponible';
      case 'en_ruta': return 'En Ruta';
      case 'en_servicio': return 'En Servicio';
      default: return status;
    }
  };

  const abrirEnGoogleMaps = (evento: SupervisorEvent) => {
    if (evento.ubicacionDestino) {
      // Si hay destino, mostrar ruta desde origen a destino
      const origen = `${evento.ubicacionOrigen[0]},${evento.ubicacionOrigen[1]}`;
      const destino = `${evento.ubicacionDestino[0]},${evento.ubicacionDestino[1]}`;
      const url = `https://www.google.com/maps/dir/${origen}/${destino}`;
      window.open(url, '_blank');
    } else {
      // Mostrar ubicación actual del supervisor
      const url = `https://www.google.com/maps/@${evento.ubicacionOrigen[0]},${evento.ubicacionOrigen[1]},15z`;
      window.open(url, '_blank');
    }
  };

  const abrirUbicacionSupervisor = (supervisor: SupervisorLocation) => {
    if (supervisor.position) {
      const url = `https://www.google.com/maps/@${supervisor.position[0]},${supervisor.position[1]},15z`;
      window.open(url, '_blank');
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const supervisoresOnline = supervisoresStatus.filter(s => s.isOnline && s.position);
  const supervisoresOffline = supervisoresStatus.filter(s => !s.isOnline || !s.position);
  const supervisoresActivos = supervisoresStatus.filter(s => s.isOnline && s.position && s.status !== 'disponible');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Cargando datos de supervisores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <MapPin className="h-8 w-8 text-primary" />
            Reporte de Ubicación
          </h1>
          <p className="text-muted-foreground">
            Monitoreo en tiempo real de supervisores y sus ubicaciones
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Actualizar
        </Button>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Supervisores</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{supervisoresStatus.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Con GPS Activo</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{supervisoresOnline.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Actividad</CardTitle>
            <Route className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{supervisoresActivos.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sin GPS / Desconectados</CardTitle>
            <Users className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{supervisoresOffline.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="eventos">Eventos Activos</TabsTrigger>
          <TabsTrigger value="lista">Lista de Supervisores</TabsTrigger>
          <TabsTrigger value="mapa">Mapa Interactivo</TabsTrigger>
        </TabsList>

        <TabsContent value="eventos">
          <Card>
            <CardHeader>
              <CardTitle>Eventos de Supervisión Activos</CardTitle>
              <div className="text-sm text-muted-foreground">
                Haz clic en cualquier evento para ver el recorrido en Google Maps
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {eventosSupervision.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No hay eventos activos en este momento</p>
                    <p className="text-sm mt-2">Los supervisores en movimiento aparecerán aquí</p>
                  </div>
                ) : (
                  eventosSupervision.map((evento) => (
                    <div
                      key={evento.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => abrirEnGoogleMaps(evento)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Bike className="h-4 w-4 text-blue-500" />
                          <Badge variant="outline">{evento.supervisorName}</Badge>
                          <span className="text-sm font-medium">{evento.evento}</span>
                        </div>
                        {evento.clienteNombre && (
                          <p className="text-sm text-muted-foreground mb-1">
                            Destino: {evento.clienteNombre}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(evento.timestamp), 'HH:mm:ss')} - GPS: {evento.ubicacionOrigen[0].toFixed(6)}, {evento.ubicacionOrigen[1].toFixed(6)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <MapPin className="h-4 w-4 mr-2 text-blue-500" />
                          Ver en Google Maps
                        </Button>
                        <Navigation className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lista">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Supervisores Conectados */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  Supervisores con GPS Activo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {supervisoresOnline.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No hay supervisores con GPS activo
                    </p>
                  ) : (
                    supervisoresOnline.map((supervisor) => (
                      <div
                        key={supervisor.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                        onClick={() => abrirUbicacionSupervisor(supervisor)}
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`w-3 h-3 rounded-full ${
                              supervisor.status === 'disponible' ? 'bg-blue-500' 
                                : supervisor.status === 'en_ruta' ? 'bg-orange-500'
                                : 'bg-green-500'
                            }`}></div>
                            <p className="font-medium">{supervisor.name}</p>
                            <span className="text-xs text-muted-foreground">({supervisor.email})</span>
                          </div>
                          {supervisor.destino && (
                            <p className="text-sm text-muted-foreground">
                              {supervisor.destino}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            GPS: {format(new Date(supervisor.ultimaActualizacion), 'dd/MM HH:mm:ss')}
                            {supervisor.precision && ` • Precisión: ${supervisor.precision}m`}
                          </p>
                          {supervisor.position && (
                            <p className="text-xs text-green-600 font-mono">
                              {supervisor.position[0].toFixed(6)}, {supervisor.position[1].toFixed(6)}
                            </p>
                          )}
                        </div>
                        <Badge variant={getStatusColor(supervisor.status, supervisor.isOnline)}>
                          {getStatusText(supervisor.status, supervisor.isOnline)}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Supervisores Desconectados */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  Sin GPS / Desconectados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {supervisoresOffline.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      ✅ Todos los supervisores tienen GPS activo
                    </p>
                  ) : (
                    supervisoresOffline.map((supervisor) => (
                      <div
                        key={supervisor.id}
                        className="flex items-center justify-between p-3 border rounded-lg opacity-60"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <p className="font-medium">{supervisor.name}</p>
                            <span className="text-xs text-muted-foreground">({supervisor.email})</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {supervisor.position 
                              ? `Sin GPS reciente: ${format(new Date(supervisor.ultimaActualizacion), 'dd/MM HH:mm')}`
                              : 'Sin datos GPS registrados'
                            }
                          </p>
                        </div>
                        <Badge variant="destructive">
                          {supervisor.position ? 'GPS Inactivo' : 'Sin GPS'}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="mapa">
          <Card>
            <CardHeader>
              <CardTitle>Mapa de Supervisores en Tiempo Real</CardTitle>
              <p className="text-sm text-muted-foreground">
                Ubicación en tiempo real de todos los supervisores motorizados
              </p>
            </CardHeader>
            <CardContent>
              <SupervisorMap 
                supervisores={supervisoresStatus.filter(s => s.position).map(s => ({
                  ...s,
                  position: s.position!
                }))}
                onSupervisorClick={(supervisor) => {
                  // Mostrar más información del supervisor
                  console.log('Supervisor seleccionado:', supervisor);
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReporteUbicacion;