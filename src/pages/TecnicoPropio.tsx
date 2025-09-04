import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { exportToPDF, exportToExcel } from "@/utils/exportUtils";
import { ServicioTecnicoCard } from "@/components/servicios-tecnicos/ServicioTecnicoCard";
import { useServiciosTecnicos } from "@/hooks/useServiciosTecnicos";
import { 
  Wrench, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Download,
  FileSpreadsheet
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuthConsolidated } from "@/hooks/useAuthConsolidated";

const TecnicoPropio = () => {
  const { servicios, loading, fetchServicios } = useServiciosTecnicos();
  const { user } = useAuthConsolidated();
  
  // Filtrar solo servicios para técnicos propios
  const serviciosPropio = servicios.filter(s => s.tecnico_tipo === 'propio');
  
  console.log('🔧 Servicios técnico propio:', serviciosPropio);
  console.log('👤 Usuario actual:', JSON.stringify(user, null, 2));

  const exportServiciosPDF = () => {
    if (serviciosPropio.length === 0) {
      toast({
        title: "Sin datos",
        description: "No hay servicios para exportar",
        variant: "destructive"
      });
      return;
    }

    const data = serviciosPropio.map(servicio => ({
      cliente: servicio.cliente_razon_social,
      motivo: servicio.motivo_servicio,
      direccion: servicio.cliente_direccion,
      encargado: servicio.persona_encargada,
      estado: servicio.estado,
      prioridad: servicio.prioridad
    }));

    exportToPDF(data, "Mis Servicios Técnicos", ["Cliente", "Motivo", "Dirección", "Encargado", "Estado", "Prioridad"]);
  };

  const exportServiciosExcel = () => {
    if (serviciosPropio.length === 0) {
      toast({
        title: "Sin datos",
        description: "No hay servicios para exportar",
        variant: "destructive"
      });
      return;
    }

    const data = serviciosPropio.map(servicio => ({
      'Cliente': servicio.cliente_razon_social,
      'Motivo': servicio.motivo_servicio,
      'Dirección': servicio.cliente_direccion,
      'Persona Encargada': servicio.persona_encargada,
      'Descripción': servicio.descripcion_detallada,
      'Estado': servicio.estado,
      'Prioridad': servicio.prioridad,
      'Fecha Asignación': new Date(servicio.fecha_asignacion).toLocaleDateString(),
      'Tiempo Estimado': `${servicio.tiempo_estimado_horas || 0} horas`
    }));

    exportToExcel(data, "Mis Servicios Técnicos");
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Panel Técnico - Personal Interno</h1>
          <p className="text-muted-foreground">
            Mis servicios técnicos asignados por el Director Técnico
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportServiciosPDF}>
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button variant="outline" onClick={exportServiciosExcel}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Excel
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Servicios</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{serviciosPropio.length}</div>
            <p className="text-xs text-muted-foreground">Servicios asignados</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Progreso</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {serviciosPropio.filter(s => s.estado === 'en_progreso').length}
            </div>
            <p className="text-xs text-muted-foreground">Trabajando ahora</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completados</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {serviciosPropio.filter(s => s.estado === 'completado').length}
            </div>
            <p className="text-xs text-muted-foreground">Este mes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alta Prioridad</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {serviciosPropio.filter(s => s.prioridad === 'alta' || s.prioridad === 'urgente').length}
            </div>
            <p className="text-xs text-muted-foreground">Urgentes</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Servicios */}
      <Card>
        <CardHeader>
          <CardTitle>Mis Servicios Asignados</CardTitle>
          <CardDescription>
            Lista de servicios técnicos asignados por el Director Técnico
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Cargando servicios...</p>
            </div>
          ) : serviciosPropio.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No tienes servicios asignados actualmente
            </div>
          ) : (
            <div className="space-y-4">
              {serviciosPropio.map((servicio) => (
                <ServicioTecnicoCard 
                  key={servicio.id} 
                  servicio={servicio} 
                  onRefresh={fetchServicios}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
};

export default TecnicoPropio;