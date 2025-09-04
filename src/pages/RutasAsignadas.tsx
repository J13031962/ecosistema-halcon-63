import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Car, Clock, CheckCircle, MapPin, Users, AlertTriangle, Flame, Eye, UserCheck, Shield } from "lucide-react";
import { useAlarmas, Alarm } from "@/contexts/AlarmasContext";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const RutasAsignadas = () => {
  const { state } = useAlarmas();
  const [routeStates, setRouteStates] = useState<{ [key: number]: string }>({});

  const getAlarmTypeIcon = (type: Alarm['type']) => {
    switch (type) {
      case "Fuego": return <Flame className="h-4 w-4" />;
      case "Pánico": return <Shield className="h-4 w-4" />;
      case "Revisión": return <Eye className="h-4 w-4" />;
      case "Acompañamiento": return <UserCheck className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getAlarmTypeColor = (type: Alarm['type']) => {
    switch (type) {
      case "Fuego": return "border-red-500 bg-red-50";
      case "Pánico": return "border-purple-500 bg-purple-50";
      case "Revisión": return "border-blue-500 bg-blue-50";
      case "Acompañamiento": return "border-green-500 bg-green-50";
      default: return "border-orange-500 bg-orange-50";
    }
  };

  const getEstadoColor = (estado: string) => {
    const colors = {
      'En Proceso': 'bg-blue-100 text-blue-800',
      'En Ruta': 'bg-yellow-100 text-yellow-800',
      'En Sitio': 'bg-green-100 text-green-800',
      'Finalizada': 'bg-gray-100 text-gray-800'
    };
    return colors[estado as keyof typeof colors] || 'bg-blue-100 text-blue-800';
  };

  const handleCambiarEstado = (id: number, nuevoEstado: string) => {
    setRouteStates(prev => ({
      ...prev,
      [id]: nuevoEstado
    }));
  };

  const getCurrentEstado = (alarmId: number) => {
    return routeStates[alarmId] || 'En Proceso';
  };

  const estadosDisponibles = (estadoActual: string) => {
    const flujo = {
      'En Proceso': ['En Ruta'],
      'En Ruta': ['En Sitio'],
      'En Sitio': ['Finalizada'],
      'Finalizada': []
    };
    return flujo[estadoActual as keyof typeof flujo] || [];
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Alta": return "text-red-600";
      case "Media": return "text-orange-500";
      case "Baja": return "text-yellow-500";
      default: return "text-gray-500";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <MapPin className="h-8 w-8 text-primary" />
          Rutas Asignadas al Supervisor
        </h1>
        <p className="text-muted-foreground">Seguimiento y gestión de patrullas en terreno</p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rutas Activas</CardTitle>
            <Car className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {(state.rutasAsignadas || []).filter(r => getCurrentEstado(r.id) !== 'Finalizada').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Ruta</CardTitle>
            <MapPin className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {(state.rutasAsignadas || []).filter(r => getCurrentEstado(r.id) === 'En Ruta').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Sitio</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {(state.rutasAsignadas || []).filter(r => getCurrentEstado(r.id) === 'En Sitio').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Finalizadas Hoy</CardTitle>
            <CheckCircle className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {(state.rutasAsignadas || []).filter(r => getCurrentEstado(r.id) === 'Finalizada').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Rutas Asignadas */}
      <Card>
        <CardHeader>
          <CardTitle>Rutas Asignadas</CardTitle>
          <CardDescription>Seguimiento en tiempo real de patrullas en servicio</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {!state.rutasAsignadas || state.rutasAsignadas.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Car className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>No hay rutas asignadas en este momento</p>
                <p className="text-sm">Las rutas aparecerán aquí cuando el despachador atienda alarmas</p>
              </div>
            ) : (
              (state.rutasAsignadas || [])
                .filter(route => getCurrentEstado(route.id) !== 'Finalizada')
                .map((route) => (
                  <AccordionItem key={route.id} value={`route-${route.id}`} className={`border-2 rounded-lg mb-4 ${getAlarmTypeColor(route.type)}`}>
                    <AccordionTrigger className="px-4 py-2 hover:no-underline">
                      <div className="flex items-center justify-between w-full mr-4">
                        <div className="flex items-center space-x-4">
                          <div className={`p-2 rounded-full ${route.priority === 'Alta' ? 'bg-red-100' : 'bg-orange-100'}`}>
                            {getAlarmTypeIcon(route.type)}
                          </div>
                          <div className="text-left">
                            <h4 className="font-semibold">{route.client}</h4>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="font-medium">
                                {route.type}
                              </Badge>
                              <span className="text-sm text-muted-foreground">-</span>
                              <span className="text-sm text-muted-foreground">{route.patrullaAsignada}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">📍 {route.address}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <Badge className={getEstadoColor(getCurrentEstado(route.id))}>
                            {getCurrentEstado(route.id)}
                          </Badge>
                          <Badge variant="outline" className={getPriorityColor(route.priority)}>
                            {route.priority}
                          </Badge>
                          <div className="text-lg font-mono font-bold text-blue-600">
                            ⏱️ {route.tiempoRespuesta}
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    
                    <AccordionContent className="px-4 pb-4">
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p><strong>Dirección:</strong> {route.address}</p>
                            <p><strong>Municipio:</strong> {route.municipality}</p>
                            <p><strong>Patrulla Asignada:</strong> {route.patrullaAsignada}</p>
                            {route.supervisor && <p><strong>Supervisor:</strong> {route.supervisor}</p>}
                          </div>
                          <div>
                            <p><strong>Estado:</strong> {getCurrentEstado(route.id)}</p>
                            <p><strong>Prioridad:</strong> {route.priority}</p>
                            <p><strong>Tiempo de Respuesta:</strong> {route.tiempoRespuesta}</p>
                            <p><strong>Atendida por:</strong> {route.operator}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-4 border-t">
                          {estadosDisponibles(getCurrentEstado(route.id)).map((estado) => (
                            <Button
                              key={estado}
                              size="sm"
                              variant="outline"
                              onClick={() => handleCambiarEstado(route.id, estado)}
                              className="flex items-center gap-1"
                            >
                              {estado === 'En Ruta' && <MapPin className="h-4 w-4" />}
                              {estado === 'En Sitio' && <CheckCircle className="h-4 w-4" />}
                              {estado === 'Finalizada' && <CheckCircle className="h-4 w-4" />}
                              {estado}
                            </Button>
                          ))}
                          
                          <Button size="sm" variant="outline">
                            <Users className="h-4 w-4 mr-1" />
                            Contactar Patrulla
                          </Button>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))
            )}
          </Accordion>
        </CardContent>
      </Card>

      {/* Rutas Finalizadas */}
      {(state.rutasAsignadas || []).filter(r => getCurrentEstado(r.id) === 'Finalizada').length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Rutas Finalizadas Hoy</CardTitle>
            <CardDescription>Historial de rutas completadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(state.rutasAsignadas || [])
                .filter(route => getCurrentEstado(route.id) === 'Finalizada')
                .map((route) => (
                  <div key={route.id} className={`p-4 border-2 rounded-lg opacity-75 ${getAlarmTypeColor(route.type)}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 rounded-full bg-gray-100">
                          {getAlarmTypeIcon(route.type)}
                        </div>
                        <div>
                          <h4 className="font-semibold">{route.client}</h4>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="font-medium">
                              {route.type}
                            </Badge>
                            <span className="text-sm text-muted-foreground">-</span>
                            <span className="text-sm text-muted-foreground">{route.patrullaAsignada}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">📍 {route.address}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end space-y-2">
                        <Badge className={getEstadoColor('Finalizada')}>
                          Finalizada
                        </Badge>
                        <div className="text-sm font-mono text-gray-600">
                          ✅ {route.tiempoRespuesta}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RutasAsignadas;