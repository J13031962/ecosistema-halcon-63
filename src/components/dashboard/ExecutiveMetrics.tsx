import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Wrench, Users, Building2, Phone, Target, Route, CreditCard, AlertTriangle, Clock } from "lucide-react";

interface ExecutiveMetricsProps {
  kpis: {
    servicios_tecnicos_propios: number;
    servicios_terceros: number;
    clientes_activos: number;
    llamadas_smart_urban: number;
    crecimiento_mensual: number;
    revistas_rutina: number;
    revistas_pagas: number;
    cantidad_alarmas: number;
    tiempo_respuesta_promedio_mes: number;
  };
}

export const ExecutiveMetrics = ({ kpis }: ExecutiveMetricsProps) => {
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (value < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Target className="h-4 w-4 text-muted-foreground" />;
  };

  const getTrendColor = (value: number) => {
    if (value > 0) return "text-green-600";
    if (value < 0) return "text-red-600";
    return "text-muted-foreground";
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Servicios Técnicos Propios */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Servicios Técnicos Propios</CardTitle>
          <Wrench className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{kpis.servicios_tecnicos_propios}</div>
          <p className="text-xs text-muted-foreground">
            Servicios con técnicos internos
          </p>
        </CardContent>
      </Card>

      {/* Servicios de Terceros */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Servicios de Terceros</CardTitle>
          <Users className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{kpis.servicios_terceros}</div>
          <p className="text-xs text-muted-foreground">
            Servicios con técnicos externos
          </p>
        </CardContent>
      </Card>

      {/* Clientes Activos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Clientes Activos</CardTitle>
          <Building2 className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{kpis.clientes_activos}</div>
          <p className="text-xs text-muted-foreground">
            Clientes con servicios activos
          </p>
        </CardContent>
      </Card>

      {/* Llamadas Smart Urban */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Llamadas Smart Urban</CardTitle>
          <Phone className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{kpis.llamadas_smart_urban}</div>
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            {getTrendIcon(kpis.crecimiento_mensual)}
            <span className={getTrendColor(kpis.crecimiento_mensual)}>
              {formatPercentage(Math.abs(kpis.crecimiento_mensual))} vs mes anterior
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Revistas Rutina */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Revistas Rutina</CardTitle>
          <Route className="h-4 w-4 text-cyan-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{kpis.revistas_rutina}</div>
          <p className="text-xs text-muted-foreground">
            Revistas realizadas este mes
          </p>
        </CardContent>
      </Card>

      {/* Revistas Pagas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Revistas Pagas</CardTitle>
          <CreditCard className="h-4 w-4 text-emerald-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{kpis.revistas_pagas}</div>
          <p className="text-xs text-muted-foreground">
            Acompañamientos realizados
          </p>
        </CardContent>
      </Card>

      {/* Cantidad Alarmas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cantidad Alarmas</CardTitle>
          <AlertTriangle className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{kpis.cantidad_alarmas}</div>
          <p className="text-xs text-muted-foreground">
            Alarmas registradas este mes
          </p>
        </CardContent>
      </Card>

      {/* Tiempo Respuesta Promedio */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tiempo Respuesta Promedio</CardTitle>
          <Clock className="h-4 w-4 text-amber-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{kpis.tiempo_respuesta_promedio_mes}</div>
          <p className="text-xs text-muted-foreground">
            Minutos promedio de respuesta
          </p>
        </CardContent>
      </Card>
    </div>
  );
};