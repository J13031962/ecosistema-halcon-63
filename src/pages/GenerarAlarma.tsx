import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Siren, Search, Building2, AlertTriangle, Flame, Shield, Eye, UserCheck, Plus, MapPin, X, Clock } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSupabaseClientes } from "@/hooks/useSupabaseClientes";
import { useSupabaseAlarmas } from "@/hooks/useSupabaseAlarmas";
import { useSupabaseLlamadas } from "@/hooks/useSupabaseLlamadas";
import { useAuthConsolidatedContext } from "@/contexts/AuthContextConsolidated";
import { ClienteServiciosDisplay } from "@/components/alarmas/ClienteServiciosDisplay";

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

const GenerarAlarma = () => {
  const { toast } = useToast();
  const { clientes, loading: clientesLoading, addCliente } = useSupabaseClientes();
  const { addAlarma, cancelAlarma } = useSupabaseAlarmas();
  const { addLlamada } = useSupabaseLlamadas();
  const { user, isAuthenticated } = useAuthConsolidatedContext();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [clienteEncontrado, setClienteEncontrado] = useState<any>(null);
  const [clienteNoEncontrado, setClienteNoEncontrado] = useState(false);
  const [isAlarmModalOpen, setIsAlarmModalOpen] = useState(false);
  const [selectedClienteForAlarm, setSelectedClienteForAlarm] = useState<any>(null);
  const [selectedAlarmType, setSelectedAlarmType] = useState<string>("");
  const [showClienteForm, setShowClienteForm] = useState(false);
  
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
      console.error('Datos faltantes:', { selectedClienteForAlarm, selectedAlarmType });
      toast({
        title: "Error",
        description: "Debe seleccionar un cliente y tipo de alarma",
        variant: "destructive"
      });
      return;
    }

    console.log('Generando alarma con datos:', {
      cliente_id: selectedClienteForAlarm.id,
      tipo: selectedAlarmType,
      prioridad: 'alta',
      direccion: selectedClienteForAlarm.direccion,
      municipio: selectedClienteForAlarm.municipio,
      descripcion: `Alarma generada para ${selectedClienteForAlarm.nombre}`
    });

    try {
      const nuevaAlarma = await addAlarma({
        cliente_id: selectedClienteForAlarm.id,
        tipo: selectedAlarmType,
        prioridad: 'alta',
        direccion: selectedClienteForAlarm.direccion,
        municipio: selectedClienteForAlarm.municipio,
        descripcion: `Alarma generada para ${selectedClienteForAlarm.nombre}`
      });
      
      console.log('Alarma creada exitosamente:', nuevaAlarma);
      
      if (nuevaAlarma) {
        // Activar el botón de cancelar por 5 minutos
        setAlarmaGenerada(nuevaAlarma);
        setCanCancel(true);
        setTiempoRestante(300); // 5 minutos en segundos
        
        console.log('Iniciando timer de cancelación por 5 minutos');
        
        // Iniciar countdown
        timerRef.current = setInterval(() => {
          setTiempoRestante(prev => {
            if (prev <= 1) {
              console.log('Timer expirado, deshabilitando cancelación');
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
      // Limpiar búsqueda
      setClienteId("");
      setClienteEncontrado(null);
      setClienteNoEncontrado(false);
    } catch (error) {
      console.error('Error completo al generar alarma:', error);
      toast({
        title: "Error",
        description: `Error al generar alarma: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        variant: "destructive"
      });
    }
  };

  const handleCancelAlarm = async () => {
    if (!alarmaGenerada) {
      console.error('No hay alarma para cancelar');
      return;
    }

    console.log('Cancelando alarma:', alarmaGenerada.id);

    try {
      await cancelAlarma(alarmaGenerada.id);
      
      console.log('Alarma cancelada exitosamente');
      
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

  // Solo mostrar mensaje si realmente no hay usuario (para evitar bloquear operadores legacy)
  if (!isAuthenticated && !user) {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardHeader>
          <CardTitle className="text-center text-destructive">Acceso Restringido</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            Debes estar autenticado para generar alarmas. Por favor, inicia sesión.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Siren className="h-8 w-8 text-primary" />
            Generar Alarma
          </h1>
          <p className="text-muted-foreground">Genera alarmas para clientes registrados en el sistema</p>
        </div>
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
      <Card>
        <CardHeader>
          <CardTitle>Búsqueda de Cliente</CardTitle>
          <CardDescription>Ingresa el ID del cliente para generar una alarma</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
          </div>

          {clienteEncontrado && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-green-800">{clienteEncontrado.nombre}</h3>
                    <p className="text-sm text-green-700">📍 {clienteEncontrado.direccion}</p>
                    <p className="text-sm text-green-700">🏙️ {clienteEncontrado.municipio}</p>
                    <p className="text-sm text-green-700">📄 Cuenta: {clienteEncontrado.numero_cuenta}</p>
                  </div>
                  <div className="min-w-48">
                    <ClienteServiciosDisplay 
                      clienteId={clienteEncontrado.id}
                      clienteNombre={clienteEncontrado.nombre}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button 
                      onClick={() => openAlarmModal(clienteEncontrado)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Siren className="h-4 w-4 mr-2" />
                      Generar Alarma
                    </Button>
                    <Button 
                      onClick={() => openCallModal(clienteEncontrado)}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Generar Llamada
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {clienteNoEncontrado && (
            <Card className="bg-red-50 border-red-200">
              <CardContent className="pt-4">
                <div className="text-center">
                  <h3 className="font-semibold text-red-800 mb-2">Cliente no encontrado</h3>
                  <p className="text-sm text-red-700 mb-4">No se encontró un cliente con el ID ingresado</p>
                  <Button 
                    onClick={() => setShowClienteForm(true)}
                    variant="outline"
                    className="border-red-300 text-red-700 hover:bg-red-50"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Nuevo Cliente
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {showClienteForm && (
            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-800">Crear Nuevo Cliente</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitCliente} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="id_numerico">ID Numérico</Label>
                      <Input
                        id="id_numerico"
                        value={formData.id_numerico}
                        onChange={(e) => handleInputChange('id_numerico', e.target.value)}
                        placeholder="Ej: 001, 002, etc."
                      />
                    </div>

                    <div>
                      <Label htmlFor="nombre">Razón Social *</Label>
                      <Input
                        id="nombre"
                        value={formData.nombre}
                        onChange={(e) => handleInputChange('nombre', e.target.value)}
                        placeholder="Nombre del cliente"
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="direccion">Dirección *</Label>
                      <Input
                        id="direccion"
                        value={formData.direccion}
                        onChange={(e) => handleInputChange('direccion', e.target.value)}
                        placeholder="Dirección completa"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="municipio">Municipio</Label>
                      <Input
                        id="municipio"
                        value={formData.municipio}
                        onChange={(e) => handleInputChange('municipio', e.target.value)}
                        placeholder="Municipio"
                      />
                    </div>

                    <div>
                      <Label htmlFor="ciudad">Ciudad</Label>
                      <Input
                        id="ciudad"
                        value={formData.ciudad}
                        onChange={(e) => handleInputChange('ciudad', e.target.value)}
                        placeholder="Ciudad"
                      />
                    </div>

                    <div>
                      <Label htmlFor="departamento">Departamento</Label>
                      <Input
                        id="departamento"
                        value={formData.departamento}
                        onChange={(e) => handleInputChange('departamento', e.target.value)}
                        placeholder="Departamento"
                      />
                    </div>

                    <div>
                      <Label htmlFor="contacto_alarma">Contacto Alarma</Label>
                      <Input
                        id="contacto_alarma"
                        value={formData.contacto_alarma}
                        onChange={(e) => handleInputChange('contacto_alarma', e.target.value)}
                        placeholder="Email o teléfono"
                      />
                    </div>

                    <div>
                      <Label htmlFor="latitud">Latitud</Label>
                      <Input
                        id="latitud"
                        value={formData.latitud}
                        onChange={(e) => handleInputChange('latitud', e.target.value)}
                        placeholder="Ej: 4.6097"
                        type="number"
                        step="any"
                      />
                    </div>

                    <div>
                      <Label htmlFor="longitud">Longitud</Label>
                      <Input
                        id="longitud"
                        value={formData.longitud}
                        onChange={(e) => handleInputChange('longitud', e.target.value)}
                        placeholder="Ej: -74.0817"
                        type="number"
                        step="any"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowClienteForm(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit">
                      Guardar Cliente
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Botón principal para generar alarma (modo alternativo) */}
      <Card>
        <CardHeader>
          <CardTitle>Generar Nueva Alarma (Búsqueda Manual)</CardTitle>
          <CardDescription>Busca y selecciona un cliente de la lista para generar una alarma</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Button 
              size="lg" 
              onClick={() => setIsAlarmModalOpen(true)}
              className="flex items-center gap-2 px-8 py-4 text-lg"
              variant="outline"
            >
              <Siren className="h-6 w-6" />
              Buscar en Lista de Clientes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Búsqueda y Selección de Cliente */}
      <Dialog open={isAlarmModalOpen} onOpenChange={setIsAlarmModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generar Nueva Alarma</DialogTitle>
            <DialogDescription>
              {!selectedClienteForAlarm ? "Busca y selecciona un cliente" : `Selecciona el tipo de alarma para ${selectedClienteForAlarm.nombre}`}
            </DialogDescription>
          </DialogHeader>
          
          {!selectedClienteForAlarm ? (
            // Pantalla de búsqueda de cliente
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="search-name">Nombre o Razón Social</Label>
                  <Input
                    id="search-name"
                    placeholder="Ej: Residencial Los Pinos"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="search-email">Email</Label>
                  <Input
                    id="search-email"
                    placeholder="Ej: cliente@empresa.com"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="max-h-60 overflow-y-auto border rounded-lg">
                {clientesLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Cargando clientes...</p>
                  </div>
                ) : filteredClientes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p>No se encontraron clientes</p>
                    <p className="text-sm">Intenta con otros términos de búsqueda</p>
                  </div>
                ) : (
                  <div className="space-y-2 p-4">
                    {filteredClientes.map((cliente) => (
                      <div 
                        key={cliente.id} 
                        className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => setSelectedClienteForAlarm(cliente)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">{cliente.nombre}</p>
                            <p className="text-sm text-muted-foreground">📍 {cliente.direccion}</p>
                            <p className="text-sm text-muted-foreground">🏙️ {cliente.municipio}</p>
                            {cliente.telefono && (
                              <p className="text-sm text-muted-foreground">📞 {cliente.telefono}</p>
                            )}
                          </div>
                          <Badge variant="outline">{cliente.estado}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Pantalla de selección de tipo de alarma
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Cliente Seleccionado</h4>
                <p className="text-sm"><strong>{selectedClienteForAlarm.nombre}</strong></p>
                <p className="text-sm">📍 {selectedClienteForAlarm.direccion}</p>
                <p className="text-sm">🏙️ {selectedClienteForAlarm.municipio}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => setSelectedClienteForAlarm(null)}
                >
                  Cambiar Cliente
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <Label htmlFor="alarm-type">Tipo de Alarma</Label>
                <Select value={selectedAlarmType} onValueChange={setSelectedAlarmType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un tipo de alarma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Alarma">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        Alarma
                      </div>
                    </SelectItem>
                    <SelectItem value="Pánico">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-purple-500" />
                        Pánico
                      </div>
                    </SelectItem>
                    <SelectItem value="Revista Rutina">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-blue-500" />
                        Revista Rutina
                      </div>
                    </SelectItem>
                    <SelectItem value="Revista Paga">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-cyan-500" />
                        Revista Paga
                      </div>
                    </SelectItem>
                    <SelectItem value="Fuego">
                      <div className="flex items-center gap-2">
                        <Flame className="h-4 w-4 text-red-500" />
                        Fuego
                      </div>
                    </SelectItem>
                    <SelectItem value="Acompañamiento">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-green-500" />
                        Acompañamiento
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedAlarmType && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Recurso:</strong> {getAlarmTypeInfo(selectedAlarmType).description}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-4 pt-4">
            {selectedClienteForAlarm && selectedAlarmType ? (
              <Button 
                onClick={generateAlarm} 
                className="flex-1"
              >
                Generar Alarma
              </Button>
            ) : null}
            <Button 
              variant="outline" 
              onClick={() => {
                setIsAlarmModalOpen(false);
                setSelectedClienteForAlarm(null);
                setSelectedAlarmType("");
              }}
            >
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal para generar llamada */}
      <Dialog open={isCallModalOpen} onOpenChange={setIsCallModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-purple-800">
              <Eye className="h-5 w-5" />
              Generar Llamada
            </DialogTitle>
            <DialogDescription>
              Registra una llamada realizada al cliente
            </DialogDescription>
          </DialogHeader>

          {selectedClienteForCall && (
            <div className="space-y-4">
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <h4 className="font-semibold text-purple-800 mb-1">Cliente</h4>
                <p className="text-sm text-purple-700">{selectedClienteForCall.nombre}</p>
                <p className="text-xs text-purple-600">📍 {selectedClienteForCall.direccion}</p>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="contacto_nombre">Nombre del Contacto *</Label>
                  <Input
                    id="contacto_nombre"
                    value={callFormData.contacto_nombre}
                    onChange={(e) => setCallFormData(prev => ({ ...prev, contacto_nombre: e.target.value }))}
                    placeholder="Nombre de la persona contactada"
                  />
                </div>

                <div>
                  <Label htmlFor="numero_telefono">Número de Teléfono *</Label>
                  <Input
                    id="numero_telefono"
                    value={callFormData.numero_telefono}
                    onChange={(e) => setCallFormData(prev => ({ ...prev, numero_telefono: e.target.value }))}
                    placeholder="Número de teléfono o SmartUrban"
                  />
                </div>

                <div>
                  <Label htmlFor="tipo_llamada">Tipo de Llamada</Label>
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
                  <Label htmlFor="estado">Estado de la Llamada</Label>
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
                      <SelectItem value="ocupado">🔄 Ocupado</SelectItem>
                      <SelectItem value="fuera_servicio">📵 Fuera de Servicio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="motivo">Motivo de la Llamada</Label>
                  <Input
                    id="motivo"
                    value={callFormData.motivo}
                    onChange={(e) => setCallFormData(prev => ({ ...prev, motivo: e.target.value }))}
                    placeholder="Motivo de la llamada"
                  />
                </div>

                <div>
                  <Label htmlFor="observaciones">Observaciones</Label>
                  <Textarea
                    id="observaciones"
                    value={callFormData.observaciones}
                    onChange={(e) => setCallFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                    placeholder="Observaciones adicionales"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="duracion">Duración (segundos)</Label>
                  <Input
                    id="duracion"
                    type="number"
                    value={callFormData.duracion_segundos}
                    onChange={(e) => setCallFormData(prev => ({ ...prev, duracion_segundos: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleCallSubmit}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  Registrar Llamada
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsCallModalOpen(false);
                    setSelectedClienteForCall(null);
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GenerarAlarma;