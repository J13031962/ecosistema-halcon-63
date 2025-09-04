import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from "recharts";

interface MonthlyComparison {
  month: string;
  alarmas_total: number;
  alarmas_resueltas: number;
  servicios_tecnicos: number;
  clientes_nuevos: number;
  ingresos_estimados: number;
}

interface MonthlyComparisonsProps {
  data: MonthlyComparison[];
}

export const MonthlyComparisons = ({ data }: MonthlyComparisonsProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatTooltipCurrency = (value: number, name: string) => {
    if (name === 'ingresos_estimados') {
      return [formatCurrency(value), 'Ingresos Estimados'];
    }
    return [value, name];
  };

  // Datos para el gráfico de tendencias
  const trendData = data.map(item => ({
    ...item,
    efectividad: item.alarmas_total > 0 ? (item.alarmas_resueltas / item.alarmas_total) * 100 : 0
  }));

  return (
    <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
      {/* Gráfico de Tendencias de Alarmas */}
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Tendencia de Alarmas - Últimos 6 Meses</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="alarmas_total" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                name="Total Alarmas"
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="alarmas_resueltas" 
                stroke="hsl(142 76% 36%)" 
                strokeWidth={2}
                name="Alarmas Resueltas"
                dot={{ fill: 'hsl(142 76% 36%)', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="efectividad" 
                stroke="hsl(221 83% 53%)" 
                strokeWidth={2}
                name="Efectividad (%)"
                dot={{ fill: 'hsl(221 83% 53%)', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico de Servicios Técnicos y Clientes */}
      <Card>
        <CardHeader>
          <CardTitle>Servicios Técnicos por Mes</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Bar 
                dataKey="servicios_tecnicos" 
                fill="hsl(var(--primary))" 
                name="Servicios Técnicos"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico de Clientes Nuevos */}
      <Card>
        <CardHeader>
          <CardTitle>Clientes Nuevos por Mes</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Bar 
                dataKey="clientes_nuevos" 
                fill="hsl(142 76% 36%)" 
                name="Clientes Nuevos"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico de Ingresos Estimados */}
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Ingresos Estimados por Mes</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis 
                tick={{ fontSize: 12 }} 
                className="text-muted-foreground"
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip 
                formatter={formatTooltipCurrency}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Bar 
                dataKey="ingresos_estimados" 
                fill="hsl(var(--chart-3))" 
                name="Ingresos Estimados"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};