import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSupervisorGPSTracking } from '@/hooks/useSupervisorGPSTracking';

interface SupervisorGPSStatusProps {
  supervisorId: string;
  className?: string;
}

export const SupervisorGPSStatus = ({ supervisorId, className }: SupervisorGPSStatusProps) => {
  const { toast } = useToast();
  const [isManualUpdate, setIsManualUpdate] = useState(false);
  
  const {
    currentPosition,
    isTracking,
    lastUpdate,
    error,
    hasPermission,
    updateGPSPosition,
    startTracking,
    stopTracking
  } = useSupervisorGPSTracking({
    supervisorId,
    isActive: false, // No auto-start, will be controlled manually
    updateInterval: 180000 // 3 minutes
  });

  const handleManualUpdate = async () => {
    setIsManualUpdate(true);
    try {
      await updateGPSPosition(true);
    } catch (error) {
      console.error('Error updating GPS:', error);
    } finally {
      setIsManualUpdate(false);
    }
  };

  const handleToggleTracking = async () => {
    if (isTracking) {
      stopTracking();
      toast({
        title: "GPS Desactivado",
        description: "El rastreo automático ha sido detenido",
      });
    } else {
      const success = await startTracking();
      if (!success) {
        toast({
          title: "Error GPS",
          description: "No se pudo activar el rastreo GPS. Verifique los permisos.",
          variant: "destructive",
        });
      }
    }
  };

  const getStatusColor = () => {
    if (error) return 'destructive';
    if (isTracking) return 'default';
    if (hasPermission === false) return 'secondary';
    return 'outline';
  };

  const getStatusText = () => {
    if (error) return 'Error GPS';
    if (isTracking) return 'GPS Activo';
    if (hasPermission === false) return 'Sin Permisos';
    return 'GPS Inactivo';
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Status Badge */}
      <div className="flex items-center gap-2">
        <Badge variant={getStatusColor()} className="flex items-center gap-1">
          {isTracking ? (
            <Navigation className="h-3 w-3" />
          ) : error ? (
            <AlertCircle className="h-3 w-3" />
          ) : (
            <MapPin className="h-3 w-3" />
          )}
          {getStatusText()}
        </Badge>
        
        {lastUpdate && (
          <span className="text-xs text-muted-foreground">
            Actualizado: {lastUpdate.toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Current Position */}
      {currentPosition && (
        <div className="text-xs text-muted-foreground">
          📍 {currentPosition.latitude.toFixed(6)}, {currentPosition.longitude.toFixed(6)}
          {currentPosition.precision && (
            <span className="ml-1">
              (±{Math.round(currentPosition.precision)}m)
            </span>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="text-xs text-destructive">
          {error}
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleToggleTracking}
          disabled={hasPermission === false}
        >
          {isTracking ? 'Desactivar GPS' : 'Activar GPS'}
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleManualUpdate}
          disabled={!hasPermission || isManualUpdate}
        >
          {isManualUpdate ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Navigation className="h-3 w-3" />
          )}
          Actualizar
        </Button>
      </div>

      {/* Permission Request */}
      {hasPermission === false && (
        <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
          Para activar el GPS, debe permitir el acceso a la ubicación cuando se lo solicite el navegador.
        </div>
      )}
    </div>
  );
};