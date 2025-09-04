import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { User, Phone, IdCard, UserCheck } from "lucide-react";

const personalSchema = z.object({
  nombres: z.string().min(2, "Los nombres son obligatorios"),
  apellidos: z.string().min(2, "Los apellidos son obligatorios"),
  numero_documento: z.string().min(5, "El número de documento es obligatorio"),
  tipo_documento: z.string().min(1, "Seleccione el tipo de documento"),
  celular: z.string().min(10, "El número de celular debe tener al menos 10 dígitos"),
  cargo: z.string().min(1, "Seleccione un cargo"),
  estado: z.string().min(1, "Seleccione un estado"),
  contacto_emergencia_nombre: z.string().min(2, "El nombre del contacto de emergencia es obligatorio"),
  contacto_emergencia_telefono: z.string().min(10, "El teléfono del contacto de emergencia es obligatorio"),
  contacto_emergencia_relacion: z.string().min(2, "La relación del contacto de emergencia es obligatoria"),
  observaciones: z.string().optional()
});

type PersonalFormData = z.infer<typeof personalSchema>;

interface FormularioNuevoPersonalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PersonalFormData) => void;
}

export function FormularioNuevoPersonal({ isOpen, onClose, onSubmit }: FormularioNuevoPersonalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PersonalFormData>({
    resolver: zodResolver(personalSchema),
    defaultValues: {
      nombres: "",
      apellidos: "",
      numero_documento: "",
      tipo_documento: "",
      celular: "",
      cargo: "",
      estado: "activo",
      contacto_emergencia_nombre: "",
      contacto_emergencia_telefono: "",
      contacto_emergencia_relacion: "",
      observaciones: ""
    }
  });

  const handleSubmit = async (data: PersonalFormData) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
      
      toast({
        title: "Personal registrado exitosamente",
        description: `${data.nombres} ${data.apellidos} ha sido registrado en el sistema`,
      });
      
      form.reset();
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo registrar el personal. Intente nuevamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Registrar Nuevo Personal
          </DialogTitle>
          <DialogDescription>
            Complete la información del nuevo miembro del personal
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Información Personal */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Información Personal
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nombres"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombres *</FormLabel>
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
                      <FormLabel>Apellidos *</FormLabel>
                      <FormControl>
                        <Input placeholder="Apellidos completos" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="tipo_documento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Documento *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="cedula">Cédula de Ciudadanía</SelectItem>
                          <SelectItem value="cedula_extranjeria">Cédula de Extranjería</SelectItem>
                          <SelectItem value="pasaporte">Pasaporte</SelectItem>
                          <SelectItem value="tarjeta_identidad">Tarjeta de Identidad</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="numero_documento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Documento *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: 12345678" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="celular"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Celular *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: 3001234567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Información Laboral */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <IdCard className="h-4 w-4" />
                Información Laboral
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cargo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cargo *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar cargo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="operador_alarmas">Operador de Alarmas</SelectItem>
                          <SelectItem value="despachador_patrullas">Despachador de Patrullas</SelectItem>
                          <SelectItem value="supervisor_motorizado">Supervisor Motorizado</SelectItem>
                          <SelectItem value="tecnico">Técnico</SelectItem>
                          <SelectItem value="guardia_seguridad">Guardia de Seguridad</SelectItem>
                          <SelectItem value="coordinador">Coordinador</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="estado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar estado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="activo">Activo</SelectItem>
                          <SelectItem value="inactivo">Inactivo</SelectItem>
                          <SelectItem value="licencia">En Licencia</SelectItem>
                          <SelectItem value="vacaciones">En Vacaciones</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Contacto de Emergencia */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Contacto de Emergencia
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="contacto_emergencia_nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre Completo *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre del contacto" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contacto_emergencia_telefono"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: 3001234567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contacto_emergencia_relacion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Relación *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Relación" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="familiar">Familiar</SelectItem>
                          <SelectItem value="padre">Padre</SelectItem>
                          <SelectItem value="madre">Madre</SelectItem>
                          <SelectItem value="hermano">Hermano/a</SelectItem>
                          <SelectItem value="conyuge">Cónyuge</SelectItem>
                          <SelectItem value="hijo">Hijo/a</SelectItem>
                          <SelectItem value="amigo">Amigo/a</SelectItem>
                          <SelectItem value="otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Observaciones */}
            <FormField
              control={form.control}
              name="observaciones"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observaciones</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Observaciones adicionales (opcional)" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4 pt-4">
              <Button 
                type="submit" 
                className="flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Registrando..." : "Registrar Personal"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}