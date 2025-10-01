import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSupabaseAlarmas } from "@/hooks/useSupabaseAlarmas";
import { useSupabaseAlarmasEnhanced } from "@/hooks/useSupabaseAlarmasEnhanced";
import { useAuthConsolidated } from "@/hooks/useAuthConsolidated";
import { useRealTimeGPS } from "@/hooks/useRealTimeGPS";
import { useVisibilityRefresh } from "@/hooks/useVisibilityRefresh";
import { MapPin, Clock, Phone, AlertTriangle, CheckCircle, Camera, Timer, LogOut, Navigation } from "lucide-react";
import { format, differenceInSeconds } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { QRScannerComponent } from "@/components/qr/QRScanner";
import { supabase } from "@/integrations/supabase/client";

interface QRData {
  id_cliente?: string; // Old format (UUID)
  numero_cuenta?: string; // New format 
  id?: string; // Generic ID field
  coordenadas: {
    latitud: string;
    longitud: string;
  };
  nombre: string;
  direccion: string;
  supervisor_location?: {
    latitud: number;
    longitud: number;
    accuracy?: number;
    timestamp: string;
  };
}

// Extended alarma type to include new fields
interface ExtendedAlarma {
  tiempo_llegada_sitio?: string;
  tiempo_salida_sitio?: string;
  qr_llegada_data?: any;
  qr_salida_data?: any;
  duracion_sitio_segundos?: number;
}

const MisAsignaciones = () => {
  const { user } = useAuthConsolidated();
  const { alarmas, loading, attendAlarma, refetch } = useSupabaseAlarmas();
  const { aceptarServicio } = useSupabaseAlarmasEnhanced();
  const { toast } = useToast();
  
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [currentScanType, setCurrentScanType] = useState<'arrival' | 'departure' | null>(null);
  const [selectedAlarmaId, setSelectedAlarmaId] = useState<string>('');
  const [siteTimes, setSiteTimes] = useState<Record<string, number>>({});

  // Filtrar alarmas asignadas al supervisor actual
  const misAsignaciones = alarmas.filter(alarma => {
    // Debug: log all alarms and supervisor info
    console.log('🔍 Checking alarm:', {
      alarmaId: alarma.id,
      supervisor_id: alarma.supervisor_id,
      supervisor: alarma.supervisor,
      currentUserId: user?.id,
      currentUserName: user?.full_name,
      currentUserEmail: user?.email
    });
    
    return alarma.supervisor_id === user?.id || 
           (alarma.supervisor && alarma.supervisor.includes(user?.full_name || '')) ||
           (alarma.supervisor && alarma.supervisor.includes(user?.email || ''));
  });

  console.log('👥 Current user:', user);
  console.log('📋 Total alarms:', alarmas.length);
  console.log('🎯 My assignments:', misAsignaciones.length);

  // Force refresh when component mounts or user changes
  useEffect(() => {
    if (user?.id) {
      console.log('🔄 Force refreshing alarms for supervisor:', user.email);
      refetch();
    }
  }, [user?.id, refetch]);

  // Use visibility refresh to maintain active session
  useVisibilityRefresh({
    onRefresh: async () => {
      await refetch();
    },
    interval: 30000
  });

  
  // Update site times every second for active alarms
  useEffect(() => {
    const interval = setInterval(() => {
      const newTimes: Record<string, number> = {};
      misAsignaciones.forEach(alarma => {
        const extendedAlarma = alarma as any; // Type assertion for new fields
        if (extendedAlarma.tiempo_llegada_sitio && !extendedAlarma.tiempo_salida_sitio) {
          const arrivalTime = new Date(extendedAlarma.tiempo_llegada_sitio);
          const currentTime = new Date();
          newTimes[alarma.id] = differenceInSeconds(currentTime, arrivalTime);
        }
      });
      setSiteTimes(newTimes);
    }, 1000);

    return () => clearInterval(interval);
  }, [misAsignaciones]);

  // GPS tracking for active assignments - vinculado con alarma específica
  const [trackingAlarmaId, setTrackingAlarmaId] = useState<string | null>(null);
  
  // Auto-start GPS tracking for en_proceso alarms con alarma_id específico
  useEffect(() => {
    if (!user?.id) return;
    
    const activeAlarm = misAsignaciones.find(alarma => 
      alarma.estado === 'en_proceso' && 
      alarma.supervisor_id === user.id && 
      !alarma.tiempo_segunda_lectura_qr
    );
    
    if (activeAlarm && trackingAlarmaId !== activeAlarm.id) {
      console.log('🛰️ Auto-starting GPS tracking for alarm:', activeAlarm.id);
      console.log('📍 GPS positions will be saved with alarma_id:', activeAlarm.id);
      setTrackingAlarmaId(activeAlarm.id);
    } else if (!activeAlarm && trackingAlarmaId) {
      console.log('🛑 Stopping GPS tracking - no active alarm');
      setTrackingAlarmaId(null);
    }
  }, [misAsignaciones, user?.id, trackingAlarmaId]);

  // Initialize GPS tracking with specific alarma_id
  const { updateGPSPosition, isTracking } = useRealTimeGPS({
    alarmaId: trackingAlarmaId || undefined,
    supervisorId: user?.id,
    isActive: Boolean(trackingAlarmaId && user?.id),
    updateInterval: 180000 // 3 minutos
  });

  // Log GPS tracking status
  useEffect(() => {
    if (trackingAlarmaId && isTracking) {
      console.log('✅ GPS tracking activo para alarma:', trackingAlarmaId);
    }
  }, [trackingAlarmaId, isTracking]);

  // Función para aceptar servicio (nueva lógica según el flujo del usuario)
  const handleAceptarServicio = async (alarmaId: string) => {
    try {
      console.log('🎯 Supervisor aceptando servicio:', alarmaId);
      
      // Refresh session before critical operation
      try {
        await supabase.auth.getSession();
      } catch (sessionError) {
        console.warn('⚠️ Session refresh failed:', sessionError);
      }
      
      // Solicitar permisos de geolocalización
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            console.log('✅ Permisos de GPS concedidos');
            toast({
              title: "GPS Activado",
              description: "Ubicación en tiempo real activada para este servicio",
            });
          },
          (error) => {
            console.warn('⚠️ Permisos de GPS denegados:', error);
            toast({
              title: "GPS Opcional",
              description: "Puedes continuar sin GPS, pero no se registrará tu ubicación",
              variant: "destructive",
            });
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      }
      
      const result = await aceptarServicio(alarmaId, user?.id || '');
      if (result.success) {
        console.log('✅ Servicio aceptado exitosamente, estado: asignada -> en_proceso');
        
        // Upload initial GPS position immediately
        try {
          await updateGPSPosition(false);
          console.log('📍 Initial GPS position uploaded');
        } catch (gpsError) {
          console.warn('⚠️ Could not upload initial GPS position:', gpsError);
        }
        
        toast({
          title: "Servicio Aceptado",
          description: "Has aceptado el servicio. Ahora puedes dirigirte al sitio.",
        });
        refetch();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error('❌ Error aceptando servicio:', error);
      
      // Retry with session refresh if auth error
      if (error.message?.includes('JWT') || error.message?.includes('401')) {
        try {
          await supabase.auth.getSession();
          toast({
            title: "Sesión Actualizada",
            description: "Por favor, intenta la operación nuevamente",
          });
        } catch (retryError) {
          toast({
            title: "Error de Sesión",
            description: "Por favor, recarga la página y vuelve a intentar",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Error",
          description: error.message || "No se pudo aceptar el servicio",
          variant: "destructive",
        });
      }
    }
  };

  // Función existente para aceptar asignación (mantenida para compatibilidad)
  const handleAceptarAsignacion = async (alarmaId: string) => {
    try {
      await attendAlarma(alarmaId);
      toast({
        title: "Asignación aceptada",
        description: "Has aceptado la asignación del servicio",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo aceptar la asignación",
        variant: "destructive"
      });
    }
  };

  const handleArrivalScan = (alarmaId: string) => {
    setSelectedAlarmaId(alarmaId);
    setCurrentScanType('arrival');
    setIsQRScannerOpen(true);
  };

  const handleDepartureScan = (alarmaId: string) => {
    setSelectedAlarmaId(alarmaId);
    setCurrentScanType('departure');
    setIsQRScannerOpen(true);
  };

  const handleQRScanSuccess = async (qrData: QRData) => {
    try {
      const alarma = alarmas.find(a => a.id === selectedAlarmaId);
      if (!alarma) {
        toast({
          title: "Error",
          description: "No se encontró la alarma seleccionada",
          variant: "destructive"
        });
        return;
      }

      // Verify QR matches the client - Support both old and new formats
      const expectedClientId = alarma.cliente_id;
      const expectedNumeroCuenta = alarma.clientes?.numero_cuenta;
      const expectedName = alarma.clientes?.nombre || '';

      const normalize = (s: string | null | undefined) => (s ?? '').toString().trim().toLowerCase();
      
      // Check multiple ID formats for compatibility
      let idMatches = false;
      
      // New format: numero_cuenta
      if (qrData.numero_cuenta && expectedNumeroCuenta) {
        idMatches = normalize(qrData.numero_cuenta) === normalize(expectedNumeroCuenta);
      }
      
      // Old format: id_cliente (UUID)
      if (!idMatches && qrData.id_cliente && expectedClientId) {
        idMatches = normalize(qrData.id_cliente) === normalize(expectedClientId);
      }
      
      // Generic id field
      if (!idMatches && qrData.id) {
        idMatches = normalize(qrData.id) === normalize(expectedNumeroCuenta) || 
                   normalize(qrData.id) === normalize(expectedClientId);
      }
      
      // Fallback to name match
      const nameMatches = normalize(qrData.nombre) !== '' && normalize(expectedName) !== ''
        ? normalize(qrData.nombre) === normalize(expectedName)
        : false;

      console.log('🔎 QR match check:', { 
        idMatches, 
        nameMatches, 
        expectedClientId, 
        expectedNumeroCuenta,
        expectedName, 
        scanned: qrData 
      });
      
      if (!idMatches && !nameMatches) {
        toast({
          title: "QR Incorrecto",
          description: `El código QR escaneado pertenece a "${qrData.nombre}" pero esta alarma es para otro cliente. Por favor, escanee el QR correcto.`,
          variant: "destructive"
        });
        setIsQRScannerOpen(false);
        return;
      }

      const now = new Date().toISOString();
      
      if (currentScanType === 'arrival') {
        // Mark arrival at site
        console.log('📍 Marking arrival for alarm:', selectedAlarmaId);
        const { data, error } = await supabase
          .from('alarmas')
          .update({
            tiempo_llegada_sitio: now,
            tiempo_primera_lectura_qr: now,
            qr_llegada_data: qrData as any,
            ubicacion_supervisor_llegada: qrData.supervisor_location || null,
            tiempo_aceptacion_supervisor: alarma.tiempo_aceptacion_supervisor || now,
            estado: 'en_proceso'
          })
          .eq('id', selectedAlarmaId)
          .select('*');

        if (error) {
          console.error('❌ Error updating arrival:', error);
          throw error;
        }
        
        console.log('✅ Arrival marked successfully:', data);
        const locationText = qrData.supervisor_location 
          ? " Tu ubicación GPS ha sido registrada."
          : " (Ubicación GPS no disponible)";
        toast({
          title: "Llegada Confirmada",
          description: `Has llegado al sitio de ${qrData.nombre}. El contador de tiempo ha iniciado.${locationText}`,
        });
      } else {
        // Mark departure from site
        console.log('🏁 Marking departure for alarm:', selectedAlarmaId);
        
        // También actualizar el estado de la patrulla a disponible
        const { data: patrullaData, error: patrullaError } = await supabase
          .from('patrullas')
          .update({
            estado: 'disponible'
          })
          .eq('numero_patrulla', alarma.patrulla_asignada);

        if (patrullaError) {
          console.warn('⚠️ Warning updating patrol status:', patrullaError);
        }

        const { data, error } = await supabase
          .from('alarmas')
          .update({
            tiempo_salida_sitio: now,
            qr_salida_data: qrData as any,
            ubicacion_supervisor_salida: qrData.supervisor_location || null,
            tiempo_segunda_lectura_qr: now,
            // Asegurar consistencia de tiempos si faltan
            tiempo_aceptacion_supervisor: alarma.tiempo_aceptacion_supervisor || now,
            tiempo_primera_lectura_qr: (alarma as any).tiempo_primera_lectura_qr || (alarma as any).tiempo_llegada_sitio || now,
            resolved_at: now,
            estado: 'resuelta' // Estado final: en_proceso -> resuelta
          })
          .eq('id', selectedAlarmaId)
          .select('*');
        
        console.log('🏁 Servicio finalizado, estado: en_proceso -> resuelta, alarmaId:', selectedAlarmaId);

        if (error) {
          console.error('❌ Error updating departure:', error);
          throw error;
        }
        
        console.log('✅ Departure marked successfully:', data);
        const locationText = qrData.supervisor_location 
          ? " Tu ubicación GPS de salida ha sido registrada."
          : " (Ubicación GPS no disponible)";
        toast({
          title: "Servicio Finalizado",
          description: `Has finalizado el servicio en ${qrData.nombre} exitosamente.${locationText}`,
        });
      }

      await refetch();
      setIsQRScannerOpen(false);
      setCurrentScanType(null);
      setSelectedAlarmaId('');

    } catch (error: any) {
      console.error('Error updating alarm:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo procesar el escaneo QR",
        variant: "destructive"
      });
    }
  };

  const formatSiteTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const getPriorityColor = (prioridad: string) => {
    switch (prioridad) {
      case 'alta': return 'destructive';
      case 'media': return 'default';
      case 'baja': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'asignada': return 'default';
      case 'en_proceso': return 'secondary';
      case 'resuelta': return 'outline';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded w-2/3"></div>
          <div className="space-y-3">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Mis Asignaciones</h2>
        <p className="text-muted-foreground">Servicios asignados a tu patrulla</p>
      </div>

      {misAsignaciones.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No tienes asignaciones pendientes</h3>
              <p>Los nuevos servicios asignados aparecerán aquí</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {misAsignaciones.map((alarma) => {
            const extendedAlarma = alarma as any; // Type assertion for new fields
            return (
            <Card key={alarma.id} className="border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      {alarma.tipo}
                      <Badge variant={getPriorityColor(alarma.prioridad)}>
                        {alarma.prioridad}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Asignado el {format(new Date(alarma.created_at), 'dd/MM/yyyy HH:mm')}
                    </CardDescription>
                  </div>
                  <Badge variant={getStatusColor(alarma.estado)}>
                    {alarma.estado}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Información del Cliente */}
                  <div>
                    <h4 className="font-semibold mb-2">Información del Cliente</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="font-medium">{alarma.clientes?.nombre || 'Cliente no especificado'}</p>
                        {alarma.direccion && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                            <MapPin className="h-3 w-3" />
                            <span>{alarma.direccion}</span>
                          </div>
                        )}
                        {alarma.municipio && (
                          <p className="text-sm text-muted-foreground">
                            Municipio: {alarma.municipio}
                          </p>
                        )}
                      </div>
                      <div>
                        {alarma.clientes?.telefono && (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3" />
                            <span>{alarma.clientes.telefono}</span>
                          </div>
                        )}
                        {alarma.descripcion && (
                          <p className="text-sm text-muted-foreground mt-2">
                            <strong>Descripción:</strong> {alarma.descripcion}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Información de la Patrulla */}
                  <div>
                    <h4 className="font-semibold mb-2">Patrulla Asignada</h4>
                    <p className="text-sm">
                      <strong>Patrulla:</strong> {alarma.patrulla_asignada || 'No asignada'}
                    </p>
                    <p className="text-sm">
                      <strong>Supervisor:</strong> {alarma.supervisor || user?.full_name}
                    </p>
                  </div>

                  {/* Tiempos y Control de Sitio */}
                  <div>
                    <h4 className="font-semibold mb-2">Control de Sitio</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Creada:</span>
                        <p>{format(new Date(alarma.created_at), 'HH:mm:ss')}</p>
                      </div>
                      {alarma.tiempo_asignacion_supervisor && (
                        <div>
                          <span className="text-muted-foreground">Asignada:</span>
                          <p>{format(new Date(alarma.tiempo_asignacion_supervisor), 'HH:mm:ss')}</p>
                        </div>
                      )}
                      {extendedAlarma.tiempo_llegada_sitio && (
                        <div>
                          <span className="text-muted-foreground">Llegada al sitio:</span>
                          <p>{format(new Date(extendedAlarma.tiempo_llegada_sitio), 'HH:mm:ss')}</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Timer en sitio */}
                    {extendedAlarma.tiempo_llegada_sitio && !extendedAlarma.tiempo_salida_sitio && (
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                        <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                          <Timer className="h-4 w-4" />
                          <span className="font-medium">Tiempo en sitio:</span>
                          <span className="font-mono text-lg">
                            {formatSiteTime(siteTimes[alarma.id] || 0)}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {/* Tiempo total si ya salió */}
                    {extendedAlarma.tiempo_llegada_sitio && extendedAlarma.tiempo_salida_sitio && (
                      <div className="mt-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                        <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                          <CheckCircle className="h-4 w-4" />
                          <span className="font-medium">Tiempo total en sitio:</span>
                          <span className="font-mono">
                            {extendedAlarma.duracion_sitio_segundos ? formatSiteTime(extendedAlarma.duracion_sitio_segundos) : 'Calculando...'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Acciones con QR Scanning */}
                  <div className="flex gap-2 pt-4 border-t">
                  {/* Botón para aceptar servicio asignado (estado: asignada -> en_proceso) */}
                  {alarma.estado === 'asignada' && !alarma.tiempo_aceptacion_supervisor && (
                    <Button 
                      onClick={() => handleAceptarServicio(alarma.id)}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Atender
                    </Button>
                  )}
                    
                    {/* Botón original para casos legacy */}
                    {alarma.estado === 'asignada' && !alarma.tiempo_asignacion_supervisor && (
                      <Button 
                        onClick={() => handleAceptarAsignacion(alarma.id)}
                        className="flex items-center gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Aceptar Asignación
                      </Button>
                    )}
                    
                  {/* Botón para marcar llegada (después de aceptar servicio) */}
                   {alarma.tiempo_aceptacion_supervisor && !extendedAlarma.tiempo_llegada_sitio && (
                     <Button 
                       onClick={() => handleArrivalScan(alarma.id)}
                       translate="no"
                       className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 notranslate"
                     >
                       <Navigation className="h-4 w-4" />
                       Marcar Llegada (Escanear QR)
                     </Button>
                   )}
                     
                     {extendedAlarma.tiempo_llegada_sitio && !extendedAlarma.tiempo_salida_sitio && (
                       <Button 
                         onClick={() => handleDepartureScan(alarma.id)}
                         translate="no"
                         className="flex items-center gap-2 bg-red-600 hover:bg-red-700 notranslate"
                         variant="destructive"
                       >
                         <LogOut className="h-4 w-4" />
                         Finalizar Servicio (Escanear QR)
                       </Button>
                     )}
                    
                    {alarma.estado === 'resuelta' && (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">Servicio completado</span>
                      </div>
                    )}
                    
                    {alarma.estado === 'cancelada' && (
                      <div className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm font-medium">Servicio cancelado</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}
      
      {/* QR Scanner Modal */}
      <QRScannerComponent
        isOpen={isQRScannerOpen}
        onClose={() => {
          setIsQRScannerOpen(false);
          setCurrentScanType(null);
          setSelectedAlarmaId('');
        }}
        onScanSuccess={handleQRScanSuccess}
      />
    </div>
  );
};

export default MisAsignaciones;