import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { exportToPDF, exportToExcel } from "@/utils/exportUtils";
import { Download, FileSpreadsheet, Calendar, TrendingUp, Users, Wrench } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const ReportesTecnicos = () => {
  const [tipoReporte, setTipoReporte] = useState("general");
  const [tecnicoSeleccionado, setTecnicoSeleccionado] = useState("");
  const [tipoFecha, setTipoFecha] = useState("mes");
  const [mes, setMes] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  // Datos simulados para reportes
  const datosReporte = {
    resumen: {
      totalServicios: 45,
      serviciosCompletados: 38,
      serviciosEnProgreso: 5,
      serviciosPendientes: 2,
      tecnicosPropios: 8,
      tecnicosExternos: 12,
      ingresosTotales: 15750.00
    },
    serviciosPorTipo: [
      { tipo: 'Instalación', cantidad: 15, porcentaje: 33.3 },
      { tipo: 'Mantenimiento', cantidad: 18, porcentaje: 40.0 },
      { tipo: 'Reparación', cantidad: 8, porcentaje: 17.8 },
      { tipo: 'Consultoría', cantidad: 4, porcentaje: 8.9 }
    ],
    rendimientoTecnicos: [
      { nombre: 'Juan Pérez', tipo: 'Propio', servicios: 12, completados: 11, eficiencia: 91.7 },
      { nombre: 'María García', tipo: 'Externo', servicios: 8, completados: 8, eficiencia: 100.0 },
      { nombre: 'Carlos López', tipo: 'Propio', servicios: 10, completados: 9, eficiencia: 90.0 },
      { nombre: 'Ana Martín', tipo: 'Externo', servicios: 6, completados: 5, eficiencia: 83.3 }
    ],
    ingresosPorMes: [
      { mes: 'Enero', propios: 2500, externos: 3200, total: 5700 },
      { mes: 'Febrero', propios: 2800, externos: 2900, total: 5700 },
      { mes: 'Marzo', propios: 2200, externos: 3350, total: 5550 }
    ]
  };

  const exportarReportePDF = () => {
    if (!validateDates()) return;

    let data = [];
    let title = "";
    let headers = [];

    switch (tipoReporte) {
      case "general":
        data = [
          { concepto: "Total Servicios", valor: datosReporte.resumen.totalServicios },
          { concepto: "Servicios Completados", valor: datosReporte.resumen.serviciosCompletados },
          { concepto: "Servicios En Progreso", valor: datosReporte.resumen.serviciosEnProgreso },
          { concepto: "Técnicos Propios", valor: datosReporte.resumen.tecnicosPropios },
          { concepto: "Técnicos Externos", valor: datosReporte.resumen.tecnicosExternos },
          { concepto: "Ingresos Totales", valor: `$${datosReporte.resumen.ingresosTotales}` }
        ];
        title = "Reporte General Técnicos";
        headers = ["Concepto", "Valor"];
        break;
      
      case "rendimiento":
        data = datosReporte.rendimientoTecnicos.map(t => ({
          nombre: t.nombre,
          tipo: t.tipo,
          servicios: t.servicios,
          completados: t.completados,
          eficiencia: `${t.eficiencia}%`
        }));
        title = "Reporte Rendimiento Técnicos";
        headers = ["Nombre", "Tipo", "Servicios", "Completados", "Eficiencia"];
        break;
      
      case "ingresos":
        data = datosReporte.ingresosPorMes.map(i => ({
          mes: i.mes,
          propios: `$${i.propios}`,
          externos: `$${i.externos}`,
          total: `$${i.total}`
        }));
        title = "Reporte Ingresos por Mes";
        headers = ["Mes", "Propios", "Externos", "Total"];
        break;
    }

    exportToPDF(data, title, headers);
  };

  const exportarReporteExcel = () => {
    if (!validateDates()) return;

    let data = [];
    let filename = "";

    switch (tipoReporte) {
      case "general":
        data = [
          {
            'Concepto': 'Total Servicios',
            'Valor': datosReporte.resumen.totalServicios,
            'Periodo': getPeriodoTexto()
          },
          {
            'Concepto': 'Servicios Completados',
            'Valor': datosReporte.resumen.serviciosCompletados,
            'Periodo': getPeriodoTexto()
          },
          {
            'Concepto': 'Servicios En Progreso',
            'Valor': datosReporte.resumen.serviciosEnProgreso,
            'Periodo': getPeriodoTexto()
          },
          {
            'Concepto': 'Técnicos Propios',
            'Valor': datosReporte.resumen.tecnicosPropios,
            'Periodo': getPeriodoTexto()
          },
          {
            'Concepto': 'Técnicos Externos',
            'Valor': datosReporte.resumen.tecnicosExternos,
            'Periodo': getPeriodoTexto()
          },
          {
            'Concepto': 'Ingresos Totales',
            'Valor': datosReporte.resumen.ingresosTotales,
            'Periodo': getPeriodoTexto()
          }
        ];
        filename = "Reporte General Técnicos";
        break;
      
      case "rendimiento":
        data = datosReporte.rendimientoTecnicos.map(t => ({
          'Técnico': t.nombre,
          'Tipo': t.tipo,
          'Servicios Asignados': t.servicios,
          'Servicios Completados': t.completados,
          'Eficiencia (%)': t.eficiencia,
          'Periodo': getPeriodoTexto()
        }));
        filename = "Reporte Rendimiento Técnicos";
        break;
      
      case "ingresos":
        data = datosReporte.ingresosPorMes.map(i => ({
          'Mes': i.mes,
          'Ingresos Técnicos Propios': i.propios,
          'Ingresos Técnicos Externos': i.externos,
          'Total Ingresos': i.total,
          'Periodo': getPeriodoTexto()
        }));
        filename = "Reporte Ingresos Técnicos";
        break;
    }

    exportToExcel(data, filename);
  };

  const validateDates = () => {
    if (tipoFecha === "mes" && !mes) {
      toast({
        title: "Error",
        description: "Por favor seleccione un mes",
        variant: "destructive"
      });
      return false;
    }
    
    if (tipoFecha === "rango" && (!fechaInicio || !fechaFin)) {
      toast({
        title: "Error",
        description: "Por favor seleccione las fechas de inicio y fin",
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  };

  const getPeriodoTexto = () => {
    if (tipoFecha === "mes" && mes) {
      return mes;
    } else if (tipoFecha === "rango" && fechaInicio && fechaFin) {
      return `${fechaInicio} a ${fechaFin}`;
    }
    return "Periodo no especificado";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reportes Técnicos</h1>
          <p className="text-muted-foreground">
            Análisis y reportes de servicios técnicos y rendimiento
          </p>
        </div>
      </div>

      {/* Configuración de Reportes */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración de Reporte</CardTitle>
          <CardDescription>
            Seleccione el tipo de reporte y el período a analizar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="tipoReporte">Tipo de Reporte</Label>
              <Select value={tipoReporte} onValueChange={setTipoReporte}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">Reporte General</SelectItem>
                  <SelectItem value="rendimiento">Rendimiento Técnicos</SelectItem>
                  <SelectItem value="ingresos">Análisis de Ingresos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="tipoFecha">Período</Label>
              <Select value={tipoFecha} onValueChange={setTipoFecha}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mes">Por Mes</SelectItem>
                  <SelectItem value="rango">Rango de Fechas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {tipoFecha === "mes" && (
              <div>
                <Label htmlFor="mes">Mes</Label>
                <Input
                  type="month"
                  value={mes}
                  onChange={(e) => setMes(e.target.value)}
                />
              </div>
            )}
          </div>

          {tipoFecha === "rango" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fechaInicio">Fecha Inicio</Label>
                <Input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="fechaFin">Fecha Fin</Label>
                <Input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={exportarReportePDF}>
              <Download className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
            <Button variant="outline" onClick={exportarReporteExcel}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Exportar Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Vista Previa del Reporte */}
      <Tabs value={tipoReporte} onValueChange={setTipoReporte} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">Reporte General</TabsTrigger>
          <TabsTrigger value="rendimiento">Rendimiento</TabsTrigger>
          <TabsTrigger value="ingresos">Ingresos</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resumen General de Servicios Técnicos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{datosReporte.resumen.totalServicios}</div>
                  <div className="text-sm text-muted-foreground">Total Servicios</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{datosReporte.resumen.serviciosCompletados}</div>
                  <div className="text-sm text-muted-foreground">Completados</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{datosReporte.resumen.serviciosEnProgreso}</div>
                  <div className="text-sm text-muted-foreground">En Progreso</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">${datosReporte.resumen.ingresosTotales}</div>
                  <div className="text-sm text-muted-foreground">Ingresos</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rendimiento" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rendimiento por Técnico</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-5 gap-4 font-medium border-b pb-2">
                  <div>Técnico</div>
                  <div>Tipo</div>
                  <div>Servicios</div>
                  <div>Completados</div>
                  <div>Eficiencia</div>
                </div>
                {datosReporte.rendimientoTecnicos.map((tecnico, index) => (
                  <div key={index} className="grid grid-cols-5 gap-4 py-2 border-b">
                    <div className="font-medium">{tecnico.nombre}</div>
                    <div>{tecnico.tipo}</div>
                    <div>{tecnico.servicios}</div>
                    <div>{tecnico.completados}</div>
                    <div className="font-medium text-green-600">{tecnico.eficiencia}%</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ingresos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análisis de Ingresos por Mes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-4 font-medium border-b pb-2">
                  <div>Mes</div>
                  <div>Técnicos Propios</div>
                  <div>Técnicos Externos</div>
                  <div>Total</div>
                </div>
                {datosReporte.ingresosPorMes.map((mes, index) => (
                  <div key={index} className="grid grid-cols-4 gap-4 py-2 border-b">
                    <div className="font-medium">{mes.mes}</div>
                    <div className="text-blue-600">${mes.propios}</div>
                    <div className="text-orange-600">${mes.externos}</div>
                    <div className="font-medium text-green-600">${mes.total}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportesTecnicos;