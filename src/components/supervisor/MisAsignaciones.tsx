import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSupabaseAlarmas } from "@/hooks/useSupabaseAlarmas";
import { useAuthConsolidated } from "@/hooks/useAuthConsolidated";
import { MapPin, Clock, Phone, AlertTriangle, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const MisAsignaciones = () => {
  const { user } = useAuthConsolidated();
  const { alarmas, loading, attendAlarma } = useSupabaseAlarmas();
  const { toast } = useToast();

  // Filtrar alarmas asignadas al supervisor actual
  const misAsignaciones = alarmas.filter(
    alarma => alarma.supervisor_id === user?.id || 
    (alarma.supervisor && alarma.supervisor.includes(user?.full_name || ''))
  );

  const handleAceptarAsignacion = async (alarmaId: string) => {
    try {
      await attendAlarma(alarmaId);
      toast({
        title: "Asignación aceptada",
        description: "Has aceptado la asignación del servicio",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo aceptar la asignación",
        variant: "destructive"
      });
    }
  };

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

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded w-2/3"></div>
          <div className="space-y-3">
            {Array(3).fill(0).map((_, i) => (
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
        <h2 className="text-2xl font-bold text-foreground">Mis Asignaciones</h2>
        <p className="text-muted-foreground">Servicios asignados a tu patrulla</p>
      </div>

      {misAsignaciones.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No tienes asignaciones pendientes</h3>
              <p>Los nuevos servicios asignados aparecerán aquí</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {misAsignaciones.map((alarma) => (
            <Card key={alarma.id} className="border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      {alarma.tipo}
                      <Badge variant={getPriorityColor(alarma.prioridad)}>
                        {alarma.prioridad}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Asignado el {format(new Date(alarma.created_at), 'dd/MM/yyyy HH:mm')}
                    </CardDescription>
                  </div>
                  <Badge variant={getStatusColor(alarma.estado)}>
                    {alarma.estado}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Información del Cliente */}
                  <div>
                    <h4 className="font-semibold mb-2">Información del Cliente</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="font-medium">{alarma.clientes?.nombre || 'Cliente no especificado'}</p>
                        {alarma.direccion && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                            <MapPin className="h-3 w-3" />
                            <span>{alarma.direccion}</span>
                          </div>
                        )}
                        {alarma.municipio && (
                          <p className="text-sm text-muted-foreground">
                            Municipio: {alarma.municipio}
                          </p>
                        )}
                      </div>
                      <div>
                        {alarma.clientes?.telefono && (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3" />
                            <span>{alarma.clientes.telefono}</span>
                          </div>
                        )}
                        {alarma.descripcion && (
                          <p className="text-sm text-muted-foreground mt-2">
                            <strong>Descripción:</strong> {alarma.descripcion}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Información de la Patrulla */}
                  <div>
                    <h4 className="font-semibold mb-2">Patrulla Asignada</h4>
                    <p className="text-sm">
                      <strong>Patrulla:</strong> {alarma.patrulla_asignada || 'No asignada'}
                    </p>
                    <p className="text-sm">
                      <strong>Supervisor:</strong> {alarma.supervisor || user?.full_name}
                    </p>
                  </div>

                  {/* Tiempos */}
                  <div>
                    <h4 className="font-semibold mb-2">Información de Tiempos</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Creada:</span>
                        <p>{format(new Date(alarma.created_at), 'HH:mm:ss')}</p>
                      </div>
                      {alarma.tiempo_asignacion_supervisor && (
                        <div>
                          <span className="text-muted-foreground">Asignada:</span>
                          <p>{format(new Date(alarma.tiempo_asignacion_supervisor), 'HH:mm:ss')}</p>
                        </div>
                      )}
                      {alarma.attended_at && (
                        <div>
                          <span className="text-muted-foreground">Atendida:</span>
                          <p>{format(new Date(alarma.attended_at), 'HH:mm:ss')}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-2 pt-4 border-t">
                    {alarma.estado === 'asignada' && (
                      <Button 
                        onClick={() => handleAceptarAsignacion(alarma.id)}
                        className="flex items-center gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Aceptar Asignación
                      </Button>
                    )}
                    {alarma.estado === 'en_proceso' && (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">Servicio en proceso</span>
                      </div>
                    )}
                    {alarma.estado === 'resuelta' && (
                      <div className="flex items-center gap-2 text-blue-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">Servicio completado</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MisAsignaciones;