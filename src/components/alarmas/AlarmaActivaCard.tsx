import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { differenceInSeconds } from "date-fns";
import { Clock } from "lucide-react";

interface AlarmaActivaCardProps {
  alarma: {
    id: string;
    tipo: string;
    prioridad: string;
    direccion?: string;
    municipio?: string;
    descripcion?: string;
    created_at: string;
    tiempo_toma_despachador?: string;
    tiempo_asignacion_supervisor?: string;
    tiempo_aceptacion_supervisor?: string;
    tiempo_primera_lectura_qr?: string;
    tiempo_segunda_lectura_qr?: string;
  };
}

export const AlarmaActivaCard = ({ alarma }: AlarmaActivaCardProps) => {
  const [tiempos, setTiempos] = useState({
    total: '0:00',
    aceptacionDespachador: '0:00',
    despachadorEnvio: '0:00',
    supervisorAceptacion: '0:00',
    supervisorLlegada: '0:00',
    supervisorSalida: '0:00'
  });

  const calcularTiempo = (inicio: string, fin?: string) => {
    const inicioDate = new Date(inicio);
    const finDate = fin ? new Date(fin) : new Date();
    const diff = differenceInSeconds(finDate, inicioDate);
    const min = Math.floor(diff / 60);
    const sec = diff % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const tiempoTotal = calcularTiempo(alarma.created_at);
      
      // Aceptación Despachador - se detiene cuando se toma la alarma
      const aceptacionDesp = alarma.tiempo_toma_despachador 
        ? calcularTiempo(alarma.created_at, alarma.tiempo_toma_despachador)
        : calcularTiempo(alarma.created_at);

      // Despachador envío - inicia cuando se toma y se detiene cuando se asigna supervisor
      const despEnvio = alarma.tiempo_toma_despachador
        ? (alarma.tiempo_asignacion_supervisor 
          ? calcularTiempo(alarma.tiempo_toma_despachador, alarma.tiempo_asignacion_supervisor)
          : calcularTiempo(alarma.tiempo_toma_despachador))
        : '0:00';

      // Supervisor aceptación - inicia cuando se asigna y se detiene cuando acepta
      const supAceptacion = alarma.tiempo_asignacion_supervisor
        ? (alarma.tiempo_aceptacion_supervisor
          ? calcularTiempo(alarma.tiempo_asignacion_supervisor, alarma.tiempo_aceptacion_supervisor)
          : calcularTiempo(alarma.tiempo_asignacion_supervisor))
        : '0:00';

      // Supervisor llegada - inicia cuando acepta y se detiene en primera lectura QR
      const supLlegada = alarma.tiempo_aceptacion_supervisor
        ? (alarma.tiempo_primera_lectura_qr
          ? calcularTiempo(alarma.tiempo_aceptacion_supervisor, alarma.tiempo_primera_lectura_qr)
          : calcularTiempo(alarma.tiempo_aceptacion_supervisor))
        : '0:00';

      // Supervisor salida - inicia en primera lectura y se detiene en segunda lectura QR
      const supSalida = alarma.tiempo_primera_lectura_qr
        ? (alarma.tiempo_segunda_lectura_qr
          ? calcularTiempo(alarma.tiempo_primera_lectura_qr, alarma.tiempo_segunda_lectura_qr)
          : calcularTiempo(alarma.tiempo_primera_lectura_qr))
        : '0:00';

      setTiempos({
        total: tiempoTotal,
        aceptacionDespachador: aceptacionDesp,
        despachadorEnvio: despEnvio,
        supervisorAceptacion: supAceptacion,
        supervisorLlegada: supLlegada,
        supervisorSalida: supSalida
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [alarma]);

  const getPriorityColor = (prioridad: string) => {
    switch (prioridad) {
      case "alta": return "text-red-600";
      case "media": return "text-orange-500";
      case "baja": return "text-yellow-500";
      default: return "text-gray-500";
    }
  };

  const getBadgeVariant = (prioridad: string) => {
    switch (prioridad) {
      case "alta": return "destructive";
      case "media": return "default";
      case "baja": return "secondary";
      default: return "outline";
    }
  };

  return (
    <div className="p-6 border rounded-lg bg-red-50 border-red-200 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="text-lg font-semibold">{alarma.tipo}</h4>
            <Badge variant={getBadgeVariant(alarma.prioridad)}>
              {alarma.prioridad}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            📍 {alarma.direccion}, {alarma.municipio}
          </p>
          {alarma.descripcion && (
            <p className="text-sm mt-2">
              <strong>Descripción:</strong> {alarma.descripcion}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 text-right">
          <span className="text-sm text-muted-foreground">Tiempo Total</span>
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-2xl font-bold">{tiempos.total}</span>
        </div>
      </div>

      {/* Cronómetros */}
      <div className="grid grid-cols-5 gap-4">
        <div className="text-center">
          <div className="text-sm text-muted-foreground mb-1">Aceptación Despachador</div>
          <div className="flex items-center justify-center">
            <Clock className="h-4 w-4 mr-1 text-blue-500" />
            <span className={`text-lg font-bold ${alarma.tiempo_toma_despachador ? 'text-green-600' : 'text-blue-600'}`}>
              {tiempos.aceptacionDespachador}
            </span>
          </div>
        </div>

        <div className="text-center">
          <div className="text-sm text-muted-foreground mb-1">Despachador envío</div>
          <div className="flex items-center justify-center">
            <Clock className="h-4 w-4 mr-1 text-purple-500" />
            <span className={`text-lg font-bold ${alarma.tiempo_asignacion_supervisor ? 'text-green-600' : 'text-purple-600'}`}>
              {tiempos.despachadorEnvio}
            </span>
          </div>
        </div>

        <div className="text-center">
          <div className="text-sm text-muted-foreground mb-1">Supervisor aceptación</div>
          <div className="flex items-center justify-center">
            <Clock className="h-4 w-4 mr-1 text-orange-500" />
            <span className={`text-lg font-bold ${alarma.tiempo_aceptacion_supervisor ? 'text-green-600' : 'text-orange-600'}`}>
              {tiempos.supervisorAceptacion}
            </span>
          </div>
        </div>

        <div className="text-center">
          <div className="text-sm text-muted-foreground mb-1">Supervisor llegada</div>
          <div className="flex items-center justify-center">
            <Clock className="h-4 w-4 mr-1 text-teal-500" />
            <span className={`text-lg font-bold ${alarma.tiempo_primera_lectura_qr ? 'text-green-600' : 'text-teal-600'}`}>
              {tiempos.supervisorLlegada}
            </span>
          </div>
        </div>

        <div className="text-center">
          <div className="text-sm text-muted-foreground mb-1">Supervisor salida</div>
          <div className="flex items-center justify-center">
            <Clock className="h-4 w-4 mr-1 text-cyan-500" />
            <span className={`text-lg font-bold ${alarma.tiempo_segunda_lectura_qr ? 'text-green-600' : 'text-cyan-600'}`}>
              {tiempos.supervisorSalida}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};