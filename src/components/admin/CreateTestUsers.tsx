import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Users, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface TestUser {
  email: string;
  password: string;
  fullName: string;
  role: string;
  created?: boolean;
  error?: string;
}

const testUsers: TestUser[] = [
  {
    email: 'operador@gmail.com',
    password: 'operador123',
    fullName: 'Operador de Alarmas',
    role: 'operador_alarmas'
  },
  {
    email: 'despachador@gmail.com', 
    password: 'despachador123',
    fullName: 'Despachador de Patrullas',
    role: 'despachador_patrullas'
  },
  {
    email: 'supervisor@gmail.com',
    password: 'supervisor123', 
    fullName: 'Supervisor Motorizado',
    role: 'supervisor_motorizado'
  },
  {
    email: 'tecnico@gmail.com',
    password: 'tecnico123',
    fullName: 'Técnico',
    role: 'tecnico'
  },
  {
    email: 'jefe-tecnicos@gmail.com',
    password: 'jefe123',
    fullName: 'Jefe de Técnicos', 
    role: 'jefe_tecnicos'
  },
  {
    email: 'asesor-ventas@gmail.com',
    password: 'asesor123',
    fullName: 'Asesor de Ventas',
    role: 'asesor_ventas'
  }
];

export function CreateTestUsers() {
  const [users, setUsers] = useState<TestUser[]>(testUsers);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const createUser = async (user: TestUser): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.signUp({
        email: user.email,
        password: user.password,
        options: {
          data: {
            full_name: user.fullName
          },
          emailRedirectTo: `${window.location.origin}/auth`
        }
      });

      if (error) {
        console.error(`Error creating user ${user.email}:`, error);
        return false;
      }

      return true;
    } catch (error) {
      console.error(`Error creating user ${user.email}:`, error);
      return false;
    }
  };

  const createAllUsers = async () => {
    setIsCreating(true);
    const updatedUsers = [...users];

    for (let i = 0; i < updatedUsers.length; i++) {
      const user = updatedUsers[i];
      
      if (user.created) continue; // Skip already created users

      toast({
        title: "Creando usuario",
        description: `Creando ${user.fullName}...`
      });

      const success = await createUser(user);
      
      updatedUsers[i] = {
        ...user,
        created: success,
        error: success ? undefined : 'Error al crear usuario'
      };

      setUsers([...updatedUsers]);
      
      // Small delay between creations
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setIsCreating(false);
    
    const successCount = updatedUsers.filter(u => u.created).length;
    const totalCount = updatedUsers.length;
    
    toast({
      title: "Proceso completado",
      description: `${successCount}/${totalCount} usuarios creados exitosamente`,
      variant: successCount === totalCount ? "default" : "destructive"
    });
  };

  const allCreated = users.every(u => u.created);
  const hasErrors = users.some(u => u.error);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Crear Usuarios de Prueba
        </CardTitle>
        <CardDescription>
          Crea automáticamente todos los usuarios de prueba con sus roles correspondientes.
          Los roles se asignan automáticamente basados en el email.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Importante:</strong> Asegúrate de que la confirmación de email esté deshabilitada en 
            Supabase Authentication Settings para que los usuarios puedan iniciar sesión inmediatamente.
          </AlertDescription>
        </Alert>

        <div className="grid gap-4">
          {users.map((user, index) => (
            <div 
              key={user.email}
              className={`flex items-center justify-between p-4 border rounded-lg ${
                user.created ? 'bg-green-50 border-green-200' : 
                user.error ? 'bg-red-50 border-red-200' : 
                'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex-1">
                <div className="font-medium">{user.fullName}</div>
                <div className="text-sm text-gray-600">{user.email}</div>
                <div className="text-sm text-gray-500">Rol: {user.role}</div>
                <div className="text-sm text-gray-500">Contraseña: {user.password}</div>
              </div>
              
              <div className="flex items-center gap-2">
                {user.created && (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-sm text-green-600">Creado</span>
                  </>
                )}
                {user.error && (
                  <>
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <span className="text-sm text-red-600">Error</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={createAllUsers}
            disabled={isCreating || allCreated}
            className="w-full"
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creando usuarios...
              </>
            ) : allCreated ? (
              'Todos los usuarios creados'
            ) : (
              'Crear todos los usuarios'
            )}
          </Button>
        </div>

        {(allCreated || hasErrors) && (
          <Alert className={allCreated && !hasErrors ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
            <AlertDescription>
              {allCreated && !hasErrors ? (
                <>
                  <strong>¡Éxito!</strong> Todos los usuarios han sido creados. 
                  Ahora puedes iniciar sesión con cualquiera de ellos usando las credenciales mostradas arriba.
                </>
              ) : (
                <>
                  <strong>Advertencia:</strong> Algunos usuarios no pudieron ser creados. 
                  Verifica que no existan ya en el sistema o que no haya errores de validación.
                </>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}