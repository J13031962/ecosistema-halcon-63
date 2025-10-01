import { useState } from "react";
import { OperationalButton as Button } from "@/components/ui/operational-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSupabaseUsuariosEnhanced } from "@/hooks/useSupabaseUsuariosEnhanced";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff } from "lucide-react";

interface FormularioSupervisorProps {
  onSuccess?: () => void;
}

export const FormularioSupervisor = ({ onSuccess }: FormularioSupervisorProps) => {
  const { createUser } = useSupabaseUsuariosEnhanced();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    numero_documento: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = "El email es requerido";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email inválido";
    }

    if (!formData.password) {
      newErrors.password = "La contraseña es requerida";
    } else if (formData.password.length < 6) {
      newErrors.password = "La contraseña debe tener al menos 6 caracteres";
    }

    if (!formData.full_name || formData.full_name.trim().length < 3) {
      newErrors.full_name = "El nombre completo es requerido (mínimo 3 caracteres)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Por favor corrija los errores en el formulario");
      return;
    }

    setLoading(true);
    try {
      await createUser({
        email: formData.email.trim(),
        password: formData.password,
        fullName: formData.full_name.trim(),
        role: 'supervisor_motorizado',
        numeroDocumento: formData.numero_documento.trim() || undefined,
      });

      toast.success("Supervisor registrado exitosamente");
      setFormData({
        email: "",
        password: "",
        full_name: "",
        numero_documento: "",
      });
      setErrors({});
      onSuccess?.();
    } catch (error: any) {
      console.error('Error creating supervisor:', error);
      toast.error(error.message || "Error al registrar supervisor");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="full_name">
            Nombre Completo <span className="text-red-500">*</span>
          </Label>
          <Input
            id="full_name"
            type="text"
            placeholder="Juan Pérez García"
            value={formData.full_name}
            onChange={(e) => handleChange("full_name", e.target.value)}
            className={errors.full_name ? "border-red-500" : ""}
            disabled={loading}
          />
          {errors.full_name && (
            <p className="text-sm text-red-500">{errors.full_name}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="numero_documento">Número de Documento</Label>
          <Input
            id="numero_documento"
            type="text"
            placeholder="12345678"
            value={formData.numero_documento}
            onChange={(e) => handleChange("numero_documento", e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">
            Email <span className="text-red-500">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="supervisor@ejemplo.com"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            className={errors.email ? "border-red-500" : ""}
            disabled={loading}
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">
            Contraseña <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Mínimo 6 caracteres"
              value={formData.password}
              onChange={(e) => handleChange("password", e.target.value)}
              className={errors.password ? "border-red-500 pr-10" : "pr-10"}
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              disabled={loading}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-red-500">{errors.password}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <div className="text-sm text-blue-800">
          <p className="font-semibold">Rol: Supervisor Motorizado</p>
          <p className="text-xs">Este usuario tendrá acceso a las funciones de supervisor</p>
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button
          type="submit"
          disabled={loading}
          className="flex-1"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Registrando...
            </>
          ) : (
            "Registrar Supervisor"
          )}
        </Button>
      </div>
    </form>
  );
};
