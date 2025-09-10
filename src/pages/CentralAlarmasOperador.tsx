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
import { useSupabaseAlarmasEnhanced } from "@/hooks/useSupabaseAlarmasEnhanced";
import { useSupabasePatrullas } from "@/hooks/useSupabasePatrullas";
import CronometroAlarma from "@/components/alarmas/CronometroAlarma";

const CentralAlarmasOperador = () => {
  const { user } = useAuthConsolidated();
  const [mostrarCalendarioTurnos, setMostrarCalendarioTurnos] = useState(false);
  
  // Cargar turnos desde la base de datos
  const { turnosOperador, turnosSupervisor, loading: turnosSupabaseLoading } = useSupabaseTurnos();

  // Cargar todas las alarmas para que los operadores vean lo mismo que el admin
  const { alarmas: todasAlarmas, loading: loadingAll, cancelAlarma } = useSupabaseAlarmas();

  // Hook para servicios activos (alarmas enhanced)
  const { 
    alarmas: alarmasEnhanced, 
    loading: loadingEnhanced
  } = useSupabaseAlarmasEnhanced();

  // Hook para patrullas
  const { patrullas, loading: loadingPatrullas } = useSupabasePatrullas();

  // Todos los usuarios (incluyendo operadores) ahora ven todas las alarmas
  const fuenteAlarmas = todasAlarmas || [];

  // Filtrar alarmas para servicios activos
  const alarmasActivas = fuenteAlarmas.filter(a => a.estado === 'activa');
  const alarmasResueltas = fuenteAlarmas.filter(a => a.estado === 'resuelta');
  
  // Servicios activos (alarmas en proceso o asignadas)
  const alarmasActivasServicios = alarmasEnhanced.filter(a => 
    a.estado === 'en_proceso' || a.estado === 'asignada'
  );
  const alarmasPendientes = alarmasEnhanced.filter(a => 
    a.estado === 'activa' && !a.supervisor_id
  );
  const historialAsignaciones = alarmasEnhanced.filter(a => 
    a.estado === 'resuelta' && a.tiempo_salida_sitio
  );

  // Obtener turnos del operador
  const { data: misTurnos, loading: turnosLoading } = useUserSpecificData({
    table: 'turnos_operador',
    enabled: !!user?.id && user?.role === 'operador_alarmas'
  });

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
          Monitoreo de Alarmas - Operador
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
            <CardTitle className="text-sm font-medium">Mis Turnos</CardTitle>
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
            {turnosOperador.length > 0 && (
              <div className="mt-2 text-xs text-muted-foreground">
                Total turnos programados: {turnosOperador.length}
              </div>
            )}
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

      {/* Servicios Activos */}
      <Card>
        <CardHeader>
          <CardTitle>Servicios Activos</CardTitle>
          <CardDescription>
            Servicios asignados y en proceso
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingEnhanced ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Servicios Pendientes de Asignación */}
              {alarmasPendientes.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Servicios Pendientes de Asignación</h3>
                  <div className="space-y-4">
                    {alarmasPendientes.map((alarma) => (
                      <CronometroAlarma
                        key={`pendiente-${alarma.id}`}
                        alarmaId={alarma.id}
                        tipo={alarma.tipo}
                        cliente={alarma.clientes?.nombre || 'Cliente no especificado'}
                        direccion={alarma.direccion || 'Sin dirección'}
                        telefono={alarma.clientes?.telefono || 'Sin teléfono'}
                        prioridad={alarma.prioridad}
                        estado={alarma.estado as 'activa' | 'asignada' | 'en_proceso' | 'resuelta'}
                        created_at={alarma.created_at}
                        attended_at={alarma.attended_at || undefined}
                        tiempo_asignacion_supervisor={alarma.tiempo_asignacion_supervisor || undefined}
                        tiempo_primera_lectura_qr={alarma.tiempo_llegada_sitio || undefined}
                        tiempo_segunda_lectura_qr={alarma.tiempo_salida_sitio || undefined}
                        supervisor={alarma.supervisor || undefined}
                        patrulla_asignada={alarma.patrulla_asignada || undefined}
                        onCancel={() => console.log('Cancelar alarma:', alarma.id)}
                        showCancelButton={false}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Servicios Activos */}
              {alarmasActivasServicios.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Servicios Activos</h3>
                  <div className="space-y-4">
                    {alarmasActivasServicios.map((alarma) => (
                      <CronometroAlarma
                        key={`activa-${alarma.id}`}
                        alarmaId={alarma.id}
                        tipo={alarma.tipo}
                        cliente={alarma.clientes?.nombre || 'Cliente no especificado'}
                        direccion={alarma.direccion || 'Sin dirección'}
                        telefono={alarma.clientes?.telefono || 'Sin teléfono'}
                        prioridad={alarma.prioridad}
                        estado={alarma.estado as 'activa' | 'asignada' | 'en_proceso' | 'resuelta'}
                        created_at={alarma.created_at}
                        attended_at={alarma.attended_at || undefined}
                        tiempo_asignacion_supervisor={alarma.tiempo_asignacion_supervisor || undefined}
                        tiempo_primera_lectura_qr={alarma.tiempo_llegada_sitio || undefined}
                        tiempo_segunda_lectura_qr={alarma.tiempo_salida_sitio || undefined}
                        supervisor={alarma.supervisor || undefined}
                        patrulla_asignada={alarma.patrulla_asignada || undefined}
                        onCancel={() => console.log('Cancelar alarma:', alarma.id)}
                        showCancelButton={false}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Historial de Asignaciones */}
              {historialAsignaciones.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Historial de Asignaciones</h3>
                  <div className="space-y-4">
                    {historialAsignaciones.slice(0, 5).map((alarma) => (
                      <CronometroAlarma
                        key={`historial-${alarma.id}`}
                        alarmaId={alarma.id}
                        tipo={alarma.tipo}
                        cliente={alarma.clientes?.nombre || 'Cliente no especificado'}
                        direccion={alarma.direccion || 'Sin dirección'}
                        telefono={alarma.clientes?.telefono || 'Sin teléfono'}
                        prioridad={alarma.prioridad}
                        estado={alarma.estado as 'activa' | 'asignada' | 'en_proceso' | 'resuelta'}
                        created_at={alarma.created_at}
                        attended_at={alarma.attended_at || undefined}
                        tiempo_asignacion_supervisor={alarma.tiempo_asignacion_supervisor || undefined}
                        tiempo_primera_lectura_qr={alarma.tiempo_llegada_sitio || undefined}
                        tiempo_segunda_lectura_qr={alarma.tiempo_salida_sitio || undefined}
                        supervisor={alarma.supervisor || undefined}
                        patrulla_asignada={alarma.patrulla_asignada || undefined}
                        onCancel={() => console.log('Cancelar alarma:', alarma.id)}
                        showCancelButton={false}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Mensaje cuando no hay servicios */}
              {alarmasPendientes.length === 0 && alarmasActivasServicios.length === 0 && historialAsignaciones.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p>No hay servicios activos en este momento</p>
                  <p className="text-sm">Los servicios aparecerán aquí cuando se asignen supervisores</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Calendario de turnos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Calendario de Turnos</CardTitle>
              <CardDescription>
                Gestión de turnos del operador
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
          <p className="text-sm text-muted-foreground mb-4">
            Haz clic en "Ver Calendario" para consultar los turnos programados del equipo.
          </p>
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
