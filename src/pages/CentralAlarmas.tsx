import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Siren, Shield, AlertTriangle, Flame, Eye, UserCheck, Clock } from "lucide-react";
import { useSupabaseAlarmas } from "@/hooks/useSupabaseAlarmas";
import { useUserSpecificData } from "@/hooks/useUserSpecificData";
import { format } from "date-fns";
import { useAuthConsolidated } from "@/hooks/useAuthConsolidated";
import { AsignarSupervisorModal } from "@/components/modals/AsignarSupervisorModal";

const CentralAlarmas = () => {
  const { user } = useAuthConsolidated();
  const { attendAlarma, assignPatrulla } = useSupabaseAlarmas();
  
  // Usar el hook de datos específicos por usuario para alarmas
  const { data: alarmas, loading } = useUserSpecificData({
    table: 'alarmas',
    enabled: !!user?.id
  });
  const [timers, setTimers] = useState<{ [key: string]: string }>({});
  const [supervisorModalOpen, setSupervisorModalOpen] = useState(false);
  const [selectedAlarmaForSupervisor, setSelectedAlarmaForSupervisor] = useState<any>(null);

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

  const handleAttendAlarm = async (alarmaId: string) => {
    try {
      await attendAlarma(alarmaId);
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
      await assignPatrulla(alarmaId, {
        patrulla_asignada: supervisorData.patrulla_asignada,
        supervisor: supervisorData.supervisor_nombre,
        supervisor_id: supervisorData.supervisor_id,
      });
    } catch (error) {
      console.error('Error assigning supervisor:', error);
      throw error;
    }
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
                      </div>
                      <div>
                        <p><strong>Estado:</strong> {alarma.estado.toUpperCase()}</p>
                        <p><strong>Prioridad:</strong> {alarma.prioridad.toUpperCase()}</p>
                        {alarma.operador_id && <p><strong>Operador:</strong> {alarma.operador_id}</p>}
                      </div>
                    </div>
                    {alarma.descripcion && (
                      <div>
                        <p><strong>Descripción:</strong> {alarma.descripcion}</p>
                      </div>
                    )}

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
                      
                      {alarma.estado === 'activa' && (
                        <Button 
                          size="sm" 
                          onClick={() => handleAttendAlarm(alarma.id)}
                          className="flex items-center gap-1"
                        >
                          <UserCheck className="h-4 w-4" />
                          Atender Alarma
                        </Button>
                      )}
                      
                       {alarma.estado === 'en_proceso' && alarma.attended_at && (
                        <div className="flex items-center gap-2">
                          <div className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded flex items-center gap-1">
                            <UserCheck className="h-4 w-4" />
                            Atendida el: {format(new Date(alarma.attended_at), 'HH:mm:ss')}
                          </div>
                          {user?.role === 'despachador_patrullas' && (
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