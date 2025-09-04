import { createContext, useContext, ReactNode } from 'react';
import { AuthContextEnhanced, useAuthEnhancedHook } from '@/hooks/useAuthEnhanced';
import { Loader2 } from 'lucide-react';

interface AuthProviderEnhancedProps {
  children: ReactNode;
}

const AuthContextEnhancedComponent = createContext<ReturnType<typeof useAuthEnhancedHook> | undefined>(undefined);

export const AuthProviderEnhanced = ({ children }: AuthProviderEnhancedProps) => {
  const auth = useAuthEnhancedHook();

  // Mostrar loading global mientras se verifica la autenticación inicial
  if (auth.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Sistema HALCON</h2>
            <p className="text-muted-foreground">Inicializando aplicación...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthContextEnhancedComponent.Provider value={auth}>
      {children}
    </AuthContextEnhancedComponent.Provider>
  );
};

export const useAuthEnhanced = () => {
  const context = useContext(AuthContextEnhancedComponent);
  if (context === undefined) {
    throw new Error('useAuthEnhanced must be used within an AuthProviderEnhanced');
  }
  return context;
};