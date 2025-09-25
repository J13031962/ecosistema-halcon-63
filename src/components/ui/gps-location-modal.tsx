import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, ExternalLink, Signal, Navigation, Copy, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

interface GPSLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  ubicacionLlegada?: any;
  ubicacionSalida?: any;
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
  const { toast } = useToast();
  // Función para normalizar ubicaciones en diferentes formatos
  const normalizeLocation = (input: any): LocationData | null => {
    if (!input) return null;
    
    // Si es un string, intentar parsearlo como "lat,lng"
    if (typeof input === 'string') {
      const coords = input.split(',').map(c => parseFloat(c.trim()));
      if (coords.length >= 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
        return {
          latitude: coords[0],
          longitude: coords[1],
          accuracy: coords[2] || undefined
        };
      }
      return null;
    }
    
    // Si es un objeto, buscar diferentes formatos de keys
    if (typeof input === 'object') {
      let lat, lng, accuracy;
      
      // Formato en inglés
      if ('latitude' in input && 'longitude' in input) {
        lat = input.latitude;
        lng = input.longitude;
        accuracy = input.accuracy;
      }
      // Formato en español
      else if ('latitud' in input && 'longitud' in input) {
        lat = input.latitud;
        lng = input.longitud;
        accuracy = input.precision || input.accuracy;
      }
      // Formato corto
      else if ('lat' in input && 'lng' in input) {
        lat = input.lat;
        lng = input.lng;
        accuracy = input.accuracy;
      }
      
      // Validar que son números válidos
      if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
        return {
          latitude: lat,
          longitude: lng,
          accuracy: typeof accuracy === 'number' ? accuracy : undefined
        };
      }
    }
    
    return null;
  };

  // Normalizar las ubicaciones
  const normalizedLlegada = normalizeLocation(ubicacionLlegada);
  const normalizedSalida = normalizeLocation(ubicacionSalida);
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
    
    // Validate coordinates are within valid ranges
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      // Use the working Google Maps URL format
      const url = `https://www.google.com/maps/search/maps+${lat},+${lng}?sa=X&ved=1t:242&ictx=111`;
      
      try {
        const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
        
        // Check if popup was blocked after a short delay
        setTimeout(() => {
          if (!newWindow || newWindow.closed || newWindow.location.href === 'about:blank') {
            toast({
              title: "Pop-up bloqueado",
              description: "El navegador bloqueó la ventana. El enlace se copió al portapapeles. Pégalo en una nueva pestaña para abrir Google Maps.",
              variant: "destructive",
              duration: 6000,
            });
            
            // Copy to clipboard as fallback
            navigator.clipboard?.writeText(url).catch(() => {
              console.log('No se pudo copiar al portapapeles');
            });
          }
        }, 100);
        
      } catch (error) {
        toast({
          title: "Error al abrir Maps",
          description: "No se pudo abrir Google Maps. El enlace se copió al portapapeles.",
          variant: "destructive",
        });
        
        navigator.clipboard?.writeText(url).catch(() => {
          console.log('No se pudo copiar al portapapeles');
        });
      }
    }
  };

  const copyMapsLink = (lat?: number, lng?: number) => {
    if (typeof lat !== 'number' || typeof lng !== 'number') return;
    
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      const url = `https://www.google.com/maps/search/maps+${lat},+${lng}?sa=X&ved=1t:242&ictx=111`;
      
      navigator.clipboard.writeText(url).then(() => {
        toast({
          title: "¡Enlace copiado!",
          description: "El enlace de Google Maps se copió al portapapeles. Pégalo en una nueva pestaña.",
          duration: 3000,
        });
      }).catch(() => {
        toast({
          title: "Error al copiar",
          description: "No se pudo copiar el enlace. Inténtalo de nuevo.",
          variant: "destructive",
        });
      });
    }
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
            
            {hasValidLocation(normalizedLlegada) ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Coordenadas</p>
                    <p className="font-mono text-sm">
                      {formatCoordinates(normalizedLlegada!.latitude, normalizedLlegada!.longitude)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyMapsLink(normalizedLlegada!.latitude, normalizedLlegada!.longitude)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar enlace
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openInMaps(normalizedLlegada!.latitude, normalizedLlegada!.longitude)}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Ver en Maps
                    </Button>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mt-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-amber-700">
                      <p className="font-medium">¿No se abre Google Maps?</p>
                      <p>Tu navegador puede estar bloqueando pop-ups. Usa el botón "Copiar enlace" y pega la URL en una nueva pestaña.</p>
                    </div>
                  </div>
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
                      <Badge variant={getAccuracyColor(normalizedLlegada!.accuracy)}>
                        ±{normalizedLlegada!.accuracy || 0}m ({getAccuracyLabel(normalizedLlegada!.accuracy)})
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
            
            {hasValidLocation(normalizedSalida) ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Coordenadas</p>
                    <p className="font-mono text-sm">
                      {formatCoordinates(normalizedSalida!.latitude, normalizedSalida!.longitude)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyMapsLink(normalizedSalida!.latitude, normalizedSalida!.longitude)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar enlace
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openInMaps(normalizedSalida!.latitude, normalizedSalida!.longitude)}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Ver en Maps
                    </Button>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mt-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-amber-700">
                      <p className="font-medium">¿No se abre Google Maps?</p>
                      <p>Tu navegador puede estar bloqueando pop-ups. Usa el botón "Copiar enlace" y pega la URL en una nueva pestaña.</p>
                    </div>
                  </div>
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
                      <Badge variant={getAccuracyColor(normalizedSalida!.accuracy)}>
                        ±{normalizedSalida!.accuracy || 0}m ({getAccuracyLabel(normalizedSalida!.accuracy)})
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
          {(hasValidLocation(normalizedLlegada) || hasValidLocation(normalizedSalida)) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Signal className="h-4 w-4 text-blue-600" />
                Resumen de Verificación GPS
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Ubicaciones registradas</p>
                  <p className="font-medium">
                    {[hasValidLocation(normalizedLlegada) ? 'Llegada' : null, 
                      hasValidLocation(normalizedSalida) ? 'Salida' : null]
                      .filter(Boolean).join(', ') || 'Ninguna'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Estado de verificación</p>
                  <Badge 
                    variant={hasValidLocation(normalizedLlegada) && hasValidLocation(normalizedSalida) ? "default" : "secondary"}
                  >
                    {hasValidLocation(normalizedLlegada) && hasValidLocation(normalizedSalida) 
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