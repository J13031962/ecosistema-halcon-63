import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { differenceInSeconds } from "date-fns";
import { Clock, X } from "lucide-react";

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
  onCancelar?: (alarmaId: string) => void;
}

export const AlarmaActivaCard = ({ alarma, onCancelar }: AlarmaActivaCardProps) => {
  const [tiempos, setTiempos] = useState({
    total: { tiempo: '0:00', segundos: 0 },
    aceptacionDespachador: { tiempo: '0:00', segundos: 0 },
    despachadorEnvio: { tiempo: '0:00', segundos: 0 },
    supervisorAceptacion: { tiempo: '0:00', segundos: 0 },
    supervisorLlegada: { tiempo: '0:00', segundos: 0 },
    supervisorSalida: { tiempo: '0:00', segundos: 0 }
  });

  const calcularTiempo = (inicio: string, fin?: string) => {
    const inicioDate = new Date(inicio);
    const finDate = fin ? new Date(fin) : new Date();
    const diff = differenceInSeconds(finDate, inicioDate);
    const min = Math.floor(diff / 60);
    const sec = diff % 60;
    return {
      tiempo: `${min}:${sec.toString().padStart(2, '0')}`,
      segundos: diff
    };
  };

  const getColorPorTiempo = (segundos: number, tipo: string, completado: boolean) => {
    if (completado) return 'text-green-600';
    
    const minutos = segundos / 60;
    
    switch (tipo) {
      case 'aceptacion':
      case 'envio':
      case 'aceptacion-supervisor':
        if (minutos < 2) return 'text-green-600';
        if (minutos < 4) return 'text-yellow-500';
        if (minutos < 6) return 'text-orange-500';
        return 'text-red-600';
      
      case 'llegada':
        if (minutos < 15) return 'text-green-600';
        if (minutos < 20) return 'text-yellow-500';
        if (minutos < 25) return 'text-orange-500';
        return 'text-red-600';
      
      case 'salida':
        if (minutos < 5) return 'text-red-600';
        if (minutos < 7) return 'text-yellow-500';
        return 'text-green-600';
      
      default:
        return 'text-gray-600';
    }
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
        : { tiempo: '0:00', segundos: 0 };

      // Supervisor aceptación - inicia cuando se asigna y se detiene cuando acepta
      const supAceptacion = alarma.tiempo_asignacion_supervisor
        ? (alarma.tiempo_aceptacion_supervisor
          ? calcularTiempo(alarma.tiempo_asignacion_supervisor, alarma.tiempo_aceptacion_supervisor)
          : calcularTiempo(alarma.tiempo_asignacion_supervisor))
        : { tiempo: '0:00', segundos: 0 };

      // Supervisor llegada - inicia cuando acepta y se detiene en primera lectura QR
      const supLlegada = alarma.tiempo_aceptacion_supervisor
        ? (alarma.tiempo_primera_lectura_qr
          ? calcularTiempo(alarma.tiempo_aceptacion_supervisor, alarma.tiempo_primera_lectura_qr)
          : calcularTiempo(alarma.tiempo_aceptacion_supervisor))
        : { tiempo: '0:00', segundos: 0 };

      // Supervisor salida - inicia en primera lectura y se detiene en segunda lectura QR
      const supSalida = alarma.tiempo_primera_lectura_qr
        ? (alarma.tiempo_segunda_lectura_qr
          ? calcularTiempo(alarma.tiempo_primera_lectura_qr, alarma.tiempo_segunda_lectura_qr)
          : calcularTiempo(alarma.tiempo_primera_lectura_qr))
        : { tiempo: '0:00', segundos: 0 };

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

  const getCardColorAndClass = (tiempoTotalSegundos: number) => {
    const minutos = tiempoTotalSegundos / 60;
    
    if (minutos < 10) {
      return "bg-green-50 border-green-200";
    } else if (minutos < 20) {
      return "bg-yellow-50 border-yellow-200";
    } else if (minutos < 25) {
      return "bg-red-50 border-red-200";
    } else if (minutos >= 30) {
      return "bg-red-50 border-red-200 animate-pulse";
    } else {
      return "bg-red-50 border-red-200";
    }
  };

  const puedeSerCancelada = (tiempoTotalSegundos: number) => {
    const minutos = tiempoTotalSegundos / 60;
    return minutos <= 5;
  };

  return (
    <div className={`p-6 border rounded-lg space-y-4 ${getCardColorAndClass(tiempos.total.segundos)}`}>
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
        <div className="flex items-center gap-4 text-right">
          {puedeSerCancelada(tiempos.total.segundos) && onCancelar && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onCancelar(alarma.id)}
              className="flex items-center gap-1"
            >
              <X className="h-4 w-4" />
              Cancelar
            </Button>
          )}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Tiempo Total</span>
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-2xl font-bold">{tiempos.total.tiempo}</span>
          </div>
        </div>
      </div>

      {/* Cronómetros */}
      <div className="grid grid-cols-5 gap-4">
        <div className="text-center">
          <div className="text-sm text-muted-foreground mb-1 h-8 flex items-center justify-center">
            <span className="text-center leading-tight">Aceptación<br />Despachador</span>
          </div>
          <div className="flex items-center justify-center">
            <Clock className="h-4 w-4 mr-1 text-blue-500" />
            <span className={`text-lg font-bold ${getColorPorTiempo(tiempos.aceptacionDespachador.segundos, 'aceptacion', !!alarma.tiempo_toma_despachador)}`}>
              {tiempos.aceptacionDespachador.tiempo}
            </span>
          </div>
        </div>

        <div className="text-center">
          <div className="text-sm text-muted-foreground mb-1 h-8 flex items-center justify-center">
            <span className="text-center leading-tight">Despachador<br />envío</span>
          </div>
          <div className="flex items-center justify-center">
            <Clock className="h-4 w-4 mr-1 text-purple-500" />
            <span className={`text-lg font-bold ${getColorPorTiempo(tiempos.despachadorEnvio.segundos, 'envio', !!alarma.tiempo_asignacion_supervisor)}`}>
              {tiempos.despachadorEnvio.tiempo}
            </span>
          </div>
        </div>

        <div className="text-center">
          <div className="text-sm text-muted-foreground mb-1 h-8 flex items-center justify-center">
            <span className="text-center leading-tight">Supervisor<br />aceptación</span>
          </div>
          <div className="flex items-center justify-center">
            <Clock className="h-4 w-4 mr-1 text-orange-500" />
            <span className={`text-lg font-bold ${getColorPorTiempo(tiempos.supervisorAceptacion.segundos, 'aceptacion-supervisor', !!alarma.tiempo_aceptacion_supervisor)}`}>
              {tiempos.supervisorAceptacion.tiempo}
            </span>
          </div>
        </div>

        <div className="text-center">
          <div className="text-sm text-muted-foreground mb-1 h-8 flex items-center justify-center">
            <span className="text-center leading-tight">Supervisor<br />llegada</span>
          </div>
          <div className="flex items-center justify-center">
            <Clock className="h-4 w-4 mr-1 text-teal-500" />
            <span className={`text-lg font-bold ${getColorPorTiempo(tiempos.supervisorLlegada.segundos, 'llegada', !!alarma.tiempo_primera_lectura_qr)}`}>
              {tiempos.supervisorLlegada.tiempo}
            </span>
          </div>
        </div>

        <div className="text-center">
          <div className="text-sm text-muted-foreground mb-1 h-8 flex items-center justify-center">
            <span className="text-center leading-tight">Supervisor<br />salida</span>
          </div>
          <div className="flex items-center justify-center">
            <Clock className="h-4 w-4 mr-1 text-cyan-500" />
            <span className={`text-lg font-bold ${getColorPorTiempo(tiempos.supervisorSalida.segundos, 'salida', !!alarma.tiempo_segunda_lectura_qr)}`}>
              {tiempos.supervisorSalida.tiempo}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};