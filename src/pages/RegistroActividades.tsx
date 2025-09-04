import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useSupabaseActividades } from "@/hooks/useSupabaseActividades";
import { useAuthConsolidated } from "@/hooks/useAuthConsolidated";
import { Activity, Plus, MapPin, Clock, User, Calendar } from "lucide-react";
import { format } from "date-fns";

const RegistroActividades = () => {
  const { actividades, loading, addActividad } = useSupabaseActividades();
  const { user } = useAuthConsolidated();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    tipo_actividad: '',
    descripcion: '',
    ubicacion: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addActividad({
        ...formData,
        supervisor_id: user?.id,
        supervisor_nombre: user?.full_name
      });
      setFormData({
        tipo_actividad: '',
        descripcion: '',
        ubicacion: ''
      });
      setShowModal(false);
    } catch (error) {
      console.error('Error creating activity:', error);
    }
  };

  const getActividadColor = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case 'patrullaje': return 'default';
      case 'inspeccion': return 'secondary';
      case 'capacitacion': return 'outline';
      case 'mantenimiento': return 'destructive';
      case 'reunion': return 'default';
      default: return 'outline';
    }
  };

  const getActividadIcon = (tipo: string) => {
    return <Activity className="h-4 w-4" />;
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
          <h1 className="text-3xl font-bold">Registro de Actividades</h1>
          <p className="text-muted-foreground">
            Registra y consulta las actividades realizadas durante el servicio
          </p>
        </div>
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nueva Actividad
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Registrar Nueva Actividad</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="tipo_actividad">Tipo de Actividad</Label>
                <Select value={formData.tipo_actividad} onValueChange={(value) => setFormData({...formData, tipo_actividad: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="patrullaje">Patrullaje</SelectItem>
                    <SelectItem value="inspeccion">Inspección</SelectItem>
                    <SelectItem value="capacitacion">Capacitación</SelectItem>
                    <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                    <SelectItem value="reunion">Reunión</SelectItem>
                    <SelectItem value="escolta">Escolta</SelectItem>
                    <SelectItem value="vigilancia">Vigilancia</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
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
                <Label htmlFor="descripcion">Descripción de la Actividad</Label>
                <Textarea 
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  placeholder="Describe la actividad realizada..."
                  rows={4}
                />
              </div>

              <Button type="submit" className="w-full">
                Registrar Actividad
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Actividades</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{actividades.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoy</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {actividades.filter(a => {
                const created = new Date(a.created_at);
                const today = new Date();
                return created.toDateString() === today.toDateString();
              }).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {actividades.filter(a => {
                const created = new Date(a.created_at);
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return created >= weekAgo;
              }).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patrullajes</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {actividades.filter(a => a.tipo_actividad.toLowerCase() === 'patrullaje').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de actividades */}
      <div className="space-y-4">
        {actividades.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay actividades registradas</h3>
              <p className="text-muted-foreground">
                Las actividades que registres aparecerán aquí.
              </p>
            </CardContent>
          </Card>
        ) : (
          actividades.map((actividad) => (
            <Card key={actividad.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <CardTitle className="text-lg capitalize flex items-center gap-2">
                        {getActividadIcon(actividad.tipo_actividad)}
                        {actividad.tipo_actividad}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-4 w-4" />
                        {actividad.supervisor_nombre || 'Sin supervisor'}
                        {actividad.ubicacion && (
                          <>
                            <MapPin className="h-4 w-4 ml-2" />
                            {actividad.ubicacion}
                          </>
                        )}
                      </div>
                    </div>
                    <Badge variant={getActividadColor(actividad.tipo_actividad)}>
                      {actividad.tipo_actividad.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    {format(new Date(actividad.created_at), 'dd/MM/yyyy HH:mm')}
                  </div>
                </div>
              </CardHeader>
              {actividad.descripcion && (
                <CardContent>
                  <p>{actividad.descripcion}</p>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default RegistroActividades;