import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Plus, 
  Building, 
  Phone, 
  Mail, 
  Settings,
  Shield,
  Users,
  Search
} from 'lucide-react';
import { useEmpresasContratadas, type EmpresaContratada } from '@/hooks/useEmpresasContratadas';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export default function PatrullasContratadas() {
  const { empresas, loading, createEmpresa, updateEmpresa, deleteEmpresa } = useEmpresasContratadas();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEmpresa, setSelectedEmpresa] = useState<EmpresaContratada | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    tipo_servicio: 'seguridad',
    contacto: '',
    telefono: '',
    email: '',
    descripcion: ''
  });

  const resetForm = () => {
    setFormData({
      nombre: '',
      tipo_servicio: 'seguridad',
      contacto: '',
      telefono: '',
      email: '',
      descripcion: ''
    });
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createEmpresa({
        ...formData,
        estado: 'activo'
      });
      toast({
        title: "Empresa creada",
        description: "La empresa contratada ha sido creada exitosamente",
      });
      setIsCreateModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error en handleCreateSubmit:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al crear la empresa contratada",
        variant: "destructive",
      });
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpresa) return;
    
    try {
      await updateEmpresa(selectedEmpresa.id, formData);
      toast({
        title: "Empresa actualizada",
        description: "La empresa contratada ha sido actualizada exitosamente",
      });
      setIsEditModalOpen(false);
      setSelectedEmpresa(null);
      resetForm();
    } catch (error) {
      console.error('Error en handleEditSubmit:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al actualizar la empresa contratada",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (empresa: EmpresaContratada) => {
    setSelectedEmpresa(empresa);
    setFormData({
      nombre: empresa.nombre,
      tipo_servicio: empresa.tipo_servicio,
      contacto: empresa.contacto || '',
      telefono: empresa.telefono || '',
      email: empresa.email || '',
      descripcion: empresa.descripcion || ''
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = async (empresaId: string) => {
    if (confirm('¿Está seguro que desea eliminar esta empresa contratada?')) {
      try {
        await deleteEmpresa(empresaId);
        toast({
          title: "Empresa eliminada",
          description: "La empresa contratada ha sido eliminada exitosamente",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Error al eliminar la empresa contratada",
          variant: "destructive",
        });
      }
    }
  };

  const handleConfigureEmpresa = (empresaId: string, empresaNombre: string) => {
    navigate(`/patrullas-contratadas/${empresaId}`, { 
      state: { empresaNombre } 
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Cargando empresas contratadas...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">PATRULLAS CONTRATADAS</h1>
          <p className="text-muted-foreground">
            Gestión de empresas contratadas y sus configuraciones de servicios
          </p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Empresa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nueva Empresa Contratada</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="nombre">Nombre de la Empresa</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej: Coraza Seguridad"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contacto">Persona de Contacto</Label>
                <Input
                  id="contacto"
                  value={formData.contacto}
                  onChange={(e) => setFormData({ ...formData, contacto: e.target.value })}
                  placeholder="Nombre del contacto principal"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  placeholder="Número de teléfono"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="correo@empresa.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Descripción de los servicios que presta"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Crear Empresa</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de Empresas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {empresas.map((empresa) => (
          <Card key={empresa.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                {empresa.nombre}
              </CardTitle>
              <Badge variant="secondary" className="w-fit">
                {empresa.tipo_servicio}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Información de contacto */}
              <div className="space-y-2">
                {empresa.contacto && (
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{empresa.contacto}</span>
                  </div>
                )}
                {empresa.telefono && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{empresa.telefono}</span>
                  </div>
                )}
                {empresa.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{empresa.email}</span>
                  </div>
                )}
              </div>

              {empresa.descripcion && (
                <p className="text-sm text-muted-foreground">
                  {empresa.descripcion}
                </p>
              )}

              {/* Acciones */}
              <div className="flex flex-col gap-2">
                <Button 
                  variant="default" 
                  size="sm" 
                  className="w-full"
                  onClick={() => handleConfigureEmpresa(empresa.id, empresa.nombre)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Configurar
                </Button>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEdit(empresa)}
                  >
                    Editar
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    className="flex-1"
                    onClick={() => handleDelete(empresa.id)}
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {empresas.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay empresas contratadas</h3>
            <p className="text-muted-foreground mb-4">
              Comienza agregando una empresa contratada para gestionar los servicios de patrullaje.
            </p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Primera Empresa
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Modal de Edición */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Empresa Contratada</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-nombre">Nombre de la Empresa</Label>
              <Input
                id="edit-nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej: Coraza Seguridad"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-contacto">Persona de Contacto</Label>
              <Input
                id="edit-contacto"
                value={formData.contacto}
                onChange={(e) => setFormData({ ...formData, contacto: e.target.value })}
                placeholder="Nombre del contacto principal"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-telefono">Teléfono</Label>
              <Input
                id="edit-telefono"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                placeholder="Número de teléfono"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="correo@empresa.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-descripcion">Descripción</Label>
              <Textarea
                id="edit-descripcion"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Descripción de los servicios que presta"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Actualizar Empresa</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}