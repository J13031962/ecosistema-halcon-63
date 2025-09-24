import React, { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, User, MapPin, CheckCircle, X, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { useOptimizedCronometer } from '@/hooks/useOptimizedCronometer';
import { useGlobalTimer } from '@/hooks/useGlobalTimer';

interface CronometroAlarmaProps {
  alarmaId: string;
  tipo: string;
  cliente: string;
  direccion?: string;
  municipio?: string;
  telefono?: string;
  prioridad: string;
  estado: 'activa' | 'asignada' | 'en_proceso' | 'resuelta' | 'cancelada';
  created_at: string;
  attended_at?: string;
  tiempo_toma_despachador?: string;
  tiempo_asignacion_supervisor?: string;
  tiempo_aceptacion_supervisor?: string;
  tiempo_primera_lectura_qr?: string;
  tiempo_segunda_lectura_qr?: string;
  resolved_at?: string;
  supervisor?: string;
  supervisor_id?: string;
  patrulla_asignada?: string;
  onSelect?: () => void;
  onCancel?: () => void;
  onSupervisorAccept?: (alarmaId: string) => void;
  onSupervisorArrive?: (alarmaId: string) => void;
  onSupervisorLeave?: (alarmaId: string) => void;
  isSelected?: boolean;
  showCancelButton?: boolean;
  showAssignButton?: boolean;
  userRole?: string;
  currentUserId?: string;
  currentUserName?: string;
}

// Interfaces moved to useOptimizedCronometer hook

const CronometroAlarma: React.FC<CronometroAlarmaProps> = ({
  alarmaId,
  tipo,
  cliente,
  direccion,
  municipio,
  telefono,
  prioridad,
  estado,
  created_at,
  attended_at,
  tiempo_toma_despachador,
  tiempo_asignacion_supervisor,
  tiempo_aceptacion_supervisor,
  tiempo_primera_lectura_qr,
  tiempo_segunda_lectura_qr,
  resolved_at,
  supervisor,
  supervisor_id,
  patrulla_asignada,
  onSelect,
  onCancel,
  onSupervisorAccept,
  onSupervisorArrive,
  onSupervisorLeave,
  isSelected,
  showCancelButton,
  showAssignButton,
  userRole,
  currentUserId,
  currentUserName
}) => {
  const [parpadeo, setParpadeo] = useState(false);

  // Use optimized cronometer hook
  const {
    tiempoActual,
    tiempoTotal,
    tiempoHastaLlegada,
    cronometrosEspecificos,
    formatTiempo,
    getFaseTexto
  } = useOptimizedCronometer({
    created_at,
    estado,
    tiempo_toma_despachador,
    tiempo_asignacion_supervisor,
    tiempo_aceptacion_supervisor,
    tiempo_primera_lectura_qr,
    tiempo_segunda_lectura_qr,
    resolved_at
  });

  // Global timer for blinking effect
  const { currentTime } = useGlobalTimer();

  // Memoized supervisor assignment check
  const isAssignedToCurrentSupervisor = React.useMemo(() => {
    if (supervisor_id && currentUserId) {
      return supervisor_id === currentUserId;
    }
    if (supervisor && currentUserName) {
      const s = supervisor.toLowerCase();
      const u = currentUserName.toLowerCase();
      return s.includes(u) || u.includes(s);
    }
    return false;
  }, [supervisor_id, currentUserId, supervisor, currentUserName]);

  // Handle blinking effect based on timer color
  React.useEffect(() => {
    if (tiempoActual.color === 'red-blink') {
      const blinkInterval = setInterval(() => {
        setParpadeo(prev => !prev);
      }, 500); // Blink every 500ms
      
      return () => clearInterval(blinkInterval);
    } else {
      setParpadeo(false);
    }
  }, [tiempoActual.color]);

  // Memoized utility functions to avoid recreation
  const memoizedCallbacks = React.useMemo(() => ({
    onSelectHandler: () => onSelect?.(),
    onCancelHandler: (e: React.MouseEvent) => {
      e.stopPropagation();
      onCancel?.();
    },
    onSupervisorAcceptHandler: (e: React.MouseEvent) => {
      e.stopPropagation();
      onSupervisorAccept?.(alarmaId);
    },
    onSupervisorArriveHandler: (e: React.MouseEvent) => {
      e.stopPropagation();
      onSupervisorArrive?.(alarmaId);
    },
    onSupervisorLeaveHandler: (e: React.MouseEvent) => {
      e.stopPropagation();
      onSupervisorLeave?.(alarmaId);
    }
  }), [onSelect, onCancel, onSupervisorAccept, onSupervisorArrive, onSupervisorLeave, alarmaId]);

  const getCardClasses = () => {
    const baseClasses = `p-2 border rounded-lg cursor-pointer transition-all duration-300 ${
      isSelected ? 'ring-2 ring-primary bg-accent/50' : ''
    }`;

    if (tiempoActual.color === 'red-blink' && parpadeo) {
      return `${baseClasses} bg-red-100 border-red-500 shadow-lg shadow-red-200`;
    }

    switch (tiempoActual.color) {
      case 'green':
        return `${baseClasses} bg-green-50 border-green-200`;
      case 'yellow':
        return `${baseClasses} bg-yellow-50 border-yellow-300`;
      case 'orange':
        return `${baseClasses} bg-orange-50 border-orange-300`;
      case 'red':
      case 'red-blink':
        return `${baseClasses} bg-red-50 border-red-300`;
      default:
        return baseClasses;
    }
  };

  const getTiempoColor = () => {
    if (tiempoActual.color === 'red-blink' && parpadeo) {
      return 'text-red-700 font-bold';
    }

    switch (tiempoActual.color) {
      case 'green':
        return 'text-green-700';
      case 'yellow':
        return 'text-yellow-700';
      case 'orange':
        return 'text-orange-700';
      case 'red':
      case 'red-blink':
        return 'text-red-700';
      default:
        return 'text-foreground';
    }
  };

  // Memoized style functions
  const styleHelpers = React.useMemo(() => ({
    getPriorityColor: (prioridad: string) => {
      switch (prioridad) {
        case 'alta': return 'destructive';
        case 'media': return 'default';
        case 'baja': return 'secondary';
        default: return 'outline';
      }
    },
    getColorClassForTimer: (color: 'green' | 'red') => {
      return color === 'red' ? 'text-red-600 font-bold' : 'text-green-600';
    }
  }), []);

  // Remove these functions as they're now in styleHelpers

  return (
    <div className={getCardClasses()} onClick={onSelect}>
      <div className="space-y-2">
        {/* Header compacto */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium">{tipo}</span>
            <Badge variant={styleHelpers.getPriorityColor(prioridad)} className="text-xs px-1 py-0">
              {prioridad}
            </Badge>
          </div>
          {/* Contadores de tiempo */}
          <div className="text-right space-y-1">
            <div className="flex items-center justify-end gap-2">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <div className={`text-sm font-bold ${getTiempoColor()}`}>
                {formatTiempo(tiempoTotal)}
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <MapPin className="h-3 w-3 text-blue-500" />
              <div className={`text-sm font-bold ${tiempo_primera_lectura_qr ? 'text-green-600' : getTiempoColor()}`}>
                {formatTiempo(tiempoHastaLlegada)}
                {tiempo_primera_lectura_qr && <span className="text-xs text-muted-foreground ml-1">(Llegada)</span>}
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              {getFaseTexto()}
            </div>
          </div>
        </div>

        {/* Fecha y hora compacta */}
        <div className="text-xs text-muted-foreground">
          {format(new Date(created_at), 'dd/MM/yyyy HH:mm:ss')}
        </div>

        {/* Cliente compacto */}
        <div className="space-y-1">
          <h3 className="text-base font-bold leading-tight">{cliente}</h3>
          
          {/* Dirección con icono */}
          {direccion && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{direccion}</span>
              {municipio && <span>• {municipio}</span>}
            </div>
          )}
          
          {/* Teléfono con icono */}
          {telefono && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Phone className="h-3 w-3 flex-shrink-0" />
              <span>{telefono}</span>
            </div>
          )}
        </div>

        {/* Estado y asignación de supervisor compacto */}
        <div className="bg-muted/50 rounded p-2 text-center">
          <div className="text-xs text-muted-foreground mb-1">{getFaseTexto()}</div>
          <div className={`text-base font-bold ${getTiempoColor()}`}>
            {formatTiempo(tiempoActual.segundos)}
          </div>
          
          <div className="flex justify-between items-center mt-1 text-xs text-muted-foreground">
            <span>Supervisor:</span>
            <span className="font-bold text-base text-foreground">
              {supervisor ? supervisor : "Sin asignar"}
            </span>
          </div>
        </div>

        {/* Botón de asignar supervisor */}
        {showAssignButton && estado === 'activa' && !supervisor && onSelect && (
          <div className="flex justify-end">
            <Button
              variant="default"
              size="sm"
              onClick={memoizedCallbacks.onSelectHandler}
              className="bg-blue-600 hover:bg-blue-700 text-white h-6 px-2 text-xs"
            >
              <User className="h-3 w-3 mr-1" />
              Asignar Supervisor
            </Button>
          </div>
        )}

        {/* Botones del supervisor */}
        {userRole === 'supervisor_motorizado' && isAssignedToCurrentSupervisor && (
          <div className="space-y-2">
            {/* Botón Atender - aparece cuando el servicio está asignado al supervisor */}
            {estado === 'asignada' && !tiempo_aceptacion_supervisor && (
              <div className="flex justify-center">
                <Button
                  variant="default"
                  size="sm"
                  onClick={memoizedCallbacks.onSupervisorAcceptHandler}
                  className="bg-green-600 hover:bg-green-700 text-white h-8 px-4 text-sm"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Atender
                </Button>
              </div>
            )}
            
            {/* Botón Marcar Llegada - aparece después de presionar Atender */}
            {tiempo_aceptacion_supervisor && !tiempo_primera_lectura_qr && (
              <div className="flex justify-center">
                <Button
                  variant="default"
                  size="sm"
                  onClick={memoizedCallbacks.onSupervisorArriveHandler}
                  className="bg-blue-600 hover:bg-blue-700 text-white h-8 px-4 text-sm"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Marcar Llegada
                </Button>
              </div>
            )}
            
            {/* Botón Marcar Salida - aparece después de Marcar Llegada */}
            {tiempo_primera_lectura_qr && !tiempo_segunda_lectura_qr && (
              <div className="flex justify-center">
                <Button
                  variant="default"
                  size="sm"
                  onClick={memoizedCallbacks.onSupervisorLeaveHandler}
                  className="bg-orange-600 hover:bg-orange-700 text-white h-8 px-4 text-sm"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Marcar Salida
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Botón de cancelar si está disponible */}
        {showCancelButton && estado !== 'resuelta' && estado !== 'cancelada' && onCancel && (
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onCancel();
              }}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 h-6 px-2 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Cancelar
            </Button>
          </div>
        )}

        {/* Estado finalizada */}
        {estado === 'resuelta' && (
          <div className="flex items-center justify-center space-x-1 text-green-600">
            <CheckCircle className="h-3 w-3" />
            <span className="text-xs font-medium">Servicio completado</span>
          </div>
        )}

        {/* Estado cancelada */}
        {estado === 'cancelada' && (
          <div className="flex items-center justify-center space-x-1 text-red-600">
            <X className="h-3 w-3" />
            <span className="text-xs font-medium">Servicio cancelado</span>
          </div>
        )}

        {/* Cronómetros específicos según el nuevo flujo de usuario */}
        <div className="bg-muted/20 rounded p-1 border-t">
          <div className="grid grid-cols-5 gap-1 text-center">
            {/* 1. Aceptación Despachador: Desde creación hasta asignación de supervisor */}
            <div>
              <div className="text-xs text-muted-foreground leading-tight">Aceptación</div>
              <div className="text-xs text-muted-foreground leading-tight">Despachador</div>
              <div className="flex items-center justify-center mt-1">
                <Clock className="h-3 w-3 mr-1 text-blue-500" />
                <div className={`text-xs font-mono font-bold ${styleHelpers.getColorClassForTimer(cronometrosEspecificos.aceptacion_despachador.color)}`}>
                  {formatTiempo(cronometrosEspecificos.aceptacion_despachador.tiempo)}
                </div>
              </div>
            </div>
            
            {/* 2. Despachador envío: Desde asignación hasta que supervisor acepta */}
            <div>
              <div className="text-xs text-muted-foreground leading-tight">Despachador</div>
              <div className="text-xs text-muted-foreground leading-tight">envío</div>
              <div className="flex items-center justify-center mt-1">
                <Clock className="h-3 w-3 mr-1 text-purple-500" />
                <div className={`text-xs font-mono font-bold ${styleHelpers.getColorClassForTimer(cronometrosEspecificos.despachador_envio.color)}`}>
                  {formatTiempo(cronometrosEspecificos.despachador_envio.tiempo)}
                </div>
              </div>
            </div>
            
            {/* 3. Supervisor aceptación: Desde asignación hasta que presiona "Atender" */}
            <div>
              <div className="text-xs text-muted-foreground leading-tight">Supervisor</div>
              <div className="text-xs text-muted-foreground leading-tight">aceptación</div>
              <div className="flex items-center justify-center mt-1">
                <Clock className="h-3 w-3 mr-1 text-yellow-500" />
                <div className={`text-xs font-mono font-bold ${styleHelpers.getColorClassForTimer(cronometrosEspecificos.supervisor_aceptacion.color)}`}>
                  {formatTiempo(cronometrosEspecificos.supervisor_aceptacion.tiempo)}
                </div>
              </div>
            </div>
            
            {/* 4. Supervisor llegada: Desde que acepta servicio hasta escaneo QR llegada */}
            <div>
              <div className="text-xs text-muted-foreground leading-tight">Supervisor</div>
              <div className="text-xs text-muted-foreground leading-tight">llegada</div>
              <div className="flex items-center justify-center mt-1">
                <Clock className="h-3 w-3 mr-1 text-teal-500" />
                <div className={`text-xs font-mono font-bold ${styleHelpers.getColorClassForTimer(cronometrosEspecificos.supervisor_llegada.color)}`}>
                  {formatTiempo(cronometrosEspecificos.supervisor_llegada.tiempo)}
                </div>
              </div>
            </div>
            
            {/* 5. Supervisor salida: Desde QR llegada hasta QR salida */}
            <div>
              <div className="text-xs text-muted-foreground leading-tight">Supervisor</div>
              <div className="text-xs text-muted-foreground leading-tight">salida</div>
              <div className="flex items-center justify-center mt-1">
                <Clock className="h-3 w-3 mr-1 text-cyan-500" />
                <div className={`text-xs font-mono font-bold ${styleHelpers.getColorClassForTimer(cronometrosEspecificos.supervisor_salida.color)}`}>
                  {formatTiempo(cronometrosEspecificos.supervisor_salida.tiempo)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default React.memo(CronometroAlarma, (prevProps, nextProps) => {
  // Custom comparison function - only re-render if critical props change
  const criticalProps = [
    'estado', 'created_at', 'tiempo_toma_despachador', 'tiempo_asignacion_supervisor',
    'tiempo_aceptacion_supervisor', 'tiempo_primera_lectura_qr', 'tiempo_segunda_lectura_qr',
    'isSelected', 'supervisor', 'supervisor_id'
  ];
  
  return criticalProps.every(prop => prevProps[prop] === nextProps[prop]);
});