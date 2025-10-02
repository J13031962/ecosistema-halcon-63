import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Shield, Plus, Edit, Trash2, Calendar, Users, Car, Eye, ArrowLeft } from 'lucide-react';
import { useConfiguracionEmpresa } from '@/hooks/useConfiguracionEmpresa';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useEmpresaUsuarios } from '@/hooks/useEmpresaUsuarios';
import { Checkbox } from '@/components/ui/checkbox';
import { UserCheck } from 'lucide-react';
import { CardDescription } from '@/components/ui/card';

export default function PatrullasCorazaConfig() {
  const { empresaId } = useParams<{ empresaId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const empresaNombre = location.state?.empresaNombre || 'Empresa';
  
  const {
    configuraciones,
    serviciosUtilizados,
    loading,
    getServiciosEmpresa,
    getHistorialServicios,
    createConfiguracion,
    updateConfiguracion,
    deleteConfiguracion
  } = useConfiguracionEmpresa(empresaId || '');

  const {
    despachadores,
    supervisores,
    loading: loadingUsuarios,
    asignarUsuarioAEmpresa,
    desasignarUsuarioDeEmpresa
  } = useEmpresaUsuarios(empresaId);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedConfiguracion, setSelectedConfiguracion] = useState<any>(null);
  
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [serviciosEmpresa, setServiciosEmpresa] = useState({
    patrullas_disponibles: 0,
    patrullas_usadas: 0,
    patrullas_restantes: 0,
    acompanamientos_disponibles: 0,
    acompanamientos_usados: 0,
    acompanamientos_restantes: 0,
    revistas_disponibles: 0,
    revistas_usadas: 0,
    revistas_restantes: 0
  });

  const [formData, setFormData] = useState({
    year: currentYear,
    month: currentMonth,
    patrullas_disponibles: 0,
    acompanamientos_disponibles: 0,
    revistas_disponibles: 0
  });

  const fetchServiciosEmpresa = async () => {
    if (!empresaId) return;
    try {
      const data = await getServiciosEmpresa();
      setServiciosEmpresa(data);
    } catch (error) {
      console.error('Error fetching servicios empresa:', error);
    }
  };

  useEffect(() => {
    if (empresaId) {
      fetchServiciosEmpresa();
      getHistorialServicios();
    }
  }, [empresaId]);

  const resetForm = () => {
    setFormData({
      year: currentYear,
      month: currentMonth,
      patrullas_disponibles: 0,
      acompanamientos_disponibles: 0,
      revistas_disponibles: 0
    });
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createConfiguracion({
        ...formData,
        patrullas_usadas: 0,
        acompanamientos_usados: 0,
        revistas_usadas: 0
      });
      toast({
        title: "Configuración creada",
        description: "La configuración ha sido creada exitosamente",
      });
      setIsCreateModalOpen(false);
      resetForm();
      fetchServiciosEmpresa();
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al crear la configuración",
        variant: "destructive",
      });
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConfiguracion) return;
    
    try {
      await updateConfiguracion(selectedConfiguracion.id, formData);
      toast({
        title: "Configuración actualizada",
        description: "La configuración ha sido actualizada exitosamente",
      });
      setIsEditModalOpen(false);
      setSelectedConfiguracion(null);
      resetForm();
      fetchServiciosEmpresa();
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al actualizar la configuración",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (configuracion: any) => {
    setSelectedConfiguracion(configuracion);
    setFormData({
      year: configuracion.year,
      month: configuracion.month,
      patrullas_disponibles: configuracion.patrullas_disponibles,
      acompanamientos_disponibles: configuracion.acompanamientos_disponibles,
      revistas_disponibles: configuracion.revistas_disponibles
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Está seguro que desea eliminar esta configuración?')) {
      try {
        await deleteConfiguracion(id);
        toast({
          title: "Configuración eliminada",
          description: "La configuración ha sido eliminada exitosamente",
        });
        fetchServiciosEmpresa();
      } catch (error) {
        toast({
          title: "Error",
          description: "Error al eliminar la configuración",
          variant: "destructive",
        });
      }
    }
  };

  const getMonthName = (month: number) => {
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return monthNames[month - 1];
  };

  const getProgress = (usado: number, disponible: number) => {
    if (disponible === 0) return 0;
    return (usado / disponible) * 100;
  };

  const getProgressColor = (usado: number, disponible: number) => {
    const percentage = getProgress(usado, disponible);
    if (percentage >= 90) return 'bg-destructive';
    if (percentage >= 70) return 'bg-warning';
    return 'bg-primary';
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Cargando configuración...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/patrullas-contratadas')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold">CONFIGURACIÓN - {empresaNombre.toUpperCase()}</h1>
            <p className="text-muted-foreground">
              Configuración de servicios para {empresaNombre}
            </p>
          </div>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Configuración
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nueva Configuración</DialogTitle>
              <DialogDescription>
                Configure los servicios disponibles para un mes específico
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="year">Año</Label>
                  <Select value={formData.year.toString()} onValueChange={(value) => setFormData({...formData, year: parseInt(value)})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[currentYear - 1, currentYear, currentYear + 1].map(year => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="month">Mes</Label>
                  <Select value={formData.month.toString()} onValueChange={(value) => setFormData({...formData, month: parseInt(value)})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({length: 12}, (_, i) => i + 1).map(month => (
                        <SelectItem key={month} value={month.toString()}>{getMonthName(month)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="patrullas">Patrullas Disponibles</Label>
                <Input
                  type="number"
                  value={formData.patrullas_disponibles}
                  onChange={(e) => setFormData({...formData, patrullas_disponibles: parseInt(e.target.value)})}
                  min="0"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="acompanamientos">Acompañamientos Disponibles</Label>
                <Input
                  type="number"
                  value={formData.acompanamientos_disponibles}
                  onChange={(e) => setFormData({...formData, acompanamientos_disponibles: parseInt(e.target.value)})}
                  min="0"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="revistas">Revistas Disponibles</Label>
                <Input
                  type="number"
                  value={formData.revistas_disponibles}
                  onChange={(e) => setFormData({...formData, revistas_disponibles: parseInt(e.target.value)})}
                  min="0"
                />
              </div>
              <DialogFooter>
                <Button type="submit">Crear Configuración</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabla de Configuraciones */}
      <Card>
        <CardHeader>
          <CardTitle>Configuraciones Activas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Período</TableHead>
                <TableHead>Patrullas</TableHead>
                <TableHead>Acompañamientos</TableHead>
                <TableHead>Revistas</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {configuraciones.map((configuracion) => (
                <TableRow key={configuracion.id}>
                  <TableCell>{getMonthName(configuracion.month)} {configuracion.year}</TableCell>
                  <TableCell>{configuracion.patrullas_disponibles}</TableCell>
                  <TableCell>{configuracion.acompanamientos_disponibles}</TableCell>
                  <TableCell>{configuracion.revistas_disponibles}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(configuracion)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(configuracion.id)}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {configuraciones.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No hay configuraciones creadas. Cree la primera configuración.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumen del Mes Actual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Resumen del Mes Actual - {getMonthName(currentMonth)} {currentYear}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Patrullas */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    <span className="font-medium">Patrullas</span>
                  </div>
                  <Badge variant={serviciosEmpresa.patrullas_restantes === 0 ? 'destructive' : 'secondary'}>
                    {serviciosEmpresa.patrullas_usadas}/{serviciosEmpresa.patrullas_disponibles}
                  </Badge>
                </div>
                <Progress 
                  value={getProgress(serviciosEmpresa.patrullas_usadas, serviciosEmpresa.patrullas_disponibles)} 
                  className="mt-2"
                />
                <div className="text-sm text-muted-foreground mt-1">
                  {serviciosEmpresa.patrullas_restantes} restantes
                </div>
              </CardContent>
            </Card>

            {/* Acompañamientos */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <span className="font-medium">Acompañamientos</span>
                  </div>
                  <Badge variant={serviciosEmpresa.acompanamientos_restantes === 0 ? 'destructive' : 'secondary'}>
                    {serviciosEmpresa.acompanamientos_usados}/{serviciosEmpresa.acompanamientos_disponibles}
                  </Badge>
                </div>
                <Progress 
                  value={getProgress(serviciosEmpresa.acompanamientos_usados, serviciosEmpresa.acompanamientos_disponibles)} 
                  className="mt-2"
                />
                <div className="text-sm text-muted-foreground mt-1">
                  {serviciosEmpresa.acompanamientos_restantes} restantes
                </div>
              </CardContent>
            </Card>

            {/* Revistas */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-primary" />
                    <span className="font-medium">Revistas</span>
                  </div>
                  <Badge variant={serviciosEmpresa.revistas_restantes === 0 ? 'destructive' : 'secondary'}>
                    {serviciosEmpresa.revistas_usadas}/{serviciosEmpresa.revistas_disponibles}
                  </Badge>
                </div>
                <Progress 
                  value={getProgress(serviciosEmpresa.revistas_usadas, serviciosEmpresa.revistas_disponibles)} 
                  className="mt-2"
                />
                <div className="text-sm text-muted-foreground mt-1">
                  {serviciosEmpresa.revistas_restantes} restantes
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Servicios Utilizados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Servicios Utilizados - {getMonthName(currentMonth)} {currentYear}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {serviciosUtilizados.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay servicios utilizados este mes
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Tipo de Servicio</TableHead>
                  <TableHead>Tipo de Alarma</TableHead>
                  <TableHead>Operador</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {serviciosUtilizados.map((servicio) => (
                  <TableRow key={servicio.id}>
                    <TableCell>
                      {format(new Date(servicio.fecha_uso), 'dd/MM/yyyy HH:mm')}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{servicio.cliente_nombre}</div>
                        <div className="text-sm text-muted-foreground">{servicio.cliente_numero_cuenta}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {servicio.tipo_servicio}
                      </Badge>
                    </TableCell>
                    <TableCell>{servicio.tipo_alarma}</TableCell>
                    <TableCell>{servicio.operador_nombre}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal de Edición */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Configuración</DialogTitle>
            <DialogDescription>
              Modifique los servicios disponibles para este período
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-year">Año</Label>
                <Select value={formData.year.toString()} onValueChange={(value) => setFormData({...formData, year: parseInt(value)})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[currentYear - 1, currentYear, currentYear + 1].map(year => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-month">Mes</Label>
                <Select value={formData.month.toString()} onValueChange={(value) => setFormData({...formData, month: parseInt(value)})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({length: 12}, (_, i) => i + 1).map(month => (
                      <SelectItem key={month} value={month.toString()}>{getMonthName(month)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-patrullas">Patrullas Disponibles</Label>
              <Input
                type="number"
                value={formData.patrullas_disponibles}
                onChange={(e) => setFormData({...formData, patrullas_disponibles: parseInt(e.target.value)})}
                min="0"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-acompanamientos">Acompañamientos Disponibles</Label>
              <Input
                type="number"
                value={formData.acompanamientos_disponibles}
                onChange={(e) => setFormData({...formData, acompanamientos_disponibles: parseInt(e.target.value)})}
                min="0"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-revistas">Revistas Disponibles</Label>
              <Input
                type="number"
                value={formData.revistas_disponibles}
                onChange={(e) => setFormData({...formData, revistas_disponibles: parseInt(e.target.value)})}
                min="0"
              />
            </div>
            <DialogFooter>
              <Button type="submit">Actualizar Configuración</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Sección de Personal Asignado */}
      <div className="grid md:grid-cols-2 gap-6 mt-6">
        {/* Despachadores */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Despachadores Asignados
            </CardTitle>
            <CardDescription>
              Selecciona los despachadores que pertenecen a esta empresa
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingUsuarios ? (
              <p className="text-sm text-muted-foreground">Cargando despachadores...</p>
            ) : despachadores.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay despachadores disponibles</p>
            ) : (
              <div className="space-y-3">
                {despachadores.map((despachador) => {
                  const isAsignado = despachador.empresa_contratada_id === empresaId;
                  const perteneceOtraEmpresa = despachador.empresa_contratada_id && despachador.empresa_contratada_id !== empresaId;
                  
                  return (
                    <div key={despachador.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-accent">
                      <Checkbox
                        id={`desp-${despachador.id}`}
                        checked={isAsignado}
                        disabled={perteneceOtraEmpresa}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            asignarUsuarioAEmpresa(despachador.id, empresaId!);
                          } else {
                            desasignarUsuarioDeEmpresa(despachador.id);
                          }
                        }}
                      />
                      <label
                        htmlFor={`desp-${despachador.id}`}
                        className={`flex-1 text-sm cursor-pointer ${perteneceOtraEmpresa ? 'text-muted-foreground' : ''}`}
                      >
                        <div className="font-medium">{despachador.full_name}</div>
                        <div className="text-xs text-muted-foreground">{despachador.email}</div>
                        {perteneceOtraEmpresa && (
                          <div className="text-xs text-amber-600 mt-1">Asignado a otra empresa</div>
                        )}
                      </label>
                      {isAsignado && (
                        <UserCheck className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Supervisores */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Supervisores Asignados
            </CardTitle>
            <CardDescription>
              Selecciona los supervisores que pertenecen a esta empresa
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingUsuarios ? (
              <p className="text-sm text-muted-foreground">Cargando supervisores...</p>
            ) : supervisores.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay supervisores disponibles</p>
            ) : (
              <div className="space-y-3">
                {supervisores.map((supervisor) => {
                  const isAsignado = supervisor.empresa_contratada_id === empresaId;
                  const perteneceOtraEmpresa = supervisor.empresa_contratada_id && supervisor.empresa_contratada_id !== empresaId;
                  
                  return (
                    <div key={supervisor.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-accent">
                      <Checkbox
                        id={`sup-${supervisor.id}`}
                        checked={isAsignado}
                        disabled={perteneceOtraEmpresa}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            asignarUsuarioAEmpresa(supervisor.id, empresaId!);
                          } else {
                            desasignarUsuarioDeEmpresa(supervisor.id);
                          }
                        }}
                      />
                      <label
                        htmlFor={`sup-${supervisor.id}`}
                        className={`flex-1 text-sm cursor-pointer ${perteneceOtraEmpresa ? 'text-muted-foreground' : ''}`}
                      >
                        <div className="font-medium">{supervisor.full_name}</div>
                        <div className="text-xs text-muted-foreground">{supervisor.email}</div>
                        {perteneceOtraEmpresa && (
                          <div className="text-xs text-amber-600 mt-1">Asignado a otra empresa</div>
                        )}
                      </label>
                      {isAsignado && (
                        <UserCheck className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};