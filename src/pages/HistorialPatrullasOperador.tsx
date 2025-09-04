import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSupabaseHistorialPatrullas } from "@/hooks/useSupabaseHistorialPatrullas";
import { Clock, MapPin, Search, Filter, Download, Eye } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

const HistorialPatrullasOperador = () => {
  const { historial, loading } = useSupabaseHistorialPatrullas('operador');
  const navigate = useNavigate();

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getStatusColor = (actividad: string) => {
    switch (actividad.toLowerCase()) {
      case 'patrullaje': return 'default';
      case 'emergencia': return 'destructive';
      case 'mantenimiento': return 'secondary';
      case 'descanso': return 'outline';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded w-2/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Historial de Patrullas - Operador</h1>
          <p className="text-muted-foreground">
            Registro histórico de actividades de patrullaje
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros de Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <Input 
                placeholder="Buscar por patrulla o supervisor..." 
                className="w-full"
              />
            </div>
            <Button variant="outline">
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </Button>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filtros Avanzados
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Registros</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{historial.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {historial.filter(h => {
                const created = new Date(h.created_at);
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return created >= weekAgo;
              }).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiempo Promedio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {historial.length > 0 
                ? formatDuration(
                    historial
                      .filter(h => h.duracion_minutos)
                      .reduce((acc, h) => acc + (h.duracion_minutos || 0), 0) / 
                    historial.filter(h => h.duracion_minutos).length
                  )
                : '0m'
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patrullas Activas</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(historial.map(h => h.patrulla_numero)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sección de Reportes */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Reportes</h2>
        
        {historial.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay reportes</h3>
              <p className="text-muted-foreground">
                Aún no se han generado reportes de patrullaje.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {historial.map((registro, index) => (
              <Card key={registro.id} className="hover:shadow-md transition-shadow">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <p className="font-medium">
                          Reporte No {index + 1} supervisor {registro.supervisor_nombre || 'Sin asignar'} Fecha {format(new Date(registro.created_at), 'dd MMMM yyyy')}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/reporte-detallado/${registro.id}`)}
                      className="flex items-center gap-1"
                    >
                      <Eye className="h-3 w-3" />
                      Ver
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistorialPatrullasOperador;