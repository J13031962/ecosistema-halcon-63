import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Shield, Plus, Edit, Trash2, Calendar, Users, Car } from 'lucide-react';
import { useSupabasePatrullasCoraza, PatrullaCorazaData } from '@/hooks/useSupabasePatrullasCoraza';
import { useSupabaseClientes } from '@/hooks/useSupabaseClientes';

const PatrullasCoraza = () => {
  const { 
    patrullasCoraza, 
    loading, 
    createPatrullaCoraza, 
    updatePatrullaCoraza, 
    deletePatrullaCoraza 
  } = useSupabasePatrullasCoraza();
  const { clientes } = useSupabaseClientes();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPatrulla, setSelectedPatrulla] = useState<PatrullaCorazaData | null>(null);
  
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [formData, setFormData] = useState<PatrullaCorazaData>({
    cliente_id: '',
    year: currentYear,
    month: currentMonth,
    patrullas_disponibles: 0,
    acompanamientos_disponibles: 0,
    revistas_disponibles: 0
  });

  const handleCreateSubmit = async () => {
    const result = await createPatrullaCoraza(formData);
    if (result.success) {
      setIsCreateModalOpen(false);
      setFormData({
        cliente_id: '',
        year: currentYear,
        month: currentMonth,
        patrullas_disponibles: 0,
        acompanamientos_disponibles: 0,
        revistas_disponibles: 0
      });
    }
  };

  const handleEditSubmit = async () => {
    if (!selectedPatrulla?.id) return;
    
    const result = await updatePatrullaCoraza(selectedPatrulla.id, formData);
    if (result.success) {
      setIsEditModalOpen(false);
      setSelectedPatrulla(null);
    }
  };

  const handleEdit = (patrulla: any) => {
    setSelectedPatrulla(patrulla);
    setFormData({
      cliente_id: patrulla.cliente_id,
      year: patrulla.year,
      month: patrulla.month,
      patrullas_disponibles: patrulla.patrullas_disponibles,
      acompanamientos_disponibles: patrulla.acompanamientos_disponibles,
      revistas_disponibles: patrulla.revistas_disponibles
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Está seguro de eliminar esta configuración?')) {
      await deletePatrullaCoraza(id);
    }
  };

  const getMonthName = (month: number) => {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[month - 1] || '';
  };

  const getProgress = (usado: number, disponible: number) => {
    if (disponible === 0) return 0;
    return Math.min((usado / disponible) * 100, 100);
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 90) return 'bg-red-500';
    if (progress >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            PATRULLAS CORAZA
          </h1>
          <p className="text-muted-foreground">
            Gestión de servicios disponibles por cliente y mes
          </p>
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
              <DialogTitle>Nueva Configuración de Patrullas</DialogTitle>
              <DialogDescription>
                Configure los servicios disponibles para un cliente específico
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="cliente">Cliente</Label>
                <Select value={formData.cliente_id} onValueChange={(value) => setFormData({...formData, cliente_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((cliente) => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        {cliente.nombre} ({cliente.numero_cuenta})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="year">Año</Label>
                  <Input
                    id="year"
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="month">Mes</Label>
                  <Select value={formData.month.toString()} onValueChange={(value) => setFormData({...formData, month: parseInt(value)})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({length: 12}, (_, i) => i + 1).map((month) => (
                        <SelectItem key={month} value={month.toString()}>
                          {getMonthName(month)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="patrullas">Patrullas Disponibles</Label>
                <Input
                  id="patrullas"
                  type="number"
                  min="0"
                  value={formData.patrullas_disponibles}
                  onChange={(e) => setFormData({...formData, patrullas_disponibles: parseInt(e.target.value) || 0})}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="acompanamientos">Acompañamientos Disponibles</Label>
                <Input
                  id="acompanamientos"
                  type="number"
                  min="0"
                  value={formData.acompanamientos_disponibles}
                  onChange={(e) => setFormData({...formData, acompanamientos_disponibles: parseInt(e.target.value) || 0})}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="revistas">Revistas Disponibles</Label>
                <Input
                  id="revistas"
                  type="number"
                  min="0"
                  value={formData.revistas_disponibles}
                  onChange={(e) => setFormData({...formData, revistas_disponibles: parseInt(e.target.value) || 0})}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateSubmit}>
                Crear Configuración
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Configuraciones Activas</span>
            <Badge variant="outline">
              {patrullasCoraza.length} configuración{patrullasCoraza.length !== 1 ? 'es' : ''}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Cargando configuraciones...</p>
            </div>
          ) : patrullasCoraza.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No hay configuraciones creadas</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Patrullas</TableHead>
                  <TableHead>Acompañamientos</TableHead>
                  <TableHead>Revistas</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patrullasCoraza.map((patrulla: any) => (
                  <TableRow key={patrulla.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{patrulla.clientes?.nombre}</p>
                        <p className="text-sm text-muted-foreground">{patrulla.clientes?.numero_cuenta}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {getMonthName(patrulla.month)} {patrulla.year}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{patrulla.patrullas_usadas || 0} / {patrulla.patrullas_disponibles}</span>
                          <span>{getProgress(patrulla.patrullas_usadas || 0, patrulla.patrullas_disponibles).toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${getProgressColor(getProgress(patrulla.patrullas_usadas || 0, patrulla.patrullas_disponibles))}`}
                            style={{ width: `${getProgress(patrulla.patrullas_usadas || 0, patrulla.patrullas_disponibles)}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{patrulla.acompanamientos_usados || 0} / {patrulla.acompanamientos_disponibles}</span>
                          <span>{getProgress(patrulla.acompanamientos_usados || 0, patrulla.acompanamientos_disponibles).toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${getProgressColor(getProgress(patrulla.acompanamientos_usados || 0, patrulla.acompanamientos_disponibles))}`}
                            style={{ width: `${getProgress(patrulla.acompanamientos_usados || 0, patrulla.acompanamientos_disponibles)}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{patrulla.revistas_usadas || 0} / {patrulla.revistas_disponibles}</span>
                          <span>{getProgress(patrulla.revistas_usadas || 0, patrulla.revistas_disponibles).toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${getProgressColor(getProgress(patrulla.revistas_usadas || 0, patrulla.revistas_disponibles))}`}
                            style={{ width: `${getProgress(patrulla.revistas_usadas || 0, patrulla.revistas_disponibles)}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(patrulla)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(patrulla.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
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
            <DialogTitle>Editar Configuración de Patrullas</DialogTitle>
            <DialogDescription>
              Modifique los servicios disponibles para este cliente
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="cliente-edit">Cliente</Label>
              <Select value={formData.cliente_id} onValueChange={(value) => setFormData({...formData, cliente_id: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.nombre} ({cliente.numero_cuenta})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="year-edit">Año</Label>
                <Input
                  id="year-edit"
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="month-edit">Mes</Label>
                <Select value={formData.month.toString()} onValueChange={(value) => setFormData({...formData, month: parseInt(value)})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({length: 12}, (_, i) => i + 1).map((month) => (
                      <SelectItem key={month} value={month.toString()}>
                        {getMonthName(month)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="patrullas-edit">Patrullas Disponibles</Label>
              <Input
                id="patrullas-edit"
                type="number"
                min="0"
                value={formData.patrullas_disponibles}
                onChange={(e) => setFormData({...formData, patrullas_disponibles: parseInt(e.target.value) || 0})}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="acompanamientos-edit">Acompañamientos Disponibles</Label>
              <Input
                id="acompanamientos-edit"
                type="number"
                min="0"
                value={formData.acompanamientos_disponibles}
                onChange={(e) => setFormData({...formData, acompanamientos_disponibles: parseInt(e.target.value) || 0})}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="revistas-edit">Revistas Disponibles</Label>
              <Input
                id="revistas-edit"
                type="number"
                min="0"
                value={formData.revistas_disponibles}
                onChange={(e) => setFormData({...formData, revistas_disponibles: parseInt(e.target.value) || 0})}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditSubmit}>
              Actualizar Configuración
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PatrullasCoraza;