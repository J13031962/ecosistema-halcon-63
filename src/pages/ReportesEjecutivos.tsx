import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  AlertTriangle,
  Download,
  Calendar,
  Target
} from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, Line, LineChart, Pie, PieChart, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from "recharts";

const ReportesEjecutivos = () => {
  // Datos ejecutivos
  const kpiData = {
    ingresosMensuales: 45000000,
    crecimientoIngresos: 12.5,
    clientesActivos: 156,
    crecimientoClientes: 8.3,
    alarmasAtendidas: 1247,
    efectividadRespuesta: 97.8,
    costoOperacional: 28000000,
    margenOperacional: 37.8
  };

  const ingresosTrimestre = [
    { mes: "Oct", ingresos: 42000000, presupuesto: 40000000 },
    { mes: "Nov", ingresos: 43500000, presupuesto: 41000000 },
    { mes: "Dic", ingresos: 45000000, presupuesto: 42000000 }
  ];

  const clientesPorSegmento = [
    { segmento: "Financiero", clientes: 45, ingresos: 18000000 },
    { segmento: "Comercial", clientes: 67, ingresos: 15000000 },
    { segmento: "Residencial", clientes: 32, ingresos: 8000000 },
    { segmento: "Industrial", clientes: 12, ingresos: 4000000 }
  ];

  const rendimientoMensual = [
    { mes: "Ene", alarmas: 1180, efectividad: 96.2, satisfaccion: 4.3 },
    { mes: "Feb", alarmas: 1095, efectividad: 97.1, satisfaccion: 4.4 },
    { mes: "Mar", alarmas: 1247, efectividad: 97.8, satisfaccion: 4.5 },
    { mes: "Abr", alarmas: 1156, efectividad: 96.8, satisfaccion: 4.4 },
    { mes: "May", alarmas: 1289, efectividad: 98.2, satisfaccion: 4.6 },
    { mes: "Jun", alarmas: 1334, efectividad: 97.9, satisfaccion: 4.5 }
  ];

  const costosOperacionales = [
    { categoria: "Personal", monto: 15000000, porcentaje: 53.6 },
    { categoria: "Combustible", monto: 4500000, porcentaje: 16.1 },
    { categoria: "Mantenimiento", monto: 3200000, porcentaje: 11.4 },
    { categoria: "Tecnología", monto: 2800000, porcentaje: 10.0 },
    { categoria: "Otros", monto: 2500000, porcentaje: 8.9 }
  ];

  const chartConfig = {
    ingresos: { label: "Ingresos", color: "hsl(var(--chart-1))" },
    presupuesto: { label: "Presupuesto", color: "hsl(var(--chart-2))" },
    alarmas: { label: "Alarmas", color: "hsl(var(--chart-3))" },
    efectividad: { label: "Efectividad %", color: "hsl(var(--chart-4))" }
  };

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Reportes Ejecutivos</h2>
          <p className="text-muted-foreground">
            Dashboard estratégico para la toma de decisiones
          </p>
        </div>
        <div className="flex gap-2">
          <Select defaultValue="trimestre">
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mes">Este Mes</SelectItem>
              <SelectItem value="trimestre">Este Trimestre</SelectItem>
              <SelectItem value="semestre">Este Semestre</SelectItem>
              <SelectItem value="ano">Este Año</SelectItem>
            </SelectContent>
          </Select>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPIs Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Mensuales</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(kpiData.ingresosMensuales / 1000000).toFixed(1)}M</div>
            <p className="text-xs text-green-600 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              +{kpiData.crecimientoIngresos}% vs mes anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Activos</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.clientesActivos}</div>
            <p className="text-xs text-green-600 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              +{kpiData.crecimientoClientes}% crecimiento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efectividad</CardTitle>
            <Target className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.efectividadRespuesta}%</div>
            <p className="text-xs text-muted-foreground">
              {kpiData.alarmasAtendidas} alarmas atendidas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margen Operacional</CardTitle>
            <BarChart3 className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.margenOperacional}%</div>
            <p className="text-xs text-muted-foreground">
              Costos: ${(kpiData.costoOperacional / 1000000).toFixed(1)}M
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ingresos vs Presupuesto */}
        <Card>
          <CardHeader>
            <CardTitle>Ingresos vs Presupuesto</CardTitle>
            <CardDescription>Comparación trimestral (en millones COP)</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ingresosTrimestre}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis tickFormatter={(value) => `$${(value / 1000000).toFixed(0)}M`} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="ingresos" fill="var(--color-ingresos)" />
                  <Bar dataKey="presupuesto" fill="var(--color-presupuesto)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Rendimiento Mensual */}
        <Card>
          <CardHeader>
            <CardTitle>Tendencia de Rendimiento</CardTitle>
            <CardDescription>Alarmas atendidas y efectividad</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rendimientoMensual}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar yAxisId="left" dataKey="alarmas" fill="var(--color-alarmas)" />
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="efectividad" 
                    stroke="var(--color-efectividad)" 
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Clientes por Segmento */}
        <Card>
          <CardHeader>
            <CardTitle>Ingresos por Segmento</CardTitle>
            <CardDescription>Distribución de clientes e ingresos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {clientesPorSegmento.map((segmento, index) => (
                <div key={segmento.segmento} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index] }}
                    />
                    <span className="font-medium">{segmento.segmento}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">${(segmento.ingresos / 1000000).toFixed(1)}M</div>
                    <div className="text-sm text-muted-foreground">{segmento.clientes} clientes</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Costos Operacionales */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución de Costos</CardTitle>
            <CardDescription>Análisis de costos operacionales</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {costosOperacionales.map((costo, index) => (
                <div key={costo.categoria} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{costo.categoria}</span>
                    <span className="font-medium">{costo.porcentaje}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full" 
                      style={{ 
                        width: `${costo.porcentaje}%`,
                        backgroundColor: COLORS[index]
                      }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    ${(costo.monto / 1000000).toFixed(1)}M
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Acciones Recomendadas */}
      <Card>
        <CardHeader>
          <CardTitle>Recomendaciones Estratégicas</CardTitle>
          <CardDescription>Acciones sugeridas basadas en el análisis de datos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="font-medium">Oportunidad de Crecimiento</span>
              </div>
              <p className="text-sm text-muted-foreground">
                El segmento financiero muestra el mayor margen. Considerar expansión en este sector.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="font-medium">Optimización de Costos</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Los costos de combustible han aumentado 15%. Evaluar rutas y eficiencia operativa.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportesEjecutivos;