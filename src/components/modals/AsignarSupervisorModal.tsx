import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { useSupabaseSupervisores } from "@/hooks/useSupabaseSupervisores";
import { useToast } from "@/hooks/use-toast";
import { UserCheck, Phone, Shield, Clock } from "lucide-react";
import { format } from "date-fns";

interface AsignarSupervisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  alarma: {
    id: string;
    tipo: string;
    cliente?: string;
    direccion?: string;
    prioridad: string;
    created_at: string;
  } | null;
  onAssign: (alarmaId: string, supervisorData: { supervisor_id: string; supervisor_nombre: string; patrulla_asignada: string }) => Promise<void>;
}

export function AsignarSupervisorModal({ 
  isOpen, 
  onClose, 
  alarma, 
  onAssign 
}: AsignarSupervisorModalProps) {
  const { supervisores, loading } = useSupabaseSupervisores();
  const { toast } = useToast();
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedSupervisor, setSelectedSupervisor] = useState<string | null>(null);

  console.log('🔍 Supervisores en modal:', supervisores);
  console.log('🔍 Loading en modal:', loading);

  const getPriorityColor = (prioridad: string) => {
    switch (prioridad) {
      case 'alta': return 'destructive';
      case 'media': return 'default';
      case 'baja': return 'secondary';
      default: return 'outline';
    }
  };

  const handleAssignSupervisor = async (supervisorId: string, supervisorNombre: string) => {
    if (!alarma) return;

    try {
      setIsAssigning(true);
      
      // Generar número de patrulla automáticamente basado en el supervisor
      const patrullaNumero = `PAT-${supervisorNombre.split(' ')[0].toUpperCase()}-${Date.now().toString().slice(-4)}`;
      
      await onAssign(alarma.id, {
        supervisor_id: supervisorId,
        supervisor_nombre: supervisorNombre,
        patrulla_asignada: patrullaNumero
      });

      toast({
        title: "Supervisor asignado exitosamente",
        description: `${supervisorNombre} ha sido asignado a la alarma de ${alarma.tipo}`,
      });

      onClose();
    } catch (error) {
      console.error('Error al asignar supervisor:', error);
      toast({
        title: "Error en asignación",
        description: (error as any)?.message || "No se pudo asignar el supervisor a la alarma",
        variant: "destructive"
      });
    } finally {
      setIsAssigning(false);
    }
  };

  if (!alarma) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Asignar Supervisor a Alarma
          </DialogTitle>
          <DialogDescription>
            Seleccione un supervisor disponible para atender esta alarma
          </DialogDescription>
        </DialogHeader>

        {/* Información de la alarma */}
        <Card className="mb-4">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">{alarma.tipo}</h3>
                <Badge variant={getPriorityColor(alarma.prioridad)}>
                  {alarma.prioridad}
                </Badge>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                {format(new Date(alarma.created_at), 'HH:mm dd/MM')}
              </div>
            </div>
            
            {alarma.cliente && (
              <p className="text-sm mb-1">
                <strong>Cliente:</strong> {alarma.cliente}
              </p>
            )}
            {alarma.direccion && (
              <p className="text-sm text-muted-foreground">
                <strong>Dirección:</strong> {alarma.direccion}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Lista de supervisores */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Supervisores Disponibles ({supervisores.length})
          </h4>
          
          {loading ? (
            <div className="space-y-3">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : supervisores.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay supervisores disponibles en este momento
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {supervisores.map((supervisor) => (
                <Card 
                  key={supervisor.id} 
                  className={`cursor-pointer transition-colors hover:bg-accent/50 ${
                    selectedSupervisor === supervisor.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedSupervisor(supervisor.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={supervisor.foto_url || undefined} />
                          <AvatarFallback>
                            {supervisor.full_name?.split(' ').map(n => n[0]).join('') || 'SU'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{supervisor.full_name || supervisor.email}</p>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <UserCheck className="h-3 w-3" />
                            Supervisor Motorizado
                          </div>
                          {supervisor.numero_documento && (
                            <p className="text-xs text-muted-foreground">
                              Doc: {supervisor.numero_documento}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <Badge variant="secondary" className="mb-1">
                          Disponible
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          Contactable
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={onClose} disabled={isAssigning}>
            Cancelar
          </Button>
          <Button 
            onClick={() => {
              const supervisor = supervisores.find(s => s.id === selectedSupervisor);
              if (supervisor) {
                handleAssignSupervisor(supervisor.id, supervisor.full_name || supervisor.email);
              }
            }}
            disabled={!selectedSupervisor || isAssigning}
          >
            {isAssigning ? 'Asignando...' : 'Asignar Supervisor'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}