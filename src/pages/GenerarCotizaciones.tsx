import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { FileSignature, Plus, Trash2, Calculator, User, Building2, Eye, Send, Download, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthConsolidated } from '@/hooks/useAuthConsolidated';

const itemSchema = z.object({
  descripcion: z.string().min(1, 'La descripción es requerida'),
  cantidad: z.number().min(1, 'La cantidad debe ser mayor a 0'),
  precioUnitario: z.number().min(0, 'El precio debe ser mayor o igual a 0'),
  total: z.number(),
});

const cotizacionSchema = z.object({
  cliente: z.string().min(1, 'Seleccione un cliente'),
  fechaVencimiento: z.string().min(1, 'La fecha de vencimiento es requerida'),
  condicionesPago: z.string().min(1, 'Las condiciones de pago son requeridas'),
  observaciones: z.string().optional(),
  items: z.array(itemSchema).min(1, 'Debe agregar al menos un item'),
  descuento: z.number().min(0).max(100).optional(),
});

type CotizacionFormData = z.infer<typeof cotizacionSchema>;

interface Cotizacion {
  id: string;
  numero_cotizacion: string;
  cliente_nombre: string;
  total: number;
  estado: string;
  fecha_expiracion: string;
  created_at: string;
}

const GenerarCotizaciones = () => {
  const { user } = useAuthConsolidated();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [activeTab, setActiveTab] = useState('crear');

  useEffect(() => {
    if (activeTab === 'listado') {
      fetchCotizaciones();
    }
  }, [activeTab, user]);

  const fetchCotizaciones = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('cotizaciones')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las cotizaciones",
        variant: "destructive",
      });
      return;
    }

    setCotizaciones(data || []);
  };

  const form = useForm<CotizacionFormData>({
    resolver: zodResolver(cotizacionSchema),
    defaultValues: {
      cliente: '',
      fechaVencimiento: '',
      condicionesPago: '30 días',
      observaciones: '',
      items: [{ descripcion: '', cantidad: 1, precioUnitario: 0, total: 0 }],
      descuento: 0,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const watchedItems = form.watch('items');
  const watchedDescuento = form.watch('descuento') || 0;

  const calcularSubtotal = () => {
    return watchedItems.reduce((acc, item) => acc + (item.cantidad * item.precioUnitario), 0);
  };

  const calcularTotal = () => {
    const subtotal = calcularSubtotal();
    const descuentoMonto = (subtotal * watchedDescuento) / 100;
    return subtotal - descuentoMonto;
  };

  const actualizarTotal = (index: number) => {
    const item = watchedItems[index];
    const total = item.cantidad * item.precioUnitario;
    form.setValue(`items.${index}.total`, total);
  };

  const onSubmit = async (data: CotizacionFormData) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const subtotal = calcularSubtotal();
      const total = calcularTotal();
      const numeroCotizacion = `COT-${Date.now()}`;

      // Guardar cotización
      const { data: cotizacion, error: cotError } = await supabase
        .from('cotizaciones')
        .insert({
          numero_cotizacion: numeroCotizacion,
          cliente_nombre: data.cliente,
          user_id: user.id,
          fecha_expiracion: data.fechaVencimiento,
          terminos_pago: data.condicionesPago,
          subtotal: subtotal,
          descuento: data.descuento || 0,
          total: total,
          estado: 'borrador'
        })
        .select()
        .single();

      if (cotError) throw cotError;

      // Guardar items
      const items = data.items.map(item => ({
        cotizacion_id: cotizacion.id,
        descripcion: item.descripcion,
        cantidad: item.cantidad,
        precio_unitario: item.precioUnitario,
        total: item.cantidad * item.precioUnitario
      }));

      const { error: itemsError } = await supabase
        .from('cotizacion_items')
        .insert(items);

      if (itemsError) throw itemsError;
      
      toast({
        title: "Cotización generada",
        description: `Cotización ${numeroCotizacion} creada exitosamente`,
      });
      
      form.reset();
      setActiveTab('listado');
    } catch (error) {
      toast({
        title: "Error",
        description: "Hubo un error al generar la cotización",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'borrador': return 'bg-gray-500';
      case 'enviada': return 'bg-blue-500';
      case 'aprobada': return 'bg-green-500';
      case 'rechazada': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-2 mb-6">
        <FileSignature className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Gestión de Cotizaciones</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-6xl mx-auto">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="crear">Crear Cotización</TabsTrigger>
          <TabsTrigger value="listado">Mis Cotizaciones</TabsTrigger>
        </TabsList>

        <TabsContent value="crear">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Nueva Cotización
              </CardTitle>
              <CardDescription>
                Complete la información para generar una nueva cotización
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Información del Cliente */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="cliente"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            Cliente
                          </FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione un cliente" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Juan Pérez - Empresa ABC">Juan Pérez - Empresa ABC</SelectItem>
                              <SelectItem value="María González - Empresa XYZ">María González - Empresa XYZ</SelectItem>
                              <SelectItem value="Carlos Rodríguez - Persona Natural">Carlos Rodríguez - Persona Natural</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="fechaVencimiento"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fecha de Vencimiento</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="condicionesPago"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Condiciones de Pago</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione condiciones de pago" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="contado">Contado</SelectItem>
                            <SelectItem value="15 días">15 días</SelectItem>
                            <SelectItem value="30 días">30 días</SelectItem>
                            <SelectItem value="45 días">45 días</SelectItem>
                            <SelectItem value="60 días">60 días</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Items de la Cotización */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label className="text-lg font-semibold">Items de la Cotización</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => append({ descripcion: '', cantidad: 1, precioUnitario: 0, total: 0 })}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Agregar Item
                      </Button>
                    </div>

                    {fields.map((field, index) => (
                      <Card key={field.id} className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                          <div className="md:col-span-2">
                            <FormField
                              control={form.control}
                              name={`items.${index}.descripcion`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Descripción</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Descripción del servicio/producto" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name={`items.${index}.cantidad`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Cantidad</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="1"
                                    {...field}
                                    onChange={(e) => {
                                      field.onChange(parseInt(e.target.value));
                                      setTimeout(() => actualizarTotal(index), 0);
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`items.${index}.precioUnitario`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Precio Unitario</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    {...field}
                                    onChange={(e) => {
                                      field.onChange(parseFloat(e.target.value));
                                      setTimeout(() => actualizarTotal(index), 0);
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <Label className="text-sm">Total</Label>
                              <div className="font-semibold text-lg">
                                ${(watchedItems[index]?.cantidad * watchedItems[index]?.precioUnitario || 0).toLocaleString()}
                              </div>
                            </div>
                            {fields.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => remove(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>

                  {/* Totales */}
                  <Card className="p-4 bg-muted/50">
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <FormField
                          control={form.control}
                          name="descuento"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Descuento (%)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.1"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="text-right">
                          <Label>Subtotal</Label>
                          <div className="text-xl font-semibold">${calcularSubtotal().toLocaleString()}</div>
                        </div>
                        
                        <div className="text-right">
                          <Label>Total</Label>
                          <div className="text-2xl font-bold text-primary">${calcularTotal().toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  </Card>

                  <FormField
                    control={form.control}
                    name="observaciones"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observaciones</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Observaciones adicionales..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-4 pt-4">
                    <Button type="submit" disabled={isLoading} className="flex-1">
                      {isLoading ? 'Generando...' : 'Generar Cotización'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => form.reset()}>
                      Limpiar Formulario
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="listado">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Mis Cotizaciones
                </div>
                <Badge variant="outline">
                  {cotizaciones.length} cotizaciones
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cotizaciones.length > 0 ? (
                <div className="space-y-4">
                  {cotizaciones.map((cotizacion) => (
                    <Card key={cotizacion.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{cotizacion.numero_cotizacion}</h3>
                              <Badge className={getEstadoColor(cotizacion.estado)}>
                                {cotizacion.estado.toUpperCase()}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Cliente: {cotizacion.cliente_nombre}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Fecha de expiración: {new Date(cotizacion.fecha_expiracion).toLocaleDateString()}
                            </p>
                            <p className="text-lg font-semibold text-primary">
                              Total: ${cotizacion.total.toLocaleString()}
                            </p>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              Ver
                            </Button>
                            <Button variant="outline" size="sm">
                              <Send className="h-4 w-4 mr-1" />
                              Enviar
                            </Button>
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4 mr-1" />
                              PDF
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No hay cotizaciones</h3>
                  <p className="text-muted-foreground mb-4">
                    Aún no has creado ninguna cotización.
                  </p>
                  <Button onClick={() => setActiveTab('crear')}>
                    <Plus className="h-4 w-4 mr-1" />
                    Crear primera cotización
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GenerarCotizaciones;