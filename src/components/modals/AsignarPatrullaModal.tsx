import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Car, MapPin, User, Clock } from "lucide-react";
import { Alarm } from "@/contexts/AlarmasContext";

interface Supervisor {
  id: string;
  name: string;
  status: 'Disponible' | 'En Servicio' | 'Ocupado';
  currentLocation: string;
  patrullaUnit: string;
}

interface AsignarPatrullaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alarm: any | null;
  onAssign: (alarmId: string, supervisor: Supervisor) => void;
}

const supervisores: Supervisor[] = [
  { id: "1", name: "Supervisor García", status: "Disponible", currentLocation: "Zona Norte", patrullaUnit: "P-001" },
  { id: "2", name: "Supervisor Martínez", status: "Disponible", currentLocation: "Zona Centro", patrullaUnit: "P-002" },
  { id: "3", name: "Supervisor López", status: "En Servicio", currentLocation: "Zona Sur", patrullaUnit: "P-003" },
  { id: "4", name: "Supervisor Rivera", status: "Disponible", currentLocation: "Zona Este", patrullaUnit: "P-004" },
  { id: "5", name: "Supervisor Herrera", status: "Ocupado", currentLocation: "Zona Oeste", patrullaUnit: "P-005" },
  { id: "6", name: "Supervisor Morales", status: "Disponible", currentLocation: "Zona Industrial", patrullaUnit: "P-006" },
];

export const AsignarPatrullaModal = ({ open, onOpenChange, alarm, onAssign }: AsignarPatrullaModalProps) => {
  const [selectedSupervisor, setSelectedSupervisor] = useState<string>("");

  const handleAssign = () => {
    if (!selectedSupervisor || !alarm) return;
    
    const supervisor = supervisores.find(s => s.id === selectedSupervisor);
    if (supervisor) {
      onAssign(alarm.id, supervisor);
      setSelectedSupervisor("");
      onOpenChange(false);
    }
  };

  const getStatusColor = (status: Supervisor['status']) => {
    switch (status) {
      case 'Disponible': return 'bg-green-100 text-green-800';
      case 'En Servicio': return 'bg-blue-100 text-blue-800';
      case 'Ocupado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const supervisoresDisponibles = supervisores.filter(s => s.status === 'Disponible');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5 text-primary" />
            Asignar Patrulla a Alarma
          </DialogTitle>
          <DialogDescription>
            Selecciona un supervisor disponible para atender la alarma
          </DialogDescription>
        </DialogHeader>

        {alarm && (
          <div className="space-y-6">
            {/* Información de la Alarma */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Detalles de la Alarma
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>Cliente:</strong> {alarm.clientes?.nombre || 'No especificado'}</p>
                  <p><strong>Tipo:</strong> {alarm.tipo}</p>
                  <p><strong>Prioridad:</strong> {alarm.prioridad}</p>
                </div>
                <div>
                  <p><strong>Dirección:</strong> {alarm.direccion}</p>
                  <p><strong>Municipio:</strong> {alarm.municipio}</p>
                  <p><strong>Hora:</strong> {new Date(alarm.created_at).toLocaleTimeString()}</p>
                </div>
              </div>
            </div>

            {/* Selección de Supervisor */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <User className="h-4 w-4" />
                Supervisores Disponibles ({supervisoresDisponibles.length})
              </h3>

              <Select value={selectedSupervisor} onValueChange={setSelectedSupervisor}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar supervisor..." />
                </SelectTrigger>
                <SelectContent>
                  {supervisoresDisponibles.map((supervisor) => (
                    <SelectItem key={supervisor.id} value={supervisor.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{supervisor.name} - {supervisor.patrullaUnit}</span>
                        <span className="text-sm text-muted-foreground ml-2">📍 {supervisor.currentLocation}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Lista de todos los supervisores */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Estado de Todas las Patrullas</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto">
                {supervisores.map((supervisor) => (
                  <div 
                    key={supervisor.id} 
                    className={`p-3 border rounded-lg ${supervisor.status === 'Disponible' ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-blue-500" />
                        <span className="font-medium text-sm">{supervisor.name}</span>
                      </div>
                      <Badge className={getStatusColor(supervisor.status)}>
                        {supervisor.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>🚔 {supervisor.patrullaUnit}</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {supervisor.currentLocation}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-3 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleAssign}
                disabled={!selectedSupervisor}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Car className="h-4 w-4 mr-2" />
                Asignar Patrulla
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};