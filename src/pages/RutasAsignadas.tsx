import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Car, Clock, CheckCircle, MapPin, Users, AlertTriangle, Flame, Eye, UserCheck, Shield, Phone, Camera, Timer, LogOut, Navigation } from "lucide-react";
import { useSupabaseAlarmas } from "@/hooks/useSupabaseAlarmas";
import { useAuthConsolidated } from "@/hooks/useAuthConsolidated";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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
}

const RutasAsignadas = () => {
  const { user } = useAuthConsolidated();
  const { alarmas, loading, refetch } = useSupabaseAlarmas();
  const { toast } = useToast();
  const [routeStates, setRouteStates] = useState<{ [key: string]: string }>({});
  
  // QR Scanner states
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [currentScanType, setCurrentScanType] = useState<'arrival' | 'departure' | null>(null);
  const [selectedAlarmaId, setSelectedAlarmaId] = useState<string>('');
  const [siteTimes, setSiteTimes] = useState<Record<string, number>>({});

  // Filtrar alarmas asignadas al supervisor actual
  const misAsignaciones = alarmas.filter(
    alarma => 
      // Supervisor específico por ID o nombre
      alarma.supervisor_id === user?.id || 
      (alarma.supervisor && alarma.supervisor === user?.full_name) ||
      // Si el supervisor está en el campo patrulla_asignada (formato legacy)
      (alarma.patrulla_asignada && alarma.patrulla_asignada.includes(user?.full_name || ''))
  );

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
        // Mark arrival at site - Update tiempo_primera_lectura_qr to stop supervisor llegada timer
        const { error } = await supabase
          .from('alarmas')
          .update({
            tiempo_llegada_sitio: now,
            tiempo_primera_lectura_qr: now, // This stops the supervisor llegada timer
            qr_llegada_data: qrData as any,
            estado: 'en_proceso'
          })
          .eq('id', selectedAlarmaId);

        if (error) throw error;

        toast({
          title: "Llegada Confirmada",
          description: `Has llegado al sitio de ${qrData.nombre}. El contador de tiempo ha iniciado.`,
        });
      } else {
        // Mark departure from site - Update tiempo_segunda_lectura_qr to stop supervisor salida timer
        const { error } = await supabase
          .from('alarmas')
          .update({
            tiempo_salida_sitio: now,
            tiempo_segunda_lectura_qr: now, // This stops the supervisor salida timer
            qr_salida_data: qrData as any,
            resolved_at: now,
            estado: 'resuelta'
          })
          .eq('id', selectedAlarmaId);

        if (error) throw error;

        toast({
          title: "Servicio Finalizado",
          description: `Has finalizado el servicio en ${qrData.nombre} exitosamente.`,
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

  const getAlarmTypeIcon = (tipo: string) => {
    switch (tipo) {
      case "Fuego": return <Flame className="h-4 w-4" />;
      case "Pánico": return <Shield className="h-4 w-4" />;
      case "Revisión": return <Eye className="h-4 w-4" />;
      case "Acompañamiento": return <UserCheck className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getAlarmTypeColor = (tipo: string) => {
    switch (tipo) {
      case "Fuego": return "border-red-500 bg-red-50";
      case "Pánico": return "border-purple-500 bg-purple-50";
      case "Revisión": return "border-blue-500 bg-blue-50";
      case "Acompañamiento": return "border-green-500 bg-green-50";
      default: return "border-orange-500 bg-orange-50";
    }
  };

  const getEstadoColor = (estado: string) => {
    const colors = {
      'asignada': 'bg-blue-100 text-blue-800',
      'en_proceso': 'bg-yellow-100 text-yellow-800',
      'resuelta': 'bg-green-100 text-green-800',
      'activa': 'bg-red-100 text-red-800'
    };
    return colors[estado as keyof typeof colors] || 'bg-blue-100 text-blue-800';
  };

  const getEstadoDisplay = (estado: string) => {
    switch (estado) {
      case 'asignada': return 'Asignada';
      case 'en_proceso': return 'En Proceso';
      case 'resuelta': return 'Finalizada';
      case 'activa': return 'Pendiente';
      default: return estado;
    }
  };

  const handleCambiarEstado = async (alarmaId: string, nuevoEstado: string) => {
    try {
      const updates: any = {};
      
      switch (nuevoEstado) {
        case 'en_proceso':
          updates.estado = 'en_proceso';
          const now = new Date().toISOString();
          updates.attended_at = now;
          updates.tiempo_aceptacion_supervisor = now; // Marca aceptación del supervisor para detener cronómetro
          break;
        case 'resuelta':
          updates.estado = 'resuelta';
          updates.resolved_at = new Date().toISOString();
          break;
      }

      const { error } = await supabase
        .from('alarmas')
        .update(updates)
        .eq('id', alarmaId);

      if (error) throw error;

      setRouteStates(prev => ({
        ...prev,
        [alarmaId]: nuevoEstado
      }));

      toast({
        title: "Estado actualizado",
        description: `La alarma ha sido marcada como ${getEstadoDisplay(nuevoEstado)}`,
      });
    } catch (error) {
      console.error('Error updating alarm state:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de la alarma",
        variant: "destructive"
      });
    }
  };

  const getCurrentEstado = (alarma: any) => {
    return routeStates[alarma.id] || alarma.estado;
  };

  const estadosDisponibles = (estadoActual: string) => {
    const flujo = {
      'asignada': ['en_proceso'],
      'en_proceso': ['resuelta'],
      'resuelta': [],
      'activa': ['en_proceso']
    };
    return flujo[estadoActual as keyof typeof flujo] || [];
  };

  const getPriorityColor = (prioridad: string) => {
    switch (prioridad) {
      case "alta": return "text-red-600";
      case "media": return "text-orange-500";
      case "baja": return "text-yellow-500";
      default: return "text-gray-500";
    }
  };

  const calcularTiempoRespuesta = (createdAt: string, attendedAt?: string) => {
    const inicio = new Date(createdAt);
    const fin = attendedAt ? new Date(attendedAt) : new Date();
    const diferencia = Math.floor((fin.getTime() - inicio.getTime()) / 60000); // en minutos
    
    if (diferencia < 60) {
      return `${diferencia}min`;
    } else {
      const horas = Math.floor(diferencia / 60);
      const minutos = diferencia % 60;
      return `${horas}h ${minutos}min`;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded w-2/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <MapPin className="h-8 w-8 text-primary" />
          Rutas Asignadas al Supervisor
        </h1>
        <p className="text-muted-foreground">Seguimiento y gestión de mis servicios asignados</p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Asignadas</CardTitle>
            <Car className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {misAsignaciones.length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Proceso</CardTitle>
            <MapPin className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {misAsignaciones.filter(a => getCurrentEstado(a) === 'en_proceso').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {misAsignaciones.filter(a => getCurrentEstado(a) === 'asignada').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Finalizadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {misAsignaciones.filter(a => getCurrentEstado(a) === 'resuelta').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Rutas Asignadas */}
      <Card>
        <CardHeader>
          <CardTitle>Mis Asignaciones</CardTitle>
          <CardDescription>Servicios asignados a mi patrulla</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {misAsignaciones.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Car className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>No tienes rutas asignadas en este momento</p>
                <p className="text-sm">Las asignaciones del despachador aparecerán aquí</p>
              </div>
            ) : (
              misAsignaciones
                .filter(alarma => getCurrentEstado(alarma) !== 'resuelta')
                .map((alarma) => (
                  <AccordionItem key={alarma.id} value={`route-${alarma.id}`} className={`border-2 rounded-lg mb-4 ${getAlarmTypeColor(alarma.tipo)}`}>
                    <AccordionTrigger className="px-4 py-2 hover:no-underline">
                      <div className="flex items-center justify-between w-full mr-4">
                        <div className="flex items-center space-x-4">
                          <div className={`p-2 rounded-full ${alarma.prioridad === 'alta' ? 'bg-red-100' : 'bg-orange-100'}`}>
                            {getAlarmTypeIcon(alarma.tipo)}
                          </div>
                          <div className="text-left">
                            <h4 className="font-semibold">{alarma.clientes?.nombre || 'Cliente no especificado'}</h4>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="font-medium">
                                {alarma.tipo}
                              </Badge>
                              <span className="text-sm text-muted-foreground">-</span>
                              <span className="text-sm text-muted-foreground">{alarma.patrulla_asignada}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">📍 {alarma.direccion}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <Badge className={getEstadoColor(getCurrentEstado(alarma))}>
                            {getEstadoDisplay(getCurrentEstado(alarma))}
                          </Badge>
                          <Badge variant="outline" className={getPriorityColor(alarma.prioridad)}>
                            {alarma.prioridad}
                          </Badge>
                          <div className="text-lg font-mono font-bold text-blue-600">
                            ⏱️ {calcularTiempoRespuesta(alarma.created_at, alarma.attended_at)}
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    
                    <AccordionContent className="px-4 pb-4">
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p><strong>Cliente:</strong> {alarma.clientes?.nombre || 'No especificado'}</p>
                            <p><strong>Dirección:</strong> {alarma.direccion}</p>
                            <p><strong>Municipio:</strong> {alarma.municipio}</p>
                            <p><strong>Patrulla Asignada:</strong> {alarma.patrulla_asignada}</p>
                            {alarma.supervisor && <p><strong>Supervisor:</strong> {alarma.supervisor}</p>}
                            {alarma.clientes?.telefono && (
                              <div className="flex items-center gap-1 mt-2">
                                <Phone className="h-3 w-3" />
                                <span>{alarma.clientes.telefono}</span>
                              </div>
                            )}
                          </div>
                          <div>
                            <p><strong>Estado:</strong> {getEstadoDisplay(getCurrentEstado(alarma))}</p>
                            <p><strong>Prioridad:</strong> {alarma.prioridad}</p>
                            <p><strong>Creada:</strong> {format(new Date(alarma.created_at), 'dd/MM/yyyy HH:mm')}</p>
                            {alarma.attended_at && (
                              <p><strong>Atendida:</strong> {format(new Date(alarma.attended_at), 'dd/MM/yyyy HH:mm')}</p>
                            )}
                            {alarma.tiempo_asignacion_supervisor && (
                              <p><strong>Asignada:</strong> {format(new Date(alarma.tiempo_asignacion_supervisor), 'dd/MM/yyyy HH:mm')}</p>
                            )}
                            {alarma.descripcion && (
                              <p><strong>Descripción:</strong> {alarma.descripcion}</p>
                            )}
                          </div>
                        </div>

                        {/* Control de Sitio con QR */}
                        <div className="space-y-3">
                          {(() => {
                            const extendedAlarma = alarma as any;
                            
                            // Show site timer if supervisor is on-site
                            if (extendedAlarma.tiempo_llegada_sitio && !extendedAlarma.tiempo_salida_sitio) {
                              return (
                                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                                    <Timer className="h-4 w-4" />
                                    <span className="font-medium">Tiempo en sitio:</span>
                                    <span className="font-mono text-lg">
                                      {formatSiteTime(siteTimes[alarma.id] || 0)}
                                    </span>
                                  </div>
                                </div>
                              );
                            }
                            
                            // Show total time if completed
                            if (extendedAlarma.tiempo_llegada_sitio && extendedAlarma.tiempo_salida_sitio) {
                              return (
                                <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                                  <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                                    <CheckCircle className="h-4 w-4" />
                                    <span className="font-medium">Tiempo total en sitio:</span>
                                    <span className="font-mono">
                                      {extendedAlarma.duracion_sitio_segundos ? formatSiteTime(extendedAlarma.duracion_sitio_segundos) : 'Calculando...'}
                                    </span>
                                  </div>
                                </div>
                              );
                            }
                            
                            return null;
                          })()}
                        </div>

                        <div className="flex flex-wrap gap-2 pt-4 border-t">
                          {(() => {
                            const extendedAlarma = alarma as any;
                            const currentEstado = getCurrentEstado(alarma);
                            
                            // Show QR arrival button for in-process alarms without arrival time
                            if (currentEstado === 'en_proceso' && !extendedAlarma.tiempo_llegada_sitio) {
                              return (
                                <Button
                                  size="sm"
                                  onClick={() => handleArrivalScan(alarma.id)}
                                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                                >
                                  <Navigation className="h-4 w-4" />
                                  Marcar Llegada (Escanear QR)
                                </Button>
                              );
                            }
                            
                            // Show QR departure button if arrived but not departed
                            if (extendedAlarma.tiempo_llegada_sitio && !extendedAlarma.tiempo_salida_sitio) {
                              return (
                                <Button
                                  size="sm"
                                  onClick={() => handleDepartureScan(alarma.id)}
                                  variant="destructive"
                                  className="flex items-center gap-2"
                                >
                                  <LogOut className="h-4 w-4" />
                                  Finalizar Servicio (Escanear QR)
                                </Button>
                              );
                            }
                            
                            // Show standard state change buttons if no QR process started
                            if (!extendedAlarma.tiempo_llegada_sitio) {
                              return estadosDisponibles(currentEstado).map((estado) => (
                                <Button
                                  key={estado}
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleCambiarEstado(alarma.id, estado)}
                                  className="flex items-center gap-1"
                                >
                                  {estado === 'en_proceso' && <MapPin className="h-4 w-4" />}
                                  {estado === 'resuelta' && <CheckCircle className="h-4 w-4" />}
                                  {getEstadoDisplay(estado)}
                                </Button>
                              ));
                            }
                            
                            return null;
                          })()}
                          
                          <Button size="sm" variant="outline">
                            <Users className="h-4 w-4 mr-1" />
                            Contactar Despachador
                          </Button>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))
            )}
          </Accordion>
        </CardContent>
      </Card>

      {/* Rutas Finalizadas */}
      {misAsignaciones.filter(a => getCurrentEstado(a) === 'resuelta').length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Servicios Finalizados</CardTitle>
            <CardDescription>Historial de servicios completados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {misAsignaciones
                .filter(alarma => getCurrentEstado(alarma) === 'resuelta')
                .map((alarma) => (
                  <div key={alarma.id} className={`p-4 border-2 rounded-lg opacity-75 ${getAlarmTypeColor(alarma.tipo)}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 rounded-full bg-gray-100">
                          {getAlarmTypeIcon(alarma.tipo)}
                        </div>
                        <div>
                          <h4 className="font-semibold">{alarma.clientes?.nombre || 'Cliente no especificado'}</h4>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="font-medium">
                              {alarma.tipo}
                            </Badge>
                            <span className="text-sm text-muted-foreground">-</span>
                            <span className="text-sm text-muted-foreground">{alarma.patrulla_asignada}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">📍 {alarma.direccion}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end space-y-2">
                        <Badge className={getEstadoColor('resuelta')}>
                          Finalizada
                        </Badge>
                        <div className="text-sm font-mono text-gray-600">
                          ✅ {calcularTiempoRespuesta(alarma.created_at, alarma.resolved_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
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

export default RutasAsignadas;