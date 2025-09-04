import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Car, MapPin, Clock, Battery, Fuel, Navigation, AlertTriangle, Camera } from "lucide-react";

const MiPatrulla = () => {
  const [patrullaInfo] = useState({
    unit: "Patrulla 05",
    officer: "Juan Carlos Morales",
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

  const [actividades] = useState([
    {
      time: "14:35:22",
      type: "Punto de Control",
      location: "Checkpoint Norte #3",
      status: "Completado",
      notes: "Todo en orden"
    },
    {
      time: "14:20:15",
      type: "Patrullaje",
      location: "Ronda Sector Norte",
      status: "En Proceso",
      notes: "Iniciando recorrido rutinario"
    },
    {
      time: "14:05:30",
      type: "Reporte",
      location: "Base Central",
      status: "Completado", 
      notes: "Inicio de turno registrado"
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "En Servicio": return "default";
      case "Disponible": return "secondary";
      case "Fuera de Servicio": return "outline";
      case "Emergencia": return "destructive";
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Mi Patrulla</h1>
        <p className="text-muted-foreground">Estado y control de mi unidad asignada</p>
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

        {/* Estado y Controles */}
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

          {/* Registro de Actividades */}
          <Card>
            <CardHeader>
              <CardTitle>Actividades del Turno</CardTitle>
              <CardDescription>Registro de actividades realizadas hoy</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {actividades.map((actividad, index) => (
                  <div key={index} className="flex items-start space-x-4 p-3 border rounded-lg">
                    <div className="text-sm text-muted-foreground min-w-[80px]">
                      {actividad.time}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h5 className="font-medium">{actividad.type}</h5>
                        <Badge variant={actividad.status === 'Completado' ? 'secondary' : 'default'}>
                          {actividad.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{actividad.location}</p>
                      {actividad.notes && (
                        <p className="text-sm mt-1">{actividad.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Nuevo Reporte */}
          <Card>
            <CardHeader>
              <CardTitle>Registrar Actividad</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Tipo de Actividad</label>
                  <select className="w-full mt-1 px-3 py-2 border border-border rounded-md">
                    <option value="">Seleccionar...</option>
                    <option value="patrullaje">Patrullaje</option>
                    <option value="punto-control">Punto de Control</option>
                    <option value="incidente">Incidente</option>
                    <option value="reporte">Reporte</option>
                    <option value="mantenimiento">Mantenimiento</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Ubicación</label>
                  <Input placeholder="Ubicación de la actividad" />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Notas</label>
                <Textarea 
                  placeholder="Descripción detallada de la actividad..."
                  className="mt-1"
                />
              </div>
              
              <Button className="w-full">
                Registrar Actividad
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MiPatrulla;