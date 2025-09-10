import React, { useState, useEffect } from 'react';
import { differenceInSeconds } from 'date-fns';

interface CronometrosEspecificosProps {
  alarma: {
    id: string;
    created_at: string;
    attended_at?: string;
    tiempo_asignacion?: string;
    supervisor_llegada?: string;
    supervisor_salida?: string;
    estado: string;
  };
}

interface CronometroEstado {
  tiempo: number;
  color: 'green' | 'red';
}

const CronometrosEspecificos: React.FC<CronometrosEspecificosProps> = ({ alarma }) => {
  const [cronometros, setCronometros] = useState<{
    aceptacion_despachador: CronometroEstado;
    despachador_envio: CronometroEstado;
    supervisor_aceptacion: CronometroEstado;
    supervisor_llegada: CronometroEstado;
    supervisor_salida: CronometroEstado;
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
      const fechaCreacion = new Date(alarma.created_at);
      const fechaAtencion = alarma.attended_at ? new Date(alarma.attended_at) : null;
      const fechaAsignacion = alarma.tiempo_asignacion ? new Date(alarma.tiempo_asignacion) : null;
      const fechaLlegada = alarma.supervisor_llegada ? new Date(alarma.supervisor_llegada) : null;
      const fechaSalida = alarma.supervisor_salida ? new Date(alarma.supervisor_salida) : null;

      const nuevosCronometros = {
        // Aceptación Despachador: desde creación hasta atención (o actual si no hay atención)
        aceptacion_despachador: {
          tiempo: fechaAtencion 
            ? differenceInSeconds(fechaAtencion, fechaCreacion)
            : differenceInSeconds(ahora, fechaCreacion),
          color: (!fechaAtencion && differenceInSeconds(ahora, fechaCreacion) > 300) ? 'red' : 'green' as 'green' | 'red'
        },
        
        // Despachador envío: desde atención hasta asignación (o 0 si no hay atención)
        despachador_envio: {
          tiempo: fechaAtencion && fechaAsignacion 
            ? differenceInSeconds(fechaAsignacion, fechaAtencion)
            : fechaAtencion ? differenceInSeconds(ahora, fechaAtencion) : 0,
          color: (fechaAtencion && !fechaAsignacion && differenceInSeconds(ahora, fechaAtencion) > 180) ? 'red' : 'green' as 'green' | 'red'
        },
        
        // Supervisor aceptación: desde asignación hasta llegada (o actual si hay asignación)
        supervisor_aceptacion: {
          tiempo: fechaAsignacion && fechaLlegada 
            ? differenceInSeconds(fechaLlegada, fechaAsignacion)
            : fechaAsignacion ? differenceInSeconds(ahora, fechaAsignacion) : 0,
          color: (fechaAsignacion && !fechaLlegada && differenceInSeconds(ahora, fechaAsignacion) > 1200) ? 'red' : 'green' as 'green' | 'red'
        },
        
        // Supervisor llegada: tiempo de permanencia en sitio
        supervisor_llegada: {
          tiempo: fechaLlegada && fechaSalida 
            ? differenceInSeconds(fechaSalida, fechaLlegada)
            : fechaLlegada ? differenceInSeconds(ahora, fechaLlegada) : 0,
          color: (fechaLlegada && !fechaSalida && differenceInSeconds(ahora, fechaLlegada) > 3600) ? 'red' : 'green' as 'green' | 'red'
        },
        
        // Supervisor salida: tiempo total del servicio
        supervisor_salida: {
          tiempo: fechaSalida 
            ? differenceInSeconds(fechaSalida, fechaCreacion)
            : alarma.estado === 'resuelta' ? differenceInSeconds(ahora, fechaCreacion) : 0,
          color: (!fechaSalida && alarma.estado !== 'resuelta' && differenceInSeconds(ahora, fechaCreacion) > 7200) ? 'red' : 'green' as 'green' | 'red'
        }
      };

      setCronometros(nuevosCronometros);
    }, 1000);

    return () => clearInterval(interval);
  }, [alarma]);

  const formatTiempo = (segundos: number) => {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = segundos % 60;
    
    if (horas > 0) {
      return `${horas}:${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
    }
    return `${minutos}:${segs.toString().padStart(2, '0')}`;
  };

  const getColorClass = (color: 'green' | 'red') => {
    return color === 'red' ? 'text-red-600 font-bold' : 'text-green-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="grid grid-cols-5 gap-4">
        <div className="text-center">
          <div className="text-sm text-muted-foreground mb-1">Aceptación</div>
          <div className="text-sm text-muted-foreground mb-2">Despachador</div>
          <div className={`text-lg font-mono ${getColorClass(cronometros.aceptacion_despachador.color)}`}>
            {formatTiempo(cronometros.aceptacion_despachador.tiempo)}
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-sm text-muted-foreground mb-1">Despachador</div>
          <div className="text-sm text-muted-foreground mb-2">envío</div>
          <div className={`text-lg font-mono ${getColorClass(cronometros.despachador_envio.color)}`}>
            {formatTiempo(cronometros.despachador_envio.tiempo)}
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-sm text-muted-foreground mb-1">Supervisor</div>
          <div className="text-sm text-muted-foreground mb-2">aceptación</div>
          <div className={`text-lg font-mono ${getColorClass(cronometros.supervisor_aceptacion.color)}`}>
            {formatTiempo(cronometros.supervisor_aceptacion.tiempo)}
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-sm text-muted-foreground mb-1">Supervisor</div>
          <div className="text-sm text-muted-foreground mb-2">llegada</div>
          <div className={`text-lg font-mono ${getColorClass(cronometros.supervisor_llegada.color)}`}>
            {formatTiempo(cronometros.supervisor_llegada.tiempo)}
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-sm text-muted-foreground mb-1">Supervisor</div>
          <div className="text-sm text-muted-foreground mb-2">salida</div>
          <div className={`text-lg font-mono ${getColorClass(cronometros.supervisor_salida.color)}`}>
            {formatTiempo(cronometros.supervisor_salida.tiempo)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CronometrosEspecificos;