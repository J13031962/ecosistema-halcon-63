import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useEmpresasContratadas } from "@/hooks/useEmpresasContratadas";
import { Building2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface EmpresaServiciosSelectorProps {
  selectedEmpresa: string;
  onEmpresaChange: (empresaId: string) => void;
  tipoAlarma: string;
  className?: string;
}

interface ServiciosDisponibles {
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

export const EmpresaServiciosSelector = ({ 
  selectedEmpresa, 
  onEmpresaChange,
  tipoAlarma,
  className = "" 
}: EmpresaServiciosSelectorProps) => {
  const { empresas, loading } = useEmpresasContratadas();
  const [servicios, setServicios] = useState<ServiciosDisponibles | null>(null);
  const [loadingServicios, setLoadingServicios] = useState(false);

  useEffect(() => {
    const fetchServicios = async () => {
      if (!selectedEmpresa) {
        setServicios(null);
        return;
      }

      setLoadingServicios(true);
      try {
        const { data, error } = await supabase.rpc('get_servicios_por_empresa', {
          empresa_id_param: selectedEmpresa,
          year_param: new Date().getFullYear(),
          month_param: new Date().getMonth() + 1
        });

        if (error) throw error;
        if (data && data.length > 0) {
          setServicios(data[0]);
        } else {
          setServicios(null);
        }
      } catch (error) {
        console.error('Error fetching servicios:', error);
        setServicios(null);
      } finally {
        setLoadingServicios(false);
      }
    };

    fetchServicios();
  }, [selectedEmpresa]);

  const getTipoServicio = (tipo: string): 'patrulla' | 'acompanamiento' | 'revista' => {
    const tipoLower = tipo.toLowerCase();
    if (tipoLower.includes('acompañamiento') || tipoLower.includes('acompanamiento') || tipoLower.includes('escolta')) {
      return 'acompanamiento';
    }
    if (tipoLower.includes('revista') || tipoLower.includes('rondeo') || tipoLower.includes('inspección')) {
      return 'revista';
    }
    return 'patrulla';
  };

  const getServicioInfo = () => {
    if (!servicios || !tipoAlarma) return null;

    const tipoServicio = getTipoServicio(tipoAlarma);
    
    switch (tipoServicio) {
      case 'patrulla':
        return {
          tipo: 'Patrullas',
          disponibles: servicios.patrullas_disponibles,
          usadas: servicios.patrullas_usadas,
          restantes: servicios.patrullas_restantes
        };
      case 'acompanamiento':
        return {
          tipo: 'Acompañamientos',
          disponibles: servicios.acompanamientos_disponibles,
          usadas: servicios.acompanamientos_usados,
          restantes: servicios.acompanamientos_restantes
        };
      case 'revista':
        return {
          tipo: 'Revistas',
          disponibles: servicios.revistas_disponibles,
          usadas: servicios.revistas_usadas,
          restantes: servicios.revistas_restantes
        };
    }
  };

  const getStatusColor = (restantes: number, disponibles: number) => {
    const porcentaje = (restantes / disponibles) * 100;
    if (porcentaje > 50) return 'text-green-600';
    if (porcentaje > 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusIcon = (restantes: number, disponibles: number) => {
    const porcentaje = (restantes / disponibles) * 100;
    if (porcentaje > 50) return <TrendingUp className="w-4 h-4" />;
    if (porcentaje > 20) return <Minus className="w-4 h-4" />;
    return <TrendingDown className="w-4 h-4" />;
  };

  const servicioInfo = getServicioInfo();
  const empresaSeleccionada = empresas.find(e => e.id === selectedEmpresa);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="space-y-2">
        <label className="text-sm font-medium">Empresa Contratada</label>
        <Select value={selectedEmpresa} onValueChange={onEmpresaChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Seleccionar empresa..." />
          </SelectTrigger>
          <SelectContent>
            {loading ? (
              <SelectItem value="loading" disabled>Cargando empresas...</SelectItem>
            ) : empresas.length === 0 ? (
              <SelectItem value="empty" disabled>No hay empresas disponibles</SelectItem>
            ) : (
              empresas.map((empresa) => (
                <SelectItem key={empresa.id} value={empresa.id}>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    {empresa.nombre}
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {selectedEmpresa && empresaSeleccionada && (
        <Card className="p-4 bg-muted/50">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">{empresaSeleccionada.nombre}</h4>
              {loadingServicios && (
                <Badge variant="outline">Cargando...</Badge>
              )}
            </div>

            {servicios && servicioInfo && (
              <div className="space-y-2">
                <div className={`flex items-center justify-between p-3 rounded-lg bg-background ${getStatusColor(servicioInfo.restantes, servicioInfo.disponibles)}`}>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(servicioInfo.restantes, servicioInfo.disponibles)}
                    <span className="font-medium text-sm">{servicioInfo.tipo}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="bg-background">
                      {servicioInfo.restantes}/{servicioInfo.disponibles} disponibles
                    </Badge>
                    <Badge variant={servicioInfo.restantes > 0 ? "default" : "destructive"}>
                      {servicioInfo.restantes > 0 ? '✓ Disponible' : '✗ Agotado'}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                  <div className="flex flex-col items-center p-2 bg-background rounded">
                    <span className="font-semibold">{servicioInfo.disponibles}</span>
                    <span>Totales</span>
                  </div>
                  <div className="flex flex-col items-center p-2 bg-background rounded">
                    <span className="font-semibold">{servicioInfo.usadas}</span>
                    <span>Usados</span>
                  </div>
                  <div className="flex flex-col items-center p-2 bg-background rounded">
                    <span className="font-semibold">{servicioInfo.restantes}</span>
                    <span>Restantes</span>
                  </div>
                </div>
              </div>
            )}

            {!servicios && !loadingServicios && (
              <p className="text-sm text-muted-foreground">
                No hay configuración de servicios para esta empresa en el mes actual
              </p>
            )}
          </div>
        </Card>
      )}

      {!selectedEmpresa && (
        <p className="text-sm text-muted-foreground">
          Selecciona una empresa para ver servicios disponibles
        </p>
      )}
    </div>
  );
};
