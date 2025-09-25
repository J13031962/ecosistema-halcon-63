import { useAuthConsolidatedContext } from '@/contexts/AuthContextConsolidated';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { SupervisorGPSProvider } from '@/components/supervisor/SupervisorGPSProvider';

export const RoleBasedDashboard = () => {
  const { user, isAuthenticated, loading } = useAuthConsolidatedContext();

  if (loading) {
    return (
      <SupervisorGPSProvider>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Sistema HALCON</h2>
              <p className="text-muted-foreground">Verificando acceso...</p>
            </div>
          </div>
        </div>
      </SupervisorGPSProvider>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/auth" replace />;
  }

  // Redirigir según el rol principal del usuario
  console.log('Redirigiendo usuario con rol:', user.role, 'Usuario:', user.full_name);
  
  const getNavigateComponent = () => {
    switch (user.role) {
      case 'administrador':
        return <Navigate to="/dashboard" replace />;
      
      case 'director':
        return <Navigate to="/reportes-ejecutivos" replace />;
      
      case 'operador_alarmas':
        return <Navigate to="/central-alarmas" replace />;
      
      case 'despachador_patrullas':
        return <Navigate to="/patrullas-activas" replace />;
      
      case 'supervisor_motorizado':
        return <Navigate to="/mi-patrulla" replace />;
      
      case 'director_tecnico':
        return <Navigate to="/director-tecnico-section" replace />;
      
      case 'tecnico_propio':
        return <Navigate to="/tecnico-propio-section" replace />;
      
      case 'tecnico_externo':
        return <Navigate to="/tecnico-externo-section" replace />;
      
      case 'tecnico':
        return <Navigate to="/servicios-tecnicos" replace />;
      
      case 'jefe_tecnicos':
        return <Navigate to="/servicios-tecnicos" replace />;
      
      case 'asesor_ventas':
        return <Navigate to="/gestion-clientes" replace />;
      
      default:
        console.log('Rol no reconocido, redirigiendo a dashboard:', user.role);
        return <Navigate to="/dashboard" replace />;
    }
  };

  return (
    <SupervisorGPSProvider>
      {getNavigateComponent()}
    </SupervisorGPSProvider>
  );
};