import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { Siren, Shield, AlertTriangle, Flame, Eye, UserCheck, Clock, Timer, QrCode, Users } from "lucide-react";
import { useSupabaseAlarmas } from "@/hooks/useSupabaseAlarmas";
import { useUserSpecificData } from "@/hooks/useUserSpecificData";
import { format, differenceInSeconds, differenceInMinutes } from "date-fns";
import { useAuthConsolidated } from "@/hooks/useAuthConsolidated";
import { AsignarSupervisorModal } from "@/components/modals/AsignarSupervisorModal";
import { supabase } from "@/integrations/supabase/client";

const CentralAlarmas = () => {
  const { user } = useAuthConsolidated();
  const { attendAlarma, assignPatrulla } = useSupabaseAlarmas();
  
  // Usar el hook de datos específicos por usuario para alarmas
  const { data: alarmas, loading } = useUserSpecificData({
    table: 'alarmas',
    enabled: !!user?.id
  });
  
  // Estado para almacenar tiempos de alarmas
  const [alarmaTiempos, setAlarmaTiempos] = useState<{ [key: string]: any[] }>({});
  const [timers, setTimers] = useState<{ [key: string]: string }>({});
  const [supervisorModalOpen, setSupervisorModalOpen] = useState(false);
  const [selectedAlarmaForSupervisor, setSelectedAlarmaForSupervisor] = useState<any>(null);

  // Cargar tiempos de cada alarma
  useEffect(() => {
    const cargarTiemposAlarmas = async () => {
      if (alarmas.length === 0) return;
      
      const tiemposMap: { [key: string]: any[] } = {};
      
      for (const alarma of alarmas) {
        const { data: tiempos } = await supabase
          .from('alarma_tiempos')
          .select('*')
          .eq('alarma_id', alarma.id)
          .order('timestamp_evento', { ascending: true });
        
        if (tiempos) {
          tiemposMap[alarma.id] = tiempos;
        }
      }
      
      setAlarmaTiempos(tiemposMap);
    };
    
    cargarTiemposAlarmas();
  }, [alarmas]);

  // Actualizar timers cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      const newTimers: { [key: string]: string } = {};
      alarmas.forEach(alarma => {
        if (alarma.estado === 'activa') {
          const now = new Date();
          const startTime = new Date(alarma.created_at);
          const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
          const minutes = Math.floor(elapsed / 60);
          const seconds = elapsed % 60;
          newTimers[alarma.id] = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
      });
      setTimers(newTimers);
    }, 1000);

    return () => clearInterval(interval);
  }, [alarmas]);

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

  const getAlarmTypeIcon = (tipo: string) => {
    switch (tipo) {
      case "Fuego": return <Flame className="h-4 w-4" />;
      case "Pánico": return <Shield className="h-4 w-4" />;
      case "Revisión": return <Eye className="h-4 w-4" />;
      case "Acompañamiento": return <UserCheck className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getAlarmTypeColor = (tipo: string) => {
    switch (tipo) {
      case "Fuego": return "border-red-500 bg-red-50";
      case "Pánico": return "border-purple-500 bg-purple-50";
      case "Revisión": return "border-blue-500 bg-blue-50";
      case "Acompañamiento": return "border-green-500 bg-green-50";
      default: return "border-orange-500 bg-orange-50";
    }
  };

  const getTimerColor = (createdAt: string) => {
    const elapsed = Math.floor((new Date().getTime() - new Date(createdAt).getTime()) / 1000);
    const minutes = Math.floor(elapsed / 60);
    if (minutes < 5) return "text-green-600";
    if (minutes < 15) return "text-yellow-600";
    return "text-red-600";
  };

  const canDeleteAlarm = (createdAt: string) => {
    const elapsed = Math.floor((new Date().getTime() - new Date(createdAt).getTime()) / 1000);
    return elapsed < 300; // 5 minutes
  };

  const handleDeleteAlarm = async (alarmaId: string) => {
    // Implementar eliminación si es necesario
  };

  // Función para que supervisor acepte la alarma
  const handleSupervisorAccept = async (alarmaId: string) => {
    try {
      await supabase
        .from('alarmas')
        .update({
          tiempo_aceptacion_supervisor: new Date().toISOString(),
          estado: 'en_proceso'
        })
        .eq('id', alarmaId);
    } catch (error) {
      console.error('Error accepting alarm by supervisor:', error);
    }
  };

  // Función para manejar lectura de códigos QR
  const handleQRScan = async (alarmaId: string, tipo: 'primera' | 'segunda') => {
    try {
      const updates: any = {};
      const ubicacion = `Simulada - ${tipo === 'primera' ? 'Llegada' : 'Finalización'}`;
      
      if (tipo === 'primera') {
        updates.tiempo_primera_lectura_qr = new Date().toISOString();
        updates.ubicacion_primer_qr = ubicacion;
      } else {
        updates.tiempo_segunda_lectura_qr = new Date().toISOString();
        updates.ubicacion_segundo_qr = ubicacion;
        updates.estado = 'resuelta';
        updates.resolved_at = new Date().toISOString();
      }

      await supabase
        .from('alarmas')
        .update(updates)
        .eq('id', alarmaId);
    } catch (error) {
      console.error('Error scanning QR:', error);
    }
  };

  const handleAttendAlarm = async (alarmaId: string) => {
    try {
      // Actualizar la alarma con tiempo de toma del despachador
      await supabase
        .from('alarmas')
        .update({
          attended_at: new Date().toISOString(),
          tiempo_toma_despachador: new Date().toISOString(),
          despachador_id: user?.id,
          despachador_nombre: user?.full_name,
          estado: 'en_proceso'
        })
        .eq('id', alarmaId);

      // Después de atender la alarma, si el usuario es despachador, puede asignar supervisor
      if (user?.role === 'despachador_patrullas') {
        const alarmaAtendida = alarmas.find(a => a.id === alarmaId);
        if (alarmaAtendida) {
          setSelectedAlarmaForSupervisor(alarmaAtendida);
          setSupervisorModalOpen(true);
        }
      }
    } catch (error) {
      console.error('Error attending alarm:', error);
    }
  };

  const handleAssignSupervisor = async (alarmaId: string, supervisorData: { supervisor_id: string; supervisor_nombre: string; patrulla_asignada: string }) => {
    try {
      await supabase
        .from('alarmas')
        .update({
          patrulla_asignada: supervisorData.patrulla_asignada,
          supervisor: supervisorData.supervisor_nombre,
          supervisor_id: supervisorData.supervisor_id,
          tiempo_asignacion_supervisor: new Date().toISOString(),
          estado: 'asignada'
        })
        .eq('id', alarmaId);
    } catch (error) {
      console.error('Error assigning supervisor:', error);
      throw error;
    }
  };

  // Función para calcular duración entre eventos
  const calcularDuracion = (fechaInicio: string, fechaFin?: string) => {
    const inicio = new Date(fechaInicio);
    const fin = fechaFin ? new Date(fechaFin) : new Date();
    const diferencia = differenceInSeconds(fin, inicio);
    const minutos = Math.floor(diferencia / 60);
    const segundos = diferencia % 60;
    return `${minutos}:${segundos.toString().padStart(2, '0')}`;
  };

  // Función para renderizar el progreso de la alarma
  const renderProcesoAlarma = (alarma: any) => {
    const tiempos = alarmaTiempos[alarma.id] || [];
    const now = new Date();
    
    const eventos = [
      {
        nombre: "Alarma Recibida",
        tiempo: alarma.created_at,
        icono: <Siren className="h-4 w-4" />,
        color: "text-red-600",
        completado: true
      },
      {
        nombre: "Despachador Toma",
        tiempo: alarma.tiempo_toma_despachador,
        icono: <UserCheck className="h-4 w-4" />,
        color: "text-blue-600",
        completado: !!alarma.tiempo_toma_despachador,
        duracion: alarma.tiempo_toma_despachador ? 
          calcularDuracion(alarma.created_at, alarma.tiempo_toma_despachador) : 
          calcularDuracion(alarma.created_at)
      },
      {
        nombre: "Supervisor Asignado",
        tiempo: alarma.tiempo_asignacion_supervisor,
        icono: <Users className="h-4 w-4" />,
        color: "text-green-600",
        completado: !!alarma.tiempo_asignacion_supervisor,
        duracion: alarma.tiempo_asignacion_supervisor && alarma.tiempo_toma_despachador ? 
          calcularDuracion(alarma.tiempo_toma_despachador, alarma.tiempo_asignacion_supervisor) : null
      },
      {
        nombre: "Supervisor Acepta",
        tiempo: alarma.tiempo_aceptacion_supervisor,
        icono: <Shield className="h-4 w-4" />,
        color: "text-purple-600",
        completado: !!alarma.tiempo_aceptacion_supervisor,
        duracion: alarma.tiempo_aceptacion_supervisor && alarma.tiempo_asignacion_supervisor ? 
          calcularDuracion(alarma.tiempo_asignacion_supervisor, alarma.tiempo_aceptacion_supervisor) : null
      },
      {
        nombre: "Primera Lectura QR",
        tiempo: alarma.tiempo_primera_lectura_qr,
        icono: <QrCode className="h-4 w-4" />,
        color: "text-orange-600",
        completado: !!alarma.tiempo_primera_lectura_qr,
        duracion: alarma.tiempo_primera_lectura_qr && alarma.tiempo_aceptacion_supervisor ? 
          calcularDuracion(alarma.tiempo_aceptacion_supervisor, alarma.tiempo_primera_lectura_qr) : null
      },
      {
        nombre: "Segunda Lectura QR",
        tiempo: alarma.tiempo_segunda_lectura_qr,
        icono: <QrCode className="h-4 w-4" />,
        color: "text-teal-600",
        completado: !!alarma.tiempo_segunda_lectura_qr,
        duracion: alarma.tiempo_segunda_lectura_qr && alarma.tiempo_primera_lectura_qr ? 
          calcularDuracion(alarma.tiempo_primera_lectura_qr, alarma.tiempo_segunda_lectura_qr) : null
      }
    ];

    const completados = eventos.filter(e => e.completado).length;
    const progreso = (completados / eventos.length) * 100;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h5 className="font-semibold">Seguimiento de Procesos</h5>
          <div className="flex items-center gap-2">
            <Progress value={progreso} className="w-24" />
            <span className="text-sm font-medium">{Math.round(progreso)}%</span>
          </div>
        </div>
        
        <div className="space-y-3">
          {eventos.map((evento, index) => (
            <div 
              key={index} 
              className={`flex items-center gap-3 p-2 rounded ${
                evento.completado ? 'bg-green-50' : 'bg-gray-50'
              }`}
            >
              <div className={`${evento.color} ${evento.completado ? 'opacity-100' : 'opacity-40'}`}>
                {evento.icono}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${
                    evento.completado ? 'text-green-800' : 'text-gray-500'
                  }`}>
                    {evento.nombre}
                  </span>
                  {evento.tiempo && (
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(evento.tiempo), 'HH:mm:ss')}
                    </span>
                  )}
                </div>
                {evento.duracion && (
                  <div className="flex items-center gap-2 mt-1">
                    <Timer className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      Duración: {evento.duracion}
                    </span>
                  </div>
                )}
              </div>
              {evento.completado && (
                <div className="text-green-600">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded w-2/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const alarmasActivas = alarmas.filter(a => a.estado === 'activa');
  const alarmasEnProceso = alarmas.filter(a => a.estado === 'en_proceso');
  const alarmasResueltas = alarmas.filter(a => a.estado === 'resuelta');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Siren className="h-8 w-8 text-primary" />
          Central de Alarmas
        </h1>
        <p className="text-muted-foreground">Monitoreo y gestión de alarmas en tiempo real</p>
      </div>

      {/* Estadísticas de monitoreo - 5 tarjetas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas Activas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{alarmasActivas.length}</div>
            <p className="text-xs text-muted-foreground">
              Alarmas pendientes
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patrullas Gastadas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{alarmas.length}</div>
            <p className="text-xs text-muted-foreground">
              Utilizadas este mes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Acompañamientos</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{alarmas.filter(a => a.tipo === 'Acompañamiento').length}</div>
            <p className="text-xs text-muted-foreground">
              Realizados este mes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revistas (Rondeos)</CardTitle>
            <Eye className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{alarmas.filter(a => a.tipo === 'Revisión').length}</div>
            <p className="text-xs text-muted-foreground">
              Realizadas este mes
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alarmas Resueltas</CardTitle>
            <Shield className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-600">{alarmasResueltas.length}</div>
            <p className="text-xs text-muted-foreground">
              Despachadas exitosamente
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de alarmas activas */}
      <Card>
        <CardHeader>
          <CardTitle>Alarmas Activas</CardTitle>
          <CardDescription>Gestiona las alarmas que requieren atención inmediata</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
          {alarmasActivas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Siren className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>No hay alarmas activas en este momento</p>
              <p className="text-sm">Las nuevas alarmas aparecerán aquí automáticamente</p>
            </div>
          ) : (
            alarmasActivas.map((alarma) => (
              <AccordionItem key={alarma.id} value={`alarm-${alarma.id}`} className={`border-2 rounded-lg mb-4 ${getAlarmTypeColor(alarma.tipo)}`}>
                <AccordionTrigger className="px-4 py-2 hover:no-underline">
                  <div className="flex items-center justify-between w-full mr-4">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-full ${alarma.prioridad === 'alta' ? 'bg-red-100' : 'bg-orange-100'}`}>
                        {getAlarmTypeIcon(alarma.tipo)}
                      </div>
                      <div className="text-left">
                        <h4 className="font-semibold">{alarma.clientes?.nombre || 'Cliente no especificado'}</h4>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="font-medium">
                            {alarma.tipo}
                          </Badge>
                          <span className="text-sm text-muted-foreground">📍 {alarma.municipio}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <Badge variant={getStatusColor(alarma.estado)}>{alarma.estado.toUpperCase()}</Badge>
                      <Badge variant="outline" className={getPriorityColor(alarma.prioridad)}>
                        {alarma.prioridad.toUpperCase()}
                      </Badge>
                      <span className={`font-mono text-lg font-bold ${getTimerColor(alarma.created_at)}`}>
                        <Clock className="h-4 w-4 inline mr-1" />
                        {timers[alarma.id] || '00:00'}
                      </span>
                    </div>
                  </div>
                </AccordionTrigger>
                
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p><strong>Dirección:</strong> {alarma.direccion || 'No especificada'}</p>
                        <p><strong>Municipio:</strong> {alarma.municipio || 'No especificado'}</p>
                        <p><strong>Hora de inicio:</strong> {format(new Date(alarma.created_at), 'HH:mm:ss')}</p>
                        {alarma.despachador_nombre && (
                          <p><strong>Despachador:</strong> {alarma.despachador_nombre}</p>
                        )}
                      </div>
                      <div>
                        <p><strong>Estado:</strong> {alarma.estado.toUpperCase()}</p>
                        <p><strong>Prioridad:</strong> {alarma.prioridad.toUpperCase()}</p>
                        {alarma.supervisor && <p><strong>Supervisor:</strong> {alarma.supervisor}</p>}
                        {alarma.patrulla_asignada && <p><strong>Patrulla:</strong> {alarma.patrulla_asignada}</p>}
                      </div>
                    </div>
                    {alarma.descripcion && (
                      <div>
                        <p><strong>Descripción:</strong> {alarma.descripcion}</p>
                      </div>
                    )}

                    {/* Seguimiento de tiempos */}
                    {renderProcesoAlarma(alarma)}

                    <div className="flex flex-wrap gap-2 pt-4 border-t">
                      {canDeleteAlarm(alarma.created_at) ? (
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleDeleteAlarm(alarma.id)}
                          className="flex items-center gap-1"
                        >
                          <AlertTriangle className="h-4 w-4" />
                          Eliminar Alarma
                        </Button>
                      ) : (
                        <div className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded">
                          ⏰ Solo se puede eliminar durante los primeros 5 minutos
                        </div>
                      )}
                      
                      {/* Botón para que despachador tome la alarma */}
                      {alarma.estado === 'activa' && (
                        <Button 
                          size="sm" 
                          onClick={() => handleAttendAlarm(alarma.id)}
                          className="flex items-center gap-1"
                        >
                          <UserCheck className="h-4 w-4" />
                          Tomar Alarma
                        </Button>
                      )}
                      
                      {/* Botón para asignar supervisor */}
                      {alarma.estado === 'en_proceso' && alarma.tiempo_toma_despachador && user?.role === 'despachador_patrullas' && (
                        <Button 
                          size="sm" 
                          variant="secondary"
                          onClick={() => {
                            setSelectedAlarmaForSupervisor(alarma);
                            setSupervisorModalOpen(true);
                          }}
                          className="flex items-center gap-1"
                        >
                          <Shield className="h-4 w-4" />
                          Asignar Supervisor
                        </Button>
                      )}

                      {/* Botón para que supervisor acepte */}
                      {alarma.estado === 'asignada' && alarma.supervisor_id && user?.id === alarma.supervisor_id && !alarma.tiempo_aceptacion_supervisor && (
                        <Button 
                          size="sm" 
                          variant="default"
                          onClick={() => handleSupervisorAccept(alarma.id)}
                          className="flex items-center gap-1"
                        >
                          <Shield className="h-4 w-4" />
                          Aceptar Servicio
                        </Button>
                      )}

                      {/* Botones para lecturas QR */}
                      {alarma.tiempo_aceptacion_supervisor && user?.id === alarma.supervisor_id && (
                        <div className="flex gap-2">
                          {!alarma.tiempo_primera_lectura_qr && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleQRScan(alarma.id, 'primera')}
                              className="flex items-center gap-1"
                            >
                              <QrCode className="h-4 w-4" />
                              Llegada (QR)
                            </Button>
                          )}
                          {alarma.tiempo_primera_lectura_qr && !alarma.tiempo_segunda_lectura_qr && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleQRScan(alarma.id, 'segunda')}
                              className="flex items-center gap-1"
                            >
                              <QrCode className="h-4 w-4" />
                              Finalización (QR)
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))
          )}
          </Accordion>
        </CardContent>
      </Card>

      {/* Modal de asignación de supervisor */}
      <AsignarSupervisorModal
        isOpen={supervisorModalOpen}
        onClose={() => {
          setSupervisorModalOpen(false);
          setSelectedAlarmaForSupervisor(null);
        }}
        alarma={selectedAlarmaForSupervisor ? {
          id: selectedAlarmaForSupervisor.id,
          tipo: selectedAlarmaForSupervisor.tipo,
          cliente: selectedAlarmaForSupervisor.clientes?.nombre,
          direccion: selectedAlarmaForSupervisor.direccion,
          prioridad: selectedAlarmaForSupervisor.prioridad,
          created_at: selectedAlarmaForSupervisor.created_at
        } : null}
        onAssign={handleAssignSupervisor}
      />
    </div>
  );
};

export default CentralAlarmas;