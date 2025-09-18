import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { exportQRToPDF } from '@/utils/exportUtils';
import { Loader2, FileText, QrCode } from 'lucide-react';

interface Cliente {
  id: string;
  nombre: string;
  direccion: string;
  numero_cuenta?: string;
  latitud?: number;
  longitud?: number;
}

interface QRReportGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  clientes: Cliente[];
}

const QR_LAYOUTS = [
  { value: '1', label: '1 QR por página', description: 'Máximo tamaño, ideal para visualización' },
  { value: '2', label: '2 QRs por página', description: 'Tamaño grande, fácil lectura' },
  { value: '4', label: '4 QRs por página', description: 'Tamaño medio, balance entre tamaño y cantidad' },
  { value: '6', label: '6 QRs por página', description: 'Tamaño compacto, buena legibilidad' },
  { value: '9', label: '9 QRs por página', description: 'Tamaño pequeño, máxima eficiencia' },
  { value: '12', label: '12 QRs por página', description: 'Tamaño mínimo recomendado' }
];

export const QRReportGenerator: React.FC<QRReportGeneratorProps> = ({
  isOpen,
  onClose,
  clientes
}) => {
  const [selectedClientes, setSelectedClientes] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [layout, setLayout] = useState('4');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedClientes(clientes.map(c => c.id));
    } else {
      setSelectedClientes([]);
    }
  };

  const handleClienteSelect = (clienteId: string, checked: boolean) => {
    if (checked) {
      setSelectedClientes(prev => [...prev, clienteId]);
    } else {
      setSelectedClientes(prev => prev.filter(id => id !== clienteId));
      setSelectAll(false);
    }
  };

  const handleGenerateReport = async () => {
    if (selectedClientes.length === 0) {
      toast({
        title: "Error",
        description: "Debe seleccionar al menos un cliente",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const clientesSeleccionados = clientes.filter(c => 
        selectedClientes.includes(c.id)
      );
      
      await exportQRToPDF(clientesSeleccionados, parseInt(layout));
      
      toast({
        title: "¡Éxito!",
        description: `Reporte QR generado con ${selectedClientes.length} códigos`,
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo generar el reporte QR",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const selectedLayout = QR_LAYOUTS.find(l => l.value === layout);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Generar Reporte QR para Impresión
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Layout Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Configuración del Layout</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="layout">QRs por página</Label>
                <Select value={layout} onValueChange={setLayout}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar layout" />
                  </SelectTrigger>
                  <SelectContent>
                    {QR_LAYOUTS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex flex-col">
                          <span className="font-medium">{option.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {option.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedLayout && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm">
                    <strong>Layout seleccionado:</strong> {selectedLayout.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedLayout.description}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Client Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center justify-between">
                Selección de Clientes
                <span className="text-xs font-normal text-muted-foreground">
                  {selectedClientes.length} de {clientes.length} seleccionados
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="select-all"
                  checked={selectAll}
                  onCheckedChange={handleSelectAll}
                />
                <Label htmlFor="select-all" className="font-medium">
                  Seleccionar todos los clientes
                </Label>
              </div>

              <div className="max-h-60 overflow-auto border rounded-md p-2 space-y-2">
                {clientes.map(cliente => (
                  <div key={cliente.id} className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded">
                    <Checkbox
                      id={`cliente-${cliente.id}`}
                      checked={selectedClientes.includes(cliente.id)}
                      onCheckedChange={(checked) => 
                        handleClienteSelect(cliente.id, checked as boolean)
                      }
                    />
                    <Label 
                      htmlFor={`cliente-${cliente.id}`}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{cliente.nombre}</span>
                        <span className="text-xs text-muted-foreground">
                          Cuenta: {cliente.numero_cuenta} | {cliente.direccion}
                        </span>
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Preview Info */}
          {selectedClientes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Vista Previa del Reporte</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Clientes seleccionados:</strong> {selectedClientes.length}
                  </div>
                  <div>
                    <strong>QRs por página:</strong> {layout}
                  </div>
                  <div>
                    <strong>Páginas estimadas:</strong> {Math.ceil(selectedClientes.length / parseInt(layout))}
                  </div>
                  <div>
                    <strong>Total QRs:</strong> {selectedClientes.length}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              onClick={handleGenerateReport}
              disabled={selectedClientes.length === 0 || isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Generar PDF
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};