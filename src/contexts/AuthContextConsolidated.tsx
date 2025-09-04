import { createContext, useContext, ReactNode } from 'react';
import { useAuthConsolidated } from '@/hooks/useAuthConsolidated';
import { Loader2 } from 'lucide-react';

interface AuthProviderConsolidatedProps {
  children: ReactNode;
}

const AuthContextConsolidated = createContext<ReturnType<typeof useAuthConsolidated> | undefined>(undefined);

export const AuthProviderConsolidated = ({ children }: AuthProviderConsolidatedProps) => {
  const auth = useAuthConsolidated();

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
    <AuthContextConsolidated.Provider value={auth}>
      {children}
    </AuthContextConsolidated.Provider>
  );
};

export const useAuthConsolidatedContext = () => {
  const context = useContext(AuthContextConsolidated);
  if (context === undefined) {
    throw new Error('useAuthConsolidatedContext must be used within an AuthProviderConsolidated');
  }
  return context;
};