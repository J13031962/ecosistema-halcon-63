import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUserSpecificData } from "@/hooks/useUserSpecificData";
import { useAuthConsolidated } from "@/hooks/useAuthConsolidated";
import { CalendarioTurnosGenerados } from '@/components/personal/CalendarioTurnosGenerados';
import { useSupabaseTurnos } from '@/hooks/useSupabaseTurnos';
import { AlarmaActivaCard } from "@/components/alarmas/AlarmaActivaCard";
import { format, differenceInSeconds, isValid } from "date-fns";
import { 
  AlertTriangle, 
  Phone, 
  Activity,
  Clock,
  CheckCircle,
  User,
  Calendar,
  Users,
  Shield,
  QrCode,
  UserCheck,
  Timer
} from "lucide-react";
import { useSupabaseAlarmas } from "@/hooks/useSupabaseAlarmas";

const CentralAlarmasOperador = () => {
  const { user } = useAuthConsolidated();
  const [mostrarCalendarioTurnos, setMostrarCalendarioTurnos] = useState(false);
  
  // Cargar turnos desde la base de datos
  const { turnosOperador, turnosSupervisor, loading: turnosSupabaseLoading } = useSupabaseTurnos();

  // Cargar todas las alarmas para que los operadores vean lo mismo que el admin
  const { alarmas: todasAlarmas, loading: loadingAll, cancelAlarma } = useSupabaseAlarmas();

  // Todos los usuarios (incluyendo operadores) ahora ven todas las alarmas
  const fuenteAlarmas = todasAlarmas || [];

  // Obtener turnos del operador
  const { data: misTurnos, loading: turnosLoading } = useUserSpecificData({
    table: 'turnos_operador',
    enabled: !!user?.id && user?.role === 'operador_alarmas'
  });

  const alarmasActivas = fuenteAlarmas.filter(a => a.estado === 'activa');
  const alarmasResueltas = fuenteAlarmas.filter(a => a.estado === 'resuelta');
  const turnosHoy = misTurnos?.filter(t => 
    new Date(t.fecha).toDateString() === new Date().toDateString()
  ) || [];

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case "activa": return "destructive";
      case "en_proceso": return "default";
      case "asignada": return "secondary";
      case "resuelta": return "outline";
      default: return "outline";
    }
  };

  const getPriorityColor = (prioridad: string) => {
    switch (prioridad) {
      case "alta": return "text-red-600";
      case "media": return "text-orange-500";
      case "baja": return "text-yellow-500";
      default: return "text-gray-500";
    }
  };

  const calcularDuracion = (inicioStr: string, finStr?: string) => {
    const inicio = new Date(inicioStr);
    const fin = finStr ? new Date(finStr) : new Date();
    const diff = differenceInSeconds(fin, inicio);
    const min = Math.floor(diff / 60);
    const sec = diff % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const loadingAlarmasVista = loadingAll;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Phone className="h-8 w-8 text-primary" />
          Central de Alarmas - Operador
        </h1>
        <p className="text-muted-foreground">
          Panel de control para: {user?.full_name}
        </p>
      </div>

      {/* Estadísticas del operador */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alarmas Activas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {alarmasActivas.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Requieren atención inmediata
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resueltas Hoy</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {alarmasResueltas.filter(a => 
                new Date(a.resolved_at || a.created_at).toDateString() === new Date().toDateString()
              ).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Alarmas resueltas hoy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mi Turno</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {turnosHoy.length > 0 ? turnosHoy[0].turno : 'Sin turno'}
            </div>
            <p className="text-xs text-muted-foreground">
              {turnosHoy.length > 0 ? 
                `${turnosHoy[0].horario_inicio} - ${turnosHoy[0].horario_fin}` : 
                'No programado'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alarmas</CardTitle>
            <Activity className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {fuenteAlarmas.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Todas mis alarmas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alarmas activas */}
      <Card>
        <CardHeader>
          <CardTitle>Alarmas Activas</CardTitle>
          <CardDescription>
            Alarmas que requieren atención inmediata
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingAlarmasVista ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-muted rounded"></div>
              ))}
            </div>
          ) : alarmasActivas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p>No tienes alarmas activas en este momento</p>
              <p className="text-sm">¡Excelente trabajo!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {alarmasActivas.map((alarma) => (
                <AlarmaActivaCard key={alarma.id} alarma={alarma} onCancelar={cancelAlarma} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historial de mis alarmas resueltas */}
      <Card>
        <CardHeader>
          <CardTitle>Mis Alarmas Resueltas Hoy</CardTitle>
          <CardDescription>
            Alarmas que has procesado exitosamente
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingAlarmasVista ? (
            <div className="animate-pulse space-y-4">
              {[1, 2].map(i => (
                <div key={i} className="h-12 bg-muted rounded"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {alarmasResueltas
                .filter(a => 
                  new Date(a.resolved_at || a.created_at).toDateString() === new Date().toDateString()
                )
                .slice(0, 5)
                .map((alarma) => (
                <div key={alarma.id} className="p-3 border rounded-lg bg-green-50 border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-medium">{alarma.tipo}</h5>
                      <p className="text-sm text-muted-foreground">
                        {alarma.direccion}, {alarma.municipio}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-green-600 mb-1">
                        Resuelta
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(alarma.resolved_at || alarma.created_at), 'HH:mm')}
                      </p>
                    </div>
                  </div>
                </div>
              )) || (
                <div className="text-center py-4 text-muted-foreground">
                  <Activity className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                  <p>No has resuelto alarmas hoy aún</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alarmas canceladas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Alarmas Canceladas</CardTitle>
              <CardDescription>
                Alarmas que fueron canceladas en el sistema
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setMostrarCalendarioTurnos(!mostrarCalendarioTurnos)}
            >
              <Calendar className="h-4 w-4 mr-2" />
              {mostrarCalendarioTurnos ? 'Ocultar' : 'Ver'} Calendario
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingAlarmasVista ? (
            <div className="animate-pulse space-y-4">
              {[1, 2].map(i => (
                <div key={i} className="h-12 bg-muted rounded"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {fuenteAlarmas
                .filter(a => a.estado === 'cancelada')
                .slice(0, 5)
                .map((alarma) => (
                <div key={alarma.id} className="p-3 border rounded-lg bg-red-50 border-red-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-medium">{alarma.tipo}</h5>
                      <p className="text-sm text-muted-foreground">
                        {alarma.direccion}, {alarma.municipio}
                      </p>
                      <div className="flex flex-col gap-1 mt-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-green-600">Generada:</span>
                          <span>
                            {alarma.created_at && isValid(new Date(alarma.created_at)) 
                              ? format(new Date(alarma.created_at), 'dd/MM/yyyy HH:mm')
                              : 'Fecha no válida'
                            }
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-red-600">Cancelada:</span>
                          <span>
                            {alarma.created_at && isValid(new Date(alarma.created_at)) 
                              ? format(new Date(alarma.created_at), 'dd/MM/yyyy HH:mm')
                              : 'Fecha no válida'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-red-600 mb-1">
                        Cancelada
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        Duración: calculando...
                      </p>
                    </div>
                  </div>
                </div>
              )) || (
                <div className="text-center py-4 text-muted-foreground">
                  <Activity className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                  <p>No hay alarmas canceladas</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Calendario de turnos (solo visualización) */}
      {mostrarCalendarioTurnos && (
        <Card>
          <CardHeader>
            <CardTitle>Calendario de Turnos del Equipo</CardTitle>
            <CardDescription>
              Visualización de los turnos programados (solo lectura)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CalendarioTurnosGenerados />
          </CardContent>
        </Card>
      )}

    </div>
  );
};

export default CentralAlarmasOperador;
