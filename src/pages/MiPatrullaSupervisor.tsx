import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useUserSpecificData } from "@/hooks/useUserSpecificData";
import { useAuthConsolidatedContext } from "@/contexts/AuthContextConsolidated";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { 
  Shield, 
  MapPin, 
  Clock, 
  AlertTriangle,
  Plus,
  Car,
  Activity,
  QrCode,
  Camera
} from "lucide-react";
import { QRScannerComponent } from "@/components/qr/QRScanner";

const MiPatrullaSupervisor = () => {
  const { user } = useAuthConsolidatedContext();
  const { toast } = useToast();
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scannedCliente, setScannedCliente] = useState<any>(null);
  const [newActivity, setNewActivity] = useState({
    tipo_actividad: '',
    descripcion: '',
    ubicacion: ''
  });

  // Obtener alarmas específicas del supervisor
  const { 
    data: misAlarmas, 
    loading: alarmasLoading, 
    error: alarmasError,
    refetch: refetchAlarmas 
  } = useUserSpecificData({
    table: 'alarmas',
    enabled: !!user?.id && user?.role === 'supervisor_motorizado'
  });

  // Obtener actividades del supervisor
  const { 
    data: misActividades, 
    loading: actividadesLoading,
    error: actividadesError,
    insertData: addActividad 
  } = useUserSpecificData({
    table: 'supervisor_actividades',
    enabled: !!user?.id && user?.role === 'supervisor_motorizado'
  });

  // Obtener incidentes del supervisor
  const { 
    data: misIncidentes, 
    loading: incidentesLoading,
    error: incidentesError 
  } = useUserSpecificData({
    table: 'incidentes',
    enabled: !!user?.id && user?.role === 'supervisor_motorizado'
  });

  const handleAddActivity = async () => {
    if (!newActivity.tipo_actividad || !newActivity.descripcion) {
      toast({
        title: "Campos requeridos",
        description: "Por favor complete el tipo de actividad y la descripción",
        variant: "destructive"
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "Error de usuario",
        description: "No se pudo identificar al usuario. Intente volver a iniciar sesión.",
        variant: "destructive"
      });
      return;
    }

    const result = await addActividad({
      ...newActivity,
      supervisor_id: user.id,
      supervisor_nombre: user.full_name || user.email
    });

    if (result.success) {
      toast({
        title: "Actividad registrada",
        description: "La actividad ha sido registrada exitosamente"
      });
      setNewActivity({ tipo_actividad: '', descripcion: '', ubicacion: '' });
      setIsAddingActivity(false);
    } else {
      toast({
        title: "Error",
        description: "No se pudo registrar la actividad",
        variant: "destructive"
      });
    }
  };

  const handleQRScan = (qrData: any) => {
    setScannedCliente(qrData);
    
    if (!user?.id) {
      toast({
        title: "Error de usuario",
        description: "No se pudo identificar al usuario. Intente volver a iniciar sesión.",
        variant: "destructive"
      });
      return;
    }
    
    // Automáticamente registrar llegada al cliente
    const actividadLlegada = {
      tipo_actividad: 'llegada_cliente',
      descripcion: `Llegada confirmada al cliente ${qrData.nombre} mediante escaneo QR`,
      ubicacion: qrData.direccion,
      supervisor_id: user.id,
      supervisor_nombre: user.full_name || user.email
    };

    addActividad(actividadLlegada);
    
    toast({
      title: "Llegada Registrada",
      description: `Llegada al cliente ${qrData.nombre} confirmada mediante QR`,
    });
  };

  // Procesar datos solo si están disponibles
  // El hook ya filtra por supervisor_id y supervisor, así que no necesitamos filtrar aquí
  const alarmasAsignadas = misAlarmas?.filter(a => 
    (a.estado === 'en_patrulla' || a.estado === 'asignada' || a.estado === 'en_proceso')
  ) || [];

  const alarmasActivas = alarmasAsignadas;
  
  // DEBUG: Log para verificar datos del usuario y alarmas
  console.log('🔍 Debug MiPatrullaSupervisor:', {
    user: {
      id: user?.id,
      full_name: user?.full_name,
      role: user?.role,
      email: user?.email,
      auth_source: user?.auth_source
    },
    misAlarmas: misAlarmas,
    alarmasAsignadas: alarmasAsignadas,
    alarmasActivas: alarmasActivas,
    loading: { alarmasLoading, actividadesLoading, incidentesLoading },
    errors: { alarmasError, actividadesError, incidentesError },
    hookEnabled: !!user?.id && user?.role === 'supervisor_motorizado'
  });
  
  // Estado general de carga
  const isLoading = alarmasLoading || actividadesLoading || incidentesLoading;
  const hasErrors = alarmasError || actividadesError || incidentesError;

  return (
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Mi Patrulla
          </h1>
          <p className="text-muted-foreground">
            Panel de control del supervisor: {user?.full_name}
          </p>
          {hasErrors && (
            <p className="text-sm text-destructive mt-1">
              Algunos datos no pudieron cargarse correctamente
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowQRScanner(true)}
            className="flex items-center gap-2"
          >
            <QrCode className="h-4 w-4" />
            Escanear QR Cliente
          </Button>
          {scannedCliente && (
            <div className="text-sm text-muted-foreground">
              Último cliente: {scannedCliente.nombre}
            </div>
          )}
        </div>
      </div>

      {/* Estadísticas del supervisor */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alarmas Asignadas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {alarmasActivas.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Alarmas activas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actividades Hoy</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {misActividades?.filter(a => 
                new Date(a.created_at).toDateString() === new Date().toDateString()
              ).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Registradas hoy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Incidentes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {misIncidentes?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Total registrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estado</CardTitle>
            <Car className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              Activo
            </div>
            <p className="text-xs text-muted-foreground">
              En servicio
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alarmas asignadas */}
      <Card>
        <CardHeader>
          <CardTitle>Mis Alarmas Asignadas</CardTitle>
          <CardDescription>
            Alarmas que han sido asignadas específicamente a ti
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-muted rounded"></div>
              ))}
            </div>
          ) : alarmasError ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-destructive" />
              <p>Error al cargar las alarmas</p>
              <Button variant="outline" size="sm" onClick={refetchAlarmas} className="mt-2">
                Reintentar
              </Button>
            </div>
          ) : alarmasActivas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>No tienes alarmas asignadas en este momento</p>
            </div>
          ) : (
            <div className="space-y-4">
              {alarmasActivas.map((alarma) => (
                <div key={alarma.id} className="p-4 border rounded-lg bg-orange-50 border-orange-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{alarma.tipo}</h4>
                      <p className="text-sm text-muted-foreground">
                        📍 {alarma.direccion}, {alarma.municipio}
                      </p>
                      <p className="text-sm">
                        Cliente: {alarma.clientes?.nombre || 'No especificado'}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="mb-2">
                        {alarma.estado}
                      </Badge>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(alarma.created_at), 'HH:mm')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Registro de actividades */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Mis Actividades</CardTitle>
              <CardDescription>Registro de actividades realizadas</CardDescription>
            </div>
            <Button onClick={() => setIsAddingActivity(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Actividad
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isAddingActivity && (
            <div className="mb-6 p-4 border rounded-lg bg-muted/50">
              <h4 className="font-semibold mb-4">Registrar Nueva Actividad</h4>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Tipo de Actividad</label>
                  <Input
                    value={newActivity.tipo_actividad}
                    onChange={(e) => setNewActivity({...newActivity, tipo_actividad: e.target.value})}
                    placeholder="Ej: Patrullaje, Inspección, etc."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Ubicación</label>
                  <Input
                    value={newActivity.ubicacion}
                    onChange={(e) => setNewActivity({...newActivity, ubicacion: e.target.value})}
                    placeholder="Ubicación donde se realizó la actividad"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Descripción</label>
                  <Textarea
                    value={newActivity.descripcion}
                    onChange={(e) => setNewActivity({...newActivity, descripcion: e.target.value})}
                    placeholder="Descripción detallada de la actividad"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddActivity}>
                    Registrar Actividad
                  </Button>
                  <Button variant="outline" onClick={() => setIsAddingActivity(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-muted rounded"></div>
              ))}
            </div>
          ) : actividadesError ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 text-destructive" />
              <p>Error al cargar las actividades</p>
            </div>
          ) : (
            <div className="space-y-4">
              {misActividades?.map((actividad) => (
                <div key={actividad.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold">{actividad.tipo_actividad}</h4>
                      {actividad.ubicacion && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {actividad.ubicacion}
                        </p>
                      )}
                      <p className="text-sm mt-1">{actividad.descripcion}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(actividad.created_at), 'dd/MM/yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                </div>
              )) || (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>No has registrado actividades aún</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* QR Scanner Component */}
      <QRScannerComponent
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onScanSuccess={handleQRScan}
      />
    </div>
  );
};

export default MiPatrullaSupervisor;