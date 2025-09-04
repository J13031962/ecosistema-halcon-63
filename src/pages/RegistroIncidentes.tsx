import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useSupabaseIncidentes } from "@/hooks/useSupabaseIncidentes";
import { useAuthConsolidated } from "@/hooks/useAuthConsolidated";
import { AlertTriangle, Plus, MapPin, Clock, User, CheckCircle } from "lucide-react";
import { format } from "date-fns";

const RegistroIncidentes = () => {
  const { incidentes, loading, addIncidente, updateIncidente, resolveIncidente } = useSupabaseIncidentes();
  const { user } = useAuthConsolidated();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    tipo_incidente: '',
    descripcion: '',
    ubicacion: '',
    gravedad: 'media'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addIncidente({
        ...formData,
        supervisor_id: user?.id,
        supervisor_nombre: user?.full_name
      });
      setFormData({
        tipo_incidente: '',
        descripcion: '',
        ubicacion: '',
        gravedad: 'media'
      });
      setShowModal(false);
    } catch (error) {
      console.error('Error creating incident:', error);
    }
  };

  const getGravedadColor = (gravedad: string) => {
    switch (gravedad) {
      case 'alta': return 'destructive';
      case 'media': return 'default';
      case 'baja': return 'secondary';
      default: return 'outline';
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'reportado': return 'destructive';
      case 'en_investigacion': return 'default';
      case 'resuelto': return 'secondary';
      default: return 'outline';
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
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Registro de Incidentes</h1>
          <p className="text-muted-foreground">
            Reporta y gestiona incidentes durante el servicio
          </p>
        </div>
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Incidente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Reportar Nuevo Incidente</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="tipo_incidente">Tipo de Incidente</Label>
                <Select value={formData.tipo_incidente} onValueChange={(value) => setFormData({...formData, tipo_incidente: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="robo">Robo</SelectItem>
                    <SelectItem value="vandalismo">Vandalismo</SelectItem>
                    <SelectItem value="accidente">Accidente</SelectItem>
                    <SelectItem value="altercado">Altercado</SelectItem>
                    <SelectItem value="sospechoso">Actividad Sospechosa</SelectItem>
                    <SelectItem value="emergencia_medica">Emergencia Médica</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="gravedad">Gravedad</Label>
                <Select value={formData.gravedad} onValueChange={(value) => setFormData({...formData, gravedad: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baja">Baja</SelectItem>
                    <SelectItem value="media">Media</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="ubicacion">Ubicación</Label>
                <Input 
                  value={formData.ubicacion}
                  onChange={(e) => setFormData({...formData, ubicacion: e.target.value})}
                  placeholder="Dirección o punto de referencia"
                />
              </div>

              <div>
                <Label htmlFor="descripcion">Descripción del Incidente</Label>
                <Textarea 
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  placeholder="Describe detalladamente lo sucedido..."
                  rows={4}
                  required
                />
              </div>

              <Button type="submit" className="w-full">
                Reportar Incidente
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Incidentes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{incidentes.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reportados Hoy</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {incidentes.filter(i => {
                const created = new Date(i.created_at);
                const today = new Date();
                return created.toDateString() === today.toDateString();
              }).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gravedad Alta</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {incidentes.filter(i => i.gravedad === 'alta').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resueltos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {incidentes.filter(i => i.estado === 'resuelto').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de incidentes */}
      <div className="space-y-4">
        {incidentes.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay incidentes registrados</h3>
              <p className="text-muted-foreground">
                Los incidentes reportados aparecerán aquí.
              </p>
            </CardContent>
          </Card>
        ) : (
          incidentes.map((incidente) => (
            <Card key={incidente.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <CardTitle className="text-lg capitalize">{incidente.tipo_incidente}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-4 w-4" />
                        {incidente.supervisor_nombre || 'Sin supervisor'}
                        {incidente.ubicacion && (
                          <>
                            <MapPin className="h-4 w-4 ml-2" />
                            {incidente.ubicacion}
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={getGravedadColor(incidente.gravedad)}>
                        {incidente.gravedad.toUpperCase()}
                      </Badge>
                      <Badge variant={getEstadoColor(incidente.estado)}>
                        {incidente.estado.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    {format(new Date(incidente.created_at), 'dd/MM/yyyy HH:mm')}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-4">{incidente.descripcion}</p>
                {incidente.estado !== 'resuelto' && (
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => updateIncidente(incidente.id, { estado: 'en_investigacion' })}
                    >
                      Investigar
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => resolveIncidente(incidente.id)}
                    >
                      Marcar Resuelto
                    </Button>
                  </div>
                )}
                {incidente.resolved_at && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Resuelto el: {format(new Date(incidente.resolved_at), 'dd/MM/yyyy HH:mm')}
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default RegistroIncidentes;