import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { 
  AlertTriangle, 
  Clock, 
  MapPin, 
  User, 
  Phone, 
  MessageSquare, 
  PlayCircle, 
  StopCircle,
  Eye,
  CheckCircle
} from "lucide-react";
import { useSupabaseObservaciones } from '@/hooks/useSupabaseObservaciones';
import { useSupabaseEstadosPatrulla } from '@/hooks/useSupabaseEstadosPatrulla';
import { useAuthConsolidatedContext } from '@/contexts/AuthContextConsolidated';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface AlarmaCardProps {
  alarma: {
    id: string;
    tipo: string;
    descripcion: string | null;
    direccion: string | null;
    municipio: string | null;
    prioridad: string;
    estado: string;
    patrulla_asignada: string | null;
    supervisor: string | null;
    numero_zona?: string | null;
    nombre_zona?: string | null;
    tipo_sensor?: string | null;
    observaciones_count: number;
    created_at: string;
    clientes?: {
      nombre: string;
      telefono: string | null;
    } | null;
  };
  showActions?: boolean;
  variant?: 'compact' | 'full';
  onAction?: (action: string, alarmaId: string) => void;
}

const PRIORIDAD_COLORS = {
  'baja': 'secondary',
  'media': 'default', 
  'alta': 'destructive'
} as const;

const ESTADO_COLORS = {
  'activa': 'destructive',
  'en_proceso': 'secondary',
  'asignada': 'default',
  'resuelta': 'outline'
} as const;

export const AlarmaCard = ({ 
  alarma, 
  showActions = false, 
  variant = 'full',
  onAction 
}: AlarmaCardProps) => {
  const [showObservaciones, setShowObservaciones] = useState(false);
  const [nuevaObservacion, setNuevaObservacion] = useState('');
  const [enviandoObservacion, setEnviandoObservacion] = useState(false);
  
  const { observaciones, addObservacion } = useSupabaseObservaciones(alarma.id);
  const { getEstadoByAlarmaId, iniciarPatrulla, finalizarPatrulla } = useSupabaseEstadosPatrulla();
  const { user, hasRole } = useAuthConsolidatedContext();
  const { toast } = useToast();

  const estadoPatrulla = getEstadoByAlarmaId(alarma.id);
  const tiempoTranscurrido = formatDistanceToNow(new Date(alarma.created_at), { 
    addSuffix: true, 
    locale: es 
  });

  const handleEnviarObservacion = async () => {
    if (!nuevaObservacion.trim() || !user) return;
    
    setEnviandoObservacion(true);
    try {
      const result = await addObservacion({
        alarma_id: alarma.id,
        supervisor_id: user.id,
        supervisor_nombre: user.full_name,
        observacion: nuevaObservacion.trim()
      });

      if (result.success) {
        setNuevaObservacion('');
      }
    } finally {
      setEnviandoObservacion(false);
    }
  };

  const handleIniciarPatrulla = async () => {
    if (!user || !hasRole(['supervisor_motorizado'])) return;
    
    const result = await iniciarPatrulla(alarma.id, user.id, user.full_name);
    if (result.success) {
      onAction?.('iniciar_patrulla', alarma.id);
    }
  };

  const handleFinalizarPatrulla = async () => {
    if (!user || !hasRole(['supervisor_motorizado'])) return;
    
    const result = await finalizarPatrulla(alarma.id);
    if (result.success) {
      onAction?.('finalizar_patrulla', alarma.id);
    }
  };

  return (
    <Card className={`w-full transition-all duration-200 hover:shadow-md ${
      alarma.prioridad === 'alta' ? 'ring-1 ring-destructive/20' : ''
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className={`h-4 w-4 ${
                alarma.prioridad === 'alta' ? 'text-destructive' : 
                alarma.prioridad === 'media' ? 'text-warning' : 
                'text-muted-foreground'
              }`} />
              {alarma.tipo}
            </CardTitle>
            <CardDescription className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {tiempoTranscurrido}
              </span>
              {alarma.clientes && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {alarma.clientes.nombre}
                </span>
              )}
            </CardDescription>
          </div>
          
          <div className="flex gap-2">
            <Badge variant={PRIORIDAD_COLORS[alarma.prioridad as keyof typeof PRIORIDAD_COLORS]}>
              {alarma.prioridad.toUpperCase()}
            </Badge>
            <Badge variant={ESTADO_COLORS[alarma.estado as keyof typeof ESTADO_COLORS]}>
              {alarma.estado.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Información básica */}
        <div className="space-y-2">
          {alarma.descripcion && (
            <p className="text-sm text-muted-foreground">
              {alarma.descripcion}
            </p>
          )}
          
          {/* Información de zona (para Fuego y Alarma) */}
          {(alarma.tipo.toLowerCase() === 'fuego' || alarma.tipo.toLowerCase() === 'alarma') && 
           (alarma.numero_zona || alarma.nombre_zona || alarma.tipo_sensor) && (
            <div className="p-3 bg-muted/50 rounded-lg border-l-4 border-l-destructive">
              <h5 className="font-medium text-sm mb-2 text-destructive">🚨 Zona Activada</h5>
              <div className="space-y-1 text-sm">
                {alarma.numero_zona && (
                  <div><strong>Zona:</strong> {alarma.numero_zona}</div>
                )}
                {alarma.nombre_zona && (
                  <div><strong>Ubicación:</strong> {alarma.nombre_zona}</div>
                )}
                {alarma.tipo_sensor && (
                  <div><strong>Sensor:</strong> {alarma.tipo_sensor}</div>
                )}
              </div>
            </div>
          )}
          
          <div className="flex flex-wrap gap-4 text-sm">
            {alarma.direccion && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {alarma.direccion}
                {alarma.municipio && `, ${alarma.municipio}`}
              </span>
            )}
            
            {alarma.clientes?.telefono && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <Phone className="h-3 w-3" />
                {alarma.clientes.telefono}
              </span>
            )}
          </div>
        </div>

        {/* Información de asignación */}
        {(alarma.patrulla_asignada || alarma.supervisor) && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Asignación</h4>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {alarma.patrulla_asignada && (
                  <span>Patrulla: {alarma.patrulla_asignada}</span>
                )}
                {alarma.supervisor && (
                  <span>Supervisor: {alarma.supervisor}</span>
                )}
              </div>
              
              {estadoPatrulla && (
                <div className="flex items-center gap-2 text-sm">
                  {estadoPatrulla.estado === 'iniciada' && estadoPatrulla.tiempo_inicio && (
                    <Badge variant="secondary" className="text-xs">
                      En campo: {formatDistanceToNow(new Date(estadoPatrulla.tiempo_inicio), { locale: es })}
                    </Badge>
                  )}
                  {estadoPatrulla.estado === 'finalizada' && estadoPatrulla.duracion_segundos && (
                    <Badge variant="outline" className="text-xs">
                      Duración: {Math.round(estadoPatrulla.duracion_segundos / 60)} min
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* Observaciones */}
        {(alarma.observaciones_count > 0 || hasRole(['supervisor_motorizado'])) && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Observaciones ({alarma.observaciones_count})
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowObservaciones(!showObservaciones)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>

              {showObservaciones && (
                <div className="space-y-3">
                  {/* Lista de observaciones */}
                  <div className="max-h-32 overflow-y-auto space-y-2">
                    {observaciones.map((obs) => (
                      <div key={obs.id} className="bg-muted/50 p-2 rounded text-sm">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium text-xs">{obs.supervisor_nombre}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(obs.created_at), { 
                              addSuffix: true, 
                              locale: es 
                            })}
                          </span>
                        </div>
                        <p className="text-muted-foreground">{obs.observacion}</p>
                      </div>
                    ))}
                  </div>

                  {/* Agregar nueva observación (solo supervisores) */}
                  {hasRole(['supervisor_motorizado']) && (
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Agregar observación..."
                        value={nuevaObservacion}
                        onChange={(e) => setNuevaObservacion(e.target.value)}
                        rows={2}
                        className="text-sm"
                      />
                      <Button
                        size="sm"
                        onClick={handleEnviarObservacion}
                        disabled={!nuevaObservacion.trim() || enviandoObservacion}
                      >
                        {enviandoObservacion ? 'Enviando...' : 'Agregar'}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* Acciones */}
        {showActions && hasRole(['supervisor_motorizado']) && alarma.estado === 'asignada' && (
          <>
            <Separator />
            <div className="flex gap-2">
              {estadoPatrulla?.estado === 'pendiente' && (
                <Button
                  size="sm"
                  onClick={handleIniciarPatrulla}
                  className="flex-1"
                >
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Iniciar Patrulla
                </Button>
              )}
              
              {estadoPatrulla?.estado === 'iniciada' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleFinalizarPatrulla}
                  className="flex-1"
                >
                  <StopCircle className="h-4 w-4 mr-2" />
                  Finalizar
                </Button>
              )}
              
              {estadoPatrulla?.estado === 'finalizada' && (
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => onAction?.('resolver', alarma.id)}
                  className="flex-1"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Marcar Resuelta
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};