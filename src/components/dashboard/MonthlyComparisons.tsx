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
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total de Alarmas */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Total de Alarmas</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={data}>
              <Line 
                type="monotone" 
                dataKey="alarmas_total" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={false}
              />
              <XAxis dataKey="month" hide />
              <YAxis hide />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Alarmas Resueltas */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Alarmas Resueltas</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={data}>
              <Line 
                type="monotone" 
                dataKey="alarmas_resueltas" 
                stroke="hsl(142 76% 36%)" 
                strokeWidth={2}
                dot={false}
              />
              <XAxis dataKey="month" hide />
              <YAxis hide />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Servicios Técnicos */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Servicios Técnicos</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={data}>
              <Bar 
                dataKey="servicios_tecnicos" 
                fill="hsl(var(--chart-2))" 
                radius={[2, 2, 0, 0]}
              />
              <XAxis dataKey="month" hide />
              <YAxis hide />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Clientes Nuevos */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Clientes Nuevos</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={data}>
              <Bar 
                dataKey="clientes_nuevos" 
                fill="hsl(var(--chart-3))" 
                radius={[2, 2, 0, 0]}
              />
              <XAxis dataKey="month" hide />
              <YAxis hide />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Efectividad de Resolución */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Efectividad (%)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={trendData}>
              <Line 
                type="monotone" 
                dataKey="efectividad" 
                stroke="hsl(221 83% 53%)" 
                strokeWidth={2}
                dot={false}
              />
              <XAxis dataKey="month" hide />
              <YAxis hide />
              <Tooltip 
                formatter={(value: number) => [`${value.toFixed(1)}%`, 'Efectividad']}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tendencia Total */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Tendencia Total</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={data}>
              <Line 
                type="monotone" 
                dataKey="alarmas_total" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="servicios_tecnicos" 
                stroke="hsl(var(--chart-2))" 
                strokeWidth={2}
                dot={false}
              />
              <XAxis dataKey="month" hide />
              <YAxis hide />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Comparativa Mensual */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Comparativa Mensual</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={data.slice(-3)}>
              <Bar 
                dataKey="alarmas_total" 
                fill="hsl(var(--primary))" 
                radius={[2, 2, 0, 0]}
              />
              <XAxis dataKey="month" hide />
              <YAxis hide />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Crecimiento */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Crecimiento</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={data}>
              <Line 
                type="monotone" 
                dataKey="clientes_nuevos" 
                stroke="hsl(var(--chart-4))" 
                strokeWidth={2}
                dot={false}
              />
              <XAxis dataKey="month" hide />
              <YAxis hide />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};