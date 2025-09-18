import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Building2, Phone, Mail, MapPin, QrCode, Download } from 'lucide-react';
import { useSupabaseClientes } from '@/hooks/useSupabaseClientes';
import { capitalizeText, capitalizeWords } from '@/lib/utils';
import QRCode from 'qrcode';

const clienteSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  direccion: z.string().min(5, 'Ingrese una dirección válida'),
  telefono: z.string().optional(),
  email: z.string().email('Ingrese un email válido').optional(),
  municipio: z.string().min(2, 'Ingrese el municipio'),
  tipo_servicio: z.string().optional(),
  numero_cuenta: z.string().optional(),
  observaciones: z.string().optional(),
  latitud: z.string().min(1, 'Ingrese la latitud'),
  longitud: z.string().min(1, 'Ingrese la longitud'),
});

type ClienteFormData = z.infer<typeof clienteSchema>;

const IngresarClientes = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [ultimoCliente, setUltimoCliente] = useState<any>(null);
  const { addCliente } = useSupabaseClientes();

  const form = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      nombre: '',
      direccion: '',
      telefono: '',
      email: '',
      municipio: '',
      tipo_servicio: '',
      numero_cuenta: '',
      observaciones: '',
      latitud: '',
      longitud: '',
    },
  });

  const onSubmit = async (data: ClienteFormData) => {
    setIsLoading(true);
    try {
      const clienteData = {
        nombre: data.nombre,
        direccion: data.direccion,
        telefono: data.telefono || '',
        email: data.email || '',
        municipio: data.municipio,
        tipo_servicio: data.tipo_servicio || '',
        estado: 'activo',
        numero_cuenta: data.numero_cuenta || '',
        observaciones: `${data.observaciones || ''}\nCoordenadas: ${data.latitud}, ${data.longitud}`
      };

      const resultado = await addCliente(clienteData);
      
      if (resultado) {
        // Generar código QR con la información del cliente
        const qrData = JSON.stringify({
          numero_cuenta: data.numero_cuenta || 'N/A',
          nombre: data.nombre,
          latitud: data.latitud,
          longitud: data.longitud
        });
        
        const qrDataUrl = await QRCode.toDataURL(qrData, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        
        setQrCodeData(qrDataUrl);
        setUltimoCliente({
          ...data,
          numero_cuenta: data.numero_cuenta || 'N/A'
        });
      }
      
      form.reset();
    } catch (error) {
      console.error('Error al registrar cliente:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const descargarQR = () => {
    if (!qrCodeData || !ultimoCliente) return;
    
    const link = document.createElement('a');
    link.download = `QR_${ultimoCliente.numero_cuenta}_${ultimoCliente.nombre.replace(/\s+/g, '_')}.png`;
    link.href = qrCodeData;
    link.click();
    
    toast({
      title: "QR Descargado",
      description: "El código QR se ha descargado exitosamente"
    });
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-2 mb-6">
        <UserPlus className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Ingresar Clientes</h1>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Registro de Nuevo Cliente
          </CardTitle>
          <CardDescription>
            Complete la información del cliente para registrarlo en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del Cliente</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Nombre completo" 
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
                      <FormLabel>Número de Cuenta (Opcional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="CTE-000001" 
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
                    <FormLabel className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      Dirección
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Dirección completa del cliente" 
                        {...field}
                        onChange={(e) => field.onChange(capitalizeWords(e.target.value))}
                      />
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
                      <FormLabel className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        Teléfono
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="3001234567" {...field} />
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
                      <FormLabel className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        Email
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="cliente@email.com" type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="municipio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Municipio</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Nombre del municipio" 
                          {...field}
                          onChange={(e) => field.onChange(capitalizeText(e.target.value))}
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
                      <FormLabel>Tipo de Servicio</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione el servicio" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="alarmas">Alarmas</SelectItem>
                          <SelectItem value="patrullaje">Patrullaje</SelectItem>
                          <SelectItem value="acompañamiento">Acompañamiento</SelectItem>
                          <SelectItem value="mixto">Servicios Mixtos</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Coordenadas GPS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="latitud"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        Latitud
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="4.6097102" {...field} />
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
                      <FormLabel className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        Longitud
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="-74.0817413" {...field} />
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
                        placeholder="Información adicional sobre el cliente..."
                        className="min-h-[100px]"
                        {...field}
                        onChange={(e) => field.onChange(capitalizeText(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? 'Guardando...' : 'Registrar Cliente'}
                </Button>
                <Button type="button" variant="outline" onClick={() => form.reset()}>
                  Limpiar Formulario
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Modal de código QR */}
      {qrCodeData && ultimoCliente && (
        <Card className="max-w-md mx-auto mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Código QR Generado
            </CardTitle>
            <CardDescription>
              Código QR para {ultimoCliente.nombre}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="flex justify-center">
              <img src={qrCodeData} alt="Código QR" className="border rounded-lg" />
            </div>
            <div className="text-sm space-y-1">
              <p><strong>Cliente:</strong> {ultimoCliente.nombre}</p>
              <p><strong>Cuenta:</strong> {ultimoCliente.numero_cuenta}</p>
              <p><strong>Coordenadas:</strong> {ultimoCliente.latitud}, {ultimoCliente.longitud}</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={descargarQR} className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Descargar QR
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setQrCodeData(null);
                  setUltimoCliente(null);
                }}
                className="flex-1"
              >
                Cerrar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default IngresarClientes;