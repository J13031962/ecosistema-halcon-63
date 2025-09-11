import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSupabasePatrullas } from "@/hooks/useSupabasePatrullas";
import { useSupabaseAlarmasEnhanced } from "@/hooks/useSupabaseAlarmasEnhanced";
import { useServiciosTecnicos } from "@/hooks/useServiciosTecnicos";
import { useSupabaseSupervisores } from "@/hooks/useSupabaseSupervisores";
import { useAuthConsolidated } from "@/hooks/useAuthConsolidated";
import CronometroAlarma from "@/components/alarmas/CronometroAlarma";
import { AsignarSupervisorModal } from "@/components/modals/AsignarSupervisorModal";
import { useToast } from "@/hooks/use-toast";
import { Car, MapPin, Clock, Search, Filter, Download, Shield, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

const PatrullasActivas = () => {
  const { patrullas, loading: patrullasLoading, updatePatrulla } = useSupabasePatrullas();
  const { alarmas, resolverAlarma, asignarPatrulla, refetch: refetchAlarmas } = useSupabaseAlarmasEnhanced();
  const { servicios, loading: serviciosLoading } = useServiciosTecnicos();
  const { supervisores: supervisoresFromHook } = useSupabaseSupervisores();
  const { userRole } = useAuthConsolidated();
  const { toast } = useToast();
  const [realtimeAlarmas, setRealtimeAlarmas] = useState(alarmas);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAlarmaForAssign, setSelectedAlarmaForAssign] = useState<any>(null);
  const [lastAssignedTimes, setLastAssignedTimes] = useState<Record<string, number>>({});
  
  // Filtrar solo supervisores (que tienen patrullas asignadas)
  const supervisoresPatrulla = patrullas.filter(p => p.supervisor_nombre);
  
  // Alarmas ordenadas por hora de creación (más recientes primero)
  const alarmasOrdenadas = React.useMemo(() => {
    return [...realtimeAlarmas].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [realtimeAlarmas]);
  
  // Alarmas asignadas y en proceso para mostrar en patrullas activas
  const alarmasActivas = alarmasOrdenadas.filter(a => 
    (['asignada', 'en_proceso'].includes(a.estado) || a.tiempo_asignacion_supervisor || a.supervisor || a.patrulla_asignada)
  );

  // Alarmas pendientes ordenadas por tiempo (aún sin supervisor/patrulla asignados y sin tiempo de asignación)
  const alarmasPendientes = alarmasOrdenadas.filter(a => 
    a.estado === 'activa' && !a.supervisor_id && !a.supervisor && !a.patrulla_asignada && !a.tiempo_asignacion_supervisor
  );
  
  // Servicios pendientes de asignación (sin supervisor asignado)
  const serviciosPendientes = servicios.filter(s => s.estado === 'pendiente');
  
  // Servicios activos (con supervisor asignado)
  const serviciosActivos = servicios.filter(s => 
    ['aceptado', 'en_progreso', 'completado'].includes(s.estado) && s.tecnico_id
  );
  
  // Supervisores disponibles (no han sido asignados en los últimos 6 minutos)
  const supervisoresDisponibles = supervisoresFromHook.filter(supervisor => {
    const lastAssigned = lastAssignedTimes[supervisor.id];
    if (!lastAssigned) return true;
    const minutosTranscurridos = (Date.now() - lastAssigned) / (1000 * 60);
    return minutosTranscurridos >= 6;
  });

  // Historial de asignaciones completadas
  const historialAsignaciones = alarmasOrdenadas.filter(a => 
    a.estado === 'resuelta' && a.supervisor && a.patrulla_asignada
  );

  // Supervisores que están atendiendo alarmas
  const supervisoresConAlarmas = alarmasActivas.map(a => ({
    supervisor: a.supervisor,
    patrulla: a.patrulla_asignada,
    tiempo_respuesta: a.attended_at ? 
      Math.floor((new Date().getTime() - new Date(a.attended_at).getTime()) / 60000) : 0
  }));

  // Configurar actualizaciones en tiempo real
  useEffect(() => {
    setRealtimeAlarmas(alarmas);
  }, [alarmas]);

  useEffect(() => {
    const channel = supabase
      .channel('alarmas_patrullas_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'alarmas'
        },
        (payload) => {
          console.log('🔄 Actualización en tiempo real de alarmas:', payload);
          
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

  // Función para verificar si un supervisor está disponible
  const isSupervisorAvailable = (supervisor: string, patrulla: string, tiempoAsignacion?: string) => {
    if (!tiempoAsignacion) return true;
    
    const tiempoTranscurrido = Math.floor((new Date().getTime() - new Date(tiempoAsignacion).getTime()) / 60000);
    return tiempoTranscurrido >= 10; // Disponible después de 10 minutos
  };

  // Función para cancelar una alarma
  const handleCancelAlarma = async (alarmaId: string) => {
    try {
      // Encontrar la alarma para liberar la patrulla
      const alarma = alarmas.find(a => a.id === alarmaId);
      if (alarma?.patrulla_asignada) {
        const patrulla = patrullas.find(p => p.numero_patrulla === alarma.patrulla_asignada);
        if (patrulla) {
          await updatePatrulla(patrulla.id, { estado: 'disponible' });
        }
      }
      
      await resolverAlarma(alarmaId);
      
      toast({
        title: "Alarma cancelada",
        description: "La alarma ha sido cancelada y la patrulla liberada",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cancelar la alarma",
        variant: "destructive"
      });
    }
  };

  // Función para abrir modal de asignación
  const handleOpenAssignModal = async (alarmaData: any) => {
    try {
      // Si es una alarma (no servicio técnico), validar estado y marcar "toma del despachador"
      if (!alarmaData?.isService) {
        const current = realtimeAlarmas.find(a => a.id === alarmaData.id);
        if (!current) return;
        
        // Si ya no está activa, no permitir re-asignación
        if (current.estado !== 'activa') {
          toast({
            title: "Asignación no disponible",
            description: "Esta alarma ya fue asignada o está en proceso.",
          });
          return;
        }

        // Marcar tiempo de toma del despachador si aún no está marcado
        if (!current.tiempo_toma_despachador) {
          const { data: { user } } = await supabase.auth.getUser();
          const now = new Date().toISOString();
          await supabase
            .from('alarmas')
            .update({
              tiempo_toma_despachador: now,
              despachador_id: user?.id || null,
              despachador_nombre: user?.email || 'Despachador'
            })
            .eq('id', current.id);
          
          // Actualizar localmente para feedback inmediato
          setRealtimeAlarmas(prev => prev.map(a => a.id === current.id 
            ? { ...a, tiempo_toma_despachador: now, despachador_id: user?.id || null, despachador_nombre: user?.email || 'Despachador' }
            : a
          ));
        }
      }

      setSelectedAlarmaForAssign(alarmaData);
      setShowAssignModal(true);
    } catch (e) {
      console.error('Error al preparar asignación:', e);
    }
  };

  // Función para asignar supervisor
  const handleAssignSupervisor = async (alarmaId: string, supervisorData: { supervisor_id: string; supervisor_nombre: string; patrulla_asignada: string }) => {
    try {
      const now = new Date().toISOString();
      // Obtener información del usuario actual para despachador
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        toast({
          title: "Sesión requerida",
          description: "Debes iniciar sesión como despachador para asignar un supervisor",
          variant: "destructive"
        });
        return;
      }
      
      if (selectedAlarmaForAssign?.isService) {
        // Es un servicio técnico - actualizar directamente
        const { data, error } = await supabase
          .from('servicios_tecnicos_asignados')
          .update({
            tecnico_id: supervisorData.supervisor_id,
            estado: 'aceptado',
            fecha_aceptacion: now
          })
          .eq('id', alarmaId)
          .select('*')
          .single();
        
        if (error) throw error;
        
        // Actualización optimista para servicios técnicos
        console.log('🔄 Servicio técnico asignado:', data);
      } else {
        // Es una alarma
        const result = await asignarPatrulla(alarmaId, {
          supervisor: supervisorData.supervisor_nombre,
          supervisor_id: supervisorData.supervisor_id,
          patrulla_asignada: supervisorData.patrulla_asignada,
          despachador_id: user.id,
          despachador_nombre: user.email ?? null
        });
        if (!result.success) throw new Error(result.error);

        // Actualización optimista local: mover a Servicios Activos inmediatamente
        console.log('🔄 Actualizando estado local a asignada para', alarmaId);
        setRealtimeAlarmas(prev => prev.map(a => a.id === alarmaId ? {
          ...a,
          estado: 'asignada',
          supervisor: supervisorData.supervisor_nombre,
          supervisor_id: supervisorData.supervisor_id,
          patrulla_asignada: supervisorData.patrulla_asignada,
          tiempo_asignacion_supervisor: now,
          despachador_id: user.id,
          despachador_nombre: user.email || 'Despachador'
        } : a));

        // Forzar refetch para consolidar estado con BD
        setTimeout(() => refetchAlarmas(), 500);
      }

      // Registrar el tiempo de asignación para el supervisor (para disponibilidad)
      setLastAssignedTimes(prev => ({
        ...prev,
        [supervisorData.supervisor_id]: Date.now()
      }));

      setShowAssignModal(false);
      setSelectedAlarmaForAssign(null);

      toast({
        title: "Supervisor asignado exitosamente",
        description: `${supervisorData.supervisor_nombre} ha sido asignado y el servicio se movió a Servicios Activos en Desarrollo`,
      });
    } catch (error: any) {
      console.error('Error al asignar supervisor:', error);
      toast({
        title: "Error en asignación",
        description: error?.message || "No se pudo asignar el supervisor a la alarma",
        variant: "destructive"
      });
      throw error;
    }
  };

  const getStatusColor = (estado: string) => {
    switch (estado?.toLowerCase()) {
      case "disponible": return "secondary";
      case "en servicio": return "default";
      case "ocupado": return "destructive";
      case "mantenimiento": return "outline";
      default: return "outline";
    }
  };

  if (patrullasLoading || serviciosLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded w-2/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Patrullas Activas</h1>
        <p className="text-muted-foreground">Monitoreo de supervisores registrados en el sistema</p>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Supervisores</CardTitle>
            <Car className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{supervisoresPatrulla.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Servicio</CardTitle>
            <Shield className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {supervisoresPatrulla.filter(s => s.estado === 'en servicio').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disponibles</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {supervisoresPatrulla.filter(s => s.estado === 'disponible').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atendiendo Alarmas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{supervisoresConAlarmas.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y búsqueda */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Input 
              placeholder="Buscar supervisor..." 
              className="max-w-xs"
            />
            <Button variant="outline">
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </Button>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filtros Avanzados
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Servicios Pendientes de Asignación */}
      <Card>
        <CardHeader>
          <CardTitle>Servicios Pendientes de Asignación</CardTitle>
          <CardDescription>Servicios que requieren asignación de supervisor</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Alarmas pendientes */}
            {alarmasPendientes.length === 0 && serviciosPendientes.length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No hay servicios pendientes</h3>
                <p>Los servicios pendientes de asignación aparecerán aquí</p>
              </div>
            ) : (
              <>
                {/* Alarmas pendientes */}
                {alarmasPendientes.map((alarma) => (
                  <CronometroAlarma
                    key={`alarma-${alarma.id}`}
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
                    tiempo_asignacion_supervisor={alarma.tiempo_asignacion_supervisor || undefined}
                    tiempo_primera_lectura_qr={alarma.tiempo_primera_lectura_qr || undefined}
                    tiempo_segunda_lectura_qr={alarma.tiempo_segunda_lectura_qr || undefined}
                    supervisor={alarma.supervisor || undefined}
                    patrulla_asignada={alarma.patrulla_asignada || undefined}
                    showCancelButton={false}
                    showAssignButton={true}
                    onSelect={() => handleOpenAssignModal({
                      id: alarma.id,
                      tipo: alarma.tipo,
                      cliente: alarma.clientes?.nombre || 'Cliente no especificado',
                      direccion: alarma.direccion,
                      prioridad: alarma.prioridad,
                      created_at: alarma.created_at
                    })}
                  />
                ))}
                
                {/* Servicios técnicos pendientes */}
                {serviciosPendientes.map((servicio) => (
                  <CronometroAlarma
                    key={`servicio-${servicio.id}`}
                    alarmaId={servicio.id}
                    tipo={servicio.tipo_servicio}
                    cliente={servicio.cliente_razon_social}
                    direccion={servicio.cliente_direccion}
                    municipio=""
                    telefono={servicio.cliente_telefono}
                    prioridad={servicio.prioridad}
                    estado="activa"
                    created_at={servicio.created_at}
                    attended_at={undefined}
                    tiempo_asignacion_supervisor={undefined}
                    tiempo_primera_lectura_qr={undefined}
                    tiempo_segunda_lectura_qr={undefined}
                    supervisor={undefined}
                    patrulla_asignada={undefined}
                    showCancelButton={false}
                    showAssignButton={true}
                    onSelect={() => handleOpenAssignModal({
                      id: servicio.id,
                      tipo: servicio.tipo_servicio,
                      cliente: servicio.cliente_razon_social,
                      direccion: servicio.cliente_direccion,
                      prioridad: servicio.prioridad,
                      created_at: servicio.created_at,
                      isService: true
                    })}
                  />
                ))}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Alarmas Activas */}
      <Card>
        <CardHeader>
          <CardTitle>Servicios Activos en Desarrollo</CardTitle>
          <CardDescription>Servicios asignados y en proceso de desarrollo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {alarmasActivas.length === 0 && serviciosActivos.length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                <Car className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No hay servicios activos en desarrollo</h3>
                <p>Los servicios asignados y en desarrollo aparecerán aquí</p>
              </div>
            ) : (
              <>
                {/* Alarmas activas */}
                {alarmasActivas.map((alarma) => (
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
                    tiempo_asignacion_supervisor={alarma.tiempo_asignacion_supervisor || undefined}
                    tiempo_primera_lectura_qr={alarma.tiempo_primera_lectura_qr || undefined}
                    tiempo_segunda_lectura_qr={alarma.tiempo_segunda_lectura_qr || undefined}
                    supervisor={alarma.supervisor || undefined}
                    patrulla_asignada={alarma.patrulla_asignada || undefined}
                    showCancelButton={true}
                    onCancel={() => handleCancelAlarma(alarma.id)}
                  />
                ))}
                
                {/* Servicios técnicos activos */}
                {serviciosActivos.map((servicio) => (
                  <CronometroAlarma
                    key={`servicio-activo-${servicio.id}`}
                    alarmaId={servicio.id}
                    tipo={servicio.tipo_servicio}
                    cliente={servicio.cliente_razon_social}
                    direccion={servicio.cliente_direccion}
                    municipio=""
                    telefono={servicio.cliente_telefono}
                    prioridad={servicio.prioridad}
                    estado={servicio.estado === 'aceptado' ? 'asignada' : servicio.estado === 'en_progreso' ? 'en_proceso' : 'resuelta'}
                    created_at={servicio.created_at}
                    attended_at={servicio.fecha_aceptacion || undefined}
                    tiempo_asignacion_supervisor={servicio.fecha_aceptacion || undefined}
                    tiempo_primera_lectura_qr={servicio.fecha_inicio || undefined}
                    tiempo_segunda_lectura_qr={servicio.fecha_finalizacion || undefined}
                    supervisor="Supervisor asignado"
                    patrulla_asignada="Servicio técnico"
                    showCancelButton={false}
                  />
                ))}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Historial de Asignaciones - Solo para roles que no sean despachador */}
      {userRole !== 'despachador_patrullas' && historialAsignaciones.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Historial de Asignaciones
            </CardTitle>
            <CardDescription>
              Servicios completados con información detallada de tiempos y supervisor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {historialAsignaciones.map((alarma) => (
                <CronometroAlarma
                  key={alarma.id}
                  alarmaId={alarma.id}
                  tipo={alarma.tipo}
                  cliente={alarma.clientes?.nombre || 'Cliente no especificado'}
                  direccion={alarma.direccion}
                  municipio={alarma.municipio}
                  telefono={alarma.clientes?.telefono}
                  prioridad={alarma.prioridad}
                  estado="resuelta"
                  created_at={alarma.created_at}
                  attended_at={alarma.attended_at || undefined}
                  tiempo_asignacion_supervisor={alarma.tiempo_asignacion_supervisor || undefined}
                  tiempo_primera_lectura_qr={alarma.tiempo_primera_lectura_qr || undefined}
                  tiempo_segunda_lectura_qr={alarma.tiempo_segunda_lectura_qr || undefined}
                  supervisor={alarma.supervisor || undefined}
                  patrulla_asignada={alarma.patrulla_asignada || undefined}
                  showCancelButton={false}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de asignación de supervisor */}
      <AsignarSupervisorModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        alarma={selectedAlarmaForAssign}
        onAssign={handleAssignSupervisor}
      />
    </div>
  );
};

export default PatrullasActivas;