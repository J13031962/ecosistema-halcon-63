import { useAuthConsolidated } from '@/hooks/useAuthConsolidated';
import { Navigate } from 'react-router-dom';
import { UserRole } from '@/types/auth';

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export const RoleBasedRoute = ({ children, allowedRoles }: RoleBasedRouteProps) => {
  const { user, isAuthenticated } = useAuthConsolidated();

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (!user) {
    return <div>Cargando...</div>;
  }

  // El administrador siempre tiene acceso
  if (user.role === 'administrador') {
    return <>{children}</>;
  }

  const hasAllowedRole = allowedRoles.includes(user.role as any);

  if (!hasAllowedRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};