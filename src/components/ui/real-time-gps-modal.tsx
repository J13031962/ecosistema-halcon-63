import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, RefreshCw, ExternalLink, Loader2 } from "lucide-react";
import { useRealTimeGPS } from "@/hooks/useRealTimeGPS";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface RealTimeGPSModalProps {
  isOpen: boolean;
  onClose: () => void;
  supervisorId: string;
  supervisorNombre: string;
  alarmaId: string;
  clienteData?: {
    nombre: string;
    direccion: string;
    latitud: number | null;
    longitud: number | null;
  };
}

// Function to calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const getProximityStatus = (distance: number) => {
  if (distance <= 150) {
    return { color: 'bg-green-500', text: 'En ubicación correcta', variant: 'default' as const };
  } else if (distance <= 300) {
    return { color: 'bg-yellow-500', text: 'Cerca del cliente', variant: 'secondary' as const };
  } else {
    return { color: 'bg-red-500', text: 'Lejos del cliente', variant: 'destructive' as const };
  }
};

export const RealTimeGPSModal: React.FC<RealTimeGPSModalProps> = ({
  isOpen,
  onClose,
  supervisorId,
  supervisorNombre,
  alarmaId,
  clienteData
}) => {
  const [lastKnownPosition, setLastKnownPosition] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { getLatestGPSFromDB } = useRealTimeGPS();

  // Load latest GPS position when modal opens
  useEffect(() => {
    if (isOpen && supervisorId && alarmaId) {
      loadLatestPosition();
    }
  }, [isOpen, supervisorId, alarmaId]);

  const loadLatestPosition = async () => {
    setIsLoading(true);
    try {
      const position = await getLatestGPSFromDB(supervisorId, alarmaId);
      setLastKnownPosition(position);
    } catch (error) {
      console.error('Error cargando ubicación:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshLocation = async () => {
    await loadLatestPosition();
  };

  const openInGoogleMaps = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps?q=${lat},${lng}`;
    window.open(url, '_blank');
  };

  const openBothInGoogleMaps = () => {
    if (lastKnownPosition && clienteData?.latitud && clienteData?.longitud) {
      const url = `https://www.google.com/maps/dir/${lastKnownPosition.latitude},${lastKnownPosition.longitude}/${clienteData.latitud},${clienteData.longitud}`;
      window.open(url, '_blank');
    }
  };

  const distance = lastKnownPosition && clienteData?.latitud && clienteData?.longitud
    ? calculateDistance(
        lastKnownPosition.latitude,
        lastKnownPosition.longitude,
        clienteData.latitud,
        clienteData.longitud
      )
    : null;

  const proximityStatus = distance ? getProximityStatus(distance) : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Ubicación en Tiempo Real - {supervisorNombre}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Supervisor Location */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Ubicación Actual del Supervisor</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefreshLocation}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Actualizar
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lastKnownPosition ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Latitud:</span> {lastKnownPosition.latitude.toFixed(6)}
                    </div>
                    <div>
                      <span className="font-medium">Longitud:</span> {lastKnownPosition.longitude.toFixed(6)}
                    </div>
                  </div>
                  
                  {lastKnownPosition.precision && (
                    <div className="text-sm">
                      <span className="font-medium">Precisión:</span> ±{lastKnownPosition.precision}m
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Actualizado {formatDistanceToNow(lastKnownPosition.timestamp, { 
                      addSuffix: true, 
                      locale: es 
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openInGoogleMaps(lastKnownPosition.latitude, lastKnownPosition.longitude)}
                    className="w-full"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ver en Google Maps
                  </Button>
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  {isLoading ? "Cargando ubicación..." : "No hay ubicación disponible"}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Client Location */}
          {clienteData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Ubicación del Cliente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <span className="font-medium">Cliente:</span> {clienteData.nombre}
                  </div>
                  <div>
                    <span className="font-medium">Dirección:</span> {clienteData.direccion}
                  </div>
                  
                  {clienteData.latitud && clienteData.longitud ? (
                    <>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Latitud:</span> {clienteData.latitud.toFixed(6)}
                        </div>
                        <div>
                          <span className="font-medium">Longitud:</span> {clienteData.longitud.toFixed(6)}
                        </div>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openInGoogleMaps(clienteData.latitud!, clienteData.longitud!)}
                        className="w-full"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Ver ubicación del cliente
                      </Button>
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      No hay coordenadas GPS registradas para este cliente
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Proximity Analysis */}
          {distance !== null && proximityStatus && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Análisis de Proximidad</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Distancia al cliente:</span>
                    <span className="text-lg font-bold">{Math.round(distance)}m</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span>Estado:</span>
                    <Badge variant={proximityStatus.variant} className="gap-1">
                      <div className={`w-2 h-2 rounded-full ${proximityStatus.color}`} />
                      {proximityStatus.text}
                    </Badge>
                  </div>
                  
                  {lastKnownPosition && clienteData?.latitud && clienteData?.longitud && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={openBothInGoogleMaps}
                      className="w-full"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Ver ruta entre ubicaciones
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};