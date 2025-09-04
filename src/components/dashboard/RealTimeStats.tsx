import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, CheckCircle, Users, Activity, Shield } from "lucide-react";
import { useSupabaseAlarmasEnhanced } from '@/hooks/useSupabaseAlarmasEnhanced';
import { useSupabaseEstadosPatrulla } from '@/hooks/useSupabaseEstadosPatrulla';
import { useSupabasePatrullas } from '@/hooks/useSupabasePatrullas';

interface StatCard {
  title: string;
  value: number;
  description: string;
  icon: React.ElementType;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  trend?: 'up' | 'down' | 'stable';
}

export const RealTimeStats = () => {
  const { alarmas } = useSupabaseAlarmasEnhanced();
  const { estados } = useSupabaseEstadosPatrulla();
  const { patrullas } = useSupabasePatrullas();
  
  const [stats, setStats] = useState<StatCard[]>([]);

  useEffect(() => {
    // Calcular estadísticas en tiempo real
    const alarmasActivas = alarmas.filter(a => a.estado === 'activa').length;
    const alarmasEnProceso = alarmas.filter(a => a.estado === 'en_proceso').length;
    const alarmasAsignadas = alarmas.filter(a => a.estado === 'asignada').length;
    const alarmasResueltas = alarmas.filter(a => a.estado === 'resuelta').length;
    
    const patrullasActivas = estados.filter(e => e.estado === 'iniciada').length;
    const patrullasDisponibles = patrullas.filter(p => p.estado === 'disponible').length;
    
    // Calcular tiempo promedio de respuesta (últimas 24 horas)
    const hoyInicio = new Date();
    hoyInicio.setHours(0, 0, 0, 0);
    
    const alarmasHoy = alarmas.filter(a => 
      new Date(a.created_at) >= hoyInicio && 
      a.tiempo_respuesta_segundos !== null
    );
    
    const tiempoPromedioRespuesta = alarmasHoy.length > 0
      ? Math.round(alarmasHoy.reduce((sum, a) => sum + (a.tiempo_respuesta_segundos || 0), 0) / alarmasHoy.length / 60)
      : 0;

    const newStats: StatCard[] = [
      {
        title: "Alarmas Activas",
        value: alarmasActivas,
        description: "Pendientes de atención",
        icon: AlertTriangle,
        variant: alarmasActivas > 0 ? 'destructive' : 'default',
        trend: 'stable'
      },
      {
        title: "En Proceso",
        value: alarmasEnProceso + alarmasAsignadas,
        description: "Siendo atendidas",
        icon: Clock,
        variant: 'secondary',
        trend: 'stable'
      },
      {
        title: "Resueltas Hoy",
        value: alarmasResueltas,
        description: "Completadas exitosamente",
        icon: CheckCircle,
        variant: 'default',
        trend: 'up'
      },
      {
        title: "Patrullas Activas",
        value: patrullasActivas,
        description: "En servicio",
        icon: Shield,
        variant: patrullasActivas > 0 ? 'secondary' : 'outline',
        trend: 'stable'
      },
      {
        title: "Patrullas Disponibles",
        value: patrullasDisponibles,
        description: "Listas para asignar",
        icon: Users,
        variant: 'outline',
        trend: 'stable'
      },
      {
        title: "Tiempo Respuesta",
        value: tiempoPromedioRespuesta,
        description: "Promedio en minutos",
        icon: Activity,
        variant: tiempoPromedioRespuesta < 15 ? 'default' : 'destructive',
        trend: tiempoPromedioRespuesta < 15 ? 'up' : 'down'
      }
    ];

    setStats(newStats);
  }, [alarmas, estados, patrullas]);

  if (stats.length === 0) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-muted rounded w-24"></div>
              <div className="h-4 w-4 bg-muted rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-12 mb-2"></div>
              <div className="h-3 bg-muted rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat, index) => (
        <Card key={index} className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-4 w-4 ${
              stat.variant === 'destructive' ? 'text-destructive' :
              stat.variant === 'secondary' ? 'text-primary' :
              'text-muted-foreground'
            }`} />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold flex items-center gap-2">
                {stat.value}
                {stat.title === "Tiempo Respuesta" && (
                  <span className="text-sm font-normal text-muted-foreground">min</span>
                )}
              </div>
              {stat.trend && (
                <Badge 
                  variant={
                    stat.trend === 'up' ? 'default' :
                    stat.trend === 'down' ? 'destructive' :
                    'secondary'
                  }
                  className="text-xs"
                >
                  {stat.trend === 'up' ? '↗' : stat.trend === 'down' ? '↘' : '→'}
                </Badge>
              )}
            </div>
            <CardDescription className="text-xs text-muted-foreground mt-1">
              {stat.description}
            </CardDescription>
          </CardContent>
          
          {/* Indicator visual para estados críticos */}
          {stat.variant === 'destructive' && stat.value > 0 && (
            <div className="absolute top-0 right-0 h-2 w-2 bg-destructive rounded-full animate-pulse"></div>
          )}
        </Card>
      ))}
    </div>
  );
};