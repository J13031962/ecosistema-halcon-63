import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { OperationalCard as Card, OperationalCardContent as CardContent, OperationalCardDescription as CardDescription, OperationalCardHeader as CardHeader, OperationalCardTitle as CardTitle } from "@/components/ui/operational-card";
import { OperationalThemeWrapper } from "@/components/layout/OperationalThemeWrapper";
import { useSidebar } from "@/components/ui/sidebar";
import { OperationalButton as Button } from "@/components/ui/operational-button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUserSpecificData } from "@/hooks/useUserSpecificData";
import { useAuthConsolidated } from "@/hooks/useAuthConsolidated";
import { useOptimizedActions } from "@/hooks/useOptimizedActions";
import { useGlobalTimer } from "@/hooks/useGlobalTimer";
import { useOptimizedScrolling } from "@/hooks/useOptimizedScrolling";
import { useThrottledRealtime } from "@/hooks/useThrottledRealtime";
import { CalendarioTurnosGenerados } from '@/components/personal/CalendarioTurnosGenerados';
import { useSupabaseTurnos } from '@/hooks/useSupabaseTurnos';
import { useSupabaseClientes } from "@/hooks/useSupabaseClientes";
import { useSupabaseLlamadas } from "@/hooks/useSupabaseLlamadas";
import { AlarmaActivaCard } from "@/components/alarmas/AlarmaActivaCard";
import { format, differenceInSeconds, isValid } from "date-fns";
import { 
  AlertTriangle, 
  Phone, 
  Activity,
  Clock,
  CheckCircle,
  User,
  Calendar,
  Users,
  Shield,
  QrCode,
  UserCheck,
  Timer,
  Car,
  Siren,
  Search,
  Building2,
  Flame,
  Eye,
  Plus,
  MapPin,
  X,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import { useSupabaseAlarmas } from "@/hooks/useSupabaseAlarmas";
import { useSupabaseAlarmasEnhanced } from "@/hooks/useSupabaseAlarmasEnhanced";
import { useSupabasePatrullas } from "@/hooks/useSupabasePatrullas";
import CronometroAlarma from "@/components/alarmas/CronometroAlarma";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseMinutaOperaciones } from "@/hooks/useSupabaseMinutaOperaciones";
import { ClienteServiciosDisplay } from "@/components/alarmas/ClienteServiciosDisplay";
import OptimizedQuickBar from "@/components/layout/OptimizedQuickBar";

interface ClienteFormData {
  id_numerico: string;
  nombre: string;
  direccion: string;
  municipio: string;
  ciudad: string;
  departamento: string;
  latitud: string;
  longitud: string;
  contacto_alarma: string;
}

const CentralAlarmasOperador = () => {
  const { user } = useAuthConsolidated();
  const { toast } = useToast();
  const { state: sidebarState } = useSidebar();
  const [mostrarCalendarioTurnos, setMostrarCalendarioTurnos] = useState(false);
  
  // Optimized scrolling and realtime hooks
  const { showQuickBar, mainSectionRef } = useOptimizedScrolling();
  
  // Estados para generación de alarmas
  const [searchTerm, setSearchTerm] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [clienteEncontrado, setClienteEncontrado] = useState<any>(null);
  const [clienteNoEncontrado, setClienteNoEncontrado] = useState(false);
  const [isAlarmModalOpen, setIsAlarmModalOpen] = useState(false);
  const [selectedClienteForAlarm, setSelectedClienteForAlarm] = useState<any>(null);
  const [selectedAlarmType, setSelectedAlarmType] = useState<string>("");
  const [showClienteForm, setShowClienteForm] = useState(false);
  
  // Estados para información de zonas (para alarmas tipo Fuego y Alarma)
  const [numeroZona, setNumeroZona] = useState("");
  const [nombreZona, setNombreZona] = useState("");
  const [tipoSensor, setTipoSensor] = useState("");
  const [mostrarCamposZona, setMostrarCamposZona] = useState(false);
  
useEffect(() => {
  if (selectedClienteForAlarm) {
    console.log('[CentralAlarmasOperador] Selected cliente:', selectedClienteForAlarm.id, selectedClienteForAlarm.nombre);
  }
}, [selectedClienteForAlarm]);

// Effect para mostrar/ocultar campos de zona según el tipo de alarma
useEffect(() => {
  const shouldShowZoneFields = selectedAlarmType === 'Fuego' || selectedAlarmType === 'Alarma';
  setMostrarCamposZona(shouldShowZoneFields);
  
  // Limpiar campos cuando no son necesarios
  if (!shouldShowZoneFields) {
    setNumeroZona("");
    setNombreZona("");
    setTipoSensor("");
  }
}, [selectedAlarmType]);

// Estados para el formulario de llamadas
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [selectedClienteForCall, setSelectedClienteForCall] = useState<any>(null);
  const [callFormData, setCallFormData] = useState({
    contacto_nombre: '',
    numero_telefono: '',
    tipo_llamada: 'celular' as 'celular' | 'smarturban',
    motivo: '',
    observaciones: '',
    duracion_segundos: 0,
    estado: 'completada' as 'completada' | 'no_contesto' | 'ocupado' | 'fuera_servicio'
  });
  
  // Estados para el botón de cancelar
  const [alarmaGenerada, setAlarmaGenerada] = useState<any>(null);
  const [tiempoRestante, setTiempoRestante] = useState(0);
  const [canCancel, setCanCancel] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const [formData, setFormData] = useState<ClienteFormData>({
    id_numerico: '',
    nombre: '',
    direccion: '',
    municipio: '',
    ciudad: '',
    departamento: '',
    latitud: '',
    longitud: '',
    contacto_alarma: ''
  });
  
  // Estados para la minuta
  const [nuevaEntradaMinuta, setNuevaEntradaMinuta] = useState("");
  const [tipoEntradaMinuta, setTipoEntradaMinuta] = useState<'general' | 'cambio_turno' | 'consigna' | 'incidente' | 'mantenimiento'>('general');
  const [mostrarGenerarAlarma, setMostrarGenerarAlarma] = useState(true);
  
  // Cargar turnos desde la base de datos
  const { turnosOperador, turnosSupervisor, loading: turnosSupabaseLoading } = useSupabaseTurnos();

  // Cargar todas las alarmas para que los operadores vean lo mismo que el admin
  const { alarmas: todasAlarmas, loading: loadingAll, cancelAlarma, addAlarma } = useSupabaseAlarmas();
  
  // Hooks para generación de alarmas
  const { clientes, loading: clientesLoading, addCliente } = useSupabaseClientes();
  const { addLlamada } = useSupabaseLlamadas();
  
  // Hook para la minuta de operaciones
  const { entradas: minutaEntradas, loading: minutaLoading, addEntrada: addMinutaEntrada } = useSupabaseMinutaOperaciones();

  // Hook para servicios activos (alarmas enhanced)
  const { 
    alarmas: alarmasEnhanced, 
    loading: loadingEnhanced,
    resolverAlarma
  } = useSupabaseAlarmasEnhanced();

  // Hook para patrullas
  const { patrullas, loading: loadingPatrullas } = useSupabasePatrullas();

  // Optimized realtime updates with throttling
  const realtimeAlarmas = useThrottledRealtime(alarmasEnhanced);

  // Todos los usuarios (incluyendo operadores) ahora ven todas las alarmas
  const fuenteAlarmas = todasAlarmas || [];

  // Filtrar alarmas para servicios activos usando realtimeAlarmas
  const alarmasActivas = fuenteAlarmas.filter(a => a.estado === 'activa');
  const alarmasResueltas = fuenteAlarmas.filter(a => a.estado === 'resuelta');
  
  // Memoized filtered arrays to prevent unnecessary re-renders
  const alarmasEnProceso = useMemo(() => 
    realtimeAlarmas.filter(a => a.estado === 'en_proceso' || a.estado === 'asignada'),
    [realtimeAlarmas]
  );
  
  const alarmasPendientes = useMemo(() => 
    realtimeAlarmas.filter(a => a.estado === 'activa' && !a.supervisor_id),
    [realtimeAlarmas]
  );
  
  const historialAsignaciones = useMemo(() => 
    realtimeAlarmas.filter(a => a.estado === 'resuelta' && a.tiempo_salida_sitio),
    [realtimeAlarmas]
  );

  // Obtener turnos del operador
  const { data: misTurnos, loading: turnosLoading } = useUserSpecificData({
    table: 'turnos_operador',
    enabled: !!user?.id && user?.role === 'operador_alarmas'
  });

  const turnosHoy = misTurnos?.filter(t => 
    new Date(t.fecha).toDateString() === new Date().toDateString()
  ) || [];

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case "activa": return "destructive";
      case "en_proceso": return "default";
      case "asignada": return "secondary";
      case "resuelta": return "outline";
      default: return "outline";
    }
  };

  const getPriorityColor = (prioridad: string) => {
    switch (prioridad) {
      case "alta": return "text-red-600";
      case "media": return "text-orange-500";
      case "baja": return "text-yellow-500";
      default: return "text-gray-500";
    }
  };

  const calcularDuracion = (inicioStr: string, finStr?: string) => {
    const inicio = new Date(inicioStr);
    const fin = finStr ? new Date(finStr) : new Date();
    const diff = differenceInSeconds(fin, inicio);
    const min = Math.floor(diff / 60);
    const sec = diff % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  // Import the optimized actions hook
  const supervisorActions = useOptimizedActions();

  // Optimized supervisor functions with throttling and error handling
  const handleSupervisorAccept = useCallback(async (alarmaId: string) => {
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('alarmas')
        .update({ 
          tiempo_aceptacion_supervisor: now,
          estado: 'en_proceso'
        })
        .eq('id', alarmaId);

      if (error) throw error;

      // Note: State will be updated via realtime subscription

      toast({
        title: "Servicio atendido",
        description: "Has aceptado atender este servicio. Ahora puedes marcar tu llegada.",
      });
    } catch (error) {
      console.error('Error al aceptar servicio:', error);
      toast({
        title: "Error",
        description: "No se pudo aceptar el servicio",
        variant: "destructive"
      });
    }
  }, [toast]);

  const handleSupervisorArrive = useCallback(async (alarmaId: string) => {
    try {
      const now = new Date().toISOString();
      const alarmaActual = realtimeAlarmas.find(a => a.id === alarmaId);
      const updatePayload: any = {
        tiempo_primera_lectura_qr: now,
        estado: 'en_proceso'
      };
      if (!alarmaActual?.tiempo_aceptacion_supervisor) {
        updatePayload.tiempo_aceptacion_supervisor = now;
      }

      const { error } = await supabase
        .from('alarmas')
        .update(updatePayload)
        .eq('id', alarmaId);

      if (error) throw error;

      // Note: State will be updated via realtime subscription

      toast({
        title: "Llegada marcada",
        description: "Has marcado tu llegada al sitio. Ahora puedes marcar tu salida cuando termines.",
      });
    } catch (error) {
      console.error('Error al marcar llegada:', error);
      toast({
        title: "Error",
        description: "No se pudo marcar la llegada",
        variant: "destructive"
      });
    }
  }, [realtimeAlarmas, toast]);

  const handleSupervisorLeave = useCallback(async (alarmaId: string) => {
    try {
      const now = new Date().toISOString();
      const alarmaActual = realtimeAlarmas.find(a => a.id === alarmaId);
      const updatePayload: any = {
        tiempo_segunda_lectura_qr: now,
        resolved_at: now,
        estado: 'resuelta'
      };
      if (!alarmaActual?.tiempo_aceptacion_supervisor) {
        updatePayload.tiempo_aceptacion_supervisor = now;
      }
      if (!alarmaActual?.tiempo_primera_lectura_qr) {
        updatePayload.tiempo_primera_lectura_qr = now;
      }

      const { error } = await supabase
        .from('alarmas')
        .update(updatePayload)
        .eq('id', alarmaId);

      if (error) throw error;

      // Note: State will be updated via realtime subscription

      toast({
        title: "Servicio completado",
        description: "Has marcado tu salida. El servicio ha sido completado exitosamente.",
      });
    } catch (error) {
      console.error('Error al marcar salida:', error);
      toast({
        title: "Error",
        description: "No se pudo marcar la salida",
        variant: "destructive"
      });
    }
  }, [realtimeAlarmas, toast]);

  // Funciones para generación de alarmas
  const filteredClientes = clientes.filter(cliente =>
    cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cliente.email && cliente.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleInputChange = (field: keyof ClienteFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const buscarClientePorId = () => {
    if (!clienteId.trim()) {
      toast({
        title: "Error",
        description: "Ingrese un ID de cliente para buscar",
        variant: "destructive"
      });
      return;
    }

    const cliente = clientes.find(c => 
      c.numero_cuenta === clienteId || 
      c.id === clienteId ||
      c.nombre.toLowerCase().includes(clienteId.toLowerCase())
    );

    if (cliente) {
      setClienteEncontrado(cliente);
      setClienteNoEncontrado(false);
      setShowClienteForm(false);
      toast({
        title: "Cliente encontrado",
        description: `Cliente: ${cliente.nombre}`
      });
    } else {
      setClienteEncontrado(null);
      setClienteNoEncontrado(true);
      setShowClienteForm(false);
    }
  };

  const openAlarmModal = (cliente?: any) => {
    if (cliente) {
      setSelectedClienteForAlarm(cliente);
    } else {
      setSelectedClienteForAlarm(null);
    }
    setSelectedAlarmType("");
    // Reset zone fields
    setNumeroZona("");
    setNombreZona("");
    setTipoSensor("");
    setMostrarCamposZona(false);
    setIsAlarmModalOpen(true);
  };

  const openCallModal = (cliente: any) => {
    setSelectedClienteForCall(cliente);
    setCallFormData({
      contacto_nombre: '',
      numero_telefono: '',
      tipo_llamada: 'celular',
      motivo: '',
      observaciones: '',
      duracion_segundos: 0,
      estado: 'completada'
    });
    setIsCallModalOpen(true);
  };

  const handleCallSubmit = async () => {
    if (!selectedClienteForCall || !callFormData.contacto_nombre || !callFormData.numero_telefono) {
      toast({
        title: "Error",
        description: "Debe completar los campos obligatorios",
        variant: "destructive"
      });
      return;
    }

    try {
      await addLlamada({
        cliente_id: selectedClienteForCall.id,
        contacto_nombre: callFormData.contacto_nombre,
        numero_telefono: callFormData.numero_telefono,
        tipo_llamada: callFormData.tipo_llamada,
        motivo: callFormData.motivo,
        observaciones: callFormData.observaciones,
        duracion_segundos: callFormData.duracion_segundos,
        estado: callFormData.estado
      });

      setIsCallModalOpen(false);
      setSelectedClienteForCall(null);
    } catch (error) {
      console.error('Error al registrar llamada:', error);
    }
  };

  const generateAlarm = async () => {
    if (!selectedClienteForAlarm || !selectedAlarmType) {
      toast({
        title: "Error",
        description: "Debe seleccionar un cliente y tipo de alarma",
        variant: "destructive"
      });
      return;
    }

    // Validar campos de zona para tipos Fuego y Alarma
    if ((selectedAlarmType === 'Fuego' || selectedAlarmType === 'Alarma') && 
        (!numeroZona || !nombreZona || !tipoSensor)) {
      toast({
        title: "Error",
        description: "Para alarmas de tipo Fuego y Alarma debe completar la información de zona",
        variant: "destructive"
      });
      return;
    }

    try {
      const alarmaData: any = {
        cliente_id: selectedClienteForAlarm.id,
        tipo: selectedAlarmType,
        prioridad: 'alta',
        direccion: selectedClienteForAlarm.direccion,
        municipio: selectedClienteForAlarm.municipio,
        descripcion: `Alarma generada para ${selectedClienteForAlarm.nombre}`
      };

      // Agregar información de zona si es necesaria
      if (selectedAlarmType === 'Fuego' || selectedAlarmType === 'Alarma') {
        alarmaData.numero_zona = numeroZona;
        alarmaData.nombre_zona = nombreZona;
        alarmaData.tipo_sensor = tipoSensor;
        
        // Enriquecer la descripción con información de zona
        if (numeroZona && nombreZona && tipoSensor) {
          alarmaData.descripcion = `Alarma generada para ${selectedClienteForAlarm.nombre} - Zona: ${numeroZona} (${nombreZona}) - Sensor: ${tipoSensor}`;
        }
      }

      const nuevaAlarma = await addAlarma(alarmaData);
      
      if (nuevaAlarma) {
        // Activar el botón de cancelar por 5 minutos
        setAlarmaGenerada(nuevaAlarma);
        setCanCancel(true);
        setTiempoRestante(300); // 5 minutos en segundos
        
        // Iniciar countdown
        timerRef.current = setInterval(() => {
          setTiempoRestante(prev => {
            if (prev <= 1) {
              setCanCancel(false);
              setAlarmaGenerada(null);
              if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
              }
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
      
      setIsAlarmModalOpen(false);
      setSelectedClienteForAlarm(null);
      setSelectedAlarmType("");
      // Limpiar campos de zona
      setNumeroZona("");
      setNombreZona("");
      setTipoSensor("");
      setMostrarCamposZona(false);
      // Limpiar búsqueda
      setClienteId("");
      setClienteEncontrado(null);
      setClienteNoEncontrado(false);
    } catch (error) {
      console.error('Error al generar alarma:', error);
      toast({
        title: "Error",
        description: `Error al generar alarma: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        variant: "destructive"
      });
    }
  };

  const handleCancelAlarm = async () => {
    if (!alarmaGenerada) {
      return;
    }

    try {
      await cancelAlarma(alarmaGenerada.id);
      
      // Limpiar estados
      setAlarmaGenerada(null);
      setCanCancel(false);
      setTiempoRestante(0);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    } catch (error) {
      console.error('Error al cancelar alarma:', error);
      toast({
        title: "Error",
        description: `Error al cancelar alarma: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        variant: "destructive"
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Limpiar timer al desmontar componente
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);
  
  // Función para agregar entrada a la minuta
  const handleAgregarMinuta = async () => {
    if (!nuevaEntradaMinuta.trim()) {
      toast({
        title: "Error",
        description: "Debe escribir el contenido de la entrada",
        variant: "destructive"
      });
      return;
    }

    try {
      await addMinutaEntrada({
        tipo_entrada: tipoEntradaMinuta,
        contenido: nuevaEntradaMinuta,
        prioridad: tipoEntradaMinuta === 'incidente' ? 'alta' : 'normal'
      });
      
      setNuevaEntradaMinuta("");
      setTipoEntradaMinuta('general');
    } catch (error) {
      console.error('Error al agregar entrada a minuta:', error);
    }
  };

  const handleSubmitCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre || !formData.direccion) {
      toast({
        title: "Error",
        description: "Nombre y dirección son campos requeridos",
        variant: "destructive"
      });
      return;
    }

    try {
      const clienteData = {
        numero_cuenta: formData.id_numerico || undefined,
        nombre: formData.nombre,
        direccion: formData.direccion,
        municipio: formData.municipio || '',
        email: formData.contacto_alarma || undefined,
        estado: 'activo',
        observaciones: `Ciudad: ${formData.ciudad}, Departamento: ${formData.departamento}, Contacto Alarma: ${formData.contacto_alarma}, Coordenadas: ${formData.latitud}, ${formData.longitud}`
      };

      const nuevoCliente = await addCliente(clienteData);
      
      if (nuevoCliente) {
        toast({
          title: "Cliente creado",
          description: "El cliente ha sido registrado exitosamente"
        });

        // Establecer como cliente encontrado
        setClienteEncontrado(nuevoCliente);
        setClienteNoEncontrado(false);
        setShowClienteForm(false);
        
        // Limpiar formulario
        setFormData({
          id_numerico: '',
          nombre: '',
          direccion: '',
          municipio: '',
          ciudad: '',
          departamento: '',
          latitud: '',
          longitud: '',
          contacto_alarma: ''
        });
      }
    } catch (error) {
      console.error('Error creando cliente:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el cliente",
        variant: "destructive"
      });
    }
  };

  const getAlarmTypeInfo = (type: string) => {
    switch (type) {
      case 'Alarma':
      case 'Pánico':
      case 'Fuego':
        return { resource: 'patrulla', description: 'Consume 1 patrulla' };
      case 'Acompañamiento':
        return { resource: 'acompañamiento', description: 'Consume 1 acompañamiento' };
      case 'Revisión':
        return { resource: 'revista', description: 'Consume 1 revista (rondeo)' };
      default:
        return { resource: 'patrulla', description: 'Consume 1 patrulla' };
    }
  };

  const loadingAlarmasVista = loadingAll;

  return (
    <OperationalThemeWrapper className="min-h-screen scroll-optimized">{/* Removed bg-background since it's handled by theme */}
      {/* Barra rápida fija */}
      {showQuickBar && (
        <div 
          className="fixed top-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b shadow-md transition-all duration-300"
          style={{ 
            left: sidebarState === 'expanded' ? '16rem' : '3rem',
            top: '3rem' // Adjust for header height
          }}
        >
          <div className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 flex-1">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar cliente por ID o nombre..."
                  value={clienteId}
                  onChange={(e) => setClienteId(e.target.value)}
                  className="flex-1 max-w-md"
                  onKeyPress={(e) => e.key === 'Enter' && buscarClientePorId()}
                />
                <Button onClick={buscarClientePorId} size="sm">
                  Buscar
                </Button>
              </div>
              
              {clienteEncontrado && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {clienteEncontrado.nombre}
                  </Badge>
                  <Button 
                    onClick={() => openAlarmModal(clienteEncontrado)}
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Siren className="h-4 w-4 mr-1" />
                    Generar Alarma
                  </Button>
                </div>
              )}
              
              {clienteNoEncontrado && (
                <Badge variant="destructive" className="text-xs">
                  Cliente no encontrado
                </Badge>
              )}
            </div>
          </div>
        </div>
      )}
      
      <div className="space-y-6 p-4 transition-optimized" style={{ paddingTop: showQuickBar ? '70px' : '0' }}>
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Phone className="h-8 w-8 text-primary" />
          Monitoreo de Alarmas - Operador
        </h1>
        <p className="text-muted-foreground">
          Panel de control para: {user?.full_name}
        </p>
      </div>

      {/* Botón de cancelar alarma (activo por 5 minutos) */}
      {canCancel && alarmaGenerada && (
        <Card className="bg-red-50 border-red-200">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Alarma Generada - Opción de Cancelar
            </CardTitle>
            <CardDescription className="text-red-700">
              Puedes cancelar esta alarma en los próximos {formatTime(tiempoRestante)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold text-red-800">
                  Alarma #{alarmaGenerada.id.slice(0, 8)}
                </p>
                <p className="text-sm text-red-700">
                  Cliente: {alarmaGenerada.clientes?.nombre || 'Cliente no disponible'}
                </p>
                <p className="text-sm text-red-700">
                  Tipo: {alarmaGenerada.tipo}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="flex items-center gap-1 text-red-700">
                    <Clock className="h-4 w-4" />
                    <span className="font-mono text-lg">{formatTime(tiempoRestante)}</span>
                  </div>
                  <p className="text-xs text-red-600">Tiempo restante</p>
                </div>
                <Button 
                  onClick={handleCancelAlarm}
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Cancelar Alarma
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Bar Optimizada */}
      <OptimizedQuickBar 
        showQuickBar={showQuickBar}
        onGenerateAlarm={() => setMostrarGenerarAlarma(true)}
      />

      {/* Sección Generar Nueva Alarma - Static version */}
      <div ref={mainSectionRef}>
        <Card className="shadow-lg border-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Siren className="h-6 w-6 text-primary" />
                  Generar Nueva Alarma
                </CardTitle>
                <CardDescription>
                  Busca clientes y genera alarmas directamente desde el panel de monitoreo
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMostrarGenerarAlarma(!mostrarGenerarAlarma)}
                className="h-8 w-8 p-0"
              >
                {mostrarGenerarAlarma ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </CardHeader>
          {mostrarGenerarAlarma && (
            <CardContent className="space-y-6">
          {/* Información importante */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-800">Información sobre tipos de alarma</CardTitle>
            </CardHeader>
            <CardContent className="text-blue-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <strong>Consumen Patrullas:</strong>
                  <ul className="list-disc list-inside mt-1">
                    <li>Alarma</li>
                    <li>Pánico</li>
                    <li>Fuego</li>
                  </ul>
                </div>
                <div>
                  <strong>Consumen Acompañamientos:</strong>
                  <ul className="list-disc list-inside mt-1">
                    <li>Acompañamiento</li>
                  </ul>
                </div>
                <div>
                  <strong>Consumen Revistas:</strong>
                  <ul className="list-disc list-inside mt-1">
                    <li>Revisión (Rondeo)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Búsqueda de cliente por ID */}
          <div className="space-y-4">
            <div>
              <Label>Búsqueda de Cliente</Label>
              <p className="text-sm text-muted-foreground">Ingresa el ID del cliente o nombre para buscar</p>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="ID del cliente o nombre"
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && buscarClientePorId()}
              />
              <Button onClick={buscarClientePorId}>
                <Search className="h-4 w-4" />
                Buscar
              </Button>
              <Button variant="outline" onClick={() => openAlarmModal()}>
                <Search className="h-4 w-4 mr-2" />
                Búsqueda Manual
              </Button>
            </div>

            {clienteEncontrado && (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-green-800">{clienteEncontrado.nombre}</h3>
                      <p className="text-sm text-green-700">📍 {clienteEncontrado.direccion}</p>
                      <p className="text-sm text-green-700">📞 {clienteEncontrado.telefono || 'Sin teléfono'}</p>
                      <p className="text-sm text-green-700">🏢 {clienteEncontrado.municipio || 'Sin municipio'}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => openAlarmModal(clienteEncontrado)}
                        className="flex items-center gap-2"
                      >
                        <Siren className="h-4 w-4" />
                        Generar Alarma
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => openCallModal(clienteEncontrado)}
                        className="flex items-center gap-2"
                      >
                        <Phone className="h-4 w-4" />
                        Generar Llamada
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {clienteNoEncontrado && (
              <Card className="bg-orange-50 border-orange-200">
                <CardContent className="pt-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-orange-800">Cliente no encontrado</p>
                      <p className="text-sm text-orange-700">¿Deseas crear un nuevo cliente?</p>
                    </div>
                    <Button 
                      onClick={() => setShowClienteForm(true)}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Crear Cliente
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Formulario para crear nuevo cliente */}
            {showClienteForm && (
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-blue-800">Crear Nuevo Cliente</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitCliente} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>ID Numérico (Opcional)</Label>
                        <Input
                          value={formData.id_numerico}
                          onChange={(e) => handleInputChange('id_numerico', e.target.value)}
                          placeholder="Ej: 12345"
                        />
                      </div>
                      <div>
                        <Label>Nombre *</Label>
                        <Input
                          value={formData.nombre}
                          onChange={(e) => handleInputChange('nombre', e.target.value)}
                          placeholder="Nombre del cliente"
                          required
                        />
                      </div>
                      <div>
                        <Label>Dirección *</Label>
                        <Input
                          value={formData.direccion}
                          onChange={(e) => handleInputChange('direccion', e.target.value)}
                          placeholder="Dirección completa"
                          required
                        />
                      </div>
                      <div>
                        <Label>Municipio</Label>
                        <Input
                          value={formData.municipio}
                          onChange={(e) => handleInputChange('municipio', e.target.value)}
                          placeholder="Municipio"
                        />
                      </div>
                      <div>
                        <Label>Ciudad</Label>
                        <Input
                          value={formData.ciudad}
                          onChange={(e) => handleInputChange('ciudad', e.target.value)}
                          placeholder="Ciudad"
                        />
                      </div>
                      <div>
                        <Label>Departamento</Label>
                        <Input
                          value={formData.departamento}
                          onChange={(e) => handleInputChange('departamento', e.target.value)}
                          placeholder="Departamento"
                        />
                      </div>
                      <div>
                        <Label>Contacto Alarma (Email)</Label>
                        <Input
                          value={formData.contacto_alarma}
                          onChange={(e) => handleInputChange('contacto_alarma', e.target.value)}
                          placeholder="contacto@ejemplo.com"
                          type="email"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit">
                        <Plus className="h-4 w-4 mr-2" />
                        Crear Cliente
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setShowClienteForm(false)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Sección de Minuta/Log de Operaciones */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Minuta de Operaciones
          </CardTitle>
          <CardDescription>
            Registro de eventos y actividades en tiempo real
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 mb-4">
            <Select value={tipoEntradaMinuta} onValueChange={(value: any) => setTipoEntradaMinuta(value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tipo de entrada" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="cambio_turno">Cambio de Turno</SelectItem>
                <SelectItem value="consigna">Consigna</SelectItem>
                <SelectItem value="incidente">Incidente</SelectItem>
                <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
              </SelectContent>
            </Select>
            <Input 
              placeholder="Escribir nueva entrada en la minuta..."
              className="flex-1"
              value={nuevaEntradaMinuta}
              onChange={(e) => setNuevaEntradaMinuta(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAgregarMinuta()}
            />
            <Button onClick={handleAgregarMinuta} disabled={!nuevaEntradaMinuta.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar
            </Button>
          </div>
          
          <div className="max-h-64 overflow-y-auto space-y-2">
            {minutaLoading ? (
              <div className="text-center py-4 text-muted-foreground">
                Cargando entradas...
              </div>
            ) : minutaEntradas.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No hay entradas en la minuta
              </div>
            ) : (
              minutaEntradas.map((entrada) => (
                <div key={entrada.id} className="border rounded-lg p-3 bg-muted/50">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{entrada.usuario_nombre}</span>
                      <Badge 
                        variant={entrada.tipo_entrada === 'incidente' ? 'destructive' : 
                                entrada.tipo_entrada === 'cambio_turno' ? 'default' : 
                                entrada.tipo_entrada === 'consigna' ? 'secondary' : 'outline'}
                        className="text-xs"
                      >
                        {entrada.tipo_entrada.replace('_', ' ').toUpperCase()}
                      </Badge>
                      {entrada.prioridad === 'alta' && (
                        <Badge variant="destructive" className="text-xs">
                          ALTA
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(entrada.created_at), "HH:mm:ss")}
                    </span>
                  </div>
                  <p className="text-sm">{entrada.contenido}</p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas del operador */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alarmas Activas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {alarmasActivas.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Requieren atención inmediata
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resueltas Hoy</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {alarmasResueltas.filter(a => 
                new Date(a.resolved_at || a.created_at).toDateString() === new Date().toDateString()
              ).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Alarmas resueltas hoy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Canceladas Hoy</CardTitle>
            <UserCheck className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {fuenteAlarmas.filter(a => 
                a.estado === 'cancelada' && 
                new Date(a.created_at).toDateString() === new Date().toDateString()
              ).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Alarmas canceladas hoy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Proceso</CardTitle>
            <Car className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {alarmasEnProceso.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Servicios en desarrollo
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alarmas activas */}
      <Card>
        <CardHeader>
          <CardTitle>Alarmas Activas</CardTitle>
          <CardDescription>
            Alarmas que requieren atención inmediata
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingAlarmasVista ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-muted rounded"></div>
              ))}
            </div>
          ) : alarmasActivas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p>No tienes alarmas activas en este momento</p>
              <p className="text-sm">¡Excelente trabajo!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {alarmasActivas.map((alarma) => (
                <AlarmaActivaCard key={alarma.id} alarma={alarma} onCancelar={cancelAlarma} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Servicios en Proceso */}
      <Card>
        <CardHeader>
          <CardTitle>Servicios en Proceso</CardTitle>
          <CardDescription>
            Servicios asignados y en desarrollo con seguimiento de tiempos total y tiempo hasta llegada del supervisor
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingEnhanced ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-muted rounded"></div>
              ))}
            </div>
          ) : alarmasEnProceso.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Car className="h-12 w-12 mx-auto mb-4 text-blue-500" />
              <p>No hay servicios en proceso en este momento</p>
              <p className="text-sm">Los servicios asignados aparecerán aquí</p>
            </div>
          ) : (
            <div className="space-y-4">
              {alarmasEnProceso.map((alarma) => (
                <CronometroAlarma
                  key={alarma.id}
                  alarmaId={alarma.id}
                  tipo={alarma.tipo}
                  cliente={alarma.clientes?.nombre || 'Cliente no especificado'}
                  direccion={alarma.direccion}
                  municipio={alarma.municipio}
                  telefono={alarma.clientes?.telefono}
                  prioridad={alarma.prioridad}
                  estado={alarma.estado as any}
                  created_at={alarma.created_at}
                  attended_at={alarma.attended_at || undefined}
                  tiempo_toma_despachador={alarma.tiempo_toma_despachador || undefined}
                  tiempo_asignacion_supervisor={alarma.tiempo_asignacion_supervisor || undefined}
                  tiempo_aceptacion_supervisor={alarma.tiempo_aceptacion_supervisor || undefined}
                  tiempo_primera_lectura_qr={alarma.tiempo_primera_lectura_qr || undefined}
                  tiempo_segunda_lectura_qr={alarma.tiempo_segunda_lectura_qr || undefined}
                  supervisor={alarma.supervisor || undefined}
                  supervisor_id={alarma.supervisor_id || undefined}
                  patrulla_asignada={alarma.patrulla_asignada || undefined}
                  resolved_at={alarma.resolved_at || undefined}
                  showCancelButton={false}
                  onSupervisorAccept={handleSupervisorAccept}
                  onSupervisorArrive={handleSupervisorArrive}
                  onSupervisorLeave={handleSupervisorLeave}
                  userRole={user?.role}
                  currentUserId={user?.id}
                  currentUserName={user?.email}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Generar Alarma */}
      <Dialog open={isAlarmModalOpen} onOpenChange={setIsAlarmModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generar Alarma</DialogTitle>
            <DialogDescription>
              Selecciona un cliente y el tipo de alarma a generar
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {!selectedClienteForAlarm && (
              <>
                <div>
                  <Label>Buscar Cliente</Label>
                  <Input
                    placeholder="Buscar por nombre o email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="max-h-60 overflow-y-auto">
                  {filteredClientes.map((cliente) => (
                    <Card 
                      key={cliente.id} 
                      className="mb-2 cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedClienteForAlarm(cliente)}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-semibold">{cliente.nombre}</h4>
                            <p className="text-sm text-muted-foreground">{cliente.direccion}</p>
                            <p className="text-sm text-muted-foreground">{cliente.telefono}</p>
                          </div>
                          <Button size="sm">Seleccionar</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}

            {selectedClienteForAlarm && (
              <div className="space-y-4">
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-3 items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-green-800">Cliente Seleccionado</h3>
                        <p className="text-green-700">{selectedClienteForAlarm.nombre}</p>
                        <p className="text-sm text-green-600">{selectedClienteForAlarm.direccion}</p>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => setSelectedClienteForAlarm(null)}
                          className="mt-2"
                        >
                          Cambiar Cliente
                        </Button>
                      </div>
                      <div className="w-full md:max-w-sm">
                        <ClienteServiciosDisplay 
                          key={selectedClienteForAlarm.id}
                          clienteId={selectedClienteForAlarm.id}
                          clienteNombre={selectedClienteForAlarm.nombre}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div>
                  <Label>Tipo de Alarma</Label>
                  <Select value={selectedAlarmType} onValueChange={setSelectedAlarmType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el tipo de alarma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Alarma">🚨 Alarma</SelectItem>
                      <SelectItem value="Pánico">😰 Pánico</SelectItem>
                      <SelectItem value="Fuego">🔥 Fuego</SelectItem>
                      <SelectItem value="Acompañamiento">👥 Acompañamiento</SelectItem>
                      <SelectItem value="Revisión">🔍 Revisión (Rondeo)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Campos de zona para alarmas tipo Fuego y Alarma */}
                {mostrarCamposZona && (
                  <Card className="bg-amber-50 border-amber-200">
                    <CardHeader>
                      <CardTitle className="text-amber-800 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Información de Zona
                      </CardTitle>
                      <CardDescription className="text-amber-700">
                        Complete la información específica de la zona para este tipo de alarma
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Número de Zona *</Label>
                          <Input
                            value={numeroZona}
                            onChange={(e) => setNumeroZona(e.target.value)}
                            placeholder="Ej: Z001, Z002..."
                            required
                          />
                        </div>
                        <div>
                          <Label>Nombre de Zona *</Label>
                          <Input
                            value={nombreZona}
                            onChange={(e) => setNombreZona(e.target.value)}
                            placeholder="Ej: Zona Principal, Bodega..."
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Tipo de Sensor *</Label>
                        <Select value={tipoSensor} onValueChange={setTipoSensor}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona el tipo de sensor" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="magnetico">🧲 Magnético</SelectItem>
                            <SelectItem value="infrarrojo">📡 Infrarrojo</SelectItem>
                            <SelectItem value="movimiento">🏃 Movimiento</SelectItem>
                            <SelectItem value="humo">💨 Humo</SelectItem>
                            <SelectItem value="temperatura">🌡️ Temperatura</SelectItem>
                            <SelectItem value="gas">⛽ Gas</SelectItem>
                            <SelectItem value="vibracion">📳 Vibración</SelectItem>
                            <SelectItem value="panico">🚨 Pánico</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {selectedAlarmType && (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-blue-600" />
                        <span className="text-blue-800 font-medium">
                          {getAlarmTypeInfo(selectedAlarmType).description}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex gap-2">
                  <Button 
                    onClick={generateAlarm}
                    disabled={!selectedAlarmType}
                    className="flex items-center gap-2"
                  >
                    <Siren className="h-4 w-4" />
                    Generar Alarma
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsAlarmModalOpen(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Generar Llamada */}
      <Dialog open={isCallModalOpen} onOpenChange={setIsCallModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Llamada</DialogTitle>
            <DialogDescription>
              Registra una llamada realizada al cliente {selectedClienteForCall?.nombre}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Nombre del Contacto *</Label>
              <Input
                value={callFormData.contacto_nombre}
                onChange={(e) => setCallFormData(prev => ({ ...prev, contacto_nombre: e.target.value }))}
                placeholder="Nombre de la persona contactada"
                required
              />
            </div>

            <div>
              <Label>Número de Teléfono *</Label>
              <Input
                value={callFormData.numero_telefono}
                onChange={(e) => setCallFormData(prev => ({ ...prev, numero_telefono: e.target.value }))}
                placeholder="Número telefónico"
                required
              />
            </div>

            <div>
              <Label>Tipo de Llamada</Label>
              <Select 
                value={callFormData.tipo_llamada} 
                onValueChange={(value: 'celular' | 'smarturban') => 
                  setCallFormData(prev => ({ ...prev, tipo_llamada: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="celular">📱 Celular</SelectItem>
                  <SelectItem value="smarturban">📞 SmartUrban</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Estado de la Llamada</Label>
              <Select 
                value={callFormData.estado} 
                onValueChange={(value: 'completada' | 'no_contesto' | 'ocupado' | 'fuera_servicio') => 
                  setCallFormData(prev => ({ ...prev, estado: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completada">✅ Completada</SelectItem>
                  <SelectItem value="no_contesto">❌ No Contestó</SelectItem>
                  <SelectItem value="ocupado">📞 Ocupado</SelectItem>
                  <SelectItem value="fuera_servicio">🚫 Fuera de Servicio</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Motivo</Label>
              <Input
                value={callFormData.motivo}
                onChange={(e) => setCallFormData(prev => ({ ...prev, motivo: e.target.value }))}
                placeholder="Motivo de la llamada"
              />
            </div>

            <div>
              <Label>Observaciones</Label>
              <Textarea
                value={callFormData.observaciones}
                onChange={(e) => setCallFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                placeholder="Observaciones adicionales"
                rows={3}
              />
            </div>

            <div>
              <Label>Duración (segundos)</Label>
              <Input
                type="number"
                value={callFormData.duracion_segundos}
                onChange={(e) => setCallFormData(prev => ({ ...prev, duracion_segundos: parseInt(e.target.value) || 0 }))}
                placeholder="0"
                min="0"
              />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleCallSubmit}
                className="flex items-center gap-2"
              >
                <Phone className="h-4 w-4" />
                Registrar Llamada
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsCallModalOpen(false)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      </div>
    </OperationalThemeWrapper>
  );
};

export default CentralAlarmasOperador;
