import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSupabaseLlamadas } from "@/hooks/useSupabaseLlamadas";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Clock,
  Users, 
  AlertTriangle,
  Download,
  Calendar,
  Target,
  Shield,
  MapPin,
  Activity,
  XCircle,
  Phone,
  Smartphone
} from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, Line, LineChart, Pie, PieChart, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from "recharts";

const ReportesEjecutivos = () => {
  const { getEstadisticasLlamadas } = useSupabaseLlamadas();
  
  // Datos operativos
  const kpiData = {
    alarmasGeneradas: 1247,
    alarmasResueltas: 1219,
    alarmasCanceladas: 28,
    clientesActivos: 156,
    crecimientoClientes: 8.3,
    efectividadRespuesta: 97.8,
    tiempoPromedioRespuesta: 8.2, // minutos
    excedenciaTiempo: 5.4 // porcentaje
  };

  // Alarmas por tipo
  const alarmasPorTipo = [
    { tipo: "Robo", cantidad: 487, porcentaje: 39.1 },
    { tipo: "Pánico", cantidad: 312, porcentaje: 25.0 },
    { tipo: "Médica", cantidad: 186, porcentaje: 14.9 },
    { tipo: "Incendio", cantidad: 143, porcentaje: 11.5 },
    { tipo: "Otros", cantidad: 119, porcentaje: 9.5 }
  ];

  // Revistas por tipo
  const revistasPorTipo = [
    { tipo: "Rutina", cantidad: 2180, porcentaje: 68.2 },
    { tipo: "Acompañamiento", cantidad: 672, porcentaje: 21.0 },
    { tipo: "Especial", cantidad: 234, porcentaje: 7.3 },
    { tipo: "Nocturna", cantidad: 111, porcentaje: 3.5 }
  ];

  // Llamadas por tipo
  const llamadasPorTipo = [
    { tipo: "Celular", cantidad: 892, porcentaje: 73.4 },
    { tipo: "SmartUrban", cantidad: 324, porcentaje: 26.6 }
  ];

  // Clientes con más llamadas
  const clientesTopLlamadas = [
    { cliente: "Banco Central", celular: 45, smarturban: 23, total: 68 },
    { cliente: "Centro Comercial Plaza", celular: 38, smarturban: 19, total: 57 },
    { cliente: "Residencial Los Pinos", celular: 29, smarturban: 15, total: 44 },
    { cliente: "Hospital Regional", celular: 24, smarturban: 12, total: 36 },
    { cliente: "Universidad Nacional", celular: 19, smarturban: 9, total: 28 }
  ];

  // Clientes con más servicios
  const clientesTopServicios = [
    { cliente: "Banco Central", alarmas: 89, revistas: 156, total: 245 },
    { cliente: "Centro Comercial Plaza", alarmas: 67, revistas: 134, total: 201 },
    { cliente: "Residencial Los Pinos", alarmas: 45, revistas: 98, total: 143 },
    { cliente: "Hospital Regional", alarmas: 34, revistas: 87, total: 121 },
    { cliente: "Universidad Nacional", alarmas: 28, revistas: 76, total: 104 }
  ];

  // Rendimiento por días de la semana
  const serviciosPorDia = [
    { dia: "Lun", alarmas: 198, revistas: 289, total: 487 },
    { dia: "Mar", alarmas: 176, revistas: 312, total: 488 },
    { dia: "Mié", alarmas: 189, revistas: 298, total: 487 },
    { dia: "Jue", alarmas: 203, revistas: 284, total: 487 },
    { dia: "Vie", alarmas: 234, revistas: 253, total: 487 },
    { dia: "Sáb", alarmas: 167, revistas: 198, total: 365 },
    { dia: "Dom", alarmas: 80, revistas: 143, total: 223 }
  ];

  // Servicios por hora del día
  const serviciosPorHora = [
    { hora: "00-04", cantidad: 87 },
    { hora: "04-08", cantidad: 156 },
    { hora: "08-12", cantidad: 445 },
    { hora: "12-16", cantidad: 623 },
    { hora: "16-20", cantidad: 789 },
    { hora: "20-24", cantidad: 234 }
  ];

  // Tiempos de respuesta
  const tiemposRespuesta = [
    { rango: "0-5 min", cantidad: 742, porcentaje: 59.5 },
    { rango: "5-10 min", cantidad: 378, porcentaje: 30.3 },
    { rango: "10-15 min", cantidad: 89, porcentaje: 7.1 },
    { rango: "+15 min", cantidad: 38, porcentaje: 3.1 }
  ];

  const chartConfig = {
    alarmas: { label: "Alarmas", color: "hsl(var(--chart-1))" },
    revistas: { label: "Revistas", color: "hsl(var(--chart-2))" },
    efectividad: { label: "Efectividad %", color: "hsl(var(--chart-3))" },
    tiempo: { label: "Tiempo Respuesta", color: "hsl(var(--chart-4))" }
  };

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Reportes Operativos</h2>
          <p className="text-muted-foreground">
            Dashboard operativo para el control y seguimiento de servicios
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

      {/* KPIs Operativos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alarmas Generadas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.alarmasGeneradas}</div>
            <p className="text-xs text-muted-foreground">
              {kpiData.alarmasResueltas} resueltas, {kpiData.alarmasCanceladas} canceladas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efectividad</CardTitle>
            <Target className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.efectividadRespuesta}%</div>
            <p className="text-xs text-green-600 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              Meta: 95%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiempo Respuesta</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.tiempoPromedioRespuesta} min</div>
            <p className="text-xs text-muted-foreground">
              Promedio este mes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Excedencia Tiempo</CardTitle>
            <XCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.excedenciaTiempo}%</div>
            <p className="text-xs text-orange-600">
              Servicios fuera de tiempo
            </p>
          </CardContent>
        </Card>
      </div>

      {/* KPIs de Llamadas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Llamadas</CardTitle>
            <Phone className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,216</div>
            <p className="text-xs text-muted-foreground">
              892 celular, 324 SmartUrban
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Llamadas Celular</CardTitle>
            <Smartphone className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">892</div>
            <p className="text-xs text-blue-600">
              73.4% del total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Llamadas SmartUrban</CardTitle>
            <Phone className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">324</div>
            <p className="text-xs text-indigo-600">
              26.6% del total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos operativos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Servicios por día de la semana */}
        <Card>
          <CardHeader>
            <CardTitle>Servicios por Día de la Semana</CardTitle>
            <CardDescription>Distribución de alarmas y revistas por día</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={serviciosPorDia}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dia" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="alarmas" fill="var(--color-alarmas)" />
                  <Bar dataKey="revistas" fill="var(--color-revistas)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Servicios por franja horaria */}
        <Card>
          <CardHeader>
            <CardTitle>Servicios por Franja Horaria</CardTitle>
            <CardDescription>Distribución de servicios durante el día</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={serviciosPorHora}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hora" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="cantidad" fill="var(--color-alarmas)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Clientes por Servicios */}
        <Card>
          <CardHeader>
            <CardTitle>Clientes con Más Servicios</CardTitle>
            <CardDescription>Top 5 clientes por cantidad de servicios recibidos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {clientesTopServicios.map((cliente, index) => (
                <div key={cliente.cliente} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs">
                      {index + 1}
                    </div>
                    <span className="font-medium">{cliente.cliente}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{cliente.total} servicios</div>
                    <div className="text-xs text-muted-foreground">
                      {cliente.alarmas} alarmas • {cliente.revistas} revistas
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Análisis de Tiempos de Respuesta */}
        <Card>
          <CardHeader>
            <CardTitle>Tiempos de Respuesta</CardTitle>
            <CardDescription>Distribución de tiempos de respuesta a alarmas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tiemposRespuesta.map((tiempo, index) => (
                <div key={tiempo.rango} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{tiempo.rango}</span>
                    <span className="font-medium">{tiempo.porcentaje}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full" 
                      style={{ 
                        width: `${tiempo.porcentaje}%`,
                        backgroundColor: index === 0 ? '#22c55e' : index === 1 ? '#eab308' : index === 2 ? '#f97316' : '#ef4444'
                      }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {tiempo.cantidad} alarmas
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Análisis por Tipo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alarmas por Tipo */}
        <Card>
          <CardHeader>
            <CardTitle>Alarmas por Tipo</CardTitle>
            <CardDescription>Distribución de alarmas según su categoría</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alarmasPorTipo.map((alarma, index) => (
                <div key={alarma.tipo} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{alarma.tipo}</span>
                    <span className="font-medium">{alarma.cantidad} ({alarma.porcentaje}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full" 
                      style={{ 
                        width: `${alarma.porcentaje}%`,
                        backgroundColor: COLORS[index]
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Revistas por Tipo */}
        <Card>
          <CardHeader>
            <CardTitle>Revistas por Tipo</CardTitle>
            <CardDescription>Distribución de revistas según su categoría</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {revistasPorTipo.map((revista, index) => (
                <div key={revista.tipo} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{revista.tipo}</span>
                    <span className="font-medium">{revista.cantidad} ({revista.porcentaje}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full" 
                      style={{ 
                        width: `${revista.porcentaje}%`,
                        backgroundColor: COLORS[index]
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Llamadas por Tipo */}
        <Card>
          <CardHeader>
            <CardTitle>Llamadas por Tipo</CardTitle>
            <CardDescription>Distribución de llamadas celular vs SmartUrban</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {llamadasPorTipo.map((llamada, index) => (
                <div key={llamada.tipo} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2">
                      {llamada.tipo === 'Celular' ? 
                        <Smartphone className="h-4 w-4 text-blue-600" /> : 
                        <Phone className="h-4 w-4 text-indigo-600" />
                      }
                      {llamada.tipo}
                    </span>
                    <span className="font-medium">{llamada.cantidad} ({llamada.porcentaje}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full" 
                      style={{ 
                        width: `${llamada.porcentaje}%`,
                        backgroundColor: llamada.tipo === 'Celular' ? '#3b82f6' : '#6366f1'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Clientes con Más Llamadas */}
        <Card>
          <CardHeader>
            <CardTitle>Clientes con Más Llamadas</CardTitle>
            <CardDescription>Top 5 clientes por cantidad de llamadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {clientesTopLlamadas.map((cliente, index) => (
                <div key={cliente.cliente} className="flex items-center justify-between p-2 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{cliente.cliente}</p>
                      <p className="text-xs text-muted-foreground">
                        📱 {cliente.celular} | 📞 {cliente.smarturban}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="font-medium">
                    {cliente.total} llamadas
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recomendaciones Operativas */}
      <Card>
        <CardHeader>
          <CardTitle>Recomendaciones Operativas</CardTitle>
          <CardDescription>Acciones sugeridas basadas en el análisis operativo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="h-4 w-4 text-orange-600" />
                <span className="font-medium">Optimizar Tiempos</span>
              </div>
              <p className="text-sm text-muted-foreground">
                El 10.2% de alarmas exceden 10 minutos. Revisar protocolos de respuesta y rutas.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Reforzar Personal</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Viernes presenta mayor carga de alarmas. Considerar personal adicional en este día.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Shield className="h-4 w-4 text-green-600" />
                <span className="font-medium">Prevención</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Alto índice de robos. Implementar programa preventivo en zonas de alta incidencia.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportesEjecutivos;