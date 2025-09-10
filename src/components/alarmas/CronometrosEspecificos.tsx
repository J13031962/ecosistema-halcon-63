import React, { useState, useEffect } from 'react';
import { differenceInSeconds } from 'date-fns';

interface CronometrosEspecificosProps {
  alarma: {
    id: string;
    created_at: string;
    attended_at?: string;
    tiempo_asignacion_supervisor?: string;
    tiempo_primera_lectura_qr?: string;
    tiempo_segunda_lectura_qr?: string;
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
      const fechaAsignacion = alarma.tiempo_asignacion_supervisor ? new Date(alarma.tiempo_asignacion_supervisor) : null;
      const fechaPrimeraLectura = alarma.tiempo_primera_lectura_qr ? new Date(alarma.tiempo_primera_lectura_qr) : null;
      const fechaSegundaLectura = alarma.tiempo_segunda_lectura_qr ? new Date(alarma.tiempo_segunda_lectura_qr) : null;

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
        
        // Supervisor aceptación: desde asignación hasta primera lectura QR (o actual si hay asignación)
        supervisor_aceptacion: {
          tiempo: fechaAsignacion && fechaPrimeraLectura 
            ? differenceInSeconds(fechaPrimeraLectura, fechaAsignacion)
            : fechaAsignacion ? differenceInSeconds(ahora, fechaAsignacion) : 0,
          color: (fechaAsignacion && !fechaPrimeraLectura && differenceInSeconds(ahora, fechaAsignacion) > 1200) ? 'red' : 'green' as 'green' | 'red'
        },
        
        // Supervisor llegada: tiempo entre primera y segunda lectura QR (tiempo en sitio)
        supervisor_llegada: {
          tiempo: fechaPrimeraLectura && fechaSegundaLectura 
            ? differenceInSeconds(fechaSegundaLectura, fechaPrimeraLectura)
            : fechaPrimeraLectura ? differenceInSeconds(ahora, fechaPrimeraLectura) : 0,
          color: (fechaPrimeraLectura && !fechaSegundaLectura && differenceInSeconds(ahora, fechaPrimeraLectura) > 3600) ? 'red' : 'green' as 'green' | 'red'
        },
        
        // Supervisor salida: tiempo total del servicio
        supervisor_salida: {
          tiempo: fechaSegundaLectura 
            ? differenceInSeconds(fechaSegundaLectura, fechaCreacion)
            : alarma.estado === 'resuelta' ? differenceInSeconds(ahora, fechaCreacion) : 0,
          color: (!fechaSegundaLectura && alarma.estado !== 'resuelta' && differenceInSeconds(ahora, fechaCreacion) > 7200) ? 'red' : 'green' as 'green' | 'red'
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