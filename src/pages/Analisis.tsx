import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnalysisData } from "@/hooks/useAnalysisData";
import { useState } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Activity,
  Calendar,
  Download,
  Filter,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  Target
} from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, Line, LineChart, Area, AreaChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Legend } from "recharts";

const Analisis = () => {
  const [periodo, setPeriodo] = useState('hoy');
  const { tendenciaAlarmas, rendimientoSemanal, analisisZonas, insights, loading, error } = useAnalysisData(periodo);

  // Datos estáticos para gráficos que no están conectados aún
  const tendenciaAlarmasStatic = [
    { periodo: "00:00", alarmas: 5, resueltas: 5, promedio: 8 },
    { periodo: "04:00", alarmas: 2, resueltas: 2, promedio: 3 },
    { periodo: "08:00", alarmas: 15, resueltas: 14, promedio: 12 },
    { periodo: "12:00", alarmas: 25, resueltas: 23, promedio: 20 },
    { periodo: "16:00", alarmas: 30, resueltas: 28, promedio: 25 },
    { periodo: "20:00", alarmas: 20, resueltas: 19, promedio: 18 }
  ];

  const rendimientoSemanalStatic = [
    { dia: "Lun", tiempo: 2.8, servicios: 45, efectividad: 96 },
    { dia: "Mar", tiempo: 3.1, servicios: 52, efectividad: 94 },
    { dia: "Mie", tiempo: 2.9, servicios: 48, efectividad: 97 },
    { dia: "Jue", tiempo: 3.2, servicios: 41, efectividad: 95 },
    { dia: "Vie", tiempo: 2.7, servicios: 55, efectividad: 98 },
    { dia: "Sab", tiempo: 3.5, servicios: 38, efectividad: 93 },
    { dia: "Dom", tiempo: 4.1, servicios: 28, efectividad: 91 }
  ];

  const comparativoMensual = [
    { mes: "Jul", actual: 1180, anterior: 1095, objetivo: 1200 },
    { mes: "Ago", actual: 1247, anterior: 1180, objetivo: 1250 },
    { mes: "Sep", actual: 1156, anterior: 1247, objetivo: 1300 },
    { mes: "Oct", actual: 1289, anterior: 1156, objetivo: 1350 },
    { mes: "Nov", actual: 1334, anterior: 1289, objetivo: 1400 },
    { mes: "Dic", actual: 1298, anterior: 1334, objetivo: 1450 }
  ];

  const chartConfig = {
    alarmas: { label: "Alarmas", color: "hsl(var(--chart-1))" },
    resueltas: { label: "Resueltas", color: "hsl(var(--chart-2))" },
    tiempo: { label: "Tiempo (min)", color: "hsl(var(--chart-3))" },
    efectividad: { label: "Efectividad %", color: "hsl(var(--chart-4))" }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Análisis Avanzado</h2>
          <p className="text-muted-foreground">
            Análisis detallado de tendencias y patrones operacionales
          </p>
        </div>
        <div className="flex gap-2">
          <Select defaultValue="mes">
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semana">Esta Semana</SelectItem>
              <SelectItem value="mes">Este Mes</SelectItem>
              <SelectItem value="trimestre">Trimestre</SelectItem>
              <SelectItem value="ano">Año</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Métricas Clave */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tendencia Alarmas</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+12.5%</div>
            <p className="text-xs text-green-600">vs período anterior</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiempo Respuesta</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.9 min</div>
            <p className="text-xs text-green-600">-0.3 min mejora</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efectividad</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">97.8%</div>
            <p className="text-xs text-green-600">+1.2% incremento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Predicción</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+15%</div>
            <p className="text-xs text-muted-foreground">próximo mes</p>
          </CardContent>
        </Card>
      </div>

      {/* Análisis de Tendencias */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tendencia de Alarmas por Hora</CardTitle>
            <CardDescription>Patrón de actividad durante 24 horas</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={tendenciaAlarmas}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="periodo" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area 
                    type="monotone" 
                    dataKey="promedio" 
                    stackId="1" 
                    stroke="var(--color-tiempo)" 
                    fill="var(--color-tiempo)" 
                    fillOpacity={0.3}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="alarmas" 
                    stackId="2" 
                    stroke="var(--color-alarmas)" 
                    fill="var(--color-alarmas)" 
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rendimiento Semanal</CardTitle>
            <CardDescription>Tiempo de respuesta y efectividad por día</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rendimientoSemanal}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dia" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line 
                    yAxisId="left" 
                    type="monotone" 
                    dataKey="tiempo" 
                    stroke="var(--color-tiempo)" 
                    strokeWidth={2}
                  />
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
        {/* Comparativo Mensual */}
        <Card>
          <CardHeader>
            <CardTitle>Comparativo Mensual</CardTitle>
            <CardDescription>Rendimiento actual vs anterior y objetivos</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparativoMensual}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="anterior" fill="#94a3b8" name="Mes Anterior" />
                  <Bar dataKey="actual" fill="var(--color-alarmas)" name="Mes Actual" />
                  <Bar dataKey="objetivo" fill="var(--color-resueltas)" name="Objetivo" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Análisis Geográfico */}
        <Card>
          <CardHeader>
            <CardTitle>Análisis por Zona</CardTitle>
            <CardDescription>Distribución geográfica del rendimiento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-2 w-full" />
                  </div>
                ))
              ) : error ? (
                <div className="text-center text-red-500">Error: {error}</div>
              ) : (
                analisisZonas.map((zona) => (
                  <div key={zona.zona} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="font-medium">{zona.zona}</div>
                      <Badge variant="outline">
                        {zona.resolucion}%
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{zona.alarmas} alarmas</span>
                      <span>{zona.tiempoRespuesta} min promedio</span>
                      <span>{zona.clientes} clientes</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${zona.resolucion}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights y Recomendaciones */}
      <Card>
        <CardHeader>
          <CardTitle>Insights Automatizados</CardTitle>
          <CardDescription>Patrones detectados y recomendaciones basadas en IA</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-800">Patrón Detectado</span>
              </div>
              <p className="text-sm text-green-700">
                Los viernes muestran la mayor efectividad (98%). Considerar asignar más recursos este día.
              </p>
            </div>
            <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Activity className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-800">Oportunidad</span>
              </div>
              <p className="text-sm text-blue-700">
                La zona Centro tiene el menor tiempo de respuesta. Replicar estrategias en otras zonas.
              </p>
            </div>
            <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingDown className="h-4 w-4 text-yellow-600" />
                <span className="font-medium text-yellow-800">Alerta</span>
              </div>
              <p className="text-sm text-yellow-700">
                Los domingos muestran menor efectividad (91%). Revisar disponibilidad de personal.
              </p>
            </div>
            <div className="p-4 border border-purple-200 bg-purple-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <PieChart className="h-4 w-4 text-purple-600" />
                <span className="font-medium text-purple-800">Predicción</span>
              </div>
              <p className="text-sm text-purple-700">
                Se espera un incremento del 15% en alarmas el próximo mes. Preparar recursos adicionales.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analisis;