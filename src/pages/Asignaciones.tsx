import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSupabaseAlarmas } from "@/hooks/useSupabaseAlarmas";
import { useSupabasePatrullas } from "@/hooks/useSupabasePatrullas";
import { useAuthConsolidated } from "@/hooks/useAuthConsolidated";
import { Car, MapPin, Clock, Filter, Download, AlertTriangle, Shield, UserCheck, Phone } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { AsignarSupervisorModal } from "@/components/modals/AsignarSupervisorModal";

const Asignaciones = () => {
  const { user } = useAuthConsolidated();
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

      {/* Lista de Alarmas para Asignación - Solo para Despachadores */}
      {user?.role === 'despachador_patrullas' && (
        <Card>
          <CardHeader>
            <CardTitle>Servicios Pendientes de Asignación</CardTitle>
            <CardDescription>Selecciona una alarma y asigna un supervisor/patrulla</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filtros de búsqueda */}
            <div className="flex gap-4 mb-6">
              <Input 
                placeholder="Buscar por cliente o dirección..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>

            {/* Lista de Alarmas */}
            <div className="space-y-3">
              {serviciosPendientes
                .filter(alarma => 
                  searchTerm === '' || 
                  alarma.clientes?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  alarma.direccion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  alarma.tipo?.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((alarma) => (
                <div key={alarma.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                      {/* Cliente */}
                      <div>
                        <p className="font-semibold text-sm">
                          {alarma.clientes?.nombre || 'Cliente no especificado'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(alarma.created_at), 'dd/MM HH:mm')}
                        </p>
                      </div>
                      
                      {/* Dirección */}
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {alarma.direccion || 'Sin dirección'}
                        </span>
                      </div>
                      
                      {/* Tipo de Alarma y Prioridad */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {getServiceTypeIcon(alarma.tipo)}
                          <span className="text-sm font-medium">{alarma.tipo}</span>
                        </div>
                        <Badge variant={getPriorityColor(alarma.prioridad)}>
                          {alarma.prioridad}
                        </Badge>
                      </div>
                      
                      {/* Teléfono y Municipio */}
                      <div className="text-xs text-muted-foreground">
                        {alarma.clientes?.telefono && (
                          <div className="flex items-center gap-1 mb-1">
                            <Phone className="h-3 w-3" />
                            <span>{alarma.clientes.telefono}</span>
                          </div>
                        )}
                        {alarma.municipio && (
                          <div>Municipio: {alarma.municipio}</div>
                        )}
                      </div>
                    </div>
                    
                    {/* Botón de Asignar */}
                    <div className="ml-4">
                      <Button 
                        size="sm"
                        onClick={() => handleSelectAlarmaForAssignment(alarma.id)}
                        disabled={isAssigning}
                      >
                        <Shield className="h-4 w-4 mr-1" />
                        Asignar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              {serviciosPendientes.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No hay servicios pendientes</h3>
                  <p>No hay alarmas esperando asignación de supervisor</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vista para otros roles */}
      {user?.role !== 'despachador_patrullas' && (
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

          {/* Panel de Información */}
          <div className="lg:col-span-1 space-y-6">
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
          </div>
        </div>
      )}

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