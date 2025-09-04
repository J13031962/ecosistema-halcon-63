import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, UserPlus, Loader2 } from "lucide-react";
import { UserRole } from '@/types/auth';
import { useSupabaseUsuarios } from '@/hooks/useSupabaseUsuarios';

interface UserRegistrationData {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  role: UserRole;
}

const ROLE_LABELS: Record<UserRole, string> = {
  'administrador': 'Administrador',
  'director': 'Director Central',
  'operador_alarmas': 'Operador',
  'despachador_patrullas': 'Despachador',
  'supervisor_motorizado': 'Supervisor',
  'tecnico': 'Técnico',
  'tecnico_propio': 'Técnico Propio',
  'tecnico_externo': 'Técnico Externo',
  'director_tecnico': 'Director Técnico',
  'jefe_tecnicos': 'Jefe de Técnicos',
  'asesor_ventas': 'Ventas'
};

interface UserRegistrationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const UserRegistrationForm = ({ onSuccess, onCancel }: UserRegistrationFormProps) => {
  const [formData, setFormData] = useState<UserRegistrationData>({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    role: 'operador_alarmas'
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { createUser } = useSupabaseUsuarios();

  const validateForm = (): string[] => {
    const newErrors: string[] = [];

    if (!formData.email) newErrors.push('El email es requerido');
    if (!formData.username) newErrors.push('El nombre de usuario es requerido');
    if (!formData.fullName) newErrors.push('El nombre completo es requerido');
    if (!formData.password) newErrors.push('La contraseña es requerida');
    if (formData.password.length < 6) newErrors.push('La contraseña debe tener al menos 6 caracteres');
    if (formData.password !== formData.confirmPassword) newErrors.push('Las contraseñas no coinciden');
    if (!formData.role) newErrors.push('El rol es requerido');

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.push('El formato del email no es válido');
    }

    // Validar username (sin espacios, al menos 3 caracteres)
    if (formData.username && (formData.username.length < 3 || /\s/.test(formData.username))) {
      newErrors.push('El nombre de usuario debe tener al menos 3 caracteres y no contener espacios');
    }

    return newErrors;
  };

  const handleInputChange = (field: keyof UserRegistrationData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors([]);

    try {
      const result = await createUser({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        role: formData.role
      });

      if (result.success) {
        // Limpiar formulario
        setFormData({
          email: '',
          username: '',
          password: '',
          confirmPassword: '',
          fullName: '',
          role: 'operador_alarmas'
        });
        
        onSuccess?.();
      } else {
        setErrors([result.error || 'Error al crear el usuario']);
      }
    } catch (error: any) {
      setErrors([error.message || 'Error inesperado al crear el usuario']);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Registrar Nuevo Usuario
        </CardTitle>
        <CardDescription>
          Complete todos los campos para crear un nuevo usuario en el sistema
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {errors.length > 0 && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1">
                {errors.map((error, index) => (
                  <li key={index} className="text-sm">{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nombre Completo</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Ej: Juan Pérez"
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Nombre de Usuario</Label>
            <Input
              id="username"
              type="text"
              placeholder="Ej: jperez"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input
              id="email"
              type="email"
              placeholder="usuario@empresa.com"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Rol del Usuario</Label>
            <Select 
              value={formData.role} 
              onValueChange={(value: UserRole) => handleInputChange('role', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar rol" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ROLE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Mínimo 6 caracteres"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Repetir contraseña"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Crear Usuario
                </>
              )}
            </Button>
            
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};