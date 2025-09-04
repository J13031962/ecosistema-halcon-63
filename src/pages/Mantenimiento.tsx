import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Wrench, Plus, Calendar, Clock, User, Settings, Download, FileText } from "lucide-react";
import { toast } from "sonner";

interface MantenimientoItem {
  id: string;
  equipo: string;
  tipo: string;
  descripcion: string;
  tecnico: string;
  fecha_programada: string;
  estado: 'pendiente' | 'en_proceso' | 'completado' | 'cancelado';
  prioridad: 'baja' | 'media' | 'alta' | 'critica';
  observaciones?: string;
}

const mantenimientosMock: MantenimientoItem[] = [
  {
    id: "1",
    equipo: "Servidor Principal DC1",
    tipo: "Equipos de Cómputo",
    descripcion: "Limpieza preventiva y actualización de drivers",
    tecnico: "Juan Pérez",
    fecha_programada: "2024-01-15",
    estado: "pendiente",
    prioridad: "alta",
    observaciones: "Verificar temperatura del CPU"
  },
  {
    id: "2",
    equipo: "Planta Eléctrica Edificio A",
    tipo: "Planta Eléctrica",
    descripcion: "Cambio de aceite y filtros",
    tecnico: "María González",
    fecha_programada: "2024-01-10",
    estado: "en_proceso",
    prioridad: "critica"
  },
  {
    id: "3",
    equipo: "UPS Sala de Control",
    tipo: "Sistema Eléctrico",
    descripcion: "Revisión de baterías y conexiones",
    tecnico: "Carlos Rodríguez",
    fecha_programada: "2024-01-08",
    estado: "completado",
    prioridad: "media"
  }
];

export default function Mantenimiento() {
  const [mantenimientos, setMantenimientos] = useState<MantenimientoItem[]>(mantenimientosMock);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newMantenimiento, setNewMantenimiento] = useState({
    equipo: "",
    tipo: "",
    descripcion: "",
    tecnico: "",
    fecha_programada: "",
    prioridad: "media" as const,
    observaciones: ""
  });

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'pendiente': return 'default';
      case 'en_proceso': return 'secondary';
      case 'completado': return 'outline';
      case 'cancelado': return 'destructive';
      default: return 'default';
    }
  };

  const getPrioridadBadge = (prioridad: string) => {
    switch (prioridad) {
      case 'baja': return 'outline';
      case 'media': return 'secondary';
      case 'alta': return 'default';
      case 'critica': return 'destructive';
      default: return 'default';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMantenimiento.equipo || !newMantenimiento.tipo || !newMantenimiento.descripcion || 
        !newMantenimiento.tecnico || !newMantenimiento.fecha_programada) {
      toast.error("Por favor complete todos los campos obligatorios");
      return;
    }

    const nuevoMantenimiento: MantenimientoItem = {
      id: Date.now().toString(),
      ...newMantenimiento,
      estado: 'pendiente'
    };

    setMantenimientos(prev => [nuevoMantenimiento, ...prev]);
    setNewMantenimiento({
      equipo: "",
      tipo: "",
      descripcion: "",
      tecnico: "",
      fecha_programada: "",
      prioridad: "media",
      observaciones: ""
    });
    setIsDialogOpen(false);
    toast.success("Mantenimiento programado correctamente");
  };

  const exportToPDF = async () => {
    try {
      // Dynamic imports to avoid initial loading issues
      const jsPDF = (await import('jspdf')).default;
      const { default: autoTable } = await import('jspdf-autotable');
      
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.text('Reporte de Mantenimientos', 14, 22);
      doc.setFontSize(12);
      doc.text(`Fecha de generación: ${new Date().toLocaleDateString()}`, 14, 30);
      
      // Prepare data for table
      const tableData = mantenimientos.map(item => [
        item.equipo,
        item.tipo,
        item.descripcion,
        item.tecnico,
        new Date(item.fecha_programada).toLocaleDateString(),
        item.estado.toUpperCase(),
        item.prioridad.toUpperCase()
      ]);

      // Create table
      autoTable(doc, {
        startY: 40,
        head: [['Equipo', 'Tipo', 'Descripción', 'Técnico', 'Fecha', 'Estado', 'Prioridad']],
        body: tableData,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [66, 139, 202] }
      });

      doc.save('reporte-mantenimientos.pdf');
      toast.success("Reporte PDF generado correctamente");
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error("Error al generar el reporte PDF");
    }
  };

  const exportToExcel = async () => {
    try {
      // Dynamic import to avoid initial loading issues
      const XLSX = await import('xlsx');
      
      const wsData = [
        ['Equipo', 'Tipo', 'Descripción', 'Técnico', 'Fecha Programada', 'Estado', 'Prioridad', 'Observaciones'],
        ...mantenimientos.map(item => [
          item.equipo,
          item.tipo,
          item.descripcion,
          item.tecnico,
          item.fecha_programada,
          item.estado,
          item.prioridad,
          item.observaciones || ''
        ])
      ];

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Mantenimientos');
      
      XLSX.writeFile(wb, 'reporte-mantenimientos.xlsx');
      toast.success("Reporte Excel generado correctamente");
    } catch (error) {
      console.error('Error generating Excel:', error);
      toast.error("Error al generar el reporte Excel");
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wrench className="h-6 w-6" />
            Gestión de Mantenimiento
          </h1>
          <p className="text-muted-foreground">
            Programación y seguimiento de mantenimientos preventivos y correctivos
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToPDF} className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Exportar PDF
          </Button>
          <Button variant="outline" onClick={exportToExcel} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exportar Excel
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Nuevo Mantenimiento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Programar Nuevo Mantenimiento</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="equipo">Equipo *</Label>
                    <Input
                      id="equipo"
                      value={newMantenimiento.equipo}
                      onChange={(e) => setNewMantenimiento(prev => ({ ...prev, equipo: e.target.value }))}
                      placeholder="Nombre del equipo"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="tipo">Tipo de Equipo *</Label>
                    <Select value={newMantenimiento.tipo} onValueChange={(value) => setNewMantenimiento(prev => ({ ...prev, tipo: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Equipos de Cómputo">Equipos de Cómputo</SelectItem>
                        <SelectItem value="Planta Eléctrica">Planta Eléctrica</SelectItem>
                        <SelectItem value="Sistema Eléctrico">Sistema Eléctrico</SelectItem>
                        <SelectItem value="Cámaras de Seguridad">Cámaras de Seguridad</SelectItem>
                        <SelectItem value="Sistema de Alarmas">Sistema de Alarmas</SelectItem>
                        <SelectItem value="Comunicaciones">Comunicaciones</SelectItem>
                        <SelectItem value="Climatización">Climatización</SelectItem>
                        <SelectItem value="Otros">Otros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="descripcion">Descripción del Mantenimiento *</Label>
                  <Textarea
                    id="descripcion"
                    value={newMantenimiento.descripcion}
                    onChange={(e) => setNewMantenimiento(prev => ({ ...prev, descripcion: e.target.value }))}
                    placeholder="Describe las tareas a realizar"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tecnico">Técnico Asignado *</Label>
                    <Select value={newMantenimiento.tecnico} onValueChange={(value) => setNewMantenimiento(prev => ({ ...prev, tecnico: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar técnico" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Juan Pérez">Juan Pérez</SelectItem>
                        <SelectItem value="María González">María González</SelectItem>
                        <SelectItem value="Carlos Rodríguez">Carlos Rodríguez</SelectItem>
                        <SelectItem value="Ana Martínez">Ana Martínez</SelectItem>
                        <SelectItem value="Luis Torres">Luis Torres</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="fecha">Fecha Programada *</Label>
                    <Input
                      id="fecha"
                      type="date"
                      value={newMantenimiento.fecha_programada}
                      onChange={(e) => setNewMantenimiento(prev => ({ ...prev, fecha_programada: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="prioridad">Prioridad</Label>
                  <Select value={newMantenimiento.prioridad} onValueChange={(value: any) => setNewMantenimiento(prev => ({ ...prev, prioridad: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baja">Baja</SelectItem>
                      <SelectItem value="media">Media</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="critica">Crítica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="observaciones">Observaciones Adicionales</Label>
                  <Textarea
                    id="observaciones"
                    value={newMantenimiento.observaciones}
                    onChange={(e) => setNewMantenimiento(prev => ({ ...prev, observaciones: e.target.value }))}
                    placeholder="Observaciones o instrucciones especiales"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    Programar Mantenimiento
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendientes</p>
                <p className="text-2xl font-bold">{mantenimientos.filter(m => m.estado === 'pendiente').length}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En Proceso</p>
                <p className="text-2xl font-bold">{mantenimientos.filter(m => m.estado === 'en_proceso').length}</p>
              </div>
              <Settings className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completados</p>
                <p className="text-2xl font-bold">{mantenimientos.filter(m => m.estado === 'completado').length}</p>
              </div>
              <Wrench className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{mantenimientos.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mantenimientos Table */}
      <Card>
        <CardHeader>
          <CardTitle>Mantenimientos Programados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mantenimientos.map((mantenimiento) => (
              <div key={mantenimiento.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold">{mantenimiento.equipo}</h3>
                    <p className="text-sm text-muted-foreground">{mantenimiento.tipo}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={getPrioridadBadge(mantenimiento.prioridad)}>
                      {mantenimiento.prioridad.toUpperCase()}
                    </Badge>
                    <Badge variant={getEstadoBadge(mantenimiento.estado)}>
                      {mantenimiento.estado.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                </div>
                
                <p className="text-sm mb-3">{mantenimiento.descripcion}</p>
                
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {mantenimiento.tecnico}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(mantenimiento.fecha_programada).toLocaleDateString()}
                    </span>
                  </div>
                  <Button variant="outline" size="sm">
                    Ver Detalles
                  </Button>
                </div>
                
                {mantenimiento.observaciones && (
                  <div className="mt-2 p-2 bg-muted rounded text-sm">
                    <strong>Observaciones:</strong> {mantenimiento.observaciones}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}