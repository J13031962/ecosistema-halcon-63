import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, User, MapPin, CheckCircle, X, Phone } from 'lucide-react';
import { format, differenceInSeconds } from 'date-fns';

interface CronometroAlarmaProps {
  alarmaId: string;
  tipo: string;
  cliente: string;
  direccion?: string;
  municipio?: string;
  telefono?: string;
  prioridad: string;
  estado: 'activa' | 'asignada' | 'en_proceso' | 'resuelta';
  created_at: string;
  attended_at?: string;
  tiempo_toma_despachador?: string;
  tiempo_asignacion_supervisor?: string;
  tiempo_aceptacion_supervisor?: string;
  tiempo_primera_lectura_qr?: string;
  tiempo_segunda_lectura_qr?: string;
  supervisor?: string;
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

interface TiempoEstado {
  segundos: number;
  color: 'green' | 'yellow' | 'orange' | 'red' | 'red-blink';
  fase: 'espera_despachador' | 'desplazamiento' | 'en_sitio' | 'finalizada';
}

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
  supervisor,
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
  const [tiempoActual, setTiempoActual] = useState<TiempoEstado>({
    segundos: 0,
    color: 'green',
    fase: 'espera_despachador'
  });

  const [parpadeo, setParpadeo] = useState(false);

  // Estados para cronómetros específicos
  const [cronometrosEspecificos, setCronometrosEspecificos] = useState<{
    aceptacion_despachador: { tiempo: number; color: 'green' | 'red' };
    despachador_envio: { tiempo: number; color: 'green' | 'red' };
    supervisor_aceptacion: { tiempo: number; color: 'green' | 'red' };
    supervisor_llegada: { tiempo: number; color: 'green' | 'red' };
    supervisor_salida: { tiempo: number; color: 'green' | 'red' };
  }>({
    aceptacion_despachador: { tiempo: 0, color: 'green' },
    despachador_envio: { tiempo: 0, color: 'green' },
    supervisor_aceptacion: { tiempo: 0, color: 'green' },
    supervisor_llegada: { tiempo: 0, color: 'green' },
    supervisor_salida: { tiempo: 0, color: 'green' }
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const ahora = new Date();
      const fechaCreacion = new Date(created_at);
      const fechaTomaDespachador = tiempo_toma_despachador ? new Date(tiempo_toma_despachador) : null;
      const fechaAsignacion = tiempo_asignacion_supervisor ? new Date(tiempo_asignacion_supervisor) : null;
      const fechaAceptacion = tiempo_aceptacion_supervisor ? new Date(tiempo_aceptacion_supervisor) : null;
      const fechaPrimeraLectura = tiempo_primera_lectura_qr ? new Date(tiempo_primera_lectura_qr) : null;
      const fechaSegundaLectura = tiempo_segunda_lectura_qr ? new Date(tiempo_segunda_lectura_qr) : null;

      let nuevoEstado: TiempoEstado;

      if (estado === 'resuelta') {
        nuevoEstado = {
          segundos: fechaSegundaLectura ? differenceInSeconds(fechaSegundaLectura, fechaCreacion) : 0,
          color: 'green',
          fase: 'finalizada'
        };
      } else if (fechaSegundaLectura) {
        // Servicio completado - mostrar tiempo total
        nuevoEstado = {
          segundos: differenceInSeconds(fechaSegundaLectura, fechaCreacion),
          color: 'green',
          fase: 'finalizada'
        };
      } else if (fechaPrimeraLectura) {
        // Supervisor en sitio - contar tiempo desde llegada
        const segundosEnSitio = differenceInSeconds(ahora, fechaPrimeraLectura);
        let color: TiempoEstado['color'] = 'green';
        
        if (segundosEnSitio > 3600) { // 1+ hora
          color = 'red';
        } else if (segundosEnSitio > 2400) { // 40+ minutos
          color = 'orange';
        } else if (segundosEnSitio > 1800) { // 30+ minutos
          color = 'yellow';
        }

        nuevoEstado = {
          segundos: segundosEnSitio,
          color,
          fase: 'en_sitio'
        };
      } else if (fechaAsignacion) {
        // Asignada a supervisor, contando tiempo de desplazamiento
        const segundosDesplazamiento = differenceInSeconds(ahora, fechaAsignacion);
        let color: TiempoEstado['color'] = 'green';
        
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
      } else if (estado === 'en_proceso' && fechaTomaDespachador) {
        // Despachador tomó la alarma, esperando asignación
        const segundosDesdeAtencion = differenceInSeconds(ahora, fechaTomaDespachador);
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
      } else {
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
      }

      setTiempoActual(nuevoEstado);
      
      // Calcular cronómetros específicos según el nuevo flujo solicitado
      const nuevosCronometros = {
        // 1. Aceptación Despachador: Desde creación hasta clic en alarma (tiempo_toma_despachador)
        aceptacion_despachador: {
          tiempo: fechaTomaDespachador 
            ? differenceInSeconds(fechaTomaDespachador, fechaCreacion)
            : differenceInSeconds(ahora, fechaCreacion),
          color: (!fechaTomaDespachador && differenceInSeconds(ahora, fechaCreacion) > 240) ? 'red' : 'green' as 'green' | 'red'
        },
        
        // 2. Despachador envío: Desde clic en alarma hasta asignación de supervisor
        despachador_envio: {
          tiempo: fechaTomaDespachador && fechaAsignacion 
            ? differenceInSeconds(fechaAsignacion, fechaTomaDespachador)
            : fechaTomaDespachador 
              ? differenceInSeconds(ahora, fechaTomaDespachador) 
              : 0,
          color: (fechaTomaDespachador && !fechaAsignacion && differenceInSeconds(ahora, fechaTomaDespachador) > 360) ? 'red' : 'green' as 'green' | 'red'
        },
        
        // 3. Supervisor aceptación: Desde asignación hasta que supervisor acepta
        supervisor_aceptacion: {
          tiempo: fechaAsignacion && fechaAceptacion
            ? differenceInSeconds(fechaAceptacion, fechaAsignacion)
            : fechaAsignacion 
              ? differenceInSeconds(ahora, fechaAsignacion) 
              : 0,
          color: (fechaAsignacion && !fechaAceptacion && differenceInSeconds(ahora, fechaAsignacion) > 300) ? 'red' : 'green' as 'green' | 'red'
        },
        
        // 4. Supervisor llegada: Desde aceptación hasta primer QR
        supervisor_llegada: {
          tiempo: fechaAceptacion && fechaPrimeraLectura 
            ? differenceInSeconds(fechaPrimeraLectura, fechaAceptacion)
            : fechaAceptacion ? differenceInSeconds(ahora, fechaAceptacion) : 0,
          color: (fechaAceptacion && !fechaPrimeraLectura && differenceInSeconds(ahora, fechaAceptacion) > 1200) ? 'red' : 'green' as 'green' | 'red'
        },
        
        // 5. Supervisor salida: Desde primer QR hasta segundo QR
        supervisor_salida: {
          tiempo: fechaPrimeraLectura && fechaSegundaLectura 
            ? differenceInSeconds(fechaSegundaLectura, fechaPrimeraLectura)
            : fechaPrimeraLectura ? differenceInSeconds(ahora, fechaPrimeraLectura) : 0,
          color: (fechaPrimeraLectura && !fechaSegundaLectura && differenceInSeconds(ahora, fechaPrimeraLectura) > 3600) ? 'red' : 'green' as 'green' | 'red'
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
  }, [created_at, tiempo_toma_despachador, tiempo_asignacion_supervisor, tiempo_aceptacion_supervisor, tiempo_primera_lectura_qr, tiempo_segunda_lectura_qr, estado]);

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
    const baseClasses = `p-3 border rounded-lg cursor-pointer transition-all duration-300 ${
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

  const getColorClassForTimer = (color: 'green' | 'red') => {
    return color === 'red' ? 'text-red-600 font-bold' : 'text-green-600';
  };

  return (
    <div className={getCardClasses()} onClick={onSelect}>
      <div className="space-y-2">
        {/* Header compacto */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium">{tipo}</span>
            <Badge variant={getPriorityColor(prioridad)} className="text-xs px-1 py-0">
              {prioridad}
            </Badge>
          </div>
          {/* Tiempo total en la parte superior derecha */}
          <div className="text-right">
            <div className={`text-sm font-bold ${getTiempoColor()}`}>
              {formatTiempo(tiempoActual.segundos)}
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
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white h-6 px-2 text-xs"
            >
              <User className="h-3 w-3 mr-1" />
              Asignar Supervisor
            </Button>
          </div>
        )}

        {/* Botones del supervisor */}
        {userRole === 'supervisor_motorizado' && estado === 'asignada' && supervisor && currentUserName && supervisor.includes(currentUserName) && (
          <div className="space-y-2">
            {/* Botón Atender - aparece cuando el servicio está asignado al supervisor */}
            {!tiempo_aceptacion_supervisor && (
              <div className="flex justify-center">
                <Button
                  variant="default"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSupervisorAccept?.(alarmaId);
                  }}
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
                  onClick={(e) => {
                    e.stopPropagation();
                    onSupervisorArrive?.(alarmaId);
                  }}
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
                  onClick={(e) => {
                    e.stopPropagation();
                    onSupervisorLeave?.(alarmaId);
                  }}
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
        {showCancelButton && estado !== 'resuelta' && onCancel && (
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

        {/* Cronómetros específicos según el nuevo flujo de usuario */}
        <div className="bg-muted/20 rounded p-2 border-t">
          <div className="grid grid-cols-4 gap-2 text-center">
            {/* 1. Aceptación Despachador: Desde creación hasta asignación de supervisor */}
            <div>
              <div className="text-xs text-muted-foreground leading-tight">Aceptación</div>
              <div className="text-xs text-muted-foreground leading-tight">Despachador</div>
              <div className="flex items-center justify-center mt-1">
                <Clock className="h-3 w-3 mr-1 text-blue-500" />
                <div className={`text-xs font-mono font-bold ${getColorClassForTimer(cronometrosEspecificos.aceptacion_despachador.color)}`}>
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
                <div className={`text-xs font-mono font-bold ${getColorClassForTimer(cronometrosEspecificos.despachador_envio.color)}`}>
                  {formatTiempo(cronometrosEspecificos.despachador_envio.tiempo)}
                </div>
              </div>
            </div>
            
            {/* 3. Supervisor llegada: Desde que acepta servicio hasta escaneo QR llegada */}
            <div>
              <div className="text-xs text-muted-foreground leading-tight">Supervisor</div>
              <div className="text-xs text-muted-foreground leading-tight">llegada</div>
              <div className="flex items-center justify-center mt-1">
                <Clock className="h-3 w-3 mr-1 text-teal-500" />
                <div className={`text-xs font-mono font-bold ${getColorClassForTimer(cronometrosEspecificos.supervisor_llegada.color)}`}>
                  {formatTiempo(cronometrosEspecificos.supervisor_llegada.tiempo)}
                </div>
              </div>
            </div>
            
            {/* 4. Supervisor salida: Desde QR llegada hasta QR salida */}
            <div>
              <div className="text-xs text-muted-foreground leading-tight">Supervisor</div>
              <div className="text-xs text-muted-foreground leading-tight">salida</div>
              <div className="flex items-center justify-center mt-1">
                <Clock className="h-3 w-3 mr-1 text-cyan-500" />
                <div className={`text-xs font-mono font-bold ${getColorClassForTimer(cronometrosEspecificos.supervisor_salida.color)}`}>
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

export default CronometroAlarma;