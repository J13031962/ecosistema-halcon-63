import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';

const operadorSchema = z.object({
  nombres: z.string().min(2, 'Los nombres son requeridos'),
  apellidos: z.string().min(2, 'Los apellidos son requeridos'),
  numero_identificacion: z.string().min(5, 'Número de identificación es requerido'),
  numero_celular: z.string().min(10, 'Número de celular es requerido'),
  contacto_emergencia_nombres: z.string().min(2, 'Nombres del contacto de emergencia son requeridos'),
  contacto_emergencia_apellidos: z.string().min(2, 'Apellidos del contacto de emergencia son requeridos'),
  activo: z.boolean().default(true)
});

type OperadorFormData = z.infer<typeof operadorSchema>;

interface FormularioOperadorProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: OperadorFormData) => Promise<void>;
}

export const FormularioOperador: React.FC<FormularioOperadorProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<OperadorFormData>({
    resolver: zodResolver(operadorSchema),
    defaultValues: {
      nombres: '',
      apellidos: '',
      numero_identificacion: '',
      numero_celular: '',
      contacto_emergencia_nombres: '',
      contacto_emergencia_apellidos: '',
      activo: true
    }
  });

  const handleSubmit = async (data: OperadorFormData) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
      form.reset();
      onClose();
    } catch (error) {
      console.error('Error al registrar operador:', error);
      // El error se maneja en el componente padre
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Nuevo Operador</DialogTitle>
          <DialogDescription>
            Complete la información para crear una nueva cuenta de operador
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Información Personal */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Información Personal</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nombres"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombres</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombres completos" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="apellidos"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apellidos</FormLabel>
                      <FormControl>
                        <Input placeholder="Apellidos completos" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="numero_identificacion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Identificación</FormLabel>
                      <FormControl>
                        <Input placeholder="CC o TI" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="numero_celular"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Celular</FormLabel>
                      <FormControl>
                        <Input placeholder="3001234567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Contacto de Emergencia */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Contacto de Emergencia</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contacto_emergencia_nombres"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombres del Contacto</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombres del contacto de emergencia" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contacto_emergencia_apellidos"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apellidos del Contacto</FormLabel>
                      <FormControl>
                        <Input placeholder="Apellidos del contacto de emergencia" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Estado */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="activo"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Estado Activo</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        El operador está activo en el sistema
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creando...' : 'Crear Operador'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};