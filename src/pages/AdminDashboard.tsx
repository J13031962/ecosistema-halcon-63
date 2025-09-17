import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useExecutiveAnalytics } from "@/hooks/useExecutiveAnalytics";
import { ExecutiveMetrics } from "@/components/dashboard/ExecutiveMetrics";
import { MonthlyComparisons } from "@/components/dashboard/MonthlyComparisons";
import { ClientAnalytics } from "@/components/dashboard/ClientAnalytics";
import { ServiceTechnicalStats } from "@/components/dashboard/ServiceTechnicalStats";
import { PatrullasCorazaStats } from "@/components/dashboard/PatrullasCorazaStats";
import { RefreshCw, TrendingUp, Users, BarChart3, Wrench, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const AdminDashboard = () => {
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const { analytics, loading, refetch } = useExecutiveAnalytics(selectedMonth);

  // Generar opciones de meses (últimos 12 meses)
  const generateMonthOptions = () => {
    const options = [];
    const currentDate = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      options.push({
        value: date.toISOString(),
        label: date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
      });
    }
    return options;
  };

  const handleMonthChange = (value: string) => {
    setSelectedMonth(new Date(value));
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">No se pudieron cargar los datos del dashboard</p>
          <Button onClick={refetch} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header del Dashboard */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Ejecutivo</h1>
          <p className="text-muted-foreground">
            Panel de control con métricas avanzadas y análisis comparativo
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <Select value={selectedMonth.toISOString()} onValueChange={handleMonthChange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Seleccionar mes" />
              </SelectTrigger>
              <SelectContent>
                {generateMonthOptions().map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={refetch} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* KPIs Principales */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">
            Métricas Principales {selectedMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
          </h2>
        </div>
        <ExecutiveMetrics kpis={analytics.kpis} />
      </section>

      <Separator />

      {/* Comparativos Mensuales */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Comparativos Mensuales</h2>
        </div>
        <MonthlyComparisons data={analytics.monthlyComparisons} />
      </section>

      <Separator />

      {/* Análisis de Clientes y Alarmas */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Análisis de Clientes y Alarmas</h2>
        </div>
        <ClientAnalytics 
          topClients={analytics.topClients} 
          alarmsByType={analytics.alarmsByType} 
        />
      </section>

      <Separator />

      {/* Estadísticas de Patrullas Contratadas */}
      <section className="space-y-4">
        <PatrullasCorazaStats />
      </section>

      <Separator />

      {/* Estadísticas de Servicios Técnicos */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Servicios Técnicos</h2>
        </div>
        <ServiceTechnicalStats stats={analytics.serviceTechStats} />
      </section>
    </div>
  );
};

export default AdminDashboard;