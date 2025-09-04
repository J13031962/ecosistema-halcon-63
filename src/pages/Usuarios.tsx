import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, User, Mail, Lock, IdCard, UserCheck, Eye, EyeOff } from "lucide-react";
import { UserRole } from "@/types/auth";
import { useSupabaseUsuarios } from "@/hooks/useSupabaseUsuarios";
import { toast } from "sonner";

const userSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  fullName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  role: z.string().min(1, "Debe seleccionar un rol"),
  numeroDocumento: z.string().optional(),
  fotoUrl: z.string().url().optional().or(z.literal(""))
});

type UserFormData = z.infer<typeof userSchema>;

const roleOptions: { value: UserRole; label: string }[] = [
  { value: 'administrador', label: 'Administrador' },
  { value: 'director', label: 'Director Central' },
  { value: 'operador_alarmas', label: 'Operador de Alarmas' },
  { value: 'despachador_patrullas', label: 'Despachador de Patrullas' },
  { value: 'supervisor_motorizado', label: 'Supervisor Motorizado' },
  { value: 'tecnico', label: 'Técnico' },
  { value: 'tecnico_propio', label: 'Técnico Propio' },
  { value: 'tecnico_externo', label: 'Técnico Externo' },
  { value: 'director_tecnico', label: 'Director Técnico' },
  { value: 'jefe_tecnicos', label: 'Jefe de Técnicos' },
  { value: 'asesor_ventas', label: 'Asesor de Ventas' }
];

const Usuarios = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createUser, users, loading } = useSupabaseUsuarios();
  
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<UserFormData>({
    resolver: zodResolver(userSchema)
  });

  const selectedRole = watch("role");

  const onSubmit = async (data: UserFormData) => {
    setIsSubmitting(true);
    try {
      const result = await createUser({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        role: data.role as UserRole,
        numeroDocumento: data.numeroDocumento,
        fotoUrl: data.fotoUrl || undefined
      });

      if (result.success) {
        reset();
        toast.success("Usuario creado exitosamente");
      }
    } catch (error) {
      toast.error("Error al crear usuario");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-700 text-white p-6 rounded-lg shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-6 w-6" />
                <h1 className="text-2xl font-bold">GESTIÓN DE USUARIOS</h1>
              </div>
              <p className="text-slate-200">Administración de usuarios y permisos del sistema</p>
            </div>
            <div className="text-right text-sm">
              <p>TELEGUARDIA.COM</p>
              <p>FECHA: {new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulario con estilo neumorphic */}
          <div className="neumorphic-form bg-slate-200 dark:bg-slate-800 p-8 rounded-3xl shadow-[inset_20px_20px_60px_#bebebe,inset_-20px_-20px_60px_#ffffff] dark:shadow-[inset_20px_20px_60px_#1e293b,inset_-20px_-20px_60px_#475569] transition-all duration-500 hover:scale-[1.02]">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Nuevo Usuario</h2>
              <p className="text-slate-600 dark:text-slate-300">Ingresa los datos del nuevo usuario</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Nombre completo */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-slate-700 dark:text-slate-300 font-medium">Nombre Completo</Label>
                <div className="relative">
                  <div className="neumorphic-field flex items-center bg-slate-200 dark:bg-slate-800 rounded-2xl p-4 shadow-[inset_2px_5px_10px_rgba(0,0,0,0.1)] dark:shadow-[inset_2px_5px_10px_rgba(0,0,0,0.3)]">
                    <User className="h-5 w-5 text-slate-500 dark:text-slate-400 mr-3" />
                    <Input
                      {...register("fullName")}
                      placeholder="Ingresa el nombre completo"
                      className="bg-transparent border-none outline-none text-slate-800 dark:text-slate-200 placeholder:text-slate-500 flex-1"
                    />
                  </div>
                </div>
                {errors.fullName && <p className="text-red-500 text-sm">{errors.fullName.message}</p>}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 dark:text-slate-300 font-medium">Email</Label>
                <div className="relative">
                  <div className="neumorphic-field flex items-center bg-slate-200 dark:bg-slate-800 rounded-2xl p-4 shadow-[inset_2px_5px_10px_rgba(0,0,0,0.1)] dark:shadow-[inset_2px_5px_10px_rgba(0,0,0,0.3)]">
                    <Mail className="h-5 w-5 text-slate-500 dark:text-slate-400 mr-3" />
                    <Input
                      type="email"
                      {...register("email")}
                      placeholder="usuario@ejemplo.com"
                      className="bg-transparent border-none outline-none text-slate-800 dark:text-slate-200 placeholder:text-slate-500 flex-1"
                    />
                  </div>
                </div>
                {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
              </div>

              {/* Contraseña */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700 dark:text-slate-300 font-medium">Contraseña</Label>
                <div className="relative">
                  <div className="neumorphic-field flex items-center bg-slate-200 dark:bg-slate-800 rounded-2xl p-4 shadow-[inset_2px_5px_10px_rgba(0,0,0,0.1)] dark:shadow-[inset_2px_5px_10px_rgba(0,0,0,0.3)]">
                    <Lock className="h-5 w-5 text-slate-500 dark:text-slate-400 mr-3" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      {...register("password")}
                      placeholder="Mínimo 6 caracteres"
                      className="bg-transparent border-none outline-none text-slate-800 dark:text-slate-200 placeholder:text-slate-500 flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="ml-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
              </div>

              {/* Rol */}
              <div className="space-y-2">
                <Label htmlFor="role" className="text-slate-700 dark:text-slate-300 font-medium">Rol</Label>
                <div className="neumorphic-field bg-slate-200 dark:bg-slate-800 rounded-2xl p-1 shadow-[inset_2px_5px_10px_rgba(0,0,0,0.1)] dark:shadow-[inset_2px_5px_10px_rgba(0,0,0,0.3)]">
                  <Select onValueChange={(value) => setValue("role", value)}>
                    <SelectTrigger className="bg-transparent border-none">
                      <div className="flex items-center">
                        <UserCheck className="h-5 w-5 text-slate-500 dark:text-slate-400 mr-3" />
                        <SelectValue placeholder="Selecciona un rol" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {roleOptions.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {errors.role && <p className="text-red-500 text-sm">{errors.role.message}</p>}
              </div>

              {/* Número de documento */}
              <div className="space-y-2">
                <Label htmlFor="numeroDocumento" className="text-slate-700 dark:text-slate-300 font-medium">Número de Documento (Opcional)</Label>
                <div className="relative">
                  <div className="neumorphic-field flex items-center bg-slate-200 dark:bg-slate-800 rounded-2xl p-4 shadow-[inset_2px_5px_10px_rgba(0,0,0,0.1)] dark:shadow-[inset_2px_5px_10px_rgba(0,0,0,0.3)]">
                    <IdCard className="h-5 w-5 text-slate-500 dark:text-slate-400 mr-3" />
                    <Input
                      {...register("numeroDocumento")}
                      placeholder="Número de identificación"
                      className="bg-transparent border-none outline-none text-slate-800 dark:text-slate-200 placeholder:text-slate-500 flex-1"
                    />
                  </div>
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-4 mt-8">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 bg-slate-700 hover:bg-slate-800 text-white py-3 rounded-xl transition-all duration-300 shadow-[5px_5px_15px_#bebebe,-5px_-5px_15px_#ffffff] dark:shadow-[5px_5px_15px_#1e293b,-5px_-5px_15px_#475569] hover:shadow-[inset_5px_5px_15px_#bebebe,inset_-5px_-5px_15px_#ffffff] dark:hover:shadow-[inset_5px_5px_15px_#1e293b,inset_-5px_-5px_15px_#475569]"
                >
                  {isSubmitting ? "Creando..." : "Crear Usuario"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => reset()}
                  className="bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-slate-200 py-3 px-6 rounded-xl transition-all duration-300 shadow-[5px_5px_15px_#bebebe,-5px_-5px_15px_#ffffff] dark:shadow-[5px_5px_15px_#1e293b,-5px_-5px_15px_#475569] hover:shadow-[inset_5px_5px_15px_#bebebe,inset_-5px_-5px_15px_#ffffff] dark:hover:shadow-[inset_5px_5px_15px_#1e293b,inset_-5px_-5px_15px_#475569]"
                >
                  Limpiar
                </Button>
              </div>
            </form>
          </div>

          {/* Lista de usuarios */}
          <Card className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Usuarios Registrados
              </CardTitle>
              <CardDescription>
                {users.length} usuarios en el sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Cargando usuarios...</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {users.map((user) => (
                    <div 
                      key={user.id} 
                      className="p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{user.full_name || 'Sin nombre'}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{user.email}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-500">
                            {user.user_roles.map(r => r.role).join(', ') || 'Sin rol'}
                          </p>
                        </div>
                        <div className={`w-3 h-3 rounded-full ${user.active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Usuarios;