import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Wrench, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  PlayCircle, 
  DollarSign,
  Gauge
} from "lucide-react";

interface ServiceTechStats {
  pendientes: number;
  en_proceso: number;
  completados: number;
  tiempo_promedio_resolucion: number;
  costo_total_estimado: number;
}

interface ServiceTechnicalStatsProps {
  stats: ServiceTechStats;
}

export const ServiceTechnicalStats = ({ stats }: ServiceTechnicalStatsProps) => {
  const total = stats.pendientes + stats.en_proceso + stats.completados;
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatHours = (hours: number) => {
    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return `${days}d ${remainingHours}h`;
    }
    return `${hours}h`;
  };

  const getEfficiencyLevel = () => {
    if (total === 0) return { level: "Sin datos", color: "gray", percentage: 0 };
    
    const completionRate = (stats.completados / total) * 100;
    
    if (completionRate >= 85) return { level: "Excelente", color: "green", percentage: completionRate };
    if (completionRate >= 70) return { level: "Bueno", color: "blue", percentage: completionRate };
    if (completionRate >= 50) return { level: "Regular", color: "yellow", percentage: completionRate };
    return { level: "Necesita atención", color: "red", percentage: completionRate };
  };

  const efficiency = getEfficiencyLevel();

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Resumen de Estados */}
      <Card className="md:col-span-2 lg:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Estado de Servicios Técnicos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {/* Pendientes */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">Pendientes</span>
              </div>
              <div className="text-2xl font-bold">{stats.pendientes}</div>
              <Progress 
                value={total > 0 ? (stats.pendientes / total) * 100 : 0} 
                className="h-2"
              />
              <p className="text-xs text-muted-foreground">
                {total > 0 ? ((stats.pendientes / total) * 100).toFixed(1) : 0}% del total
              </p>
            </div>

            {/* En Proceso */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <PlayCircle className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">En Proceso</span>
              </div>
              <div className="text-2xl font-bold">{stats.en_proceso}</div>
              <Progress 
                value={total > 0 ? (stats.en_proceso / total) * 100 : 0} 
                className="h-2"
              />
              <p className="text-xs text-muted-foreground">
                {total > 0 ? ((stats.en_proceso / total) * 100).toFixed(1) : 0}% del total
              </p>
            </div>

            {/* Completados */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Completados</span>
              </div>
              <div className="text-2xl font-bold">{stats.completados}</div>
              <Progress 
                value={total > 0 ? (stats.completados / total) * 100 : 0} 
                className="h-2"
              />
              <p className="text-xs text-muted-foreground">
                {total > 0 ? ((stats.completados / total) * 100).toFixed(1) : 0}% del total
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tiempo Promedio de Resolución */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tiempo Promedio Resolución</CardTitle>
          <Clock className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatHours(stats.tiempo_promedio_resolucion)}
          </div>
          <div className="flex items-center space-x-2 mt-2">
            <Badge 
              variant={stats.tiempo_promedio_resolucion <= 48 ? "default" : "destructive"}
              className="text-xs"
            >
              {stats.tiempo_promedio_resolucion <= 48 ? "Dentro de SLA" : "Fuera de SLA"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Meta: 48 horas
          </p>
        </CardContent>
      </Card>

      {/* Costo Total Estimado */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Costo Total Estimado</CardTitle>
          <DollarSign className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(stats.costo_total_estimado)}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Incluye servicios activos y completados
          </p>
        </CardContent>
      </Card>

      {/* Eficiencia General */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Eficiencia General</CardTitle>
          <Gauge className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {efficiency.percentage.toFixed(1)}%
          </div>
          <div className="flex items-center space-x-2 mt-2">
            <Badge 
              variant={efficiency.color === 'green' ? "default" : 
                       efficiency.color === 'blue' ? "secondary" : "destructive"}
              className="text-xs"
            >
              {efficiency.level}
            </Badge>
          </div>
          <Progress 
            value={efficiency.percentage} 
            className="h-2 mt-2"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Basado en tasa de completación
          </p>
        </CardContent>
      </Card>
    </div>
  );
};