import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthEnhanced } from '@/hooks/useAuthEnhanced';
import { UserRole } from '@/types/auth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Shield, LogOut, Loader2 } from 'lucide-react';

interface ProtectedRouteEnhancedProps {
  children: ReactNode;
  requiredRoles?: UserRole[];
  requiredPermissions?: string[];
  redirectTo?: string;
}

export const ProtectedRouteEnhanced = ({ 
  children, 
  requiredRoles, 
  requiredPermissions,
  redirectTo = '/auth'
}: ProtectedRouteEnhancedProps) => {
  const { isAuthenticated, hasRole, hasPermission, logout, user, loading } = useAuthEnhanced();
  const location = useLocation();

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Redirigir a login si no está autenticado
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Verificar roles requeridos
  if (requiredRoles && !hasRole(requiredRoles)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center max-w-md">
          <Shield className="h-16 w-16 text-destructive mx-auto mb-4" />
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Acceso Denegado</p>
                <p className="text-sm">
                  No tienes permisos suficientes para acceder a esta página.
                </p>
                <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                  <p>Usuario: {user?.fullName}</p>
                  <p>Rol actual: {user?.role}</p>
                  <p>Roles requeridos: {requiredRoles.join(', ')}</p>
                </div>
              </div>
            </AlertDescription>
          </Alert>
          
          <div className="flex gap-2 justify-center">
            <Button onClick={() => window.history.back()} variant="outline">
              Volver
            </Button>
            <Button onClick={logout} variant="destructive">
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Verificar permisos específicos requeridos
  if (requiredPermissions && !requiredPermissions.every(permission => hasPermission(permission))) {
    const missingPermissions = requiredPermissions.filter(permission => !hasPermission(permission));
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center max-w-md">
          <Shield className="h-16 w-16 text-destructive mx-auto mb-4" />
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Permisos Insuficientes</p>
                <p className="text-sm">
                  No tienes los permisos necesarios para esta funcionalidad.
                </p>
                <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                  <p>Usuario: {user?.fullName}</p>
                  <p>Permisos faltantes:</p>
                  <ul className="list-disc list-inside">
                    {missingPermissions.map(permission => (
                      <li key={permission}>{permission}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </AlertDescription>
          </Alert>
          
          <div className="flex gap-2 justify-center">
            <Button onClick={() => window.history.back()} variant="outline">
              Volver
            </Button>
            <Button onClick={logout} variant="destructive">
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// HOC para proteger rutas fácilmente
export const withRoleProtection = (
  Component: React.ComponentType<any>,
  requiredRoles: UserRole[]
) => {
  return function ProtectedComponent(props: any) {
    return (
      <ProtectedRouteEnhanced requiredRoles={requiredRoles}>
        <Component {...props} />
      </ProtectedRouteEnhanced>
    );
  };
};

// HOC para proteger con permisos específicos
export const withPermissionProtection = (
  Component: React.ComponentType<any>,
  requiredPermissions: string[]
) => {
  return function ProtectedComponent(props: any) {
    return (
      <ProtectedRouteEnhanced requiredPermissions={requiredPermissions}>
        <Component {...props} />
      </ProtectedRouteEnhanced>
    );
  };
};