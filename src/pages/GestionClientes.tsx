import { useState } from "react";
import { OperationalCard as Card, OperationalCardContent as CardContent, OperationalCardDescription as CardDescription, OperationalCardHeader as CardHeader, OperationalCardTitle as CardTitle } from "@/components/ui/operational-card";
import { OperationalThemeWrapper } from "@/components/layout/OperationalThemeWrapper";
import { OperationalButton as Button } from "@/components/ui/operational-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, Search, Edit, Trash2, Building2, QrCode, MapPin } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useSupabaseClientes } from "@/hooks/useSupabaseClientes";
import { capitalizeText, capitalizeWords } from "@/lib/utils";
import { QRReportGenerator } from "@/components/QRReportGenerator";
import QRCode from "qrcode";

const clienteSchema = z.object({
  nombre: z.string().min(2, "El nombre es obligatorio"),
  numero_cuenta: z.string().optional(),
  direccion: z.string().min(5, "La dirección es obligatoria"),
  municipio: z.string().min(2, "El municipio es obligatorio"),
  latitud: z.string().optional().refine((val) => {
    if (!val || val === "") return true;
    const num = parseFloat(val);
    return !isNaN(num) && num >= -90 && num <= 90;
  }, "La latitud debe estar entre -90 y 90"),
  longitud: z.string().optional().refine((val) => {
    if (!val || val === "") return true;
    const num = parseFloat(val);
    return !isNaN(num) && num >= -180 && num <= 180;
  }, "La longitud debe estar entre -180 y 180"),
  telefono: z.string().optional(),
  email: z.string().optional().refine((val) => {
    if (!val || val === "") return true;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(val);
  }, "Formato de email inválido"),
  tipo_servicio: z.string().min(1, "El tipo de servicio es obligatorio"),
  observaciones: z.string().optional()
});

type ClienteFormData = z.infer<typeof clienteSchema>;

const GestionClientes = () => {
  const { clientes, loading, error, addCliente, updateCliente, deleteCliente } = useSupabaseClientes();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<any>(null);
  const [showQR, setShowQR] = useState<any>(null);
  const [qrDataURL, setQrDataURL] = useState<string>("");
  const [showQRReport, setShowQRReport] = useState(false);
  const { toast } = useToast();

  const form = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      nombre: "",
      numero_cuenta: "",
      direccion: "",
      municipio: "",
      latitud: "",
      longitud: "",
      telefono: "",
      email: "",
      tipo_servicio: "",
      observaciones: ""
    }
  });

  const filteredClientes = clientes.filter(cliente =>
    cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.direccion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.municipio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.numero_cuenta?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const generateQRCode = async (cliente: any) => {
    try {
      const qrData = JSON.stringify({
        id: cliente.numero_cuenta || cliente.id,
        nombre: cliente.nombre,
        direccion: cliente.direccion,
        coordenadas: {
          lat: cliente.latitud || 0,
          lng: cliente.longitud || 0
        }
      });
      
      const qrCodeDataURL = await QRCode.toDataURL(qrData, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      setQrDataURL(qrCodeDataURL);
      setShowQR(cliente);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo generar el código QR",
        variant: "destructive"
      });
    }
  };

  const onSubmit = async (data: ClienteFormData) => {
    try {
      const clienteData = {
        ...data,
        nombre: capitalizeWords(data.nombre),
        direccion: capitalizeText(data.direccion),
        municipio: capitalizeWords(data.municipio),
        numero_cuenta: data.numero_cuenta?.toUpperCase(),
        observaciones: data.observaciones ? capitalizeText(data.observaciones) : undefined,
        latitud: data.latitud ? parseFloat(data.latitud) : null,
        longitud: data.longitud ? parseFloat(data.longitud) : null,
        estado: 'activo'
      };

      if (editingCliente) {
        await updateCliente(editingCliente.id, clienteData);
        toast({
          title: "Cliente actualizado",
          description: "Los datos del cliente se han actualizado correctamente",
        });
      } else {
        await addCliente(clienteData);
        toast({
          title: "Cliente registrado",
          description: "El cliente se ha registrado correctamente",
        });
      }

      form.reset();
      setIsModalOpen(false);
      setEditingCliente(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar el cliente",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (cliente: any) => {
    setEditingCliente(cliente);
    form.reset({
      nombre: cliente.nombre || "",
      numero_cuenta: cliente.numero_cuenta || "",
      direccion: cliente.direccion || "",
      municipio: cliente.municipio || "",
      latitud: cliente.latitud?.toString() || "",
      longitud: cliente.longitud?.toString() || "",
      telefono: cliente.telefono || "",
      email: cliente.email || "",
      tipo_servicio: cliente.tipo_servicio || "",
      observaciones: cliente.observaciones || ""
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (clienteId: string) => {
    try {
      await deleteCliente(clienteId);
      toast({
        title: "Cliente eliminado",
        description: "El cliente se ha eliminado correctamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el cliente",
        variant: "destructive"
      });
    }
  };

  const openNewClientModal = () => {
    setEditingCliente(null);
    form.reset();
    setIsModalOpen(true);
  };

  if (loading) return <div className="p-6">Cargando...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;

  return (
    <OperationalThemeWrapper>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Users className="h-8 w-8 text-primary" />
              Gestión de Clientes
            </h1>
            <p className="text-muted-foreground">Administra los clientes del sistema de seguridad</p>
          </div>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => setShowQRReport(true)}
              disabled={filteredClientes.length === 0}
              className="flex items-center gap-2"
            >
              <QrCode className="h-4 w-4" />
              Generar QRs
            </Button>
            
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button onClick={openNewClientModal} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Registrar Nuevo Cliente
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingCliente ? "Editar Cliente" : "Registrar Nuevo Cliente"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingCliente 
                      ? "Modifica la información del cliente"
                      : "Complete los datos del nuevo cliente"
                    }
                  </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="nombre"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Nombre del cliente"
                                {...field}
                                onChange={(e) => field.onChange(capitalizeWords(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="numero_cuenta"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número de Cuenta</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Número de cuenta"
                                {...field}
                                onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="direccion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dirección *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Dirección completa"
                              {...field}
                              onChange={(e) => field.onChange(capitalizeText(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="municipio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Municipio *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Municipio"
                                {...field}
                                onChange={(e) => field.onChange(capitalizeWords(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="tipo_servicio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de Servicio *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar servicio" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Seguridad Residencial">Seguridad Residencial</SelectItem>
                                <SelectItem value="Seguridad Empresarial">Seguridad Empresarial</SelectItem>
                                <SelectItem value="Seguridad Industrial">Seguridad Industrial</SelectItem>
                                <SelectItem value="Seguridad Comercial">Seguridad Comercial</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="telefono"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Teléfono</FormLabel>
                            <FormControl>
                              <Input placeholder="Número de teléfono" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input placeholder="correo@ejemplo.com" type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="latitud"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Latitud</FormLabel>
                            <FormControl>
                              <Input placeholder="Ej: 10.391049" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="longitud"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Longitud</FormLabel>
                            <FormControl>
                              <Input placeholder="Ej: -75.479426" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="observaciones"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Observaciones</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Observaciones adicionales..."
                              {...field}
                              onChange={(e) => field.onChange(capitalizeText(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-3 pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsModalOpen(false)}
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" className="flex-1">
                        {editingCliente ? "Actualizar Cliente" : "Registrar Cliente"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Estadísticas */}
        <Card>
          <CardHeader>
            <CardTitle>Resumen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{clientes.length}</div>
                <div className="text-sm text-muted-foreground">Total Clientes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {clientes.filter(c => c.estado === 'activo').length}
                </div>
                <div className="text-sm text-muted-foreground">Activos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {clientes.filter(c => c.estado === 'inactivo').length}
                </div>
                <div className="text-sm text-muted-foreground">Inactivos</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Búsqueda */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Buscar Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Buscar por nombre, dirección, municipio o número de cuenta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </CardContent>
        </Card>

        {/* Lista de Clientes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClientes.map((cliente) => (
            <Card key={cliente.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{cliente.nombre}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <Building2 className="h-4 w-4" />
                      Cuenta: {cliente.numero_cuenta || 'Sin asignar'}
                    </CardDescription>
                  </div>
                  <Badge variant={cliente.estado === 'activo' ? 'default' : 'secondary'}>
                    {cliente.estado}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="text-sm">
                    <div>{cliente.direccion}</div>
                    <div className="text-muted-foreground">{cliente.municipio}</div>
                  </div>
                </div>
                
                {cliente.telefono && (
                  <div className="text-sm">
                    <strong>Tel:</strong> {cliente.telefono}
                  </div>
                )}
                
                {cliente.email && (
                  <div className="text-sm">
                    <strong>Email:</strong> {cliente.email}
                  </div>
                )}
                
                <div className="text-sm">
                  <strong>Servicio:</strong> {cliente.tipo_servicio}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => generateQRCode(cliente)}
                    className="flex-1"
                  >
                    <QrCode className="h-4 w-4 mr-1" />
                    QR
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(cliente)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. Se eliminará permanentemente 
                          la información del cliente.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDelete(cliente.id)}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredClientes.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No se encontraron clientes</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal QR */}
      <Dialog open={!!showQR} onOpenChange={() => setShowQR(null)}>
        <DialogContent className="max-w-md">
          {showQR && (
            <div className="text-center space-y-4">
              <DialogHeader>
                <DialogTitle>Código QR</DialogTitle>
                <DialogDescription>
                  Código QR para {showQR.nombre}
                </DialogDescription>
              </DialogHeader>
              
              <div className="flex justify-center">
                <img src={qrDataURL} alt="Código QR" className="border rounded" />
              </div>
              
              <div className="text-sm text-muted-foreground">
                <div><strong>Cliente:</strong> {showQR.nombre}</div>
                <div><strong>Cuenta:</strong> {showQR.numero_cuenta || 'Sin asignar'}</div>
                <div><strong>Dirección:</strong> {showQR.direccion}</div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={() => {
                    const link = document.createElement('a');
                    link.download = `qr-${showQR.nombre.replace(/\s+/g, '-')}.png`;
                    link.href = qrDataURL;
                    link.click();
                  }}
                  className="flex-1"
                >
                  Descargar
                </Button>
                <Button 
                  onClick={() => setShowQR(null)} 
                  size="sm" 
                  className="flex-1"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* QR Report Generator */}
      <QRReportGenerator
        isOpen={showQRReport}
        onClose={() => setShowQRReport(false)}
        clientes={clientes}
      />
    </OperationalThemeWrapper>
  );
};

export default GestionClientes;