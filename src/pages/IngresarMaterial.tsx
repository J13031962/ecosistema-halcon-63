import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Package, Save, RotateCcw } from 'lucide-react';

const materialSchema = z.object({
  codigo: z.string().min(1, 'El código es requerido'),
  descripcion: z.string().min(1, 'La descripción es requerida'),
  categoria: z.string().min(1, 'Seleccione una categoría'),
  valorUnitario: z.number().min(0, 'El valor debe ser mayor o igual a 0'),
  stock: z.number().min(0, 'El stock debe ser mayor o igual a 0'),
  stockMinimo: z.number().min(0, 'El stock mínimo debe ser mayor o igual a 0'),
  proveedor: z.string().optional(),
  ubicacion: z.string().optional(),
  observaciones: z.string().optional(),
});

type MaterialFormData = z.infer<typeof materialSchema>;

const IngresarMaterial = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<MaterialFormData>({
    resolver: zodResolver(materialSchema),
    defaultValues: {
      codigo: '',
      descripcion: '',
      categoria: '',
      valorUnitario: 0,
      stock: 0,
      stockMinimo: 0,
      proveedor: '',
      ubicacion: '',
      observaciones: '',
    },
  });

  const onSubmit = async (data: MaterialFormData) => {
    setIsLoading(true);
    try {
      // Aquí iría la lógica para guardar el material
      console.log('Material a guardar:', data);
      
      toast({
        title: "Material registrado",
        description: "El material ha sido registrado exitosamente",
      });
      
      form.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Hubo un error al registrar el material",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-700 text-white p-6 rounded-lg mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-6 w-6" />
              <h1 className="text-2xl font-bold">SISTEMA DE INVENTARIO</h1>
            </div>
            <p className="text-slate-200">Registro de Materiales y Equipos</p>
          </div>
          <div className="text-right text-sm">
            <p>FO-INV-001</p>
            <p>FECHA: {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      <Card className="max-w-4xl mx-auto">
        <CardHeader className="bg-slate-50 dark:bg-slate-800">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Registro de Material
          </CardTitle>
          <CardDescription>
            Complete la información del material o equipo a registrar
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Información Básica */}
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
                <h3 className="font-semibold mb-4 text-slate-800 dark:text-slate-200">INFORMACIÓN BÁSICA</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="codigo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">CÓDIGO</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="AI020105" 
                            className="font-mono"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="categoria"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">CATEGORÍA</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione categoría" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="equipos">EQUIPOS</SelectItem>
                            <SelectItem value="instalacion">INSTALACIÓN</SelectItem>
                            <SelectItem value="cables">CABLES</SelectItem>
                            <SelectItem value="sensores">SENSORES</SelectItem>
                            <SelectItem value="accesorios">ACCESORIOS</SelectItem>
                            <SelectItem value="herramientas">HERRAMIENTAS</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="valorUnitario"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">VALOR UNITARIO</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Descripción */}
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
                <FormField
                  control={form.control}
                  name="descripcion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">DESCRIPCIÓN DEL MATERIAL/EQUIPO</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="KIT HÍBRIDO PRO 433MHZ, EL KIT CONTIENE: 1* PANEL DE 64 ZONAS CON RECEPTOR..."
                          className="min-h-[100px] font-mono text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Inventario */}
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
                <h3 className="font-semibold mb-4 text-slate-800 dark:text-slate-200">CONTROL DE INVENTARIO</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="stock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">STOCK ACTUAL</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="stockMinimo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">STOCK MÍNIMO</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ubicacion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">UBICACIÓN</FormLabel>
                        <FormControl>
                          <Input placeholder="Bodega A - Estante 1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Información Adicional */}
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
                <h3 className="font-semibold mb-4 text-slate-800 dark:text-slate-200">INFORMACIÓN ADICIONAL</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="proveedor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">PROVEEDOR</FormLabel>
                        <FormControl>
                          <Input placeholder="Nombre del proveedor" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-end">
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground mb-1">VALOR TOTAL STOCK</div>
                      <div className="text-xl font-bold text-primary">
                        ${((form.watch('stock') || 0) * (form.watch('valorUnitario') || 0)).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="observaciones"
                  render={({ field }) => (
                    <FormItem className="mt-4">
                      <FormLabel className="font-medium">OBSERVACIONES</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Observaciones adicionales sobre el material..."
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Botones */}
              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={isLoading} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? 'Registrando...' : 'Registrar Material'}
                </Button>
                <Button type="button" variant="outline" onClick={() => form.reset()}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Limpiar Formulario
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default IngresarMaterial;