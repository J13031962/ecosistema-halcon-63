import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUserSpecificData } from "@/hooks/useUserSpecificData";
import { useAuthConsolidated } from "@/hooks/useAuthConsolidated";
import { CalendarioTurnosGenerados } from "@/components/personal/CalendarioTurnosGenerados";
import { format, differenceInSeconds } from "date-fns";
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

  // Obtener alarmas específicas del operador (solo si es operador)
  const { data: misAlarmas, loading: alarmasLoading } = useUserSpecificData({
    table: 'alarmas',
    enabled: !!user?.id && user?.role === 'operador_alarmas'
  });

  // Para roles distintos a operador, cargamos todas las alarmas de la central
  const { alarmas: todasAlarmas, loading: loadingAll } = useSupabaseAlarmas();

  // Fuente unificada de alarmas para la vista
  const fuenteAlarmas = (user?.role === 'operador_alarmas') ? (misAlarmas || []) : (todasAlarmas || []);

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

  const loadingAlarmasVista = (user?.role === 'operador_alarmas') ? alarmasLoading : loadingAll;

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
                new Date(a.resolved_at || a.updated_at).toDateString() === new Date().toDateString()
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
              {alarmasActivas.map((alarma) => {
                const total = calcularDuracion(alarma.created_at);
                const tDesp = alarma.tiempo_toma_despachador ? calcularDuracion(alarma.created_at, alarma.tiempo_toma_despachador) : null;
                const tAsign = alarma.tiempo_asignacion_supervisor && alarma.tiempo_toma_despachador ? calcularDuracion(alarma.tiempo_toma_despachador, alarma.tiempo_asignacion_supervisor) : null;
                const tAcept = alarma.tiempo_aceptacion_supervisor && alarma.tiempo_asignacion_supervisor ? calcularDuracion(alarma.tiempo_asignacion_supervisor, alarma.tiempo_aceptacion_supervisor) : null;
                const tQR1 = alarma.tiempo_primera_lectura_qr && alarma.tiempo_aceptacion_supervisor ? calcularDuracion(alarma.tiempo_aceptacion_supervisor, alarma.tiempo_primera_lectura_qr) : null;
                const tQR2 = alarma.tiempo_segunda_lectura_qr && alarma.tiempo_primera_lectura_qr ? calcularDuracion(alarma.tiempo_primera_lectura_qr, alarma.tiempo_segunda_lectura_qr) : null;

                return (
                  <div key={alarma.id} className="p-4 border rounded-lg bg-red-50 border-red-200">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{alarma.tipo}</h4>
                          <Badge 
                            variant="outline" 
                            className={getPriorityColor(alarma.prioridad)}
                          >
                            {alarma.prioridad}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          📍 {alarma.direccion}, {alarma.municipio}
                        </p>
                        {alarma.descripcion && (
                          <p className="text-sm mt-1">
                            <strong>Descripción:</strong> {alarma.descripcion}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col items-end min-w-[220px] gap-1">
                        <div className="grid grid-cols-3 gap-2 text-right">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xl font-bold">{total}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <UserCheck className="h-3 w-3 text-blue-500" />
                            <span className={`text-lg font-semibold ${tDesp ? 'text-green-600' : 'text-gray-400'}`}>{tDesp || '0:00'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3 text-purple-500" />
                            <span className={`text-lg font-semibold ${tAsign ? 'text-orange-600' : 'text-gray-400'}`}>{tAsign || '0:00'}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-right mt-1">
                          <div className="flex items-center gap-1">
                            <Shield className="h-3 w-3 text-green-500" />
                            <span className={`text-sm font-medium ${tAcept ? 'text-green-600' : 'text-gray-400'}`}>{tAcept || '0:00'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <QrCode className="h-3 w-3 text-orange-500" />
                            <span className={`text-sm font-medium ${tQR1 ? 'text-blue-600' : 'text-gray-400'}`}>{tQR1 || '0:00'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <QrCode className="h-3 w-3 text-teal-500" />
                            <span className={`text-sm font-medium ${tQR2 ? 'text-teal-600' : 'text-gray-400'}`}>{tQR2 || '0:00'}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground mt-1">
                          <span>Tiempo Total</span>
                          <span>Despachador</span>
                          <span>Asignación</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                          <span>Aceptación</span>
                          <span>Llegada</span>
                          <span>Finalización</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
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
          {alarmasLoading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2].map(i => (
                <div key={i} className="h-12 bg-muted rounded"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {alarmasResueltas
                .filter(a => 
                  new Date(a.resolved_at || a.updated_at).toDateString() === new Date().toDateString()
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
                        {format(new Date(alarma.resolved_at || alarma.updated_at), 'HH:mm')}
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

      {/* Información del turno */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Mi Turno de Hoy</CardTitle>
              <CardDescription>
                Información sobre tu horario asignado
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
          {turnosLoading ? (
            <div className="animate-pulse">
              <div className="h-16 bg-muted rounded"></div>
            </div>
          ) : turnosHoy.length > 0 ? (
            <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {user?.full_name}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Turno: {turnosHoy[0].turno}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {turnosHoy[0].horario_inicio} - {turnosHoy[0].horario_fin}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(turnosHoy[0].fecha), 'dd/MM/yyyy')}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>No tienes turnos programados para hoy</p>
              <p className="text-sm">Consulta con tu supervisor</p>
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