import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseClientes, Cliente } from '@/hooks/useSupabaseClientes';
import { Search, Users, Edit, Trash2, Download, Plus, UserCheck, UserX, Settings, Building2, Phone, Mail, MapPin } from 'lucide-react';

interface ServiciosContratados {
  alarmas: number;
  revistas: number;
  acompañamientos: number;
}

const clienteSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  direccion: z.string().min(5, 'Ingrese una dirección válida'),
  telefono: z.string().optional(),
  email: z.string().email('Ingrese un email válido').optional(),
  municipio: z.string().min(2, 'Ingrese el municipio'),
  tipo_servicio: z.string().optional(),
  numero_cuenta: z.string().optional(),
  observaciones: z.string().optional(),
});

type ClienteFormData = z.infer<typeof clienteSchema>;

const GestionClientesCompleta = () => {
  const { clientes, loading, error, addCliente, updateCliente, deleteCliente } = useSupabaseClientes();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [searchField, setSearchField] = useState('all');
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [editData, setEditData] = useState<Partial<Cliente>>({});
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isServicesDialogOpen, setIsServicesDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [servicesData, setServicesData] = useState<ServiciosContratados>({ alarmas: 0, revistas: 0, acompañamientos: 0 });

  // Form for creating new clients
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
    },
  });

  const filteredClientes = clientes.filter(cliente => {
    if (!searchTerm) return true;
    
    const term = searchTerm.toLowerCase();
    switch (searchField) {
      case 'nombre':
        return cliente.nombre?.toLowerCase().includes(term);
      case 'email':
        return cliente.email?.toLowerCase().includes(term);
      case 'telefono':
        return cliente.telefono?.toLowerCase().includes(term);
      case 'municipio':
        return cliente.municipio?.toLowerCase().includes(term);
      case 'numero_cuenta':
        return cliente.numero_cuenta?.toLowerCase().includes(term);
      default:
        return (
          cliente.nombre?.toLowerCase().includes(term) ||
          cliente.email?.toLowerCase().includes(term) ||
          cliente.telefono?.toLowerCase().includes(term) ||
          cliente.municipio?.toLowerCase().includes(term) ||
          cliente.numero_cuenta?.toLowerCase().includes(term) ||
          cliente.direccion?.toLowerCase().includes(term)
        );
    }
  });

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setEditData({
      nombre: cliente.nombre,
      direccion: cliente.direccion,
      telefono: cliente.telefono,
      email: cliente.email,
      municipio: cliente.municipio,
      tipo_servicio: cliente.tipo_servicio,
      numero_cuenta: cliente.numero_cuenta,
      observaciones: cliente.observaciones
    });
    setIsEditDialogOpen(true);
  };

  const handleCreateCliente = async (data: ClienteFormData) => {
    try {
      await addCliente({
        nombre: data.nombre,
        direccion: data.direccion,
        telefono: data.telefono || '',
        email: data.email || '',
        municipio: data.municipio,
        tipo_servicio: data.tipo_servicio || '',
        estado: 'activo',
        numero_cuenta: data.numero_cuenta || '',
        observaciones: data.observaciones || ''
      });
      
      form.reset();
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Error al registrar cliente:', error);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingCliente) return;
    
    try {
      await updateCliente(editingCliente.id, editData);
      setIsEditDialogOpen(false);
      setEditingCliente(null);
    } catch (error) {
      console.error('Error al actualizar cliente:', error);
    }
  };

  const handleToggleActive = async (cliente: Cliente) => {
    try {
      await updateCliente(cliente.id, { 
        estado: cliente.estado === 'activo' ? 'inactivo' : 'activo' 
      });
    } catch (error) {
      console.error('Error al cambiar estado:', error);
    }
  };

  const handleDelete = async (clienteId: string) => {
    try {
      await deleteCliente(clienteId);
    } catch (error) {
      console.error('Error al eliminar cliente:', error);
    }
  };

  const handleServicesEdit = (cliente: Cliente) => {
    setEditingCliente(cliente);
    const servicios = cliente.servicios_contratados as ServiciosContratados || { alarmas: 0, revistas: 0, acompañamientos: 0 };
    setServicesData(servicios);
    setIsServicesDialogOpen(true);
  };

  const handleSaveServices = async () => {
    if (!editingCliente) return;
    
    try {
      await updateCliente(editingCliente.id, { 
        servicios_contratados: servicesData 
      });
      setIsServicesDialogOpen(false);
      setEditingCliente(null);
    } catch (error) {
      console.error('Error al actualizar servicios:', error);
    }
  };

  const exportToCSV = () => {
    const headers = ['Nombre', 'Email', 'Teléfono', 'Municipio', 'Número Cuenta', 'Estado', 'Fecha Registro'];
    const csvContent = [
      headers.join(','),
      ...filteredClientes.map(cliente => [
        cliente.nombre,
        cliente.email || '',
        cliente.telefono || '',
        cliente.municipio,
        cliente.numero_cuenta || '',
        cliente.estado,
        new Date(cliente.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'clientes.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  console.log('🔍 Estado del componente:', { loading, clientes: clientes.length, error });

  if (loading) {
    console.log('⏳ Componente en estado loading...');
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            Gestión de Clientes
          </h1>
          <p className="text-muted-foreground">
            Administrar clientes, servicios contratados y exportar datos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Registrar Nuevo Cliente
              </Button>
            </DialogTrigger>
          </Dialog>
          <Button onClick={exportToCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros de Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar clientes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={searchField} onValueChange={setSearchField}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los campos</SelectItem>
                <SelectItem value="nombre">Nombre</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="telefono">Teléfono</SelectItem>
                <SelectItem value="municipio">Municipio</SelectItem>
                <SelectItem value="numero_cuenta">Número de Cuenta</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes ({filteredClientes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Municipio</TableHead>
                <TableHead>N° Cuenta</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Servicios</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClientes.map((cliente) => {
                const servicios = cliente.servicios_contratados as ServiciosContratados || { alarmas: 0, revistas: 0, acompañamientos: 0 };
                return (
                  <TableRow key={cliente.id}>
                    <TableCell className="font-mono text-xs">{cliente.id.slice(0, 8)}...</TableCell>
                    <TableCell className="font-medium">{cliente.nombre}</TableCell>
                    <TableCell>{cliente.email || '-'}</TableCell>
                    <TableCell>{cliente.telefono || '-'}</TableCell>
                    <TableCell>{cliente.municipio}</TableCell>
                    <TableCell>{cliente.numero_cuenta || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={cliente.estado === 'activo' ? 'default' : 'secondary'}>
                        {cliente.estado}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs">
                        A: {servicios.alarmas} | R: {servicios.revistas} | Ac: {servicios.acompañamientos}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(cliente)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleServicesEdit(cliente)}>
                          <Settings className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant={cliente.estado === 'activo' ? 'secondary' : 'default'}
                          onClick={() => handleToggleActive(cliente)}
                        >
                          {cliente.estado === 'activo' ? <UserX className="h-3 w-3" /> : <UserCheck className="h-3 w-3" />}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Se eliminará permanentemente el cliente {cliente.nombre}.
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
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de Creación de Cliente */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Registro de Nuevo Cliente
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateCliente)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del Cliente</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre completo" {...field} />
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
                        <Input placeholder="CTE-000001" {...field} />
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
                      <Input placeholder="Dirección completa del cliente" {...field} />
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
                        <Input placeholder="Nombre del municipio" {...field} />
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
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    form.reset();
                    setIsCreateDialogOpen(false);
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  Registrar Cliente
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Edición */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nombre</Label>
                <Input
                  value={editData.nombre || ''}
                  onChange={(e) => setEditData({...editData, nombre: e.target.value})}
                />
              </div>
              <div>
                <Label>Número de Cuenta</Label>
                <Input
                  value={editData.numero_cuenta || ''}
                  onChange={(e) => setEditData({...editData, numero_cuenta: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label>Dirección</Label>
              <Input
                value={editData.direccion || ''}
                onChange={(e) => setEditData({...editData, direccion: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Teléfono</Label>
                <Input
                  value={editData.telefono || ''}
                  onChange={(e) => setEditData({...editData, telefono: e.target.value})}
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  value={editData.email || ''}
                  onChange={(e) => setEditData({...editData, email: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Municipio</Label>
                <Input
                  value={editData.municipio || ''}
                  onChange={(e) => setEditData({...editData, municipio: e.target.value})}
                />
              </div>
              <div>
                <Label>Tipo de Servicio</Label>
                <Select value={editData.tipo_servicio || ''} onValueChange={(value) => setEditData({...editData, tipo_servicio: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alarmas">Alarmas</SelectItem>
                    <SelectItem value="patrullaje">Patrullaje</SelectItem>
                    <SelectItem value="acompañamiento">Acompañamiento</SelectItem>
                    <SelectItem value="mixto">Servicios Mixtos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Observaciones</Label>
              <Textarea
                value={editData.observaciones || ''}
                onChange={(e) => setEditData({...editData, observaciones: e.target.value})}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveEdit}>
                Guardar Cambios
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Servicios */}
      <Dialog open={isServicesDialogOpen} onOpenChange={setIsServicesDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Servicios Contratados</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Cantidad de Alarmas</Label>
              <Input
                type="number"
                value={servicesData.alarmas}
                onChange={(e) => setServicesData({...servicesData, alarmas: parseInt(e.target.value) || 0})}
              />
            </div>
            <div>
              <Label>Cantidad de Revistas</Label>
              <Input
                type="number"
                value={servicesData.revistas}
                onChange={(e) => setServicesData({...servicesData, revistas: parseInt(e.target.value) || 0})}
              />
            </div>
            <div>
              <Label>Cantidad de Acompañamientos</Label>
              <Input
                type="number"
                value={servicesData.acompañamientos}
                onChange={(e) => setServicesData({...servicesData, acompañamientos: parseInt(e.target.value) || 0})}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsServicesDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveServices}>
                Guardar Servicios
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GestionClientesCompleta;