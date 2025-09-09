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
  duracion_dias: z.number().min(7).max(31),
  turno_diurno_inicio: z.string(),
  turno_diurno_fin: z.string(),
  turno_nocturno_inicio: z.string(),
  turno_nocturno_fin: z.string(),
  personal_asignado: z.array(z.string()).min(1, 'Debe asignar al menos un miembro del personal')
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
      duracion_dias: 15,
      turno_diurno_inicio: '06:00',
      turno_diurno_fin: '18:00',
      turno_nocturno_inicio: '18:00',
      turno_nocturno_fin: '06:00',
      personal_asignado: []
    }
  });

  const periodicidad = form.watch('periodicidad');

  React.useEffect(() => {
    const duracionMap = {
      semanal: 7,
      quincenal: 15,
      mensual: 30
    };
    form.setValue('duracion_dias', duracionMap[periodicidad]);
  }, [periodicidad, form]);

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
            {/* Configuración de Periodicidad */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Configuración de Periodicidad</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                <FormField
                  control={form.control}
                  name="duracion_dias"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duración (días)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="7"
                          max="31"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Configuración de Horarios */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Configuración de Horarios</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="turno_diurno_inicio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Turno Diurno - Inicio</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="turno_diurno_fin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Turno Diurno - Fin</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="turno_nocturno_inicio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Turno Nocturno - Inicio</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="turno_nocturno_fin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Turno Nocturno - Fin</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Asignación de Personal */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Personal Disponible</h3>
              <FormField
                control={form.control}
                name="personal_asignado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Operadores a Incluir</FormLabel>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-md p-3">
                      {operadores.map((operador) => (
                        <label
                          key={operador.id}
                          className="flex items-center space-x-2 cursor-pointer hover:bg-accent rounded p-2"
                        >
                          <input
                            type="checkbox"
                            checked={field.value.includes(operador.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                field.onChange([...field.value, operador.id]);
                              } else {
                                field.onChange(field.value.filter(id => id !== operador.id));
                              }
                            }}
                            className="rounded"
                          />
                          <span className="text-sm">
                            {operador.nombres} {operador.apellidos}
                          </span>
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