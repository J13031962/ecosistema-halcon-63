import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Shield, Plus, Edit, Trash2, Calendar, Users, Car, Eye } from 'lucide-react';
import { useSupabasePatrullasCoraza, PatrullaCorazaData } from '@/hooks/useSupabasePatrullasCoraza';

const PatrullasCoraza = () => {
  const { 
    patrullasCoraza, 
    serviciosUtilizados,
    loading, 
    createPatrullaCoraza, 
    updatePatrullaCoraza, 
    deletePatrullaCoraza,
    getServiciosGlobalesMes,
    fetchHistorialServicios
  } = useSupabasePatrullasCoraza();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPatrulla, setSelectedPatrulla] = useState<PatrullaCorazaData | null>(null);
  
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [serviciosGlobales, setServiciosGlobales] = useState<any>(null);

  const [formData, setFormData] = useState<PatrullaCorazaData>({
    cliente_id: null, // Configuración global
    year: currentYear,
    month: currentMonth,
    patrullas_disponibles: 0,
    acompanamientos_disponibles: 0,
    revistas_disponibles: 0
  });

  const fetchServiciosGlobales = async () => {
    const servicios = await getServiciosGlobalesMes(currentYear, currentMonth);
    setServiciosGlobales(servicios);
  };

  useEffect(() => {
    fetchServiciosGlobales();
  }, [patrullasCoraza]);

  const handleCreateSubmit = async () => {
    const result = await createPatrullaCoraza(formData);
    if (result.success) {
      setIsCreateModalOpen(false);
      setFormData({
        cliente_id: null,
        year: currentYear,
        month: currentMonth,
        patrullas_disponibles: 0,
        acompanamientos_disponibles: 0,
        revistas_disponibles: 0
      });
      await fetchServiciosGlobales();
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
      cliente_id: null, // Siempre global
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
            Gestión global de servicios disponibles por mes
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
              <DialogTitle>Nueva Configuración Global</DialogTitle>
              <DialogDescription>
                Configure los servicios disponibles globalmente para el mes
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800 font-medium">Configuración Global</p>
                <p className="text-xs text-blue-600">
                  Esta configuración aplicará para todos los clientes del sistema
                </p>
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
                  <TableHead>Tipo</TableHead>
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
                      <Badge variant="default" className="bg-blue-600">
                        Global
                      </Badge>
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

      {/* Resumen de servicios globales */}
      {serviciosGlobales && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Resumen del Mes Actual</span>
              <Badge variant="outline">
                {getMonthName(currentMonth)} {currentYear}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <Car className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">Patrullas</span>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold">
                    {serviciosGlobales.patrullas_restantes} / {serviciosGlobales.patrullas_disponibles}
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${getProgressColor(getProgress(serviciosGlobales.patrullas_usadas, serviciosGlobales.patrullas_disponibles))}`}
                      style={{ width: `${getProgress(serviciosGlobales.patrullas_usadas, serviciosGlobales.patrullas_disponibles)}%` }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {serviciosGlobales.patrullas_usadas} utilizadas
                  </p>
                </div>
              </div>

              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <Users className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Acompañamientos</span>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold">
                    {serviciosGlobales.acompanamientos_restantes} / {serviciosGlobales.acompanamientos_disponibles}
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${getProgressColor(getProgress(serviciosGlobales.acompanamientos_usados, serviciosGlobales.acompanamientos_disponibles))}`}
                      style={{ width: `${getProgress(serviciosGlobales.acompanamientos_usados, serviciosGlobales.acompanamientos_disponibles)}%` }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {serviciosGlobales.acompanamientos_usados} utilizados
                  </p>
                </div>
              </div>

              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <Eye className="h-5 w-5 text-purple-600" />
                  <span className="font-medium">Revistas</span>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold">
                    {serviciosGlobales.revistas_restantes} / {serviciosGlobales.revistas_disponibles}
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${getProgressColor(getProgress(serviciosGlobales.revistas_usadas, serviciosGlobales.revistas_disponibles))}`}
                      style={{ width: `${getProgress(serviciosGlobales.revistas_usadas, serviciosGlobales.revistas_disponibles)}%` }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {serviciosGlobales.revistas_usadas} utilizadas
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Historial de servicios utilizados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Servicios Utilizados</span>
            <Badge variant="outline">
              {serviciosUtilizados.length} registros
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {serviciosUtilizados.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No hay servicios utilizados este mes</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha/Hora</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Tipo Servicio</TableHead>
                  <TableHead>Tipo Alarma</TableHead>
                  <TableHead>Operador</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {serviciosUtilizados.map((servicio) => (
                  <TableRow key={servicio.id}>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">
                          {new Date(servicio.fecha_uso).toLocaleDateString('es-ES')}
                        </div>
                        <div className="text-muted-foreground">
                          {new Date(servicio.fecha_uso).toLocaleTimeString('es-ES', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{servicio.cliente_nombre}</p>
                        <p className="text-sm text-muted-foreground">{servicio.cliente_numero_cuenta}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {servicio.tipo_servicio}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {servicio.tipo_alarma}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{servicio.operador_nombre || 'N/A'}</span>
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
            <DialogTitle>Editar Configuración Global</DialogTitle>
            <DialogDescription>
              Modifique los servicios disponibles globalmente
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800 font-medium">Configuración Global</p>
              <p className="text-xs text-blue-600">
                Esta configuración aplicará para todos los clientes del sistema
              </p>
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