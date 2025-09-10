import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSupabaseUsuarios } from '@/hooks/useSupabaseUsuarios';
import { useAuthConsolidated } from '@/hooks/useAuthConsolidated';
import { UserRole } from '@/types/auth';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import CreateOperatorUsers from './CreateOperatorUsers';

export const AdminTestPanel: React.FC = () => {
  const { createUser, users, loading, fetchUsers } = useSupabaseUsuarios();
  const { user, hasRole } = useAuthConsolidated();
  const [testResults, setTestResults] = useState<any[]>([]);

  const runAuthTests = async () => {
    const results = [];
    
    // Test 1: Verificar que el usuario actual es admin
    const isAdmin = hasRole('administrador');
    results.push({
      test: 'Usuario actual es administrador',
      status: isAdmin ? 'success' : 'error',
      details: `Rol actual: ${user?.role}, Es admin: ${isAdmin}`
    });

    // Test 2: Intentar crear un usuario de prueba
    try {
      const testUserData = {
        email: `test-${Date.now()}@teleguardia.com`,
        password: 'Test123456',
        fullName: 'Usuario de Prueba',
        role: 'operador_alarmas' as UserRole
      };
      
      const createResult = await createUser(testUserData);
      results.push({
        test: 'Creación de usuario',
        status: createResult.success ? 'success' : 'error',
        details: createResult.success ? 'Usuario creado exitosamente' : `Error: ${createResult.error}`
      });
    } catch (error: any) {
      results.push({
        test: 'Creación de usuario',
        status: 'error',
        details: `Error: ${error.message}`
      });
    }

    // Test 3: Refrescar lista de usuarios
    try {
      await fetchUsers();
      results.push({
        test: 'Carga de usuarios',
        status: 'success',
        details: `${users.length} usuarios cargados`
      });
    } catch (error: any) {
      results.push({
        test: 'Carga de usuarios',
        status: 'error',
        details: `Error: ${error.message}`
      });
    }

    setTestResults(results);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Componente para crear operadores específicos */}
      <CreateOperatorUsers />
      
      <Card>
        <CardHeader>
          <CardTitle>Panel de Pruebas de Administrador</CardTitle>
          <CardDescription>
            Pruebas para verificar el funcionamiento del sistema de autenticación
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col space-y-2">
            <h3 className="font-semibold">Estado Actual:</h3>
            <div className="flex items-center space-x-2">
              <Badge variant={user ? 'default' : 'destructive'}>
                Usuario: {user?.full_name || 'No autenticado'}
              </Badge>
              <Badge variant={hasRole('administrador') ? 'default' : 'destructive'}>
                Rol: {user?.role || 'Sin rol'}
              </Badge>
            </div>
          </div>

          <Button 
            onClick={runAuthTests} 
            disabled={loading || !hasRole('administrador')}
            className="w-full"
          >
            {loading ? 'Ejecutando pruebas...' : 'Ejecutar Pruebas de Sistema'}
          </Button>

          {testResults.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold">Resultados de las Pruebas:</h3>
              {testResults.map((result, index) => (
                <div key={index} className="flex items-start space-x-2 p-3 border rounded-lg">
                  {getStatusIcon(result.status)}
                  <div className="flex-1">
                    <p className="font-medium">{result.test}</p>
                    <p className="text-sm text-muted-foreground">{result.details}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!hasRole('administrador') && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800">
                ⚠️ Solo los administradores pueden ejecutar estas pruebas.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};