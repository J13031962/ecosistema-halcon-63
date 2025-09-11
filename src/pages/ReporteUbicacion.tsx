import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Users, Activity, Route, RefreshCw, Navigation, ExternalLink, Bike } from 'lucide-react';
import { useSupabaseSupervisores } from '@/hooks/useSupabaseSupervisores';
import { useSupabaseAlarmasEnhanced } from '@/hooks/useSupabaseAlarmasEnhanced';
import { useAuthConsolidated } from '@/hooks/useAuthConsolidated';
import { format } from 'date-fns';

interface SupervisorLocation {
  id: string;
  name: string;
  position: [number, number];
  status: 'disponible' | 'en_servicio' | 'en_ruta' | 'desconectado';
  alarmaId?: string;
  destino?: string;
  ultimaActualizacion: string;
  isOnline: boolean;
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
  const { supervisores, loading } = useSupabaseSupervisores();
  const { alarmas } = useSupabaseAlarmasEnhanced();
  const { userRole } = useAuthConsolidated();
  
  const [supervisoresUbicacion, setSupervisoresUbicacion] = useState<SupervisorLocation[]>([]);
  const [eventosSupervision, setEventosSupervision] = useState<SupervisorEvent[]>([]);
  const [activeTab, setActiveTab] = useState('eventos');

  // Simular estado de conexión de supervisores
  const getOnlineStatus = () => {
    const onlineStates: Record<string, boolean> = {};
    supervisores.forEach(supervisor => {
      // Simular algunos supervisores online/offline
      onlineStates[supervisor.id] = Math.random() > 0.3; // 70% probabilidad de estar online
    });
    return onlineStates;
  };

  // Generar ubicaciones y eventos de supervisores
  useEffect(() => {
    const generarUbicacionesYEventos = () => {
      const ubicacionesBase = [
        [6.2442, -75.5812], // Centro de Medellín
        [6.2518, -75.5636], // El Poblado
        [6.2308, -75.5906], // La América
        [6.2676, -75.5658], // Belén
        [6.2885, -75.5761], // Robledo
        [6.1701, -75.6069]  // Envigado
      ];

      const onlineStates = getOnlineStatus();
      const ubicacionesSupervisores: SupervisorLocation[] = supervisores.map((supervisor, index) => {
        const alarmaAsignada = alarmas.find(a => 
          a.supervisor_id === supervisor.id && ['asignada', 'en_proceso'].includes(a.estado)
        );
        
        const isOnline = onlineStates[supervisor.id];
        let status: 'disponible' | 'en_servicio' | 'en_ruta' | 'desconectado' = isOnline ? 'disponible' : 'desconectado';
        let destino = '';
        
        if (isOnline && alarmaAsignada) {
          if (alarmaAsignada.estado === 'asignada') {
            status = 'en_ruta';
            destino = alarmaAsignada.direccion || 'Ubicación del cliente';
          } else if (alarmaAsignada.estado === 'en_proceso') {
            status = 'en_servicio';
            destino = alarmaAsignada.direccion || 'En el sitio del cliente';
          }
        }

        const baseLocation = ubicacionesBase[index % ubicacionesBase.length];
        const lat = baseLocation[0] + (Math.random() - 0.5) * 0.01;
        const lng = baseLocation[1] + (Math.random() - 0.5) * 0.01;

        return {
          id: supervisor.id,
          name: supervisor.full_name || supervisor.email,
          position: [lat, lng] as [number, number],
          status,
          alarmaId: alarmaAsignada?.id,
          destino,
          ultimaActualizacion: new Date().toISOString(),
          isOnline
        };
      });

      // Generar eventos de supervisores activos
      const eventos: SupervisorEvent[] = [];
      ubicacionesSupervisores.forEach(supervisor => {
        if (supervisor.status === 'en_ruta' || supervisor.status === 'en_servicio') {
          const alarma = alarmas.find(a => a.id === supervisor.alarmaId);
          if (alarma && alarma.clientes) {
            eventos.push({
              id: `evento-${supervisor.id}`,
              supervisorId: supervisor.id,
              supervisorName: supervisor.name,
              evento: supervisor.status === 'en_ruta' ? 'Dirigiéndose al cliente' : 'Atendiendo cliente',
              ubicacionOrigen: supervisor.position,
              ubicacionDestino: supervisor.status === 'en_ruta' ? [
                supervisor.position[0] + (Math.random() - 0.5) * 0.02,
                supervisor.position[1] + (Math.random() - 0.5) * 0.02
              ] : undefined,
              timestamp: new Date().toISOString(),
              alarmaId: supervisor.alarmaId,
              clienteNombre: alarma.clientes?.nombre
            });
          }
        }
      });

      setSupervisoresUbicacion(ubicacionesSupervisores);
      setEventosSupervision(eventos);
    };

    if (supervisores.length > 0) {
      generarUbicacionesYEventos();
      
      // Actualizar cada 30 segundos
      const interval = setInterval(generarUbicacionesYEventos, 30000);
      return () => clearInterval(interval);
    }
  }, [supervisores, alarmas]);

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
    // Coordenadas de referencia en Medellín
    const lat = 6.1760461;
    const lng = -75.5625925;
    
    if (evento.ubicacionDestino) {
      // Si hay destino, mostrar ruta con marcador de moto azul en origen
      const origen = `${lat},${lng}`;
      const destino = `${evento.ubicacionDestino[0]},${evento.ubicacionDestino[1]}`;
      const url = `https://www.google.com/maps/dir/${origen}/${destino}`;
      window.open(url, '_blank');
    } else {
      // Mostrar ubicación del supervisor con marcador de moto azul en la ubicación de referencia
      const url = `https://www.google.com/maps/@${lat},${lng},15z?entry=ttu&g_ep=EgoyMDI1MDkwOC4wIKXMDSoASAFQAw%3D%3D`;
      window.open(url, '_blank');
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const supervisoresOnline = supervisoresUbicacion.filter(s => s.isOnline);
  const supervisoresOffline = supervisoresUbicacion.filter(s => !s.isOnline);
  const supervisoresActivos = supervisoresUbicacion.filter(s => s.isOnline && s.status !== 'disponible');

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
            <div className="text-2xl font-bold text-blue-600">{supervisoresUbicacion.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conectados</CardTitle>
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
            <CardTitle className="text-sm font-medium">Desconectados</CardTitle>
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
          <TabsTrigger value="mapa">Mapa (Próximamente)</TabsTrigger>
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
                            Cliente: {evento.clienteNombre}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(evento.timestamp), 'HH:mm:ss')} - Medellín, Colombia: {evento.ubicacionOrigen[0].toFixed(4)}, {evento.ubicacionOrigen[1].toFixed(4)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Bike className="h-4 w-4 mr-2 text-blue-500" />
                          Ver Supervisor en Maps
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
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  Supervisores Conectados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {supervisoresOnline.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No hay supervisores conectados
                    </p>
                  ) : (
                    supervisoresOnline.map((supervisor) => (
                      <div
                        key={supervisor.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                        onClick={() => {
                          const ubicacion = `${supervisor.position[0]},${supervisor.position[1]}`;
                          window.open(`https://www.google.com/maps?q=${ubicacion}`, '_blank');
                        }}
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`w-3 h-3 rounded-full ${
                              supervisor.status === 'disponible' ? 'bg-blue-500' 
                                : supervisor.status === 'en_ruta' ? 'bg-orange-500'
                                : 'bg-green-500'
                            }`}></div>
                            <p className="font-medium">{supervisor.name}</p>
                          </div>
                          {supervisor.destino && (
                            <p className="text-sm text-muted-foreground">
                              {supervisor.destino}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Última actualización: {format(new Date(supervisor.ultimaActualizacion), 'HH:mm:ss')}
                          </p>
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
                  Supervisores Desconectados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {supervisoresOffline.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      ✅ Todos los supervisores están conectados
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
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Última conexión: {format(new Date(supervisor.ultimaActualizacion), 'HH:mm:ss')}
                          </p>
                        </div>
                        <Badge variant="destructive">
                          Desconectado
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
              <CardTitle>Mapa Interactivo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {/* Contenedor del mapa simulado */}
                <div className="w-full h-96 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center relative overflow-hidden">
                  {/* Fondo del mapa estilo Google Maps */}
                  <div className="absolute inset-0 bg-gradient-to-br from-green-100 via-blue-50 to-gray-100"></div>
                  
                  {/* Icono de moto azul en el centro */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="bg-blue-600 p-4 rounded-full shadow-lg mb-2">
                      <Bike className="h-8 w-8 text-white" />
                    </div>
                    <div className="bg-white px-3 py-1 rounded-lg shadow-md border">
                      <span className="text-sm font-medium text-blue-600">Supervisor Motorizado</span>
                    </div>
                  </div>
                  
                  {/* Indicador de ubicación */}
                  <div className="absolute top-4 left-4 bg-white px-3 py-2 rounded-lg shadow-md">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">Medellín, Colombia</span>
                    </div>
                  </div>
                  
                  {/* Botón para abrir en Google Maps */}
                  <div className="absolute bottom-4 right-4">
                    <Button 
                      onClick={() => window.open('https://www.google.com/maps/@6.1760461,-75.5625925,15z?entry=ttu&g_ep=EgoyMDI1MDkwOC4wIKXMDSoASAFQAw%3D%3D', '_blank')}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Ver en Google Maps
                    </Button>
                  </div>
                </div>
                
                <div className="text-center py-4">
                  <h3 className="text-lg font-medium mb-2">Mapa en Desarrollo</h3>
                  <p className="text-muted-foreground mb-4">
                    El mapa interactivo estará disponible próximamente con:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1 max-w-md mx-auto">
                    <li>• Ubicación en tiempo real de supervisores</li>
                    <li>• Marcadores con código de colores por estado</li>
                    <li>• Rutas de desplazamiento</li>
                    <li>• Información detallada en popups</li>
                  </ul>
                  <p className="text-xs text-muted-foreground mt-4">
                    Por ahora, usa la pestaña "Eventos Activos" para ver el recorrido en Google Maps
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReporteUbicacion;