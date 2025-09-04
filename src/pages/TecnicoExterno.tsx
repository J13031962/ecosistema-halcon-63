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
  FileSpreadsheet,
  ExternalLink
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

const TecnicoExterno = () => {
  const { servicios, loading, fetchServicios } = useServiciosTecnicos();
  
  // Filtrar solo servicios para técnicos externos
  const serviciosExterno = servicios.filter(s => s.tecnico_tipo === 'externo');
  
  console.log('⚙️ Servicios técnico externo:', serviciosExterno);

  const exportServiciosPDF = () => {
    if (serviciosExterno.length === 0) {
      toast({
        title: "Sin datos",
        description: "No hay servicios para exportar",
        variant: "destructive"
      });
      return;
    }

    const data = serviciosExterno.map(servicio => ({
      cliente: servicio.cliente_razon_social,
      motivo: servicio.motivo_servicio,
      direccion: servicio.cliente_direccion,
      encargado: servicio.persona_encargada,
      estado: servicio.estado,
      costo: `$${servicio.costo_estimado || 0}`,
      tiempo: `${servicio.tiempo_estimado_horas || 0}h`
    }));

    exportToPDF(data, "Mis Servicios Externos", ["Cliente", "Motivo", "Dirección", "Encargado", "Estado", "Costo", "Tiempo"]);
  };

  const exportServiciosExcel = () => {
    if (serviciosExterno.length === 0) {
      toast({
        title: "Sin datos",
        description: "No hay servicios para exportar",
        variant: "destructive"
      });
      return;
    }

    const data = serviciosExterno.map(servicio => ({
      'Cliente': servicio.cliente_razon_social,
      'Motivo': servicio.motivo_servicio,
      'Dirección': servicio.cliente_direccion,
      'Persona Encargada': servicio.persona_encargada,
      'Descripción': servicio.descripcion_detallada,
      'Estado': servicio.estado,
      'Prioridad': servicio.prioridad,
      'Costo Estimado': `$${servicio.costo_estimado || 0}`,
      'Tiempo Estimado': `${servicio.tiempo_estimado_horas || 0} horas`,
      'Fecha Asignación': new Date(servicio.fecha_asignacion).toLocaleDateString()
    }));

    exportToExcel(data, "Mis Servicios Externos");
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Panel Técnico - Personal Externo</h1>
          <p className="text-muted-foreground">
            Mis servicios técnicos contratados por el Director Técnico
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
            <CardTitle className="text-sm font-medium">Total Contratos</CardTitle>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{serviciosExterno.length}</div>
            <p className="text-xs text-muted-foreground">Servicios contratados</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Progreso</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {serviciosExterno.filter(s => s.estado === 'en_progreso').length}
            </div>
            <p className="text-xs text-muted-foreground">Ejecutando</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completados</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {serviciosExterno.filter(s => s.estado === 'completado').length}
            </div>
            <p className="text-xs text-muted-foreground">Este mes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Mes</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${serviciosExterno.filter(s => s.estado === 'completado').reduce((sum, s) => sum + (s.costo_estimado || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">Servicios facturados</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Servicios */}
      <Card>
        <CardHeader>
          <CardTitle>Mis Contratos de Servicio</CardTitle>
          <CardDescription>
            Lista de servicios técnicos contratados por el Director Técnico
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Cargando servicios...</p>
            </div>
          ) : serviciosExterno.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No tienes contratos asignados actualmente
            </div>
          ) : (
            <div className="space-y-4">
              {serviciosExterno.map((servicio) => (
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

export default TecnicoExterno;