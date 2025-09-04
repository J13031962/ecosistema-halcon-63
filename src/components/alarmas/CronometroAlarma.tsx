import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, User, MapPin, CheckCircle } from 'lucide-react';
import { format, differenceInSeconds } from 'date-fns';

interface CronometroAlarmaProps {
  alarmaId: string;
  tipo: string;
  cliente: string;
  prioridad: string;
  estado: 'activa' | 'asignada' | 'en_proceso' | 'resuelta';
  created_at: string;
  attended_at?: string;
  tiempo_asignacion?: string;
  supervisor?: string;
  patrulla_asignada?: string;
  onSelect?: () => void;
  isSelected?: boolean;
}

interface TiempoEstado {
  segundos: number;
  color: 'green' | 'yellow' | 'orange' | 'red' | 'red-blink';
  fase: 'espera_despachador' | 'desplazamiento' | 'en_sitio' | 'finalizada';
}

const CronometroAlarma: React.FC<CronometroAlarmaProps> = ({
  alarmaId,
  tipo,
  cliente,
  prioridad,
  estado,
  created_at,
  attended_at,
  tiempo_asignacion,
  supervisor,
  patrulla_asignada,
  onSelect,
  isSelected
}) => {
  const [tiempoActual, setTiempoActual] = useState<TiempoEstado>({
    segundos: 0,
    color: 'green',
    fase: 'espera_despachador'
  });

  const [parpadeo, setParpadeo] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const ahora = new Date();
      const fechaCreacion = new Date(created_at);
      const fechaAtencion = attended_at ? new Date(attended_at) : null;
      const fechaAsignacion = tiempo_asignacion ? new Date(tiempo_asignacion) : null;

      let nuevoEstado: TiempoEstado;

      if (estado === 'resuelta') {
        nuevoEstado = {
          segundos: fechaAsignacion ? differenceInSeconds(fechaAsignacion, fechaCreacion) : 0,
          color: 'green',
          fase: 'finalizada'
        };
      } else if (estado === 'activa') {
        // Esperando atención del despachador
        const segundosEspera = differenceInSeconds(ahora, fechaCreacion);
        let color: TiempoEstado['color'] = 'green';
        
        if (segundosEspera > 240) { // 4+ minutos
          color = 'red-blink';
        } else if (segundosEspera > 180) { // 3+ minutos
          color = 'red';
        } else if (segundosEspera > 120) { // 2+ minutos
          color = 'orange';
        } else if (segundosEspera > 60) { // 1+ minuto
          color = 'yellow';
        }

        nuevoEstado = {
          segundos: segundosEspera,
          color,
          fase: 'espera_despachador'
        };
      } else if (estado === 'en_proceso' && fechaAtencion) {
        // Despachador atendió, esperando asignación
        const segundosDesdeAtencion = differenceInSeconds(ahora, fechaAtencion);
        let color: TiempoEstado['color'] = 'green';
        
        if (segundosDesdeAtencion > 240) { // 4+ minutos
          color = 'red-blink';
        } else if (segundosDesdeAtencion > 180) { // 3+ minutos
          color = 'red';
        } else if (segundosDesdeAtencion > 120) { // 2+ minutos
          color = 'orange';
        } else if (segundosDesdeAtencion > 60) { // 1+ minuto
          color = 'yellow';
        }

        nuevoEstado = {
          segundos: segundosDesdeAtencion,
          color,
          fase: 'espera_despachador'
        };
      } else if (estado === 'asignada' && fechaAsignacion) {
        // Asignada a supervisor, contando tiempo de desplazamiento
        const segundosDesplazamiento = differenceInSeconds(ahora, fechaAsignacion);
        let color: TiempoEstado['color'] = 'green';
        
        // Límites para desplazamiento: 15min base, 20min amarillo, 30min naranja, 35min rojo, 40min+ parpadeo
        if (segundosDesplazamiento > 2400) { // 40+ minutos
          color = 'red-blink';
        } else if (segundosDesplazamiento > 2100) { // 35+ minutos
          color = 'red';
        } else if (segundosDesplazamiento > 1800) { // 30+ minutos
          color = 'orange';
        } else if (segundosDesplazamiento > 1200) { // 20+ minutos
          color = 'yellow';
        }

        nuevoEstado = {
          segundos: segundosDesplazamiento,
          color,
          fase: 'desplazamiento'
        };
      } else {
        nuevoEstado = {
          segundos: 0,
          color: 'green',
          fase: 'espera_despachador'
        };
      }

      setTiempoActual(nuevoEstado);
      
      // Controlar parpadeo
      if (nuevoEstado.color === 'red-blink') {
        setParpadeo(prev => !prev);
      } else {
        setParpadeo(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [created_at, attended_at, tiempo_asignacion, estado]);

  const formatTiempo = (segundos: number) => {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = segundos % 60;
    
    if (horas > 0) {
      return `${horas}:${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
    }
    return `${minutos}:${segs.toString().padStart(2, '0')}`;
  };

  const getCardClasses = () => {
    const baseClasses = `p-4 border rounded-lg cursor-pointer transition-all duration-300 ${
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

  const getFaseTexto = () => {
    switch (tiempoActual.fase) {
      case 'espera_despachador':
        return estado === 'activa' ? 'Esperando atención' : 'Esperando asignación';
      case 'desplazamiento':
        return 'En desplazamiento';
      case 'en_sitio':
        return 'En sitio';
      case 'finalizada':
        return 'Finalizada';
      default:
        return 'Pendiente';
    }
  };

  const getPriorityColor = (prioridad: string) => {
    switch (prioridad) {
      case 'alta': return 'destructive';
      case 'media': return 'default';
      case 'baja': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className={getCardClasses()} onClick={onSelect}>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h4 className="font-semibold text-lg">{tipo}</h4>
            <Badge variant={getPriorityColor(prioridad)}>
              {prioridad}
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span className={`text-xl font-mono font-bold ${getTiempoColor()}`}>
              {formatTiempo(tiempoActual.segundos)}
            </span>
          </div>
        </div>

        {/* Cliente y fase */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground font-medium">{cliente}</p>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className={getTiempoColor()}>
              {getFaseTexto()}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {format(new Date(created_at), 'HH:mm')}
            </span>
          </div>
        </div>

        {/* Información de asignación */}
        {supervisor && patrulla_asignada && (
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <User className="h-4 w-4" />
              <span>{supervisor}</span>
            </div>
            <div className="flex items-center space-x-1">
              <MapPin className="h-4 w-4" />
              <span>{patrulla_asignada}</span>
            </div>
          </div>
        )}

        {/* Estado finalizada */}
        {estado === 'resuelta' && (
          <div className="flex items-center space-x-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Servicio completado</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CronometroAlarma;