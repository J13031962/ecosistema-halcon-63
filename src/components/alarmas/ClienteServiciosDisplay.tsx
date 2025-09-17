import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Car, Users, Eye } from 'lucide-react';
import { useSupabasePatrullasCoraza, ServiciosClienteResumen } from '@/hooks/useSupabasePatrullasCoraza';

interface ClienteServiciosDisplayProps {
  clienteId: string;
  clienteNombre?: string;
}

export const ClienteServiciosDisplay: React.FC<ClienteServiciosDisplayProps> = ({ 
  clienteId, 
  clienteNombre 
}) => {
  const { getClienteServiciosMes } = useSupabasePatrullasCoraza();
  const [servicios, setServicios] = useState<ServiciosClienteResumen | null>(null);
  const [loading, setLoading] = useState(false);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  useEffect(() => {
    if (clienteId) {
      fetchServiciosCliente();
    }
  }, [clienteId]);

  const fetchServiciosCliente = async () => {
    setLoading(true);
    try {
      const data = await getClienteServiciosMes(clienteId, currentYear, currentMonth);
      setServicios(data);
    } catch (error) {
      console.error('Error fetching servicios cliente:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (usado: number, disponible: number) => {
    if (disponible === 0) return 'secondary';
    const percentage = (usado / disponible) * 100;
    if (percentage >= 90) return 'destructive';
    if (percentage >= 70) return 'default';
    return 'secondary';
  };

  const getStatusText = (usado: number, disponible: number) => {
    if (disponible === 0) return 'Sin servicios';
    const restantes = disponible - usado;
    if (restantes <= 0) return 'Agotado';
    if (restantes <= 2) return 'Crítico';
    return 'Disponible';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-center text-sm text-muted-foreground">
            Cargando servicios del cliente...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!servicios) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-center text-sm text-muted-foreground">
            No hay datos de servicios para este cliente
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Car className="h-5 w-5" />
          Servicios del Mes - {clienteNombre || 'Cliente'}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {new Date(currentYear, currentMonth - 1).toLocaleDateString('es-ES', { 
            month: 'long', 
            year: 'numeric' 
          }).toUpperCase()}
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-3 gap-4">
          {/* Patrullas */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-1">
              <Car className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Patrullas</span>
            </div>
            <div className="space-y-1">
              <div className="text-lg font-bold">
                {servicios.patrullas_restantes} / {servicios.patrullas_disponibles}
              </div>
              <Badge 
                variant={getStatusColor(servicios.patrullas_usadas, servicios.patrullas_disponibles)}
                className="text-xs"
              >
                {getStatusText(servicios.patrullas_usadas, servicios.patrullas_disponibles)}
              </Badge>
            </div>
          </div>

          {/* Acompañamientos */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-1">
              <Users className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Acompañ.</span>
            </div>
            <div className="space-y-1">
              <div className="text-lg font-bold">
                {servicios.acompanamientos_restantes} / {servicios.acompanamientos_disponibles}
              </div>
              <Badge 
                variant={getStatusColor(servicios.acompanamientos_usados, servicios.acompanamientos_disponibles)}
                className="text-xs"
              >
                {getStatusText(servicios.acompanamientos_usados, servicios.acompanamientos_disponibles)}
              </Badge>
            </div>
          </div>

          {/* Revistas */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-1">
              <Eye className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Revistas</span>
            </div>
            <div className="space-y-1">
              <div className="text-lg font-bold">
                {servicios.revistas_restantes} / {servicios.revistas_disponibles}
              </div>
              <Badge 
                variant={getStatusColor(servicios.revistas_usadas, servicios.revistas_disponibles)}
                className="text-xs"
              >
                {getStatusText(servicios.revistas_usadas, servicios.revistas_disponibles)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Información adicional */}
        <div className="mt-4 pt-3 border-t">
          <div className="text-xs text-muted-foreground space-y-1">
            <div>• Los servicios se descontarán automáticamente al generar alarmas</div>
            <div>• Patrullas: Siempre se descuentan</div>
            <div>• Acompañamientos: Tipos "acompañamiento" o "escolta"</div>
            <div>• Revistas: Tipos "revista" o "inspección"</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};