import { useAuthConsolidated } from "@/hooks/useAuthConsolidated";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useState } from "react";
import { 
  AlertTriangle, 
  Car, 
  Users, 
  Clock, 
  Activity,
  MapPin,
  Shield,
  Phone
} from "lucide-react";
import AdminDashboard from "./AdminDashboard";

const Dashboard = () => {
  const { user } = useAuthConsolidated();
  const [periodo, setPeriodo] = useState('hoy');
  const { stats: dashboardStats, recentActivity, loading, error } = useDashboardData(periodo);

  // Si es administrador, mostrar el dashboard completo
  if (user?.role === 'administrador') {
    return <AdminDashboard />;
  }

  // Verificar si el usuario tiene acceso limitado
  const isUserSpecificRole = [
    'operador_alarmas', 
    'despachador_patrullas', 
    'supervisor_motorizado',
    'director_tecnico',
    'tecnico_propio',
    'tecnico_externo',
    'asesor_ventas'
  ].includes(user?.role || '');

  // Si el usuario tiene un rol específico, mostrar solo sus datos
  const shouldFilterData = isUserSpecificRole;

  const getStatsForRole = () => {
    if (!dashboardStats) return [];
    
    switch (user?.role) {
      case 'director':
        return [
          { title: "Eficiencia del Sistema", value: `${dashboardStats.efectividadPorcentaje}%`, icon: Shield, color: "text-green-600" },
          { title: "Tiempo Respuesta Promedio", value: `${dashboardStats.tiempoRespuestaPromedio} min`, icon: Clock, color: "text-blue-600" },
          { title: "Servicios Completados", value: `${dashboardStats.serviciosCompletados}`, icon: AlertTriangle, color: "text-orange-600" },
          { title: "Personal Activo", value: `${dashboardStats.personalActivo}`, icon: Users, color: "text-purple-600" },
        ];
      case 'operador_alarmas':
        return [
          { title: "Alarmas Activas", value: `${dashboardStats.alarmasActivas}`, icon: AlertTriangle, color: "text-red-600" },
          { title: "Total Alarmas", value: `${dashboardStats.totalAlarmas}`, icon: Phone, color: "text-blue-600" },
          { title: "Efectividad", value: `${dashboardStats.efectividadPorcentaje}%`, icon: Activity, color: "text-green-600" },
          { title: "Tiempo Respuesta", value: `${dashboardStats.tiempoRespuestaPromedio} min`, icon: Clock, color: "text-purple-600" },
        ];
      case 'despachador_patrullas':
        return [
          { title: "Patrullas Activas", value: `${dashboardStats.patrullasActivas}`, icon: Car, color: "text-green-600" },
          { title: "Servicios Completados", value: `${dashboardStats.serviciosCompletados}`, icon: MapPin, color: "text-blue-600" },
          { title: "Alarmas Activas", value: `${dashboardStats.alarmasActivas}`, icon: Activity, color: "text-orange-600" },
          { title: "Personal Disponible", value: `${dashboardStats.personalActivo}`, icon: Shield, color: "text-purple-600" },
        ];
      case 'supervisor_motorizado':
        return [
          { title: "Estado", value: "Activo", icon: Shield, color: "text-green-600" },
          { title: "Servicios Hoy", value: `${dashboardStats.serviciosCompletados}`, icon: Activity, color: "text-orange-600" },
          { title: "Tiempo Respuesta", value: `${dashboardStats.tiempoRespuestaPromedio} min`, icon: Clock, color: "text-purple-600" },
          { title: "Efectividad", value: `${dashboardStats.efectividadPorcentaje}%`, icon: MapPin, color: "text-blue-600" },
        ];
      default:
        return [];
    }
  };

  const roleStats = getStatsForRole();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <p className="text-muted-foreground">
            Bienvenido, {user?.full_name}
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {user?.role}
        </Badge>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Select value={periodo} onValueChange={setPeriodo}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Seleccionar período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hoy">Hoy</SelectItem>
            <SelectItem value="semana">Esta semana</SelectItem>
            <SelectItem value="mes">Este mes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))
        ) : error ? (
          <div className="col-span-4 text-center text-red-500">Error: {error}</div>
        ) : (
          roleStats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Role-specific content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>Últimas acciones del sistema</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-16 ml-auto" />
                  </div>
                ))}
              </div>
            ) : recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-2">
                    <Activity className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">{activity.description}</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground">No hay actividad reciente</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estado del Sistema</CardTitle>
            <CardDescription>Información general del sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Conexión Central</span>
                <Badge variant="outline" className="text-green-600">Activo</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Sistema GPS</span>
                <Badge variant="outline" className="text-green-600">Operativo</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Red de Comunicación</span>
                <Badge variant="outline" className="text-green-600">Estable</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Base de Datos</span>
                <Badge variant="outline" className="text-green-600">Sincronizada</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;