import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Download, 
  FileText, 
  Calendar as CalendarIcon, 
  Filter,
  BarChart3,
  TrendingUp,
  Clock,
  Users,
  AlertTriangle,
  Car
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useAuthConsolidated } from "@/hooks/useAuthConsolidated";

const Reports = () => {
  const { hasRole } = useAuthConsolidated();
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [reportType, setReportType] = useState<string>("");

  // Tipos de reportes según el rol
  const getReportTypes = () => {
    if (hasRole(['administrador', 'director'])) {
      // Acceso completo
      return [
        { value: "clients", label: "Clientes (Completo)", icon: Users },
        { value: "events", label: "Eventos", icon: Clock },
        { value: "alarms_generated", label: "Alarmas Generadas", icon: AlertTriangle },
        { value: "patrol_usage", label: "Patrullas Utilizadas", icon: Car },
        { value: "accompaniments", label: "Acompañamientos Realizados", icon: Users },
        { value: "reviews", label: "Revistas (Rondeos) Ejecutadas", icon: FileText },
        { value: "monthly_comparison", label: "Comparación Mensual", icon: BarChart3 },
        { value: "financial", label: "Reportes Financieros", icon: TrendingUp },
      ];
    } else if (hasRole(['operador_alarmas'])) {
      // Acceso limitado del operador
      return [
        { value: "clients_basic", label: "Clientes (Básico)", icon: Users },
        { value: "attended_alarms", label: "Atenciones Realizadas", icon: AlertTriangle },
        { value: "response_times", label: "Tiempos de Respuesta", icon: Clock },
      ];
    } else if (hasRole(['despachador_patrullas'])) {
      // Acceso del despachador
      return [
        { value: "reviews_supervisor", label: "Visitas/Revisiones por Supervisores", icon: FileText },
        { value: "patrol_status", label: "Estado de Patrullas Asignadas", icon: Car },
        { value: "coordinated_alarms", label: "Alarmas Coordinadas", icon: AlertTriangle },
      ];
    }
    return [];
  };

  const months = [
    { value: "01", label: "Enero" },
    { value: "02", label: "Febrero" },
    { value: "03", label: "Marzo" },
    { value: "04", label: "Abril" },
    { value: "05", label: "Mayo" },
    { value: "06", label: "Junio" },
    { value: "07", label: "Julio" },
    { value: "08", label: "Agosto" },
    { value: "09", label: "Septiembre" },
    { value: "10", label: "Octubre" },
    { value: "11", label: "Noviembre" },
    { value: "12", label: "Diciembre" },
  ];

  const years = ["2024", "2023", "2022", "2021"];

  const handleGenerateReport = () => {
    console.log("Generando reporte:", {
      type: reportType,
      startDate,
      endDate,
      month: selectedMonth,
      year: selectedYear
    });
  };

  const quickReports = [
    {
      title: "Reporte Diario",
      description: "Resumen de actividades del día actual",
      icon: Clock,
      color: "text-blue-600"
    },
    {
      title: "Reporte Semanal",
      description: "Análisis de la semana en curso",
      icon: BarChart3,
      color: "text-green-600"
    },
    {
      title: "Reporte Mensual",
      description: "Estadísticas del mes actual",
      icon: TrendingUp,
      color: "text-purple-600"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Reportes</h2>
          <p className="text-muted-foreground">
            Genera reportes detallados del sistema
          </p>
        </div>
        <Button onClick={handleGenerateReport} className="gap-2">
          <Download className="h-4 w-4" />
          Generar Reporte
        </Button>
      </div>

      <Tabs defaultValue="custom" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="custom">Reportes Personalizados</TabsTrigger>
          <TabsTrigger value="quick">Reportes Rápidos</TabsTrigger>
        </TabsList>

        <TabsContent value="custom" className="space-y-6">
          {/* Filtros de Reporte */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros de Reporte
              </CardTitle>
              <CardDescription>
                Selecciona los parámetros para generar tu reporte personalizado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tipo de Reporte */}
                <div className="space-y-2">
                  <Label htmlFor="report-type">Tipo de Reporte</Label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un tipo de reporte" />
                    </SelectTrigger>
                    <SelectContent>
                      {getReportTypes().map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="h-4 w-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Período */}
                <div className="space-y-2">
                  <Label>Período</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                      <SelectTrigger>
                        <SelectValue placeholder="Mes" />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map((month) => (
                          <SelectItem key={month.value} value={month.value}>
                            {month.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                      <SelectTrigger>
                        <SelectValue placeholder="Año" />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((year) => (
                          <SelectItem key={year} value={year}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Rango de Fechas */}
              <div className="space-y-2">
                <Label>Rango de Fechas Específicas</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-date">Fecha Inicio</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !startDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, "PPP") : "Seleccionar fecha"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-date">Fecha Fin</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !endDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, "PPP") : "Seleccionar fecha"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detalles del Reporte */}
          {reportType && (
            <Card>
              <CardHeader>
                <CardTitle>Detalles del Reporte</CardTitle>
                <CardDescription>
                  Información que se incluirá en el reporte seleccionado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportType === "response_times" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Métricas Incluidas:</h4>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          <li>• Tiempo promedio de respuesta</li>
                          <li>• Tiempo mínimo y máximo</li>
                          <li>• Distribución por horarios</li>
                          <li>• Comparación con períodos anteriores</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Gráficos:</h4>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          <li>• Tendencia temporal</li>
                          <li>• Distribución por días</li>
                          <li>• Comparación mensual</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {reportType === "alarms_by_client" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Métricas Incluidas:</h4>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          <li>• Ranking de clientes por cantidad de alarmas</li>
                          <li>• Tipos de alarma más frecuentes</li>
                          <li>• Tasa de falsas alarmas por cliente</li>
                          <li>• Tiempo de resolución promedio</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Análisis:</h4>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          <li>• Patrones de comportamiento</li>
                          <li>• Recomendaciones por cliente</li>
                          <li>• Evolución temporal</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {reportType === "patrol_performance" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Métricas Incluidas:</h4>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          <li>• Tiempo en servicio por patrullero</li>
                          <li>• Número de servicios atendidos</li>
                          <li>• Eficiencia por patrulla</li>
                          <li>• Tiempo de desplazamiento</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Análisis:</h4>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          <li>• Ranking de rendimiento</li>
                          <li>• Zonas de mayor actividad</li>
                          <li>• Recomendaciones operativas</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="quick" className="space-y-6">
          {/* Reportes Rápidos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickReports.map((report, index) => (
              <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <report.icon className={`h-5 w-5 ${report.color}`} />
                    {report.title}
                  </CardTitle>
                  <CardDescription>
                    {report.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Descargar
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Historial de Reportes */}
          <Card>
            <CardHeader>
              <CardTitle>Historial de Reportes</CardTitle>
              <CardDescription>
                Reportes generados recientemente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: "Reporte Mensual - Junio 2024", date: "2024-06-30", type: "Mensual", status: "Completado" },
                  { name: "Análisis de Patrullas - Semana 25", date: "2024-06-28", type: "Semanal", status: "Completado" },
                  { name: "Tiempos de Respuesta - Mayo 2024", date: "2024-05-31", type: "Personalizado", status: "Completado" },
                  { name: "Rendimiento Operadores - Q2 2024", date: "2024-06-25", type: "Trimestral", status: "Procesando" },
                ].map((report, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{report.name}</p>
                        <p className="text-sm text-muted-foreground">{report.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{report.type}</Badge>
                      <Badge variant={report.status === "Completado" ? "default" : "secondary"}>
                        {report.status}
                      </Badge>
                      {report.status === "Completado" && (
                        <Button size="sm" variant="ghost">
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
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

export default Reports;