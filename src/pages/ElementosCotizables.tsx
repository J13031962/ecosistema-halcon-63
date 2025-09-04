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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Package, Plus, Edit2, Trash2, Search, Loader2 } from 'lucide-react';
import { useSupabaseElementosCotizables, ElementoCotizable } from '@/hooks/useSupabaseElementosCotizables';

const elementoSchema = z.object({
  codigo: z.string().min(1, 'El código es requerido'),
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  descripcion: z.string().min(5, 'La descripción debe tener al menos 5 caracteres'),
  categoria: z.string().min(1, 'Seleccione una categoría'),
  precio: z.number().min(0, 'El precio debe ser mayor o igual a 0'),
  unidad: z.string().min(1, 'Seleccione una unidad'),
  estado: z.enum(['activo', 'inactivo']),
  observaciones: z.string().optional(),
});

type ElementoFormData = z.infer<typeof elementoSchema> & { id?: string };

const ElementosCotizables = () => {
  const { elementos, loading, addElemento, updateElemento, deleteElemento } = useSupabaseElementosCotizables();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filtro, setFiltro] = useState('');
  const [editando, setEditando] = useState<string | null>(null);

  const form = useForm<ElementoFormData>({
    resolver: zodResolver(elementoSchema),
    defaultValues: {
      codigo: '',
      nombre: '',
      descripcion: '',
      categoria: '',
      precio: 0,
      unidad: '',
      estado: 'activo',
      observaciones: '',
    },
  });

  const onSubmit = async (data: ElementoFormData) => {
    setIsSubmitting(true);
    try {
      if (editando) {
        await updateElemento(editando, data);
        setEditando(null);
      } else {
        await addElemento(data as Omit<ElementoCotizable, 'id' | 'created_at' | 'updated_at'>);
      }
      form.reset();
    } catch (error) {
      // Error ya manejado en el hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const editarElemento = (elemento: ElementoCotizable) => {
    form.reset(elemento);
    setEditando(elemento.id);
  };

  const eliminarElemento = async (id: string) => {
    try {
      await deleteElemento(id);
    } catch (error) {
      // Error ya manejado en el hook
    }
  };

  const elementosFiltrados = elementos.filter(elemento =>
    elemento.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
    elemento.codigo.toLowerCase().includes(filtro.toLowerCase()) ||
    elemento.categoria.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-2 mb-6">
        <Package className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Elementos Cotizables</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulario */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              {editando ? 'Editar Elemento' : 'Agregar Nuevo Elemento'}
            </CardTitle>
            <CardDescription>
              {editando ? 'Modifique la información del elemento' : 'Complete la información para agregar un nuevo elemento cotizable'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="codigo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código</FormLabel>
                        <FormControl>
                          <Input placeholder="EJ: SER001" {...field} />
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
                        <FormLabel>Categoría</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione categoría" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Servicios">Servicios</SelectItem>
                            <SelectItem value="Equipos">Equipos</SelectItem>
                            <SelectItem value="Instalación">Instalación</SelectItem>
                            <SelectItem value="Mantenimiento">Mantenimiento</SelectItem>
                            <SelectItem value="Accesorios">Accesorios</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre del elemento" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="descripcion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descripción detallada del elemento..."
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="precio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Precio</FormLabel>
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

                  <FormField
                    control={form.control}
                    name="unidad"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unidad</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Unidad" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="unidad">Unidad</SelectItem>
                            <SelectItem value="día">Día</SelectItem>
                            <SelectItem value="mes">Mes</SelectItem>
                            <SelectItem value="hora">Hora</SelectItem>
                            <SelectItem value="servicio">Servicio</SelectItem>
                            <SelectItem value="metro">Metro</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="estado"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Estado" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="activo">Activo</SelectItem>
                            <SelectItem value="inactivo">Inactivo</SelectItem>
                          </SelectContent>
                        </Select>
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
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={isSubmitting} className="flex-1">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : editando ? 'Actualizar' : 'Agregar Elemento'}
                  </Button>
                  {editando && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setEditando(null);
                        form.reset({
                          codigo: '', nombre: '', descripcion: '', categoria: '',
                          precio: 0, unidad: '', estado: 'activo', observaciones: ''
                        });
                      }}
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Lista de Elementos */}
        <Card>
          <CardHeader>
            <CardTitle>Elementos Registrados</CardTitle>
            <CardDescription>
              Lista de todos los elementos disponibles para cotizar
            </CardDescription>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, código o categoría..."
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Cargando elementos...</span>
              </div>
            ) : (
              <div className="max-h-[600px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {elementosFiltrados.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          {filtro ? 'No se encontraron elementos que coincidan con el filtro' : 'No hay elementos registrados'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      elementosFiltrados.map((elemento) => (
                    <TableRow key={elemento.id}>
                      <TableCell className="font-mono">{elemento.codigo}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{elemento.nombre}</div>
                          <div className="text-sm text-muted-foreground">
                            {elemento.descripcion.substring(0, 40)}...
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{elemento.categoria}</Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">${elemento.precio.toLocaleString()}</div>
                          <div className="text-sm text-muted-foreground">por {elemento.unidad}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={elemento.estado === 'activo' ? 'default' : 'secondary'}>
                          {elemento.estado}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => editarElemento(elemento)}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => eliminarElemento(elemento.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ElementosCotizables;