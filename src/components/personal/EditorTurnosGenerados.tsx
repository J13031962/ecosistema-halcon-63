import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Edit, Save, X } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

interface TurnoGenerado {
  id: string;
  fecha: Date;
  operador_id: string;
  operador_nombre: string;
  hora_inicio: string;
  hora_fin: string;
  tipo: string;
}

interface EditorTurnosGeneradosProps {
  isOpen: boolean;
  onClose: () => void;
  turnos: TurnoGenerado[];
  operadores: Array<{ id: string; nombres: string; apellidos: string; cargo: string }>;
  onUpdateTurno: (turnoId: string, nuevoOperadorId: string, nuevoOperadorNombre: string) => Promise<void>;
}

const TIPOS_TURNO_COLORS = {
  diurno: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  nocturno: 'bg-purple-100 text-purple-800 border-purple-300',
  mixto: 'bg-orange-100 text-orange-800 border-orange-300'
};

export const EditorTurnosGenerados: React.FC<EditorTurnosGeneradosProps> = ({
  isOpen,
  onClose,
  turnos,
  operadores,
  onUpdateTurno
}) => {
  const [turnoEditando, setTurnoEditando] = useState<string>('');
  const [nuevoOperadorId, setNuevoOperadorId] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);

  const operadoresDisponibles = operadores.filter(op => op.cargo === 'operador');

  const handleEditarTurno = (turnoId: string, operadorActualId: string) => {
    setTurnoEditando(turnoId);
    setNuevoOperadorId(operadorActualId);
  };

  const handleCancelarEdicion = () => {
    setTurnoEditando('');
    setNuevoOperadorId('');
  };

  const handleGuardarCambio = async (turno: TurnoGenerado) => {
    if (!nuevoOperadorId || nuevoOperadorId === turno.operador_id) {
      handleCancelarEdicion();
      return;
    }

    const nuevoOperador = operadoresDisponibles.find(op => op.id === nuevoOperadorId);
    if (!nuevoOperador) {
      toast.error('Operador no encontrado');
      return;
    }

    try {
      setIsUpdating(true);
      const nuevoOperadorNombre = `${nuevoOperador.nombres} ${nuevoOperador.apellidos}`;
      await onUpdateTurno(turno.id, nuevoOperadorId, nuevoOperadorNombre);
      
      toast.success(`Turno reasignado a ${nuevoOperadorNombre}`);
      handleCancelarEdicion();
    } catch (error) {
      console.error('Error al actualizar turno:', error);
      toast.error('Error al actualizar el turno');
    } finally {
      setIsUpdating(false);
    }
  };

  // Agrupar turnos por fecha
  const turnosAgrupados = turnos.reduce((acc, turno) => {
    const fechaKey = format(new Date(turno.fecha), 'yyyy-MM-dd');
    if (!acc[fechaKey]) {
      acc[fechaKey] = [];
    }
    acc[fechaKey].push(turno);
    return acc;
  }, {} as Record<string, TurnoGenerado[]>);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Editor de Turnos Generados
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-sm text-muted-foreground">
            Haga clic en "Editar" para cambiar el operador asignado a un turno específico por contingencias.
          </div>

          {Object.entries(turnosAgrupados)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([fecha, turnosDia]) => (
              <div key={fecha} className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3 text-lg">
                  {format(new Date(fecha), 'EEEE, dd \'de\' MMMM \'de\' yyyy', { locale: es })}
                </h3>

                <div className="space-y-3">
                  {turnosDia.map((turno) => (
                    <div key={turno.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge 
                          variant="outline" 
                          className={TIPOS_TURNO_COLORS[turno.tipo as keyof typeof TIPOS_TURNO_COLORS] || 'bg-gray-100 text-gray-800'}
                        >
                          {turno.hora_inicio} - {turno.hora_fin}
                        </Badge>
                        
                        {turnoEditando === turno.id ? (
                          <div className="flex items-center gap-2">
                            <Select value={nuevoOperadorId} onValueChange={setNuevoOperadorId}>
                              <SelectTrigger className="w-60">
                                <SelectValue placeholder="Seleccionar nuevo operador" />
                              </SelectTrigger>
                              <SelectContent className="bg-background border z-50">
                                {operadoresDisponibles.map((operador) => (
                                  <SelectItem 
                                    key={operador.id} 
                                    value={operador.id}
                                    className="bg-background hover:bg-muted"
                                  >
                                    {operador.nombres} {operador.apellidos}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ) : (
                          <span className="font-medium">
                            {turno.operador_nombre}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {turnoEditando === turno.id ? (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleGuardarCambio(turno)}
                              disabled={isUpdating || !nuevoOperadorId}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <Save className="h-3 w-3 mr-1" />
                              Guardar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancelarEdicion}
                              disabled={isUpdating}
                            >
                              <X className="h-3 w-3 mr-1" />
                              Cancelar
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditarTurno(turno.id, turno.operador_id)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Editar
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};