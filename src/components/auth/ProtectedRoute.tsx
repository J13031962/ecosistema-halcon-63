import { ReactNode } from 'react';
import { useAuthConsolidatedContext } from '@/contexts/AuthContextConsolidated';
import { UserRole } from '@/types/auth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Shield, LogOut } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: UserRole[];
}

const ProtectedRoute = ({ children, requiredRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useAuthConsolidatedContext();

  if (!isAuthenticated) {
    return null; // Login component will be shown
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Para el sistema HALCON, simplificar la verificación de permisos
  // Si se especifican roles requeridos, verificar solo para casos muy específicos
  if (requiredRoles && requiredRoles.length > 0) {
    // Solo restringir acceso para funciones muy específicas de administrador
    if (requiredRoles.includes('administrador') && requiredRoles.length === 1) {
      if (user.role !== 'administrador') {
        return (
          <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="text-center max-w-md">
              <Shield className="h-16 w-16 text-destructive mx-auto mb-4" />
              <Alert variant="destructive">
                <AlertDescription className="mb-4">
                  Esta función requiere permisos de administrador.
                  <br />
                  Usuario: {user?.full_name} ({user?.role})
                </AlertDescription>
              </Alert>
              <Button onClick={() => window.history.back()} variant="outline">
                Volver
              </Button>
            </div>
          </div>
        );
      }
    }
  }

  // Para todos los demás casos, permitir acceso
  return <>{children}</>;
};

export default ProtectedRoute;