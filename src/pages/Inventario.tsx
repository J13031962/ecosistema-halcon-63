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
import { useToast } from '@/hooks/use-toast';
import { Package, Plus, Edit2, Trash2, Search, Users, CheckCircle, ClipboardList } from 'lucide-react';

const inventarioSchema = z.object({
  codigo: z.string().min(1, 'El código es requerido'),
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  descripcion: z.string().min(5, 'La descripción debe tener al menos 5 caracteres'),
  categoria: z.string().min(1, 'Seleccione una categoría'),
  cantidad: z.number().min(0, 'La cantidad debe ser mayor o igual a 0'),
  cantidadMinima: z.number().min(0, 'La cantidad mínima debe ser mayor o igual a 0'),
  ubicacion: z.string().min(1, 'La ubicación es requerida'),
  responsable: z.string().min(1, 'Seleccione un responsable'),
  estado: z.enum(['disponible', 'en_uso', 'mantenimiento', 'dañado']),
  valorUnitario: z.number().min(0, 'El valor debe ser mayor o igual a 0'),
  proveedor: z.string().optional(),
  fechaAdquisicion: z.string().optional(),
  observaciones: z.string().optional(),
});

type InventarioFormData = z.infer<typeof inventarioSchema> & { id?: number };

// Datos de ejemplo
const inventarioEjemplo: InventarioFormData[] = [
  {
    id: 1,
    codigo: 'EQ001',
    nombre: 'Cámaras de Seguridad IP',
    descripcion: 'Cámaras de seguridad IP con visión nocturna 4MP',
    categoria: 'Equipos de Vigilancia',
    cantidad: 25,
    cantidadMinima: 5,
    ubicacion: 'Bodega Principal - Estante A1',
    responsable: 'Juan Pérez',
    estado: 'disponible',
    valorUnitario: 450000,
    proveedor: 'SecuriTech SAS',
    fechaAdquisicion: '2024-01-15',
    observaciones: 'Incluye adaptadores de corriente',
  },
  {
    id: 2,
    codigo: 'CAB001',
    nombre: 'Cable UTP Cat6',
    descripcion: 'Cable UTP categoría 6 para instalaciones de red',
    categoria: 'Cables y Conectores',
    cantidad: 500,
    cantidadMinima: 100,
    ubicacion: 'Bodega Principal - Estante B2',
    responsable: 'María González',
    estado: 'disponible',
    valorUnitario: 2500,
    proveedor: 'Cables Colombia',
    fechaAdquisicion: '2024-02-01',
    observaciones: 'Bobina de 305 metros',
  },
  {
    id: 3,
    codigo: 'SEN001',
    nombre: 'Sensores de Movimiento PIR',
    descripcion: 'Sensores de movimiento por infrarrojos para interiores',
    categoria: 'Sensores',
    cantidad: 3,
    cantidadMinima: 10,
    ubicacion: 'Bodega Principal - Estante C1',
    responsable: 'Carlos Rodríguez',
    estado: 'en_uso',
    valorUnitario: 85000,
    proveedor: 'Alarmas Pro',
    fechaAdquisicion: '2024-01-10',
    observaciones: 'Stock bajo - requiere reposición',
  },
];

const usuarios = [
  { id: 'juan_perez', name: 'Juan Pérez' },
  { id: 'maria_gonzalez', name: 'María González' },
  { id: 'carlos_rodriguez', name: 'Carlos Rodríguez' },
  { id: 'ana_martinez', name: 'Ana Martínez' },
  { id: 'luis_fernandez', name: 'Luis Fernández' },
];

const Inventario = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [inventario, setInventario] = useState(inventarioEjemplo);
  const [filtro, setFiltro] = useState('');
  const [editando, setEditando] = useState<number | null>(null);

  const form = useForm<InventarioFormData>({
    resolver: zodResolver(inventarioSchema),
    defaultValues: {
      codigo: '',
      nombre: '',
      descripcion: '',
      categoria: '',
      cantidad: 0,
      cantidadMinima: 0,
      ubicacion: '',
      responsable: '',
      estado: 'disponible',
      valorUnitario: 0,
      proveedor: '',
      fechaAdquisicion: '',
      observaciones: '',
    },
  });

  const onSubmit = async (data: InventarioFormData) => {
    setIsLoading(true);
    try {
      if (editando) {
        // Actualizar elemento existente
        setInventario(prev => prev.map(item => 
          item.id === editando 
            ? { ...item, ...data, id: editando }
            : item
        ));
        toast({
          title: "Elemento actualizado",
          description: "El elemento del inventario ha sido actualizado exitosamente",
        });
        setEditando(null);
      } else {
        // Crear nuevo elemento
        const nuevoElemento = {
          ...data,
          id: Date.now(),
        };
        setInventario(prev => [...prev, nuevoElemento]);
        toast({
          title: "Elemento agregado",
          description: "El elemento ha sido agregado al inventario exitosamente",
        });
      }
      
      form.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Hubo un error al guardar el elemento",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const editarElemento = (elemento: any) => {
    form.reset(elemento);
    setEditando(elemento.id);
  };

  const eliminarElemento = (id: number) => {
    setInventario(prev => prev.filter(item => item.id !== id));
    toast({
      title: "Elemento eliminado",
      description: "El elemento ha sido eliminado del inventario",
    });
  };

  const inventarioFiltrado = inventario.filter(item =>
    item.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
    item.codigo.toLowerCase().includes(filtro.toLowerCase()) ||
    item.categoria.toLowerCase().includes(filtro.toLowerCase()) ||
    item.responsable.toLowerCase().includes(filtro.toLowerCase())
  );

  const getEstadoBadgeVariant = (estado: string) => {
    switch (estado) {
      case 'disponible': return 'default';
      case 'en_uso': return 'secondary';
      case 'mantenimiento': return 'outline';
      case 'dañado': return 'destructive';
      default: return 'default';
    }
  };

  const getEstadoText = (estado: string) => {
    switch (estado) {
      case 'disponible': return 'Disponible';
      case 'en_uso': return 'En Uso';
      case 'mantenimiento': return 'Mantenimiento';
      case 'dañado': return 'Dañado';
      default: return estado;
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
              <h1 className="text-2xl font-bold">INVENTARIO GENERAL</h1>
            </div>
            <p className="text-slate-200">Control de Inventario de la Empresa</p>
          </div>
          <div className="text-right text-sm">
            <p>TELEGUARDIA.COM</p>
            <p>FECHA: {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulario */}
        <Card>
          <CardHeader className="bg-slate-50 dark:bg-slate-800">
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              {editando ? 'Editar Elemento' : 'Agregar al Inventario'}
            </CardTitle>
            <CardDescription>
              {editando ? 'Modifique la información del elemento' : 'Complete la información para agregar un nuevo elemento al inventario'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Información Básica */}
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
                  <h4 className="font-medium mb-3 text-slate-800 dark:text-slate-200">INFORMACIÓN BÁSICA</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="codigo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CÓDIGO</FormLabel>
                          <FormControl>
                            <Input placeholder="EJ: EQ001" className="font-mono" {...field} />
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
                          <FormLabel>CATEGORÍA</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione categoría" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Equipos de Vigilancia">Equipos de Vigilancia</SelectItem>
                              <SelectItem value="Cables y Conectores">Cables y Conectores</SelectItem>
                              <SelectItem value="Sensores">Sensores</SelectItem>
                              <SelectItem value="Herramientas">Herramientas</SelectItem>
                              <SelectItem value="Vehículos">Vehículos</SelectItem>
                              <SelectItem value="Equipos de Radio">Equipos de Radio</SelectItem>
                              <SelectItem value="Uniformes">Uniformes</SelectItem>
                              <SelectItem value="Material Oficina">Material de Oficina</SelectItem>
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
                      <FormItem className="mt-4">
                        <FormLabel>NOMBRE DEL ELEMENTO</FormLabel>
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
                      <FormItem className="mt-4">
                        <FormLabel>DESCRIPCIÓN</FormLabel>
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
                </div>

                {/* Control de Stock */}
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
                  <h4 className="font-medium mb-3 text-slate-800 dark:text-slate-200">CONTROL DE STOCK</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="cantidad"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CANTIDAD ACTUAL</FormLabel>
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
                      name="cantidadMinima"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CANTIDAD MÍNIMA</FormLabel>
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
                      name="valorUnitario"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>VALOR UNITARIO</FormLabel>
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

                {/* Gestión y Control */}
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
                  <h4 className="font-medium mb-3 text-slate-800 dark:text-slate-200">GESTIÓN Y CONTROL</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="responsable"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            RESPONSABLE
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione responsable" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {usuarios.map((usuario) => (
                                <SelectItem key={usuario.id} value={usuario.name}>
                                  {usuario.name}
                                </SelectItem>
                              ))}
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
                          <FormLabel>ESTADO</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Estado" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="disponible">Disponible</SelectItem>
                              <SelectItem value="en_uso">En Uso</SelectItem>
                              <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                              <SelectItem value="dañado">Dañado</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="ubicacion"
                    render={({ field }) => (
                      <FormItem className="mt-4">
                        <FormLabel>UBICACIÓN</FormLabel>
                        <FormControl>
                          <Input placeholder="Bodega Principal - Estante A1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Información Adicional */}
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
                  <h4 className="font-medium mb-3 text-slate-800 dark:text-slate-200">INFORMACIÓN ADICIONAL</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="proveedor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>PROVEEDOR</FormLabel>
                          <FormControl>
                            <Input placeholder="Nombre del proveedor" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="fechaAdquisicion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>FECHA DE ADQUISICIÓN</FormLabel>
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
                    name="observaciones"
                    render={({ field }) => (
                      <FormItem className="mt-4">
                        <FormLabel>OBSERVACIONES</FormLabel>
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
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={isLoading} className="flex-1">
                    {isLoading ? 'Guardando...' : editando ? 'Actualizar' : 'Agregar al Inventario'}
                  </Button>
                  {editando && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setEditando(null);
                        form.reset({
                          codigo: '', nombre: '', descripcion: '', categoria: '',
                          cantidad: 0, cantidadMinima: 0, ubicacion: '', responsable: '',
                          estado: 'disponible', valorUnitario: 0, proveedor: '',
                          fechaAdquisicion: '', observaciones: ''
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

        {/* Lista de Inventario */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Inventario Registrado
            </CardTitle>
            <CardDescription>
              Control de todos los elementos del inventario de la empresa
            </CardDescription>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, código, categoría o responsable..."
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-[600px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Elemento</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Responsable</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventarioFiltrado.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono">{item.codigo}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.nombre}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.categoria} • {item.ubicacion}
                          </div>
                          {item.cantidad <= item.cantidadMinima && (
                            <Badge variant="destructive" className="text-xs mt-1">
                              Stock Bajo
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.cantidad}</div>
                          <div className="text-sm text-muted-foreground">
                            Mín: {item.cantidadMinima}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span className="text-sm">{item.responsable}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getEstadoBadgeVariant(item.estado)}>
                          {getEstadoText(item.estado)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => editarElemento(item)}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => eliminarElemento(item.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Inventario;