import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, Search, Edit, Trash2, Building2, QrCode, MapPin } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useSupabaseClientes } from "@/hooks/useSupabaseClientes";
import QRCode from "qrcode";

const clienteSchema = z.object({
  nombre: z.string().min(2, "El nombre es obligatorio"),
  direccion: z.string().min(5, "La dirección es obligatoria"),
  municipio: z.string().min(2, "El municipio es obligatorio"),
  latitud: z.string().optional(),
  longitud: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().optional().refine((val) => {
    if (!val || val === "") return true; // Permite email vacío
    // Validación más flexible que acepta cualquier dominio
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(val);
  }, "Formato de email inválido"),
  tipo_servicio: z.string().optional(),
  observaciones: z.string().optional()
});

type ClienteFormData = z.infer<typeof clienteSchema>;

const GestionClientes = () => {
  const { clientes, loading, addCliente, updateCliente, deleteCliente } = useSupabaseClientes();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<any>(null);
  const [showQR, setShowQR] = useState<any>(null);
  const [qrDataURL, setQrDataURL] = useState<string>("");
  const { toast } = useToast();

  const form = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      nombre: "",
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
    (cliente.email && cliente.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const generateQRCode = async (cliente: any) => {
    const qrData = {
      id_cliente: cliente.id,
      nombre: cliente.nombre,
      direccion: cliente.direccion,
      coordenadas: {
        latitud: cliente.latitud || "0",
        longitud: cliente.longitud || "0"
      }
    };
    
    try {
      const qrString = await QRCode.toDataURL(JSON.stringify(qrData), {
        width: 300,
        margin: 2
      });
      return qrString;
    } catch (error) {
      console.error('Error generating QR:', error);
      return null;
    }
  };

  const showClienteQR = async (cliente: any) => {
    const qrString = await generateQRCode(cliente);
    if (qrString) {
      setQrDataURL(qrString);
      setShowQR(cliente);
    } else {
      toast({
        title: "Error",
        description: "No se pudo generar el código QR",
        variant: "destructive"
      });
    }
  };

  const onSubmit = async (data: ClienteFormData) => {
    try {
      if (editingCliente) {
        await updateCliente(editingCliente.id, {
          ...data,
          latitud: data.latitud ? parseFloat(data.latitud) : null,
          longitud: data.longitud ? parseFloat(data.longitud) : null,
          estado: 'activo'
        });
      } else {
        const newClienteData = {
          nombre: data.nombre,
          direccion: data.direccion,
          telefono: data.telefono,
          email: data.email,
          municipio: data.municipio,
          latitud: data.latitud ? parseFloat(data.latitud) : null,
          longitud: data.longitud ? parseFloat(data.longitud) : null,
          tipo_servicio: data.tipo_servicio,
          observaciones: data.observaciones,
          estado: 'activo'
        };
        
        const result = await addCliente(newClienteData);
        
        if (result.success) {
          toast({
            title: "Cliente creado",
            description: "El cliente ha sido registrado exitosamente con código QR generado",
          });
        }
      }

      form.reset();
      setIsModalOpen(false);
      setEditingCliente(null);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleEdit = (cliente: any) => {
    setEditingCliente(cliente);
    form.reset({
      nombre: cliente.nombre,
      direccion: cliente.direccion,
      municipio: cliente.municipio,
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
    await deleteCliente(clienteId);
  };


  const openNewClientModal = () => {
    setEditingCliente(null);
    form.reset();
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            Gestión de Clientes
          </h1>
          <p className="text-muted-foreground">Administra los clientes del sistema de seguridad</p>
        </div>

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
                <FormField
                  control={form.control}
                  name="nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre o Razón Social *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre del cliente" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="telefono"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono</FormLabel>
                        <FormControl>
                          <Input placeholder="300 123 4567" {...field} />
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
                          <Input placeholder="cliente@empresa.com" {...field} />
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
                        <Input placeholder="Dirección completa" {...field} />
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
                          <Input placeholder="Municipio" {...field} />
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
                        <FormLabel>Tipo de Servicio</FormLabel>
                        <FormControl>
                          <Input placeholder="Tipo de servicio" {...field} />
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
                          <Input 
                            placeholder="Ej: 6.2442" 
                            type="number" 
                            step="any"
                            {...field} 
                          />
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
                          <Input 
                            placeholder="Ej: -75.5812" 
                            type="number" 
                            step="any"
                            {...field} 
                          />
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
                        <Input placeholder="Observaciones adicionales sobre el cliente" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-4 pt-4">
                  <Button type="submit" className="flex-1">
                    {editingCliente ? "Actualizar Cliente" : "Registrar Cliente"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Estadística Principal */}
      <div className="grid grid-cols-1 md:grid-cols-1 gap-4 max-w-sm">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium text-blue-800">Total de Clientes Registrados</CardTitle>
            <Building2 className="h-6 w-6 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-blue-700">{clientes.length}</div>
            <p className="text-sm text-blue-600 mt-1">Clientes activos en el sistema</p>
          </CardContent>
        </Card>
      </div>

      {/* Buscador */}
      <Card>
        <CardHeader>
          <CardTitle>Listado de Clientes</CardTitle>
          <CardDescription>Gestiona todos los clientes registrados en el sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-6">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o número de cuenta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="space-y-4">
            {filteredClientes.map((cliente) => (
              <div key={cliente.id} className="p-4 border rounded-lg">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                  <div className="lg:col-span-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Nombre</p>
                        <p className="font-semibold">{cliente.nombre}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Municipio</p>
                        <p className="font-semibold">{cliente.municipio}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Estado</p>
                        <Badge variant="outline">{cliente.estado}</Badge>
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm text-muted-foreground">Dirección</p>
                      <p className="text-sm">{cliente.direccion}</p>
                    </div>
                    {cliente.telefono && (
                      <div className="mt-2">
                        <p className="text-sm text-muted-foreground">Teléfono: {cliente.telefono}</p>
                      </div>
                    )}
                    {cliente.tipo_servicio && (
                      <div className="mt-2">
                        <Badge variant="secondary">
                          {cliente.tipo_servicio}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <div className="lg:col-span-4 flex flex-wrap gap-2 justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => showClienteQR(cliente)}
                      className="flex items-center gap-1"
                    >
                      <QrCode className="h-4 w-4" />
                      Ver QR
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(cliente)}
                      className="flex items-center gap-1"
                    >
                      <Edit className="h-4 w-4" />
                      Editar
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                          Eliminar
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. El cliente será eliminado permanentemente del sistema.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(cliente.id)}>
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredClientes.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>No se encontraron clientes</p>
              <p className="text-sm">Intenta con otros términos de búsqueda</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal QR Code */}
      <Dialog open={!!showQR} onOpenChange={() => setShowQR(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Código QR - {showQR?.nombre}
            </DialogTitle>
            <DialogDescription>
              Código QR para confirmar llegada del supervisor
            </DialogDescription>
          </DialogHeader>
          
          {qrDataURL && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <img 
                  src={qrDataURL} 
                  alt="Código QR del cliente" 
                  className="border rounded-lg"
                />
              </div>
              
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>ID Cliente: {showQR?.id}</span>
                </div>
                
                {showQR?.latitud && showQR?.longitud && (
                  <div className="text-sm text-muted-foreground">
                    Coordenadas: {showQR.latitud}, {showQR.longitud}
                  </div>
                )}
                
                <p className="text-sm text-muted-foreground">
                  El supervisor debe escanear este código para confirmar su llegada
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={() => window.print()} 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                >
                  Imprimir QR
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

    </div>
  );
};

export default GestionClientes;