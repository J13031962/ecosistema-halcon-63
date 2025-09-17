import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Car, Users, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ClienteServiciosDisplayProps {
  clienteId: string;
  clienteNombre?: string;
}

export const ClienteServiciosDisplay: React.FC<ClienteServiciosDisplayProps> = ({ 
  clienteId, 
  clienteNombre 
}) => {
  const [servicios, setServicios] = useState<any>(null);
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
      // Obtener la empresa contratada del cliente
      const { data: clienteData, error: clienteError } = await supabase
        .from('clientes')
        .select('empresa_contratada_id')
        .eq('id', clienteId)
        .single();
      
      if (clienteError) throw clienteError;
      
      let empresaId = clienteData?.empresa_contratada_id;
      
      // Si no tiene empresa asignada, usar la primera empresa activa
      if (!empresaId) {
        const { data: empresaData, error: empresaError } = await supabase
          .from('empresas_contratadas')
          .select('id')
          .eq('estado', 'activo')
          .order('nombre')
          .limit(1)
          .single();
        
        if (!empresaError && empresaData) {
          empresaId = empresaData.id;
        }
      }
      
      if (empresaId) {
        const { data: serviciosData, error: serviciosError } = await supabase.rpc('get_servicios_por_empresa', {
          empresa_id_param: empresaId,
          year_param: currentYear,
          month_param: currentMonth
        });
        
        if (serviciosError) throw serviciosError;
        
        // Obtener servicios utilizados por este cliente específico
        const { data: utilizadosData, error: utilizadosError } = await supabase
          .from('servicios_utilizados')
          .select('tipo_servicio')
          .eq('cliente_id', clienteId)
          .eq('year', currentYear)
          .eq('month', currentMonth);
        
        if (utilizadosError) throw utilizadosError;
        
        // Contar servicios utilizados por tipo
        const usados = {
          patrulla: utilizadosData?.filter(s => s.tipo_servicio === 'patrulla').length || 0,
          acompanamiento: utilizadosData?.filter(s => s.tipo_servicio === 'acompanamiento').length || 0,
          revista: utilizadosData?.filter(s => s.tipo_servicio === 'revista').length || 0
        };
        
        const serviciosCompletos = {
          ...serviciosData?.[0],
          cliente_patrullas_usadas: usados.patrulla,
          cliente_acompanamientos_usados: usados.acompanamiento,
          cliente_revistas_usadas: usados.revista
        };
        
        setServicios(serviciosCompletos);
      }
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
                {servicios.patrullas_usadas} utilizadas
              </div>
              <div className="text-sm text-muted-foreground">
                este mes
              </div>
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
                {servicios.acompanamientos_usados} utilizados
              </div>
              <div className="text-sm text-muted-foreground">
                este mes
              </div>
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
                {servicios.revistas_usadas} utilizadas
              </div>
              <div className="text-sm text-muted-foreground">
                este mes
              </div>
            </div>
          </div>
        </div>

        {/* Información adicional */}
        <div className="mt-4 pt-3 border-t">
          <div className="text-xs text-muted-foreground space-y-1">
            <div>• Servicios utilizados por este cliente en el mes actual</div>
            <div>• Los servicios se descuentan del pool global automáticamente</div>
            <div>• Consulta la página "Patrullas Coraza" para gestionar el pool global</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};