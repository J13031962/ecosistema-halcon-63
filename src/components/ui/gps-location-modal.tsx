import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, ExternalLink, Signal, Navigation } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
}

interface GPSLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  ubicacionLlegada?: LocationData | null;
  ubicacionSalida?: LocationData | null;
  tiempoLlegada?: string | null;
  tiempoSalida?: string | null;
}

const GPSLocationModal: React.FC<GPSLocationModalProps> = ({
  isOpen,
  onClose,
  ubicacionLlegada,
  ubicacionSalida,
  tiempoLlegada,
  tiempoSalida
}) => {
  const formatCoordinates = (lat?: number, lng?: number) => {
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return 'Coordenadas no disponibles';
    }
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  const getAccuracyColor = (accuracy?: number) => {
    if (typeof accuracy !== 'number') return "secondary";
    if (accuracy <= 10) return "default";
    if (accuracy <= 50) return "secondary";
    return "destructive";
  };

  const getAccuracyLabel = (accuracy?: number) => {
    if (typeof accuracy !== 'number') return "Desconocida";
    if (accuracy <= 10) return "Excelente";
    if (accuracy <= 50) return "Buena";
    return "Baja";
  };

  const openInMaps = (lat?: number, lng?: number) => {
    if (typeof lat !== 'number' || typeof lng !== 'number') return;
    const url = `https://www.google.com/maps?q=${lat},${lng}`;
    window.open(url, '_blank');
  };

  const formatDateTime = (dateString?: string | null) => {
    if (!dateString) return 'No registrado';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm:ss', { locale: es });
    } catch {
      return 'Fecha inválida';
    }
  };

  const hasValidLocation = (location?: LocationData | null) => {
    return location && 
           typeof location.latitude === 'number' && 
           typeof location.longitude === 'number';
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Verificación GPS - Detalle de Ubicaciones
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Ubicación de Llegada */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5 text-green-600" />
              Ubicación de Llegada
            </h3>
            
            {hasValidLocation(ubicacionLlegada) ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Coordenadas</p>
                    <p className="font-mono text-sm">
                      {formatCoordinates(ubicacionLlegada!.latitude, ubicacionLlegada!.longitude)}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openInMaps(ubicacionLlegada!.latitude, ubicacionLlegada!.longitude)}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ver en Maps
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Hora de llegada</p>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <p className="text-sm font-medium">{formatDateTime(tiempoLlegada)}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Precisión GPS</p>
                    <div className="flex items-center gap-2">
                      <Signal className="h-4 w-4" />
                      <Badge variant={getAccuracyColor(ubicacionLlegada!.accuracy)}>
                        ±{ubicacionLlegada!.accuracy || 0}m ({getAccuracyLabel(ubicacionLlegada!.accuracy)})
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-muted-foreground text-center">
                  No se registró ubicación de llegada
                </p>
              </div>
            )}
          </div>

          {/* Ubicación de Salida */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5 text-red-600" />
              Ubicación de Salida
            </h3>
            
            {hasValidLocation(ubicacionSalida) ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Coordenadas</p>
                    <p className="font-mono text-sm">
                      {formatCoordinates(ubicacionSalida!.latitude, ubicacionSalida!.longitude)}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openInMaps(ubicacionSalida!.latitude, ubicacionSalida!.longitude)}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ver en Maps
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Hora de salida</p>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <p className="text-sm font-medium">{formatDateTime(tiempoSalida)}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Precisión GPS</p>
                    <div className="flex items-center gap-2">
                      <Signal className="h-4 w-4" />
                      <Badge variant={getAccuracyColor(ubicacionSalida!.accuracy)}>
                        ±{ubicacionSalida!.accuracy || 0}m ({getAccuracyLabel(ubicacionSalida!.accuracy)})
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-muted-foreground text-center">
                  No se registró ubicación de salida
                </p>
              </div>
            )}
          </div>

          {/* Resumen */}
          {(hasValidLocation(ubicacionLlegada) || hasValidLocation(ubicacionSalida)) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Signal className="h-4 w-4 text-blue-600" />
                Resumen de Verificación GPS
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Ubicaciones registradas</p>
                  <p className="font-medium">
                    {[hasValidLocation(ubicacionLlegada) ? 'Llegada' : null, 
                      hasValidLocation(ubicacionSalida) ? 'Salida' : null]
                      .filter(Boolean).join(', ') || 'Ninguna'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Estado de verificación</p>
                  <Badge 
                    variant={hasValidLocation(ubicacionLlegada) && hasValidLocation(ubicacionSalida) ? "default" : "secondary"}
                  >
                    {hasValidLocation(ubicacionLlegada) && hasValidLocation(ubicacionSalida) 
                      ? "Verificación completa" 
                      : "Verificación parcial"}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={onClose} variant="outline">
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GPSLocationModal;