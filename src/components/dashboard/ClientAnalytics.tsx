import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, TrendingUp, AlertTriangle, Wrench } from "lucide-react";

interface ClientConsumption {
  cliente_nombre: string;
  total_alarmas: number;
  total_servicios: number;
  score: number;
}

interface AlarmsByType {
  tipo: string;
  count: number;
  percentage: number;
}

interface ClientAnalyticsProps {
  topClients: ClientConsumption[];
  alarmsByType: AlarmsByType[];
}

export const ClientAnalytics = ({ topClients, alarmsByType }: ClientAnalyticsProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-red-500";
    if (score >= 60) return "bg-orange-500";
    if (score >= 40) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Crítico";
    if (score >= 60) return "Alto";
    if (score >= 40) return "Medio";
    return "Bajo";
  };

  const getTypeColor = (tipo: string) => {
    const colors: Record<string, string> = {
      'emergencia': 'bg-red-500',
      'robo': 'bg-orange-500',
      'intrusion': 'bg-yellow-500',
      'panico': 'bg-purple-500',
      'tecnica': 'bg-blue-500',
      'falsa': 'bg-gray-500'
    };
    return colors[tipo.toLowerCase()] || 'bg-primary';
  };

  return (
    <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
      {/* Top Clientes por Consumo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Top Clientes por Actividad
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {topClients.length > 0 ? (
            topClients.slice(0, 8).map((client, index) => (
              <div key={client.cliente_nombre} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{index + 1}.</span>
                    <span className="text-sm font-medium truncate max-w-[200px]">
                      {client.cliente_nombre}
                    </span>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getScoreColor(client.score)} text-white border-0`}
                    >
                      {getScoreLabel(client.score)}
                    </Badge>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    Score: {client.score}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-orange-500" />
                    <span>{client.total_alarmas} alarmas</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Wrench className="h-3 w-3 text-blue-500" />
                    <span>{client.total_servicios} servicios</span>
                  </div>
                </div>
                
                <Progress 
                  value={Math.min(client.score, 100)} 
                  className="h-2"
                />
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay datos de clientes disponibles</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Distribución de Alarmas por Tipo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Alarmas por Tipo (Este Mes)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {alarmsByType.length > 0 ? (
            alarmsByType.map((alarm) => (
              <div key={alarm.tipo} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className={`w-3 h-3 rounded-full ${getTypeColor(alarm.tipo)}`}
                    />
                    <span className="text-sm font-medium capitalize">
                      {alarm.tipo}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{alarm.count} casos</span>
                    <Badge variant="outline" className="text-xs">
                      {alarm.percentage.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
                <Progress 
                  value={alarm.percentage} 
                  className="h-2"
                />
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay datos de alarmas disponibles</p>
            </div>
          )}
          
          {alarmsByType.length > 0 && (
            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Total de alarmas analizadas: {alarmsByType.reduce((sum, alarm) => sum + alarm.count, 0)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};