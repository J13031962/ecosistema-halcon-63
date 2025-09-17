import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  Users, 
  Search, 
  ChevronDown, 
  ChevronUp,
  Calendar,
  User
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ResumenEmpresa {
  empresa_nombre: string;
  empresa_id: string;
  patrullas_disponibles: number;
  patrullas_usadas: number;
  patrullas_restantes: number;
  acompanamientos_disponibles: number;
  acompanamientos_usados: number;
  acompanamientos_restantes: number;
  revistas_disponibles: number;
  revistas_usadas: number;
  revistas_restantes: number;
}

interface ServicioDetalle {
  id: string;
  fecha_uso: string;
  cliente_nombre: string;
  cliente_numero_cuenta: string;
  tipo_servicio: string;
  tipo_alarma: string;
  operador_nombre: string;
}

export const PatrullasCorazaStats: React.FC = () => {
  const [resumenEmpresas, setResumenEmpresas] = useState<ResumenEmpresa[]>([]);
  const [serviciosDetalle, setServiciosDetalle] = useState<ServicioDetalle[]>([]);
  const [expandedService, setExpandedService] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const currentMonth = format(new Date(), 'MMMM yyyy', { locale: es });

  useEffect(() => {
    fetchResumenGlobal();
  }, []);

  const fetchResumenGlobal = async () => {
    try {
      setLoading(true);
      const currentYear = new Date().getFullYear();
      const currentMonthNum = new Date().getMonth() + 1;
      
      const { data, error } = await supabase.rpc('get_resumen_global_empresas', {
        year_param: currentYear,
        month_param: currentMonthNum
      });
      
      if (error) throw error;
      setResumenEmpresas(data || []);
    } catch (err) {
      console.error('Error fetching resumen global:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchServiciosDetalle = async (tipoServicio: string) => {
    try {
      setLoadingDetails(true);
      const currentYear = new Date().getFullYear();
      const currentMonthNum = new Date().getMonth() + 1;
      
      const { data, error } = await supabase
        .from('servicios_utilizados')
        .select(`
          id,
          fecha_uso,
          tipo_servicio,
          tipo_alarma,
          operador_nombre,
          clientes!inner(nombre, numero_cuenta)
        `)
        .eq('tipo_servicio', tipoServicio)
        .eq('year', currentYear)
        .eq('month', currentMonthNum)
        .order('fecha_uso', { ascending: false });
      
      if (error) throw error;
      
      const formattedData = data?.map(item => ({
        id: item.id,
        fecha_uso: item.fecha_uso,
        cliente_nombre: (item.clientes as any)?.nombre || 'Cliente no encontrado',
        cliente_numero_cuenta: (item.clientes as any)?.numero_cuenta || '',
        tipo_servicio: item.tipo_servicio,
        tipo_alarma: item.tipo_alarma,
        operador_nombre: item.operador_nombre || ''
      })) || [];
      
      setServiciosDetalle(formattedData);
    } catch (err) {
      console.error('Error fetching servicios detalle:', err);
      setServiciosDetalle([]);
    } finally {
      setLoadingDetails(false);
    }
  };

  const getTotalByService = (tipo: 'patrullas' | 'acompanamientos' | 'revistas') => {
    return resumenEmpresas.reduce((total, empresa) => {
      switch (tipo) {
        case 'patrullas':
          return {
            disponibles: total.disponibles + empresa.patrullas_disponibles,
            usadas: total.usadas + empresa.patrullas_usadas,
            restantes: total.restantes + empresa.patrullas_restantes
          };
        case 'acompanamientos':
          return {
            disponibles: total.disponibles + empresa.acompanamientos_disponibles,
            usadas: total.usadas + empresa.acompanamientos_usados,
            restantes: total.restantes + empresa.acompanamientos_restantes
          };
        case 'revistas':
          return {
            disponibles: total.disponibles + empresa.revistas_disponibles,
            usadas: total.usadas + empresa.revistas_usadas,
            restantes: total.restantes + empresa.revistas_restantes
          };
      }
    }, { disponibles: 0, usadas: 0, restantes: 0 });
  };

  const handleServiceClick = async (tipoServicio: string) => {
    if (expandedService === tipoServicio) {
      setExpandedService(null);
      setServiciosDetalle([]);
    } else {
      setExpandedService(tipoServicio);
      await fetchServiciosDetalle(tipoServicio);
    }
  };

  const getServiceIcon = (tipo: string) => {
    switch (tipo) {
      case 'patrulla':
        return <Shield className="h-4 w-4" />;
      case 'acompanamiento':
        return <Users className="h-4 w-4" />;
      case 'revista':
        return <Search className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getProgress = (usado: number, disponible: number) => {
    if (disponible === 0) return 0;
    return (usado / disponible) * 100;
  };

  const getProgressColor = (usado: number, disponible: number) => {
    const percentage = getProgress(usado, disponible);
    if (percentage >= 90) return 'bg-destructive';
    if (percentage >= 70) return 'bg-warning';
    return 'bg-primary';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Resumen Patrullas Contratadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">Cargando estadísticas...</div>
        </CardContent>
      </Card>
    );
  }

  const patrullasTotales = getTotalByService('patrullas');
  const acompanamientosTotales = getTotalByService('acompanamientos');
  const revistasTotales = getTotalByService('revistas');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Resumen Patrullas Contratadas - {currentMonth}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tarjetas de resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Patrullas */}
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleServiceClick('patrulla')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <span className="font-medium">Patrullas</span>
                  {expandedService === 'patrulla' ? 
                    <ChevronUp className="h-4 w-4" /> : 
                    <ChevronDown className="h-4 w-4" />
                  }
                </div>
                <Badge variant={patrullasTotales.restantes === 0 ? 'destructive' : 'secondary'}>
                  {patrullasTotales.usadas}/{patrullasTotales.disponibles}
                </Badge>
              </div>
              <Progress 
                value={getProgress(patrullasTotales.usadas, patrullasTotales.disponibles)} 
                className="mt-2"
              />
              <div className="text-sm text-muted-foreground mt-1">
                {patrullasTotales.restantes} restantes
              </div>
            </CardContent>
          </Card>

          {/* Acompañamientos */}
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleServiceClick('acompanamiento')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span className="font-medium">Acompañamientos</span>
                  {expandedService === 'acompanamiento' ? 
                    <ChevronUp className="h-4 w-4" /> : 
                    <ChevronDown className="h-4 w-4" />
                  }
                </div>
                <Badge variant={acompanamientosTotales.restantes === 0 ? 'destructive' : 'secondary'}>
                  {acompanamientosTotales.usadas}/{acompanamientosTotales.disponibles}
                </Badge>
              </div>
              <Progress 
                value={getProgress(acompanamientosTotales.usadas, acompanamientosTotales.disponibles)} 
                className="mt-2"
              />
              <div className="text-sm text-muted-foreground mt-1">
                {acompanamientosTotales.restantes} restantes
              </div>
            </CardContent>
          </Card>

          {/* Revistas */}
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleServiceClick('revista')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-primary" />
                  <span className="font-medium">Revistas</span>
                  {expandedService === 'revista' ? 
                    <ChevronUp className="h-4 w-4" /> : 
                    <ChevronDown className="h-4 w-4" />
                  }
                </div>
                <Badge variant={revistasTotales.restantes === 0 ? 'destructive' : 'secondary'}>
                  {revistasTotales.usadas}/{revistasTotales.disponibles}
                </Badge>
              </div>
              <Progress 
                value={getProgress(revistasTotales.usadas, revistasTotales.disponibles)} 
                className="mt-2"
              />
              <div className="text-sm text-muted-foreground mt-1">
                {revistasTotales.restantes} restantes
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detalle expandido */}
        {expandedService && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getServiceIcon(expandedService)}
                Detalle de {expandedService}s utilizados
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingDetails ? (
                <div className="text-muted-foreground">Cargando detalles...</div>
              ) : serviciosDetalle.length === 0 ? (
                <div className="text-muted-foreground">No hay servicios utilizados este mes</div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {serviciosDetalle.map((servicio) => (
                    <div key={servicio.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {format(new Date(servicio.fecha_uso), 'dd/MM/yyyy HH:mm')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {servicio.cliente_nombre} ({servicio.cliente_numero_cuenta})
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">{servicio.tipo_alarma}</Badge>
                        <div className="text-xs text-muted-foreground mt-1">
                          {servicio.operador_nombre}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};