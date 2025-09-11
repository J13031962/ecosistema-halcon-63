import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, User, MapPin, CheckCircle, X, Phone, Shield } from 'lucide-react';
import { format, differenceInSeconds } from 'date-fns';

interface ServicioPendienteCardProps {
  servicioId: string;
  tipo: string;
  cliente: string;
  direccion?: string;
  municipio?: string;
  telefono?: string;
  prioridad: string;
  estado: 'pendiente' | 'aceptado' | 'en_proceso' | 'completado';
  created_at: string;
  fecha_aceptacion?: string;
  fecha_inicio?: string;
  fecha_finalizacion?: string;
  tecnico_nombre?: string;
  onAssignSupervisor?: () => void;
  showAssignButton?: boolean;
}

interface TiempoEstado {
  segundos: number;
  color: 'green' | 'yellow' | 'orange' | 'red' | 'red-blink';
  fase: 'esperando_asignacion' | 'aceptado' | 'en_proceso' | 'finalizado';
}

const ServicioPendienteCard: React.FC<ServicioPendienteCardProps> = ({
  servicioId,
  tipo,
  cliente,
  direccion,
  municipio,
  telefono,
  prioridad,
  estado,
  created_at,
  fecha_aceptacion,
  fecha_inicio,
  fecha_finalizacion,
  tecnico_nombre,
  onAssignSupervisor,
  showAssignButton = true
}) => {
  const [tiempoActual, setTiempoActual] = useState<TiempoEstado>({
    segundos: 0,
    color: 'green',
    fase: 'esperando_asignacion'
  });

  const [parpadeo, setParpadeo] = useState(false);

  // Estados para cronómetros específicos
  const [cronometrosEspecificos, setCronometrosEspecificos] = useState<{
    aceptacion_despachador: { tiempo: number; color: 'green' | 'red' };
    despachador_envio: { tiempo: number; color: 'green' | 'red' };
    supervisor_aceptacion: { tiempo: number; color: 'green' | 'red' };
    supervisor_llegada: { tiempo: number; color: 'green' | 'red' };
  }>({
    aceptacion_despachador: { tiempo: 0, color: 'green' },
    despachador_envio: { tiempo: 0, color: 'green' },
    supervisor_aceptacion: { tiempo: 0, color: 'green' },
    supervisor_llegada: { tiempo: 0, color: 'green' }
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const ahora = new Date();
      const fechaCreacion = new Date(created_at);
      const fechaAceptacionDate = fecha_aceptacion ? new Date(fecha_aceptacion) : null;
      const fechaInicioDate = fecha_inicio ? new Date(fecha_inicio) : null;
      const fechaFinalizacionDate = fecha_finalizacion ? new Date(fecha_finalizacion) : null;

      let nuevoEstado: TiempoEstado;

      if (estado === 'completado' && fechaFinalizacionDate) {
        nuevoEstado = {
          segundos: differenceInSeconds(fechaFinalizacionDate, fechaCreacion),
          color: 'green',
          fase: 'finalizado'
        };
      } else if (estado === 'en_proceso' && fechaInicioDate) {
        const segundosEnProceso = differenceInSeconds(ahora, fechaInicioDate);
        let color: TiempoEstado['color'] = 'green';
        
        if (segundosEnProceso > 14400) { // 4+ horas
          color = 'red';
        } else if (segundosEnProceso > 10800) { // 3+ horas
          color = 'orange';
        } else if (segundosEnProceso > 7200) { // 2+ horas
          color = 'yellow';
        }

        nuevoEstado = {
          segundos: segundosEnProceso,
          color,
          fase: 'en_proceso'
        };
      } else if (estado === 'aceptado' && fechaAceptacionDate) {
        const segundosDesdeAceptacion = differenceInSeconds(ahora, fechaAceptacionDate);
        let color: TiempoEstado['color'] = 'green';
        
        if (segundosDesdeAceptacion > 1800) { // 30+ minutos
          color = 'red-blink';
        } else if (segundosDesdeAceptacion > 1200) { // 20+ minutos
          color = 'red';
        } else if (segundosDesdeAceptacion > 600) { // 10+ minutos
          color = 'orange';
        } else if (segundosDesdeAceptacion > 300) { // 5+ minutos
          color = 'yellow';
        }

        nuevoEstado = {
          segundos: segundosDesdeAceptacion,
          color,
          fase: 'aceptado'
        };
      } else {
        // Esperando asignación
        const segundosEspera = differenceInSeconds(ahora, fechaCreacion);
        let color: TiempoEstado['color'] = 'green';
        
        if (segundosEspera > 1800) { // 30+ minutos
          color = 'red-blink';
        } else if (segundosEspera > 1200) { // 20+ minutos
          color = 'red';
        } else if (segundosEspera > 600) { // 10+ minutos
          color = 'orange';
        } else if (segundosEspera > 300) { // 5+ minutos
          color = 'yellow';
        }

        nuevoEstado = {
          segundos: segundosEspera,
          color,
          fase: 'esperando_asignacion'
        };
      }

      setTiempoActual(nuevoEstado);
      
      // Calcular cronómetros específicos
      const nuevosCronometros = {
        // Tiempo hasta asignación de técnico
        aceptacion_despachador: {
          tiempo: fechaAceptacionDate 
            ? differenceInSeconds(fechaAceptacionDate, fechaCreacion)
            : differenceInSeconds(ahora, fechaCreacion),
          color: (!fechaAceptacionDate && differenceInSeconds(ahora, fechaCreacion) > 600) ? 'red' : 'green' as 'green' | 'red'
        },
        // Tiempo hasta inicio del trabajo
        despachador_envio: {
          tiempo: fechaAceptacionDate && fechaInicioDate 
            ? differenceInSeconds(fechaInicioDate, fechaAceptacionDate)
            : fechaAceptacionDate ? differenceInSeconds(ahora, fechaAceptacionDate) : 0,
          color: (fechaAceptacionDate && !fechaInicioDate && differenceInSeconds(ahora, fechaAceptacionDate) > 1800) ? 'red' : 'green' as 'green' | 'red'
        },
        // Tiempo de trabajo (desde inicio hasta finalización)
        supervisor_aceptacion: {
          tiempo: fechaInicioDate && fechaFinalizacionDate 
            ? differenceInSeconds(fechaFinalizacionDate, fechaInicioDate)
            : fechaInicioDate ? differenceInSeconds(ahora, fechaInicioDate) : 0,
          color: (fechaInicioDate && !fechaFinalizacionDate && differenceInSeconds(ahora, fechaInicioDate) > 14400) ? 'red' : 'green' as 'green' | 'red'
        },
        // Tiempo total
        supervisor_llegada: {
          tiempo: fechaFinalizacionDate 
            ? differenceInSeconds(fechaFinalizacionDate, fechaCreacion)
            : estado === 'completado' ? differenceInSeconds(ahora, fechaCreacion) : differenceInSeconds(ahora, fechaCreacion),
          color: (!fechaFinalizacionDate && estado !== 'completado' && differenceInSeconds(ahora, fechaCreacion) > 28800) ? 'red' : 'green' as 'green' | 'red'
        }
      };

      setCronometrosEspecificos(nuevosCronometros);
      
      // Controlar parpadeo
      if (nuevoEstado.color === 'red-blink') {
        setParpadeo(prev => !prev);
      } else {
        setParpadeo(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [created_at, fecha_aceptacion, fecha_inicio, fecha_finalizacion, estado]);

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
    const baseClasses = `p-3 border rounded-lg transition-all duration-300`;

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
      case 'esperando_asignacion':
        return 'Esperando atención';
      case 'aceptado':
        return 'Técnico asignado';
      case 'en_proceso':
        return 'En progreso';
      case 'finalizado':
        return 'Finalizado';
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

  const getColorClassForTimer = (color: 'green' | 'red') => {
    return color === 'red' ? 'text-red-600 font-bold' : 'text-green-600';
  };

  return (
    <div className={getCardClasses()}>
      <div className="space-y-2">
        {/* Header compacto */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium">{tipo}</span>
            <Badge variant={getPriorityColor(prioridad)} className="text-xs px-1 py-0">
              {prioridad}
            </Badge>
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

        {/* Estado y asignación de técnico compacto */}
        <div className="bg-muted/50 rounded p-2 text-center">
          <div className="text-xs text-muted-foreground mb-1">{getFaseTexto()}</div>
          <div className={`text-base font-bold ${getTiempoColor()}`}>
            {formatTiempo(tiempoActual.segundos)}
          </div>
          
          <div className="flex justify-between items-center mt-1 text-xs text-muted-foreground">
            <span>Supervisor:</span>
            <span className="font-bold text-base text-foreground">
              {tecnico_nombre ? tecnico_nombre : "Sin asignar"}
            </span>
          </div>
        </div>

        {/* Botón de asignar supervisor */}
        {showAssignButton && estado === 'pendiente' && !tecnico_nombre && onAssignSupervisor && (
          <div className="flex justify-center">
            <Button
              variant="default"
              size="sm"
              onClick={onAssignSupervisor}
              className="bg-blue-600 hover:bg-blue-700 text-white h-7 px-3 text-xs"
            >
              <Shield className="h-3 w-3 mr-1" />
              Asignar Supervisor
            </Button>
          </div>
        )}

        {/* Estado finalizada */}
        {estado === 'completado' && (
          <div className="flex items-center justify-center space-x-1 text-green-600">
            <CheckCircle className="h-3 w-3" />
            <span className="text-xs font-medium">Servicio completado</span>
          </div>
        )}

        {/* Cronómetros específicos compactos */}
        <div className="bg-muted/20 rounded p-1 border-t">
          <div className="grid grid-cols-4 gap-1 text-center">
            <div>
              <div className="text-xs text-muted-foreground leading-tight">Aceptación</div>
              <div className="text-xs text-muted-foreground leading-tight">Despachador</div>
              <div className={`text-xs font-mono font-bold ${getColorClassForTimer(cronometrosEspecificos.aceptacion_despachador.color)}`}>
                {formatTiempo(cronometrosEspecificos.aceptacion_despachador.tiempo)}
              </div>
            </div>
            
            <div>
              <div className="text-xs text-muted-foreground leading-tight">Supervisor</div>
              <div className="text-xs text-muted-foreground leading-tight">llegada</div>
              <div className={`text-xs font-mono font-bold ${getColorClassForTimer(cronometrosEspecificos.despachador_envio.color)}`}>
                {formatTiempo(cronometrosEspecificos.despachador_envio.tiempo)}
              </div>
            </div>
            
            <div>
              <div className="text-xs text-muted-foreground leading-tight">Supervisor</div>
              <div className="text-xs text-muted-foreground leading-tight">salida</div>
              <div className={`text-xs font-mono font-bold ${getColorClassForTimer(cronometrosEspecificos.supervisor_aceptacion.color)}`}>
                {formatTiempo(cronometrosEspecificos.supervisor_aceptacion.tiempo)}
              </div>
            </div>
            
            <div>
              <div className="text-xs text-muted-foreground leading-tight">Tiempo</div>
              <div className="text-xs text-muted-foreground leading-tight">total</div>
              <div className={`text-xs font-mono font-bold ${getColorClassForTimer(cronometrosEspecificos.supervisor_llegada.color)}`}>
                {formatTiempo(cronometrosEspecificos.supervisor_llegada.tiempo)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServicioPendienteCard;