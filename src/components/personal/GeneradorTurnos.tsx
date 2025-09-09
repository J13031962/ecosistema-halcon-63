import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const turnosSchema = z.object({
  periodicidad: z.enum(['semanal', 'quincenal', 'mensual'], {
    required_error: 'La periodicidad es requerida'
  }),
  fecha_inicio: z.date({
    required_error: 'La fecha de inicio es requerida'
  }),
  operador_id: z.string().min(1, 'Debe seleccionar un operador'),
  tipo_turno: z.enum(['dia', 'manana', 'tarde', 'noche'], {
    required_error: 'Debe seleccionar el tipo de turno'
  }),
  dias_descanso: z.array(z.string()).min(1, 'Debe seleccionar al menos un día de descanso')
});

type TurnosFormData = z.infer<typeof turnosSchema>;

interface GeneradorTurnosProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (data: TurnosFormData) => Promise<void>;
  personal: Array<{ id: string; nombres: string; apellidos: string; cargo: string }>;
}

export const GeneradorTurnos: React.FC<GeneradorTurnosProps> = ({
  isOpen,
  onClose,
  onGenerate,
  personal
}) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const form = useForm<TurnosFormData>({
    resolver: zodResolver(turnosSchema),
    defaultValues: {
      periodicidad: 'quincenal',
      operador_id: '',
      tipo_turno: 'dia',
      dias_descanso: []
    }
  });

  const tipoTurno = form.watch('tipo_turno');
  
  const getHorarioTurno = (tipo: string) => {
    const horarios = {
      dia: { inicio: '06:00', fin: '18:00' },
      manana: { inicio: '06:00', fin: '14:00' },
      tarde: { inicio: '14:00', fin: '22:00' },
      noche: { inicio: '18:00', fin: '06:00' }
    };
    return horarios[tipo as keyof typeof horarios] || horarios.dia;
  };

  const handleGenerate = async (data: TurnosFormData) => {
    try {
      setIsGenerating(true);
      await onGenerate(data);
      toast.success('Turnos generados exitosamente');
      form.reset();
      onClose();
    } catch (error) {
      console.error('Error al generar turnos:', error);
      toast.error('Error al generar los turnos');
    } finally {
      setIsGenerating(false);
    }
  };

  const operadores = personal.filter(p => p.cargo === 'operador');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Generar Turnos para Personal
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleGenerate)} className="space-y-6">
            {/* Configuración Básica */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Configuración Básica</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="periodicidad"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Período</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar período" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="semanal">Semanal (7 días)</SelectItem>
                          <SelectItem value="quincenal">Quincenal (15 días)</SelectItem>
                          <SelectItem value="mensual">Mensual (30 días)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fecha_inicio"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Fecha de Inicio</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP", { locale: es })
                              ) : (
                                <span>Seleccionar fecha</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Selección de Operador */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Operador</h3>
              <FormField
                control={form.control}
                name="operador_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seleccionar Operador</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Elegir operador" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {operadores.map((operador) => (
                          <SelectItem key={operador.id} value={operador.id}>
                            {operador.nombres} {operador.apellidos}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Tipo de Turno */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Tipo de Turno</h3>
              <FormField
                control={form.control}
                name="tipo_turno"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horario de Trabajo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Elegir tipo de turno" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="dia">Día (06:00 - 18:00)</SelectItem>
                        <SelectItem value="manana">Mañana (06:00 - 14:00)</SelectItem>
                        <SelectItem value="tarde">Tarde (14:00 - 22:00)</SelectItem>
                        <SelectItem value="noche">Noche (18:00 - 06:00)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {tipoTurno && (
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm">
                    <strong>Horario seleccionado:</strong> {getHorarioTurno(tipoTurno).inicio} - {getHorarioTurno(tipoTurno).fin}
                  </p>
                </div>
              )}
            </div>

            {/* Días de Descanso */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Días de Descanso</h3>
              <FormField
                control={form.control}
                name="dias_descanso"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seleccionar días de descanso en la semana</FormLabel>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {[
                        { value: 'lunes', label: 'Lunes' },
                        { value: 'martes', label: 'Martes' },
                        { value: 'miercoles', label: 'Miércoles' },
                        { value: 'jueves', label: 'Jueves' },
                        { value: 'viernes', label: 'Viernes' },
                        { value: 'sabado', label: 'Sábado' },
                        { value: 'domingo', label: 'Domingo' }
                      ].map((dia) => (
                        <label
                          key={dia.value}
                          className="flex items-center space-x-2 cursor-pointer hover:bg-accent rounded p-2"
                        >
                          <input
                            type="checkbox"
                            checked={field.value.includes(dia.value)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                field.onChange([...field.value, dia.value]);
                              } else {
                                field.onChange(field.value.filter(d => d !== dia.value));
                              }
                            }}
                            className="rounded"
                          />
                          <span className="text-sm">{dia.label}</span>
                        </label>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Información Importante */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Información Importante:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Los turnos se generarán automáticamente con rotación entre operadores</li>
                <li>• Horas diurnas: 06:00 - 19:00 | Horas nocturnas: 19:00 - 06:00</li>
                <li>• Se aplicarán tarifas especiales para domingos y feriados</li>
                <li>• Los turnos podrán editarse individualmente después de la generación</li>
              </ul>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isGenerating}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isGenerating}>
                {isGenerating ? 'Generando...' : 'Generar Turnos'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};