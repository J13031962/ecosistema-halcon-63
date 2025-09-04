import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useServiciosTecnicos, ServicioTecnico } from "@/hooks/useServiciosTecnicos";
import { useAuthConsolidated } from "@/hooks/useAuthConsolidated";
import { ServicioTecnicoCard } from "@/components/servicios-tecnicos/ServicioTecnicoCard";
import { 
  Settings, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Calendar,
  User,
  MapPin,
  Plus,
  FileText
} from "lucide-react";
import { format } from "date-fns";

const ServiciosTecnicos = () => {
  const { servicios, loading, aceptarServicio, iniciarServicio, completarServicio, agregarObservacion } = useServiciosTecnicos();
  const { user } = useAuthConsolidated();
  const [selectedServicio, setSelectedServicio] = useState<ServicioTecnico | null>(null);
  const [observacion, setObservacion] = useState("");
  const [showObservacionDialog, setShowObservacionDialog] = useState(false);

  // Filtrar servicios por estado
  const serviciosPendientes = servicios.filter(s => s.estado === 'pendiente');
  const serviciosAceptados = servicios.filter(s => s.estado === 'aceptado' || s.estado === 'en_progreso');
  const serviciosCompletados = servicios.filter(s => s.estado === 'completado');

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'pendiente': return 'destructive';
      case 'aceptado': return 'default';
      case 'en_progreso': return 'secondary';
      case 'completado': return 'outline';
      case 'cancelado': return 'destructive';
      default: return 'outline';
    }
  };

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case 'urgente': return 'destructive';
      case 'alta': return 'default';
      case 'media': return 'secondary';
      case 'baja': return 'outline';
      default: return 'outline';
    }
  };

  const handleAgregarObservacion = async () => {
    if (!selectedServicio || !observacion.trim()) return;
    
    const success = await agregarObservacion(selectedServicio.id, observacion);
    if (success) {
      setObservacion("");
      setShowObservacionDialog(false);
      setSelectedServicio(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded w-2/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="h-48 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Mis Servicios Técnicos
          </h1>
          <p className="text-muted-foreground">
            Gestiona tus servicios técnicos asignados
          </p>
        </div>
        <div className="text-right text-sm text-muted-foreground">
          <p className="font-medium">{user?.full_name}</p>
          <p>FECHA: {new Date().toLocaleDateString()}</p>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Servicios</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{servicios.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{serviciosPendientes.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Progreso</CardTitle>
            <AlertTriangle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{serviciosAceptados.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{serviciosCompletados.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de servicios */}
      <Tabs defaultValue="pendientes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pendientes">
            Pendientes ({serviciosPendientes.length})
          </TabsTrigger>
          <TabsTrigger value="en_progreso">
            En Progreso ({serviciosAceptados.length})
          </TabsTrigger>
          <TabsTrigger value="completados">
            Completados ({serviciosCompletados.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pendientes" className="space-y-4">
          {serviciosPendientes.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No hay servicios pendientes</h3>
                <p className="text-muted-foreground">
                  Cuando te asignen nuevos servicios aparecerán aquí.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {serviciosPendientes.map((servicio) => (
                <ServicioTecnicoCard
                  key={servicio.id}
                  servicio={servicio}
                  onRefresh={() => window.location.reload()}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="en_progreso" className="space-y-4">
          {serviciosAceptados.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No hay servicios en progreso</h3>
                <p className="text-muted-foreground">
                  Los servicios que aceptes y estés trabajando aparecerán aquí.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {serviciosAceptados.map((servicio) => (
                <ServicioTecnicoCard
                  key={servicio.id}
                  servicio={servicio}
                  onRefresh={() => window.location.reload()}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completados" className="space-y-4">
          {serviciosCompletados.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No hay servicios completados</h3>
                <p className="text-muted-foreground">
                  Los servicios que completes aparecerán aquí.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {serviciosCompletados.map((servicio) => (
                <ServicioTecnicoCard
                  key={servicio.id}
                  servicio={servicio}
                  onRefresh={() => window.location.reload()}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog para agregar observaciones */}
      <Dialog open={showObservacionDialog} onOpenChange={setShowObservacionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Observación</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="observacion">Observación</Label>
              <Textarea
                id="observacion"
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
                placeholder="Escribe tu observación aquí..."
                rows={4}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowObservacionDialog(false);
                  setObservacion("");
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleAgregarObservacion}>
                Agregar Observación
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ServiciosTecnicos;