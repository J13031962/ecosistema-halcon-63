import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSupabasePatrullas } from "@/hooks/useSupabasePatrullas";
import { useSupabaseAlarmasEnhanced } from "@/hooks/useSupabaseAlarmasEnhanced";
import { useServiciosTecnicos } from "@/hooks/useServiciosTecnicos";
import { useSupabaseSupervisores } from "@/hooks/useSupabaseSupervisores";
import CronometroAlarma from "@/components/alarmas/CronometroAlarma";
import ServicioPendienteCard from "@/components/servicios-tecnicos/ServicioPendienteCard";
import { AsignarSupervisorModal } from "@/components/modals/AsignarSupervisorModal";
import { useToast } from "@/hooks/use-toast";
import { Car, MapPin, Clock, Search, Filter, Download, Shield, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

const PatrullasActivas = () => {
  const { patrullas, loading: patrullasLoading, updatePatrulla } = useSupabasePatrullas();
  const { alarmas, resolverAlarma, asignarPatrulla } = useSupabaseAlarmasEnhanced();
  const { servicios, loading: serviciosLoading } = useServiciosTecnicos();
  const { supervisores: supervisoresFromHook } = useSupabaseSupervisores();
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
    ['asignada', 'en_proceso'].includes(a.estado) && a.supervisor && a.patrulla_asignada
  );

  // Alarmas pendientes ordenadas por tiempo
  const alarmasPendientes = alarmasOrdenadas.filter(a => a.estado === 'activa');
  
  // Servicios pendientes de asignación
  const serviciosPendientes = servicios.filter(s => s.estado === 'pendiente');
  
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
  const handleOpenAssignModal = (alarmaData: any) => {
    setSelectedAlarmaForAssign(alarmaData);
    setShowAssignModal(true);
  };

  // Función para asignar supervisor
  const handleAssignSupervisor = async (alarmaId: string, supervisorData: { supervisor_id: string; supervisor_nombre: string; patrulla_asignada: string }) => {
    try {
      // Obtener información del usuario actual para despachador
      const { data: { user } } = await supabase.auth.getUser();
      
      await asignarPatrulla(alarmaId, {
        supervisor: supervisorData.supervisor_nombre,
        patrulla_asignada: supervisorData.patrulla_asignada,
        despachador_id: user?.id || '',
        despachador_nombre: user?.email || 'Despachador'
      });

      // Registrar el tiempo de asignación para el supervisor
      setLastAssignedTimes(prev => ({
        ...prev,
        [supervisorData.supervisor_id]: Date.now()
      }));

      setShowAssignModal(false);
      setSelectedAlarmaForAssign(null);
    } catch (error) {
      console.error('Error al asignar supervisor:', error);
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
                  <ServicioPendienteCard
                    key={`servicio-${servicio.id}`}
                    servicioId={servicio.id}
                    tipo={servicio.tipo_servicio}
                    cliente={servicio.cliente_razon_social}
                    direccion={servicio.cliente_direccion}
                    telefono={servicio.cliente_telefono || undefined}
                    prioridad={servicio.prioridad}
                    estado={servicio.estado as any}
                    created_at={servicio.created_at}
                    fecha_aceptacion={servicio.fecha_aceptacion || undefined}
                    fecha_inicio={servicio.fecha_inicio || undefined}
                    fecha_finalizacion={servicio.fecha_finalizacion || undefined}
                    onAssignSupervisor={() => handleOpenAssignModal({
                      id: servicio.id,
                      tipo: servicio.tipo_servicio,
                      cliente: servicio.cliente_razon_social,
                      direccion: servicio.cliente_direccion,
                      prioridad: servicio.prioridad,
                      created_at: servicio.created_at,
                      isService: true
                    })}
                    showAssignButton={true}
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
          <CardTitle>Servicios Activos</CardTitle>
          <CardDescription>Servicios asignados y en proceso</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {alarmasActivas.length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                <Car className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No hay servicios activos</h3>
                <p>Los servicios asignados aparecerán aquí</p>
              </div>
            ) : (
              alarmasActivas.map((alarma) => (
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
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Historial de Asignaciones */}
      {historialAsignaciones.length > 0 && (
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
    </div>
  );
};

export default PatrullasActivas;