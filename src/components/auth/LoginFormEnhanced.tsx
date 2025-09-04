import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, LogIn, Loader2, Shield } from "lucide-react";
import { useAuthConsolidatedContext } from '@/contexts/AuthContextConsolidated';
import { useNavigate, useLocation } from 'react-router-dom';

interface LoginFormData {
  identifier: string; // puede ser email o username
  password: string;
}

export const LoginFormEnhanced = () => {
  const [formData, setFormData] = useState<LoginFormData>({
    identifier: '',
    password: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuthConsolidatedContext();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirigir según el rol del usuario
  const getRedirectPath = (userRole: string) => {
    const roleRedirects = {
      'administrador': '/admin-dashboard',
      'director_central': '/dashboard',
      'operador_alarmas': '/central-alarmas',
      'despachador_patrullas': '/seccion-despachador',
      'supervisor_motorizado': '/mi-patrulla',
      'tecnico': '/servicios-tecnicos',
      'jefe_tecnicos': '/servicios-tecnicos',
      'asesor_ventas': '/generar-cotizaciones'
    };
    
    return roleRedirects[userRole as keyof typeof roleRedirects] || '/dashboard';
  };

  const handleInputChange = (field: keyof LoginFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.identifier || !formData.password) {
      setError('Por favor complete todos los campos');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const success = await login(formData.identifier, formData.password);
      
      if (success) {
        // La redirección se maneja en el efecto del contexto de autenticación
        const from = location.state?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      } else {
        setError('Credenciales incorrectas');
      }
    } catch (error: any) {
      setError(error.message || 'Error inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Sistema HALCON</CardTitle>
          <CardDescription>
            Ingrese sus credenciales para acceder al sistema
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier">Usuario o Email</Label>
              <Input
                id="identifier"
                type="text"
                placeholder="usuario@empresa.com o usuario"
                value={formData.identifier}
                onChange={(e) => handleInputChange('identifier', e.target.value)}
                required
                autoComplete="username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Ingrese su contraseña"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  required
                  autoComplete="current-password"
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

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4 mr-2" />
                  Iniciar Sesión
                </>
              )}
            </Button>
          </form>

          {/* Información para usuarios de prueba */}
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <h4 className="text-sm font-medium mb-2">Usuarios de Prueba:</h4>
            <div className="text-xs text-muted-foreground space-y-1">
              <p><strong>Admin:</strong> admin@empresa.com / admin123</p>
              <p><strong>Operador:</strong> operador@empresa.com / operador123</p>
              <p><strong>Despachador:</strong> despachador@empresa.com / despachador123</p>
              <p><strong>Supervisor:</strong> supervisor@empresa.com / supervisor123</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};