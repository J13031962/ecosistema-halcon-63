import React, { useState, useEffect } from "react";
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
  Timer,
  Car
} from "lucide-react";
import { useSupabaseAlarmas } from "@/hooks/useSupabaseAlarmas";
import { useSupabaseAlarmasEnhanced } from "@/hooks/useSupabaseAlarmasEnhanced";
import { useSupabasePatrullas } from "@/hooks/useSupabasePatrullas";
import CronometroAlarma from "@/components/alarmas/CronometroAlarma";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const CentralAlarmasOperador = () => {
  const { user } = useAuthConsolidated();
  const { toast } = useToast();
  const [mostrarCalendarioTurnos, setMostrarCalendarioTurnos] = useState(false);
  const [realtimeAlarmas, setRealtimeAlarmas] = useState([]);
  
  // Cargar turnos desde la base de datos
  const { turnosOperador, turnosSupervisor, loading: turnosSupabaseLoading } = useSupabaseTurnos();

  // Cargar todas las alarmas para que los operadores vean lo mismo que el admin
  const { alarmas: todasAlarmas, loading: loadingAll, cancelAlarma } = useSupabaseAlarmas();

  // Hook para servicios activos (alarmas enhanced)
  const { 
    alarmas: alarmasEnhanced, 
    loading: loadingEnhanced,
    resolverAlarma
  } = useSupabaseAlarmasEnhanced();

  // Hook para patrullas
  const { patrullas, loading: loadingPatrullas } = useSupabasePatrullas();

  // Configurar actualizaciones en tiempo real
  useEffect(() => {
    setRealtimeAlarmas(alarmasEnhanced);
  }, [alarmasEnhanced]);

  useEffect(() => {
    const channel = supabase
      .channel('alarmas_operador_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'alarmas'
        },
        (payload) => {
          console.log('🔄 Actualización en tiempo real de alarmas (operador):', payload);
          
          if (payload.eventType === 'UPDATE') {
            setRealtimeAlarmas(prev => 
              prev.map(alarma => 
                alarma.id === payload.new.id 
                  ? { ...alarma, ...payload.new }
                  : alarma
              )
            );
          } else if (payload.eventType === 'INSERT') {
            setRealtimeAlarmas(prev => [payload.new as any, ...prev]);
          } else if (payload.eventType === 'DELETE') {
            setRealtimeAlarmas(prev => 
              prev.filter(alarma => alarma.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Todos los usuarios (incluyendo operadores) ahora ven todas las alarmas
  const fuenteAlarmas = todasAlarmas || [];

  // Filtrar alarmas para servicios activos usando realtimeAlarmas
  const alarmasActivas = fuenteAlarmas.filter(a => a.estado === 'activa');
  const alarmasResueltas = fuenteAlarmas.filter(a => a.estado === 'resuelta');
  
  // Servicios en proceso (alarmas en proceso o asignadas) - usando realtimeAlarmas
  const alarmasEnProceso = realtimeAlarmas.filter(a => 
    a.estado === 'en_proceso' || a.estado === 'asignada'
  );
  const alarmasPendientes = realtimeAlarmas.filter(a => 
    a.estado === 'activa' && !a.supervisor_id
  );
  const historialAsignaciones = realtimeAlarmas.filter(a => 
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

  // Funciones del supervisor copiadas de PatrullasActivas
  const handleSupervisorAccept = async (alarmaId: string) => {
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('alarmas')
        .update({ 
          tiempo_aceptacion_supervisor: now,
          estado: 'en_proceso'
        })
        .eq('id', alarmaId);

      if (error) throw error;

      // Actualizar estado local
      setRealtimeAlarmas(prev => prev.map(a => a.id === alarmaId 
        ? { ...a, tiempo_aceptacion_supervisor: now, estado: 'en_proceso' } 
        : a
      ));

      toast({
        title: "Servicio atendido",
        description: "Has aceptado atender este servicio. Ahora puedes marcar tu llegada.",
      });
    } catch (error) {
      console.error('Error al aceptar servicio:', error);
      toast({
        title: "Error",
        description: "No se pudo aceptar el servicio",
        variant: "destructive"
      });
    }
  };

  const handleSupervisorArrive = async (alarmaId: string) => {
    try {
      const now = new Date().toISOString();
      const alarmaActual = realtimeAlarmas.find(a => a.id === alarmaId);
      const updatePayload: any = {
        tiempo_primera_lectura_qr: now,
        estado: 'en_proceso'
      };
      if (!alarmaActual?.tiempo_aceptacion_supervisor) {
        updatePayload.tiempo_aceptacion_supervisor = now;
      }

      const { error } = await supabase
        .from('alarmas')
        .update(updatePayload)
        .eq('id', alarmaId);

      if (error) throw error;

      // Actualizar estado local
      setRealtimeAlarmas(prev => prev.map(a => a.id === alarmaId 
        ? { ...a, ...updatePayload } 
        : a
      ));

      toast({
        title: "Llegada marcada",
        description: "Has marcado tu llegada al sitio. Ahora puedes marcar tu salida cuando termines.",
      });
    } catch (error) {
      console.error('Error al marcar llegada:', error);
      toast({
        title: "Error",
        description: "No se pudo marcar la llegada",
        variant: "destructive"
      });
    }
  };

  const handleSupervisorLeave = async (alarmaId: string) => {
    try {
      const now = new Date().toISOString();
      const alarmaActual = realtimeAlarmas.find(a => a.id === alarmaId);
      const updatePayload: any = {
        tiempo_segunda_lectura_qr: now,
        resolved_at: now,
        estado: 'resuelta'
      };
      if (!alarmaActual?.tiempo_aceptacion_supervisor) {
        updatePayload.tiempo_aceptacion_supervisor = now;
      }
      if (!alarmaActual?.tiempo_primera_lectura_qr) {
        updatePayload.tiempo_primera_lectura_qr = now;
      }

      const { error } = await supabase
        .from('alarmas')
        .update(updatePayload)
        .eq('id', alarmaId);

      if (error) throw error;

      // Actualizar estado local
      setRealtimeAlarmas(prev => prev.map(a => a.id === alarmaId 
        ? { ...a, ...updatePayload } 
        : a
      ));

      toast({
        title: "Servicio completado",
        description: "Has marcado tu salida. El servicio ha sido completado exitosamente.",
      });
    } catch (error) {
      console.error('Error al marcar salida:', error);
      toast({
        title: "Error",
        description: "No se pudo marcar la salida",
        variant: "destructive"
      });
    }
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
            <CardTitle className="text-sm font-medium">Canceladas Hoy</CardTitle>
            <UserCheck className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {fuenteAlarmas.filter(a => 
                a.estado === 'cancelada' && 
                new Date(a.created_at).toDateString() === new Date().toDateString()
              ).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Alarmas canceladas hoy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Proceso</CardTitle>
            <Car className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {alarmasEnProceso.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Servicios en desarrollo
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

      {/* Servicios en Proceso */}
      <Card>
        <CardHeader>
          <CardTitle>Servicios en Proceso</CardTitle>
          <CardDescription>
            Servicios asignados y en desarrollo con seguimiento de tiempos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingEnhanced ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-muted rounded"></div>
              ))}
            </div>
          ) : alarmasEnProceso.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Car className="h-12 w-12 mx-auto mb-4 text-blue-500" />
              <p>No hay servicios en proceso en este momento</p>
              <p className="text-sm">Los servicios asignados aparecerán aquí</p>
            </div>
          ) : (
            <div className="space-y-4">
              {alarmasEnProceso.map((alarma) => (
                <CronometroAlarma
                  key={alarma.id}
                  alarmaId={alarma.id}
                  tipo={alarma.tipo}
                  cliente={alarma.clientes?.nombre || 'Cliente no especificado'}
                  direccion={alarma.direccion}
                  municipio={alarma.municipio}
                  telefono={alarma.clientes?.telefono}
                  prioridad={alarma.prioridad}
                  estado={alarma.estado as any}
                  created_at={alarma.created_at}
                  attended_at={alarma.attended_at || undefined}
                  tiempo_toma_despachador={alarma.tiempo_toma_despachador || undefined}
                  tiempo_asignacion_supervisor={alarma.tiempo_asignacion_supervisor || undefined}
                  tiempo_aceptacion_supervisor={alarma.tiempo_aceptacion_supervisor || undefined}
                  tiempo_primera_lectura_qr={alarma.tiempo_primera_lectura_qr || undefined}
                  tiempo_segunda_lectura_qr={alarma.tiempo_segunda_lectura_qr || undefined}
                  supervisor={alarma.supervisor || undefined}
                  supervisor_id={alarma.supervisor_id || undefined}
                  patrulla_asignada={alarma.patrulla_asignada || undefined}
                  showCancelButton={false}
                  onSupervisorAccept={handleSupervisorAccept}
                  onSupervisorArrive={handleSupervisorArrive}
                  onSupervisorLeave={handleSupervisorLeave}
                  userRole={user?.role}
                  currentUserId={user?.id}
                  currentUserName={user?.email}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
};

export default CentralAlarmasOperador;
