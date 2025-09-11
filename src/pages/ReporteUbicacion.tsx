import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Users, Activity, Route, RefreshCw } from 'lucide-react';
import LeafletMap from '@/components/map/LeafletMap';
import { useSupabaseSupervisores } from '@/hooks/useSupabaseSupervisores';
import { useSupabaseAlarmasEnhanced } from '@/hooks/useSupabaseAlarmasEnhanced';
import { useAuthConsolidated } from '@/hooks/useAuthConsolidated';
import { format } from 'date-fns';

interface SupervisorLocation {
  id: string;
  name: string;
  position: [number, number];
  status: 'disponible' | 'en_servicio' | 'en_ruta';
  alarmaId?: string;
  destino?: string;
  ultimaActualizacion: string;
}

const ReporteUbicacion = () => {
  const { supervisores } = useSupabaseSupervisores();
  const { alarmas } = useSupabaseAlarmasEnhanced();
  const { userRole } = useAuthConsolidated();
  
  const [supervisoresUbicacion, setSupervisoresUbicacion] = useState<SupervisorLocation[]>([]);
  const [selectedSupervisor, setSelectedSupervisor] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([25.674, -100.309]); // Monterrey por defecto
  const [activeTab, setActiveTab] = useState('mapa');

  // Simular ubicaciones de supervisores (en producción esto vendría de GPS/tracking)
  useEffect(() => {
    const generarUbicacionesSupervisores = () => {
      const ubicacionesBase = [
        [25.6866, -100.3161], // Centro de Monterrey
        [25.6515, -100.2895], // San Pedro
        [25.7617, -100.2442], // Escobedo
        [25.6488, -100.3898], // Santa Catarina
        [25.7785, -100.1070], // Guadalupe
        [25.5922, -100.2596]  // San Nicolás
      ];

      const ubicacionesSupervisores: SupervisorLocation[] = supervisores.map((supervisor, index) => {
        const alarmaAsignada = alarmas.find(a => 
          a.supervisor_id === supervisor.id && ['asignada', 'en_proceso'].includes(a.estado)
        );
        
        let status: 'disponible' | 'en_servicio' | 'en_ruta' = 'disponible';
        let destino = '';
        
        if (alarmaAsignada) {
          if (alarmaAsignada.estado === 'asignada') {
            status = 'en_ruta';
            destino = alarmaAsignada.direccion || 'Ubicación del cliente';
          } else if (alarmaAsignada.estado === 'en_proceso') {
            status = 'en_servicio';
            destino = alarmaAsignada.direccion || 'En el sitio del cliente';
          }
        }

        const baseLocation = ubicacionesBase[index % ubicacionesBase.length];
        // Agregar variación aleatoria pequeña para simular movimiento
        const lat = baseLocation[0] + (Math.random() - 0.5) * 0.01;
        const lng = baseLocation[1] + (Math.random() - 0.5) * 0.01;

        return {
          id: supervisor.id,
          name: supervisor.full_name || supervisor.email,
          position: [lat, lng] as [number, number],
          status,
          alarmaId: alarmaAsignada?.id,
          destino,
          ultimaActualizacion: new Date().toISOString()
        };
      });

      setSupervisoresUbicacion(ubicacionesSupervisores);
    };

    generarUbicacionesSupervisores();
    
    // Actualizar cada 30 segundos
    const interval = setInterval(generarUbicacionesSupervisores, 30000);
    
    return () => clearInterval(interval);
  }, [supervisores, alarmas]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'disponible': return 'secondary';
      case 'en_ruta': return 'default';
      case 'en_servicio': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'disponible': return 'Disponible';
      case 'en_ruta': return 'En Ruta';
      case 'en_servicio': return 'En Servicio';
      default: return status;
    }
  };

  const mapMarkers = supervisoresUbicacion.map(supervisor => ({
    position: supervisor.position,
    title: supervisor.name,
    popupContent: `
      <strong>${supervisor.name}</strong><br/>
      Estado: ${getStatusText(supervisor.status)}<br/>
      ${supervisor.destino ? `Destino: ${supervisor.destino}<br/>` : ''}
      Última actualización: ${format(new Date(supervisor.ultimaActualizacion), 'HH:mm:ss')}
    `
  }));

  const handleRefresh = () => {
    // Forzar actualización de ubicaciones
    const event = new CustomEvent('refreshLocations');
    window.dispatchEvent(event);
  };

  const supervisoresActivos = supervisoresUbicacion.filter(s => s.status !== 'disponible');
  const supervisoresDisponibles = supervisoresUbicacion.filter(s => s.status === 'disponible');

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
            <CardTitle className="text-sm font-medium">En Servicio</CardTitle>
            <Activity className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {supervisoresUbicacion.filter(s => s.status === 'en_servicio').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Ruta</CardTitle>
            <Route className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {supervisoresUbicacion.filter(s => s.status === 'en_ruta').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disponibles</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {supervisoresDisponibles.length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="mapa">Mapa en Tiempo Real</TabsTrigger>
          <TabsTrigger value="lista">Lista de Supervisores</TabsTrigger>
          <TabsTrigger value="recorridos">Historial de Recorridos</TabsTrigger>
        </TabsList>

        <TabsContent value="mapa">
          <Card>
            <CardHeader>
              <CardTitle>Ubicaciones en Tiempo Real</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[600px] w-full">
                <LeafletMap
                  center={mapCenter}
                  zoom={12}
                  markers={mapMarkers}
                  showTraffic={true}
                  height="600px"
                  withControls={true}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lista">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Supervisores Activos */}
            <Card>
              <CardHeader>
                <CardTitle>Supervisores Activos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {supervisoresActivos.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No hay supervisores activos en este momento
                    </p>
                  ) : (
                    supervisoresActivos.map((supervisor) => (
                      <div
                        key={supervisor.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer"
                        onClick={() => {
                          setMapCenter(supervisor.position);
                          setSelectedSupervisor(supervisor.id);
                          setActiveTab('mapa');
                        }}
                      >
                        <div>
                          <p className="font-medium">{supervisor.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {supervisor.destino}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Actualizado: {format(new Date(supervisor.ultimaActualizacion), 'HH:mm:ss')}
                          </p>
                        </div>
                        <Badge variant={getStatusColor(supervisor.status)}>
                          {getStatusText(supervisor.status)}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Supervisores Disponibles */}
            <Card>
              <CardHeader>
                <CardTitle>Supervisores Disponibles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {supervisoresDisponibles.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No hay supervisores disponibles
                    </p>
                  ) : (
                    supervisoresDisponibles.map((supervisor) => (
                      <div
                        key={supervisor.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer"
                        onClick={() => {
                          setMapCenter(supervisor.position);
                          setSelectedSupervisor(supervisor.id);
                          setActiveTab('mapa');
                        }}
                      >
                        <div>
                          <p className="font-medium">{supervisor.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Actualizado: {format(new Date(supervisor.ultimaActualizacion), 'HH:mm:ss')}
                          </p>
                        </div>
                        <Badge variant={getStatusColor(supervisor.status)}>
                          {getStatusText(supervisor.status)}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recorridos">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Recorridos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Route className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Historial de Recorridos</h3>
                <p className="text-muted-foreground">
                  Esta funcionalidad mostrará el historial completo de recorridos de cada supervisor
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Próximamente: Integración con datos GPS y rutas completas
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReporteUbicacion;