import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSupabaseClientes } from "@/hooks/useSupabaseClientes";
import { useAuthConsolidated } from "@/hooks/useAuthConsolidated";
import { useEmpresasContratadas } from "@/hooks/useEmpresasContratadas";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building, MapPin, Plus, QrCode, Download, Eye, Edit, Power, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import QRCode from 'qrcode';

interface ClienteFormData {
  id_numerico: string;
  nombre: string;
  direccion: string;
  municipio: string;
  ciudad: string;
  departamento: string;
  latitud: string;
  longitud: string;
  contacto_alarma_nombre: string;
  contacto_alarma_celular: string;
  cantidad_patrullas: string;
  cantidad_revistas: string;
  cantidad_smarturban: string;
  empresa_contratada_id: string;
}

const ClientesDirCentral = () => {
  const { clientes, loading, addCliente, updateCliente, deleteCliente, refetch } = useSupabaseClientes();
  const { empresas } = useEmpresasContratadas();
  const { user } = useAuthConsolidated();
  const [showModal, setShowModal] = useState(false);
  const [editingCliente, setEditingCliente] = useState<any>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [selectedCliente, setSelectedCliente] = useState<any>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [formData, setFormData] = useState<ClienteFormData>({
    id_numerico: '',
    nombre: '',
    direccion: '',
    municipio: '',
    ciudad: '',
    departamento: '',
    latitud: '',
    longitud: '',
    contacto_alarma_nombre: '',
    contacto_alarma_celular: '',
    cantidad_patrullas: '',
    cantidad_revistas: '',
    cantidad_smarturban: '',
    empresa_contratada_id: 'none'
  });

  const handleInputChange = (field: keyof ClienteFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Función para extraer coordenadas de las observaciones
  const extractCoordinate = (observaciones: string | undefined, type: 'lat' | 'lng'): string => {
    if (!observaciones) return '';
    
    const coordMatch = observaciones.match(/Coordenadas: ([^,]+), (.+?)(?:,|$)/);
    if (coordMatch) {
      return type === 'lat' ? coordMatch[1].trim() : coordMatch[2].trim();
    }
    return '';
  };

  const generateQRCode = async (cliente: any) => {
    try {
      const qrData = {
        id_cliente: cliente.id_numerico || cliente.numero_cuenta,
        coordenadas: {
          latitud: cliente.latitud,
          longitud: cliente.longitud
        },
        nombre: cliente.nombre,
        direccion: cliente.direccion
      };

      const qrString = JSON.stringify(qrData);
      const qrCodeDataUrl = await QRCode.toDataURL(qrString, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      setQrCodeUrl(qrCodeDataUrl);
      setSelectedCliente(cliente);
      setShowQrModal(true);
    } catch (error) {
      console.error('Error generando QR:', error);
      toast({
        title: "Error",
        description: "No se pudo generar el código QR",
        variant: "destructive"
      });
    }
  };

  const downloadQR = () => {
    const link = document.createElement('a');
    link.download = `QR-Cliente-${selectedCliente?.numero_cuenta || selectedCliente?.id_numerico}.png`;
    link.href = qrCodeUrl;
    link.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre || !formData.direccion) {
      toast({
        title: "Error",
        description: "Nombre y dirección son campos requeridos",
        variant: "destructive"
      });
      return;
    }

    try {
      const clienteData = {
        numero_cuenta: formData.id_numerico || undefined,
        nombre: formData.nombre,
        direccion: formData.direccion,
        municipio: formData.municipio || '',
        email: formData.contacto_alarma_nombre || undefined,
        estado: 'activo',
        empresa_contratada_id: formData.empresa_contratada_id !== 'none' ? formData.empresa_contratada_id : undefined,
        observaciones: `Ciudad: ${formData.ciudad}, Departamento: ${formData.departamento}, Contacto Alarma: ${formData.contacto_alarma_nombre} - ${formData.contacto_alarma_celular}, Coordenadas: ${formData.latitud}, ${formData.longitud}, Patrullas: ${formData.cantidad_patrullas}, Revistas: ${formData.cantidad_revistas}, SmartUrban: ${formData.cantidad_smarturban}`,
        servicios_contratados: {
          alarmas: 0,
          revistas: parseInt(formData.cantidad_revistas) || 0,
          acompañamientos: parseInt(formData.cantidad_patrullas) || 0,
          smarturban: parseInt(formData.cantidad_smarturban) || 0
        }
      };

      if (editingCliente) {
        await updateCliente(editingCliente.id, clienteData);
        toast({
          title: "Cliente actualizado",
          description: "El cliente ha sido actualizado exitosamente"
        });
      } else {
        const nuevoCliente = await addCliente(clienteData);
        
        if (nuevoCliente) {
          toast({
            title: "Cliente creado",
            description: "El cliente ha sido registrado exitosamente"
          });

          // Generar QR automáticamente
          const clienteParaQR = {
            ...nuevoCliente,
            id_numerico: formData.id_numerico,
            ciudad: formData.ciudad,
            departamento: formData.departamento,
            contacto_alarma_nombre: formData.contacto_alarma_nombre,
            contacto_alarma_celular: formData.contacto_alarma_celular,
            latitud: formData.latitud,
            longitud: formData.longitud
          };
          await generateQRCode(clienteParaQR);
        }
      }

      // Limpiar formulario
      setFormData({
        id_numerico: '',
        nombre: '',
        direccion: '',
        municipio: '',
        ciudad: '',
        departamento: '',
        latitud: '',
        longitud: '',
        contacto_alarma_nombre: '',
        contacto_alarma_celular: '',
        cantidad_patrullas: '',
        cantidad_revistas: '',
        cantidad_smarturban: '',
        empresa_contratada_id: 'none'
      });
      setShowModal(false);
      setEditingCliente(null);
      refetch();
    } catch (error) {
      console.error('Error con cliente:', error);
      toast({
        title: "Error",
        description: editingCliente ? "No se pudo actualizar el cliente" : "No se pudo crear el cliente",
        variant: "destructive"
      });
    }
  };

  const handleEditCliente = (cliente: any) => {
    const observacionesData = cliente.observaciones || '';
    
    // Extraer datos de observaciones
    const extractFromObservaciones = (text: string, field: string) => {
      const regex = new RegExp(`${field}: ([^,]+)`);
      const match = text.match(regex);
      return match ? match[1].trim() : '';
    };
    
    const contactoAlarma = cliente.email || extractFromObservaciones(observacionesData, 'Contacto Alarma');
    const [contactoNombre, contactoCelular] = contactoAlarma.includes(' - ') ? 
      contactoAlarma.split(' - ') : [contactoAlarma, ''];

    setFormData({
      id_numerico: cliente.numero_cuenta || '',
      nombre: cliente.nombre || '',
      direccion: cliente.direccion || '',
      municipio: cliente.municipio || '',
      ciudad: extractFromObservaciones(observacionesData, 'Ciudad'),
      departamento: extractFromObservaciones(observacionesData, 'Departamento'),
      latitud: extractCoordinate(cliente.observaciones, 'lat'),
      longitud: extractCoordinate(cliente.observaciones, 'lng'),
      contacto_alarma_nombre: contactoNombre,
      contacto_alarma_celular: contactoCelular,
      cantidad_patrullas: extractFromObservaciones(observacionesData, 'Patrullas') || (cliente.servicios_contratados?.acompañamientos?.toString() || ''),
      cantidad_revistas: extractFromObservaciones(observacionesData, 'Revistas') || (cliente.servicios_contratados?.revistas?.toString() || ''),
      cantidad_smarturban: extractFromObservaciones(observacionesData, 'SmartUrban') || (cliente.servicios_contratados?.smarturban?.toString() || ''),
      empresa_contratada_id: cliente.empresa_contratada_id || 'none'
    });
    
    setEditingCliente(cliente);
    setShowModal(true);
  };

  const handleToggleEstado = async (cliente: any) => {
    try {
      const nuevoEstado = cliente.estado === 'activo' ? 'inactivo' : 'activo';
      await updateCliente(cliente.id, { estado: nuevoEstado });
      toast({
        title: "Estado actualizado",
        description: `Cliente ${nuevoEstado === 'activo' ? 'activado' : 'desactivado'} exitosamente`
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cambiar el estado del cliente",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCliente = async (cliente: any) => {
    if (window.confirm(`¿Estás seguro de eliminar el cliente "${cliente.nombre}"?`)) {
      try {
        await deleteCliente(cliente.id);
        toast({
          title: "Cliente eliminado",
          description: "El cliente ha sido eliminado exitosamente"
        });
        refetch();
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo eliminar el cliente",
          variant: "destructive"
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded w-2/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="h-48 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building className="h-8 w-8" />
            Gestión de Clientes
          </h1>
          <p className="text-muted-foreground">
            Registro y gestión de clientes con códigos QR
          </p>
        </div>
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingCliente ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="id_numerico">ID Numérico</Label>
                  <Input
                    id="id_numerico"
                    value={formData.id_numerico}
                    onChange={(e) => handleInputChange('id_numerico', e.target.value)}
                    placeholder="Ej: 001, 002, etc."
                  />
                </div>

                <div>
                  <Label htmlFor="nombre">Razón Social *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => handleInputChange('nombre', e.target.value)}
                    placeholder="Nombre del cliente"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="direccion">Dirección *</Label>
                  <Input
                    id="direccion"
                    value={formData.direccion}
                    onChange={(e) => handleInputChange('direccion', e.target.value)}
                    placeholder="Dirección completa"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="municipio">Municipio</Label>
                  <Input
                    id="municipio"
                    value={formData.municipio}
                    onChange={(e) => handleInputChange('municipio', e.target.value)}
                    placeholder="Municipio"
                  />
                </div>

                <div>
                  <Label htmlFor="ciudad">Ciudad</Label>
                  <Input
                    id="ciudad"
                    value={formData.ciudad}
                    onChange={(e) => handleInputChange('ciudad', e.target.value)}
                    placeholder="Ciudad"
                  />
                </div>

                <div>
                  <Label htmlFor="departamento">Departamento</Label>
                  <Input
                    id="departamento"
                    value={formData.departamento}
                    onChange={(e) => handleInputChange('departamento', e.target.value)}
                    placeholder="Departamento"
                  />
                </div>

                <div>
                  <Label htmlFor="contacto_alarma_nombre">Contacto Alarma - Nombre</Label>
                  <Input
                    id="contacto_alarma_nombre"
                    value={formData.contacto_alarma_nombre}
                    onChange={(e) => handleInputChange('contacto_alarma_nombre', e.target.value)}
                    placeholder="Nombre del contacto"
                  />
                </div>

                <div>
                  <Label htmlFor="contacto_alarma_celular">Contacto Alarma - Celular</Label>
                  <Input
                    id="contacto_alarma_celular"
                    value={formData.contacto_alarma_celular}
                    onChange={(e) => handleInputChange('contacto_alarma_celular', e.target.value)}
                    placeholder="Número celular"
                  />
                </div>

                <div>
                  <Label htmlFor="cantidad_patrullas">Cantidad de Patrullas</Label>
                  <Input
                    id="cantidad_patrullas"
                    value={formData.cantidad_patrullas}
                    onChange={(e) => handleInputChange('cantidad_patrullas', e.target.value)}
                    placeholder="Número de patrullas contratadas"
                    type="number"
                    min="0"
                  />
                </div>

                <div>
                  <Label htmlFor="cantidad_revistas">Cantidad de Revistas</Label>
                  <Input
                    id="cantidad_revistas"
                    value={formData.cantidad_revistas}
                    onChange={(e) => handleInputChange('cantidad_revistas', e.target.value)}
                    placeholder="Número de revistas pagas"
                    type="number"
                    min="0"
                  />
                </div>

                <div>
                  <Label htmlFor="cantidad_smarturban">Cantidad de Llamadas SmartUrban</Label>
                  <Input
                    id="cantidad_smarturban"
                    value={formData.cantidad_smarturban}
                    onChange={(e) => handleInputChange('cantidad_smarturban', e.target.value)}
                    placeholder="Número de llamadas SmartUrban"
                    type="number"
                    min="0"
                  />
                </div>

                <div>
                  <Label htmlFor="latitud">Latitud</Label>
                  <Input
                    id="latitud"
                    value={formData.latitud}
                    onChange={(e) => handleInputChange('latitud', e.target.value)}
                    placeholder="Ej: 4.6097"
                    type="number"
                    step="any"
                  />
                </div>

                <div>
                  <Label htmlFor="longitud">Longitud</Label>
                  <Input
                    id="longitud"
                    value={formData.longitud}
                    onChange={(e) => handleInputChange('longitud', e.target.value)}
                    placeholder="Ej: -74.0817"
                    type="number"
                    step="any"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="empresa_contratada_id">Empresa Contratada</Label>
                  <Select
                    value={formData.empresa_contratada_id}
                    onValueChange={(value) => handleInputChange('empresa_contratada_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar empresa contratada" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin empresa asignada</SelectItem>
                      {empresas.map((empresa) => (
                        <SelectItem key={empresa.id} value={empresa.id}>
                          {empresa.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowModal(false);
                    setEditingCliente(null);
                    setFormData({
                      id_numerico: '',
                      nombre: '',
                      direccion: '',
                      municipio: '',
                      ciudad: '',
                      departamento: '',
                      latitud: '',
                      longitud: '',
                      contacto_alarma_nombre: '',
                      contacto_alarma_celular: '',
                      cantidad_patrullas: '',
                      cantidad_revistas: '',
                      cantidad_smarturban: '',
                      empresa_contratada_id: 'none'
                    });
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingCliente ? 'Actualizar Cliente' : 'Guardar Cliente'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientes.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Con Coordenadas</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clientes.filter(c => c.observaciones?.includes('Coordenadas:')).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activos</CardTitle>
            <Building className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {clientes.filter(c => c.estado === 'activo').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactivos</CardTitle>
            <Power className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {clientes.filter(c => c.estado === 'inactivo').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de clientes */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          {clientes.length === 0 ? (
            <div className="py-8 text-center">
              <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay clientes registrados</h3>
              <p className="text-muted-foreground">
                Los clientes que registres aparecerán aquí.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cuenta</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Dirección</TableHead>
                  <TableHead>Municipio</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Coordenadas</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientes.map((cliente) => (
                  <TableRow key={cliente.id}>
                    <TableCell className="font-medium">
                      {cliente.numero_cuenta || 'N/A'}
                    </TableCell>
                    <TableCell>{cliente.nombre}</TableCell>
                    <TableCell>{cliente.direccion}</TableCell>
                    <TableCell>{cliente.municipio || 'N/A'}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        cliente.estado === 'activo' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {cliente.estado}
                      </span>
                    </TableCell>
                    <TableCell>
                      {cliente.observaciones?.includes('Coordenadas:') ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs">
                            {extractCoordinate(cliente.observaciones, 'lat')}, {extractCoordinate(cliente.observaciones, 'lng')}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => generateQRCode({
                              ...cliente,
                              latitud: extractCoordinate(cliente.observaciones, 'lat'),
                              longitud: extractCoordinate(cliente.observaciones, 'lng')
                            })}
                          >
                            <QrCode className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        'Sin coordenadas'
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditCliente(cliente)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleEstado(cliente)}
                          className={cliente.estado === 'activo' ? 'text-red-600' : 'text-green-600'}
                        >
                          <Power className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteCliente(cliente)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-3 w-3" />
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

      {/* Modal QR Code */}
      <Dialog open={showQrModal} onOpenChange={setShowQrModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Código QR - {selectedCliente?.nombre}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-center">
            {qrCodeUrl && (
              <div>
                <img 
                  src={qrCodeUrl} 
                  alt="Código QR" 
                  className="mx-auto border rounded"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Código QR con información del cliente
                </p>
              </div>
            )}
            <div className="flex justify-center gap-2">
              <Button onClick={downloadQR}>
                <Download className="h-4 w-4 mr-2" />
                Descargar QR
              </Button>
              <Button variant="outline" onClick={() => setShowQrModal(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientesDirCentral;