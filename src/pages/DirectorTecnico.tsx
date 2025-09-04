import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSupabaseUsuarios } from "@/hooks/useSupabaseUsuarios";
import { exportToPDF, exportToExcel } from "@/utils/exportUtils";
import { 
  Users, 
  Plus, 
  Download, 
  FileSpreadsheet, 
  Wrench, 
  Clock,
  CheckCircle,
  AlertTriangle,
  Calendar,
  UserCheck
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

const DirectorTecnico = () => {
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTecnico, setSelectedTecnico] = useState("");
  const [tipoServicio, setTipoServicio] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [reportTipoFecha, setReportTipoFecha] = useState("mes");
  const [reportMes, setReportMes] = useState("");
  const [reportFechaInicio, setReportFechaInicio] = useState("");
  const [reportFechaFin, setReportFechaFin] = useState("");

  const { users } = useSupabaseUsuarios();

  // Filtrar técnicos propios y externos
  const tecnicosPropios = users.filter(user => 
    user.user_roles.some(role => role.role === 'tecnico_propio')
  );
  
  const tecnicosExternos = users.filter(user => 
    user.user_roles.some(role => role.role === 'tecnico_externo')
  );

  // Datos simulados de órdenes de trabajo
  const [ordenesServicio, setOrdenesServicio] = useState([
    {
      id: '1',
      tecnico_id: 'tec1',
      tecnico_nombre: 'Juan Pérez',
      tipo_tecnico: 'propio',
      tipo_servicio: 'Instalación',
      descripcion: 'Instalación de sistema de alarmas',
      fecha_asignacion: '2024-01-15',
      estado: 'en_progreso',
      cliente: 'Empresa ABC'
    },
    {
      id: '2',
      tecnico_id: 'tec2',
      tecnico_nombre: 'María García',
      tipo_tecnico: 'externo',
      tipo_servicio: 'Mantenimiento',
      descripcion: 'Mantenimiento preventivo cámaras',
      fecha_asignacion: '2024-01-16',
      estado: 'completado',
      cliente: 'Hotel XYZ'
    }
  ]);

  const handleAssignOrden = async () => {
    if (!selectedTecnico || !tipoServicio || !descripcion) {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos obligatorios",
        variant: "destructive"
      });
      return;
    }

    const allTecnicos = [...tecnicosPropios, ...tecnicosExternos];
    const selectedTecnicoData = allTecnicos.find(tec => tec.id === selectedTecnico);
    if (!selectedTecnicoData) return;

    const tipoTecnico = tecnicosPropios.find(t => t.id === selectedTecnico) ? 'propio' : 'externo';

    const nuevaOrden = {
      id: Date.now().toString(),
      tecnico_id: selectedTecnico,
      tecnico_nombre: selectedTecnicoData.full_name,
      tipo_tecnico: tipoTecnico,
      tipo_servicio: tipoServicio,
      descripcion,
      fecha_asignacion: new Date().toISOString().split('T')[0],
      estado: 'pendiente',
      cliente: 'Cliente asignado'
    };

    setOrdenesServicio(prev => [...prev, nuevaOrden]);

    toast({
      title: "Orden asignada",
      description: `Orden asignada exitosamente a ${selectedTecnicoData.full_name}`,
    });

    setShowAssignModal(false);
    setSelectedTecnico("");
    setTipoServicio("");
    setDescripcion("");
  };

  const exportReportePDF = () => {
    let filteredData = ordenesServicio;
    
    if (reportTipoFecha === "mes" && reportMes) {
      filteredData = ordenesServicio.filter(orden => 
        orden.fecha_asignacion.startsWith(reportMes)
      );
    } else if (reportTipoFecha === "rango" && reportFechaInicio && reportFechaFin) {
      filteredData = ordenesServicio.filter(orden => 
        orden.fecha_asignacion >= reportFechaInicio && orden.fecha_asignacion <= reportFechaFin
      );
    }

    if (filteredData.length === 0) {
      toast({
        title: "Sin datos",
        description: "No hay órdenes para exportar en el período seleccionado",
        variant: "destructive"
      });
      return;
    }

    const data = filteredData.map(orden => ({
      tecnico: orden.tecnico_nombre,
      tipo: orden.tipo_tecnico,
      servicio: orden.tipo_servicio,
      fecha: orden.fecha_asignacion,
      estado: orden.estado,
      cliente: orden.cliente
    }));

    exportToPDF(data, "Reporte Técnicos", ["Técnico", "Tipo", "Servicio", "Fecha", "Estado", "Cliente"]);
  };

  const exportReporteExcel = () => {
    let filteredData = ordenesServicio;
    
    if (reportTipoFecha === "mes" && reportMes) {
      filteredData = ordenesServicio.filter(orden => 
        orden.fecha_asignacion.startsWith(reportMes)
      );
    } else if (reportTipoFecha === "rango" && reportFechaInicio && reportFechaFin) {
      filteredData = ordenesServicio.filter(orden => 
        orden.fecha_asignacion >= reportFechaInicio && orden.fecha_asignacion <= reportFechaFin
      );
    }

    if (filteredData.length === 0) {
      toast({
        title: "Sin datos",
        description: "No hay órdenes para exportar en el período seleccionado",
        variant: "destructive"
      });
      return;
    }

    const data = filteredData.map(orden => ({
      'Técnico': orden.tecnico_nombre,
      'Tipo': orden.tipo_tecnico,
      'Servicio': orden.tipo_servicio,
      'Fecha': orden.fecha_asignacion,
      'Estado': orden.estado,
      'Cliente': orden.cliente,
      'Descripción': orden.descripcion
    }));

    exportToExcel(data, "Reporte Técnicos");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Director Técnico</h1>
          <p className="text-muted-foreground">
            Gestión y supervisión de técnicos propios y externos
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Asignar Orden
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Asignar Orden de Servicio</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="tecnico">Técnico</Label>
                  <Select value={selectedTecnico} onValueChange={setSelectedTecnico}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar técnico" />
                    </SelectTrigger>
                    <SelectContent>
                      <optgroup label="Técnicos Propios">
                        {tecnicosPropios.map(tecnico => (
                          <SelectItem key={tecnico.id} value={tecnico.id}>
                            {tecnico.full_name} - Propio
                          </SelectItem>
                        ))}
                      </optgroup>
                      <optgroup label="Técnicos Externos">
                        {tecnicosExternos.map(tecnico => (
                          <SelectItem key={tecnico.id} value={tecnico.id}>
                            {tecnico.full_name} - Externo
                          </SelectItem>
                        ))}
                      </optgroup>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="tipoServicio">Tipo de Servicio</Label>
                  <Select value={tipoServicio} onValueChange={setTipoServicio}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instalacion">Instalación</SelectItem>
                      <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                      <SelectItem value="reparacion">Reparación</SelectItem>
                      <SelectItem value="revision">Revisión</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Textarea
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="Descripción del servicio a realizar..."
                  />
                </div>
                <Button onClick={handleAssignOrden} className="w-full">
                  Asignar Orden
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Técnicos Propios</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tecnicosPropios.length}</div>
            <p className="text-xs text-muted-foreground">Personal interno</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Técnicos Externos</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tecnicosExternos.length}</div>
            <p className="text-xs text-muted-foreground">Personal externo</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Órdenes Activas</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {ordenesServicio.filter(o => o.estado !== 'completado').length}
            </div>
            <p className="text-xs text-muted-foreground">En progreso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Órdenes Completadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {ordenesServicio.filter(o => o.estado === 'completado').length}
            </div>
            <p className="text-xs text-muted-foreground">Este mes</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="ordenes" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="ordenes">Órdenes de Servicio</TabsTrigger>
          <TabsTrigger value="tecnicos">Gestión Técnicos</TabsTrigger>
          <TabsTrigger value="reportes">Reportes</TabsTrigger>
        </TabsList>

        <TabsContent value="ordenes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Órdenes de Servicio Asignadas</CardTitle>
              <CardDescription>
                Lista de todas las órdenes asignadas a técnicos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ordenesServicio.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay órdenes asignadas
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-6 gap-4 font-medium border-b pb-2">
                    <div>Técnico</div>
                    <div>Tipo</div>
                    <div>Servicio</div>
                    <div>Fecha</div>
                    <div>Estado</div>
                    <div>Cliente</div>
                  </div>
                  {ordenesServicio.map((orden) => (
                    <div key={orden.id} className="grid grid-cols-6 gap-4 py-2 border-b">
                      <div className="font-medium">{orden.tecnico_nombre}</div>
                      <div>
                        <Badge variant={orden.tipo_tecnico === 'propio' ? 'default' : 'secondary'}>
                          {orden.tipo_tecnico === 'propio' ? 'Propio' : 'Externo'}
                        </Badge>
                      </div>
                      <div className="capitalize">{orden.tipo_servicio}</div>
                      <div>{new Date(orden.fecha_asignacion).toLocaleDateString()}</div>
                      <div>
                        <Badge variant={
                          orden.estado === 'completado' ? 'default' : 
                          orden.estado === 'en_progreso' ? 'secondary' : 'outline'
                        }>
                          {orden.estado === 'completado' ? 'Completado' :
                           orden.estado === 'en_progreso' ? 'En Progreso' : 'Pendiente'}
                        </Badge>
                      </div>
                      <div>{orden.cliente}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tecnicos" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Técnicos Propios</CardTitle>
                <CardDescription>Personal técnico interno</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tecnicosPropios.map((tecnico) => (
                    <div key={tecnico.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center font-medium">
                          {tecnico.full_name?.split(' ').map(n => n[0]).join('') || 'TP'}
                        </div>
                        <div>
                          <h3 className="font-medium">{tecnico.full_name}</h3>
                          <p className="text-sm text-muted-foreground">{tecnico.email}</p>
                          <Badge variant="default">Técnico Propio</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Técnicos Externos</CardTitle>
                <CardDescription>Personal técnico externo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tecnicosExternos.map((tecnico) => (
                    <div key={tecnico.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center font-medium">
                          {tecnico.full_name?.split(' ').map(n => n[0]).join('') || 'TE'}
                        </div>
                        <div>
                          <h3 className="font-medium">{tecnico.full_name}</h3>
                          <p className="text-sm text-muted-foreground">{tecnico.email}</p>
                          <Badge variant="secondary">Técnico Externo</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reportes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generar Reportes</CardTitle>
              <CardDescription>
                Reportes de rendimiento y actividad de técnicos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="reportTipo">Tipo de Reporte</Label>
                  <Select value={reportTipoFecha} onValueChange={setReportTipoFecha}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mes">Por Mes</SelectItem>
                      <SelectItem value="rango">Rango de Fechas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {reportTipoFecha === "mes" && (
                  <div>
                    <Label htmlFor="mes">Mes</Label>
                    <Input
                      type="month"
                      value={reportMes}
                      onChange={(e) => setReportMes(e.target.value)}
                    />
                  </div>
                )}
                
                {reportTipoFecha === "rango" && (
                  <>
                    <div>
                      <Label htmlFor="fechaInicio">Fecha Inicio</Label>
                      <Input
                        type="date"
                        value={reportFechaInicio}
                        onChange={(e) => setReportFechaInicio(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="fechaFin">Fecha Fin</Label>
                      <Input
                        type="date"
                        value={reportFechaFin}
                        onChange={(e) => setReportFechaFin(e.target.value)}
                      />
                    </div>
                  </>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={exportReportePDF}>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar PDF
                </Button>
                <Button variant="outline" onClick={exportReporteExcel}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Exportar Excel
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DirectorTecnico;