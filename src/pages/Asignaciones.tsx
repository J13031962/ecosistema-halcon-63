import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSupabaseAlarmas } from "@/hooks/useSupabaseAlarmas";
import { useSupabasePatrullas } from "@/hooks/useSupabasePatrullas";
import { Car, MapPin, Clock, Filter, Download, AlertTriangle, Shield, UserCheck, Phone } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import CronometroAlarma from "@/components/alarmas/CronometroAlarma";
import { AsignarSupervisorModal } from "@/components/modals/AsignarSupervisorModal";

const Asignaciones = () => {
  const { alarmas, loading: alarmasLoading, assignPatrulla } = useSupabaseAlarmas();
  const { patrullas, updatePatrulla } = useSupabasePatrullas();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAlarmaId, setSelectedAlarmaId] = useState<string | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Servicios activos (alarmas asignadas o en proceso)
  const serviciosActivos = alarmas.filter(a => ['asignada', 'en_proceso'].includes(a.estado));
  
  // Servicios pendientes de asignación
  const serviciosPendientes = alarmas.filter(a => a.estado === 'activa');
  
  // Combinar servicios activos y pendientes para mostrar
  const todosLosServicios = [...serviciosPendientes, ...serviciosActivos];
  
  // Supervisores disponibles
  const supervisoresDisponibles = patrullas.filter(p => 
    p.supervisor_nombre && p.estado === 'disponible'
  );

  // Supervisores que están atendiendo alarmas
  const supervisoresOcupados = alarmas
    .filter(a => a.estado === 'asignada' && a.supervisor && a.patrulla_asignada)
    .map(a => ({
      id: a.id,
      supervisor: a.supervisor,
      patrulla: a.patrulla_asignada,
      cliente: a.clientes?.nombre || 'Cliente no especificado',
      tipo: a.tipo,
      tiempo_respuesta: a.attended_at ? 
        Math.floor((new Date().getTime() - new Date(a.attended_at).getTime()) / 60000) : 0,
      direccion: a.direccion
    }));

  const getPriorityColor = (prioridad: string) => {
    switch (prioridad) {
      case 'alta': return 'destructive';
      case 'media': return 'default';
      case 'baja': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'asignada': return 'default';
      case 'en_proceso': return 'secondary';
      case 'resuelta': return 'outline';
      default: return 'outline';
    }
  };

  const getServiceTypeIcon = (tipo: string) => {
    switch (tipo) {
      case 'Pánico': return <Shield className="h-4 w-4" />;
      case 'Fuego': return <AlertTriangle className="h-4 w-4" />;
      case 'Acompañamiento': return <UserCheck className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  // Funciones de asignación
  const handleSelectAlarmaForAssignment = (alarmaId: string) => {
    setSelectedAlarmaId(alarmaId);
    // Abrir modal automáticamente cuando se selecciona una alarma
    setIsModalOpen(true);
  };

  const handleAssignPatrulla = async (alarmaId: string, patrullaId: string) => {
    if (isAssigning) return;

    try {
      setIsAssigning(true);
      
      const patrulla = patrullas.find(p => p.id === patrullaId);
      const alarma = alarmas.find(a => a.id === alarmaId);
      
      if (!patrulla || !alarma) {
        toast({
          title: "Error",
          description: "No se encontró la patrulla o alarma seleccionada",
          variant: "destructive"
        });
        return;
      }

      // Asignar patrulla a la alarma
      await assignPatrulla(alarmaId, {
        patrulla_asignada: patrulla.numero_patrulla,
        supervisor: patrulla.supervisor_nombre
      });

      // Actualizar estado de la patrulla a ocupada
      await updatePatrulla(patrullaId, {
        estado: 'ocupada'
      });

      toast({
        title: "Asignación exitosa",
        description: `Patrulla ${patrulla.numero_patrulla} asignada a ${alarma.tipo}`,
      });

      setSelectedAlarmaId(null);
    } catch (error) {
      console.error('Error en asignación:', error);
      toast({
        title: "Error en asignación",
        description: "No se pudo completar la asignación",
        variant: "destructive"
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleQuickAssign = async (patrullaId: string) => {
    if (!selectedAlarmaId) {
      toast({
        title: "Seleccione una alarma",
        description: "Primero seleccione una alarma para asignar",
        variant: "destructive"
      });
      return;
    }

    await handleAssignPatrulla(selectedAlarmaId, patrullaId);
  };

  const handleAssignSupervisor = async (alarmaId: string, supervisorData: { supervisor_id: string; supervisor_nombre: string; patrulla_asignada: string }) => {
    if (isAssigning) return;

    try {
      setIsAssigning(true);
      
      const alarma = alarmas.find(a => a.id === alarmaId);
      
      if (!alarma) {
        toast({
          title: "Error",
          description: "No se encontró la alarma seleccionada",
          variant: "destructive"
        });
        return;
      }

      // Asignar supervisor a la alarma
      await assignPatrulla(alarmaId, {
        patrulla_asignada: supervisorData.patrulla_asignada,
        supervisor: supervisorData.supervisor_nombre,
        supervisor_id: supervisorData.supervisor_id
      });

      toast({
        title: "Supervisor asignado exitosamente",
        description: `${supervisorData.supervisor_nombre} ha sido asignado a ${alarma.tipo}`,
      });

      setSelectedAlarmaId(null);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error en asignación:', error);
      toast({
        title: "Error en asignación",
        description: "No se pudo completar la asignación",
        variant: "destructive"
      });
    } finally {
      setIsAssigning(false);
    }
  };
  if (alarmasLoading) {
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
        <h1 className="text-3xl font-bold text-foreground">Asignaciones de Servicios</h1>
        <p className="text-muted-foreground">Gestiona y asigna servicios a las patrullas disponibles</p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Servicios Pendientes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{alarmas.filter(a => a.estado === 'activa').length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Proceso</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{serviciosActivos.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patrullas Disponibles</CardTitle>
            <Car className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{supervisoresDisponibles.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiempo Promedio</CardTitle>
            <MapPin className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {supervisoresOcupados.length > 0 
                ? Math.round(supervisoresOcupados.reduce((acc, s) => acc + s.tiempo_respuesta, 0) / supervisoresOcupados.length)
                : 0
              }min
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información de Servicios */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Información de Servicios</CardTitle>
              <CardDescription>Los servicios activos se muestran en la sección "Patrullas Activas"</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Servicios en Patrullas Activas</h3>
                <p className="mb-4">
                  Los servicios pendientes y activos se visualizan en la sección "Patrullas Activas"
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = '/patrullas-activas'}
                >
                  Ir a Patrullas Activas
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panel de Asignación */}
        <div className="lg:col-span-1 space-y-6">
          {/* Información de asignación rápida */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Asignación Rápida
              </CardTitle>
              <CardDescription>
                Selecciona un servicio en "Patrullas Activas" para asignar supervisor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4 text-muted-foreground">
                <UserCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">
                  Los servicios se gestionan desde la sección "Patrullas Activas"
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Patrullas Disponibles */}
          <Card>
            <CardHeader>
              <CardTitle>Patrullas Disponibles</CardTitle>
              <CardDescription>
                Supervisores motorizados disponibles para asignación
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {supervisoresDisponibles.map((patrulla) => (
                  <div key={patrulla.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium">{patrulla.numero_patrulla}</h5>
                      <Badge 
                        variant={patrulla.estado === 'disponible' ? 'secondary' : 'outline'}
                      >
                        {patrulla.estado}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{patrulla.supervisor_nombre}</p>
                    <p className="text-xs text-muted-foreground">Ubicación: {patrulla.ubicacion}</p>
                  </div>
                ))}
                {supervisoresDisponibles.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    No hay supervisores disponibles
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Crear Nuevo Servicio */}
          <Card>
            <CardHeader>
              <CardTitle>Nuevo Servicio</CardTitle>
              <CardDescription>Crear una nueva asignación de servicio</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Tipo de Servicio</label>
                <select className="w-full mt-1 px-3 py-2 border border-border rounded-md">
                  <option value="">Seleccionar tipo...</option>
                  <option value="patrullaje">Patrullaje Preventivo</option>
                  <option value="alarma">Respuesta a Alarma</option>
                  <option value="emergencia">Emergencia</option>
                  <option value="investigacion">Investigación</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Cliente/Ubicación</label>
                <Input placeholder="Nombre del cliente o ubicación" className="mt-1" />
              </div>
              
              <div>
                <label className="text-sm font-medium">Dirección</label>
                <Textarea placeholder="Dirección completa del servicio" className="mt-1" />
              </div>
              
              <div>
                <label className="text-sm font-medium">Prioridad</label>
                <select className="w-full mt-1 px-3 py-2 border border-border rounded-md">
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                  <option value="critica">Crítica</option>
                  <option value="baja">Baja</option>
                </select>
              </div>
              
              <Button className="w-full">
                Crear Servicio
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de Asignación de Supervisor - Solo si hay servicio seleccionado desde Patrullas Activas */}
      {selectedAlarmaId && (
        <AsignarSupervisorModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedAlarmaId(null);
          }}
          alarma={selectedAlarmaId ? {
            id: selectedAlarmaId,
            tipo: alarmas.find(a => a.id === selectedAlarmaId)?.tipo || '',
            cliente: alarmas.find(a => a.id === selectedAlarmaId)?.clientes?.nombre,
            direccion: alarmas.find(a => a.id === selectedAlarmaId)?.direccion,
            prioridad: alarmas.find(a => a.id === selectedAlarmaId)?.prioridad || 'media',
            created_at: alarmas.find(a => a.id === selectedAlarmaId)?.created_at || ''
          } : null}
          onAssign={handleAssignSupervisor}
        />
      )}
    </div>
  );
};

export default Asignaciones;