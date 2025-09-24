import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, ExternalLink, Signal } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

interface LocationDisplayProps {
  ubicacionLlegada?: LocationData | null;
  ubicacionSalida?: LocationData | null;
  tiempoLlegada?: string | null;
  tiempoSalida?: string | null;
  className?: string;
}

const LocationDisplay: React.FC<LocationDisplayProps> = ({
  ubicacionLlegada,
  ubicacionSalida,
  tiempoLlegada,
  tiempoSalida,
  className = ""
}) => {
  const formatCoordinates = (lat?: number, lng?: number) => {
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return 'Coordenadas no disponibles';
    }
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  const getAccuracyColor = (accuracy?: number) => {
    if (typeof accuracy !== 'number') return "text-gray-600";
    if (accuracy <= 10) return "text-green-600";
    if (accuracy <= 50) return "text-yellow-600";
    return "text-red-600";
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

  if (!ubicacionLlegada && !ubicacionSalida) {
    return (
      <div className={`p-3 bg-muted/30 rounded-lg border border-dashed ${className}`}>
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span className="text-sm">Sin verificación GPS</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <MapPin className="h-4 w-4 text-primary" />
        <span className="font-medium text-sm">Verificación GPS</span>
      </div>

      {ubicacionLlegada && ubicacionLlegada.latitude && ubicacionLlegada.longitude && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="font-medium text-sm text-green-800">Llegada al Sitio</span>
              {tiempoLlegada && (
                <Badge variant="outline" className="text-xs">
                  {format(new Date(tiempoLlegada), 'HH:mm:ss', { locale: es })}
                </Badge>
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => openInMaps(ubicacionLlegada.latitude, ubicacionLlegada.longitude)}
              className="h-6 px-2 text-xs"
              disabled={!ubicacionLlegada.latitude || !ubicacionLlegada.longitude}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Ver
            </Button>
          </div>
          <div className="text-xs text-green-700 space-y-1">
            <div className="font-mono">
              {formatCoordinates(ubicacionLlegada.latitude, ubicacionLlegada.longitude)}
            </div>
            <div className="flex items-center gap-2">
              <Signal className="h-3 w-3" />
              <span className={`font-medium ${getAccuracyColor(ubicacionLlegada.accuracy)}`}>
                ±{ubicacionLlegada.accuracy || 0}m ({getAccuracyLabel(ubicacionLlegada.accuracy)})
              </span>
            </div>
          </div>
        </div>
      )}

      {ubicacionSalida && ubicacionSalida.latitude && ubicacionSalida.longitude && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="font-medium text-sm text-red-800">Salida del Sitio</span>
              {tiempoSalida && (
                <Badge variant="outline" className="text-xs">
                  {format(new Date(tiempoSalida), 'HH:mm:ss', { locale: es })}
                </Badge>
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => openInMaps(ubicacionSalida.latitude, ubicacionSalida.longitude)}
              className="h-6 px-2 text-xs"
              disabled={!ubicacionSalida.latitude || !ubicacionSalida.longitude}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Ver
            </Button>
          </div>
          <div className="text-xs text-red-700 space-y-1">
            <div className="font-mono">
              {formatCoordinates(ubicacionSalida.latitude, ubicacionSalida.longitude)}
            </div>
            <div className="flex items-center gap-2">
              <Signal className="h-3 w-3" />
              <span className={`font-medium ${getAccuracyColor(ubicacionSalida.accuracy)}`}>
                ±{ubicacionSalida.accuracy || 0}m ({getAccuracyLabel(ubicacionSalida.accuracy)})
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationDisplay;