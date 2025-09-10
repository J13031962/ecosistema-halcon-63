import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSupabaseUsuarios } from '@/hooks/useSupabaseUsuarios';
import { UserPlus, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const CreateOperatorUsers = () => {
  const { createUser } = useSupabaseUsuarios();
  const [isCreating, setIsCreating] = useState(false);
  const [createdUsers, setCreatedUsers] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const { toast } = useToast();

  const operatorUsers = [
    {
      email: 'luis.perez@teleguardia.com',
      fullName: 'Luis Perez',
      role: 'operador_alarmas' as const,
      password: 'Perez2025*'
    },
    {
      email: 'jaime.alvarez@teleguardia.com',
      fullName: 'Jaime Alvarez',
      role: 'operador_alarmas' as const,
      password: 'Alvarez2025*'
    },
    {
      email: 'carlos.betancur@teleguardia.com',
      fullName: 'Carlos Betancur',
      role: 'operador_alarmas' as const,
      password: 'Betancur2025*'
    }
  ];

  const createOperators = async () => {
    setIsCreating(true);
    setErrors([]);
    const newCreatedUsers: string[] = [];
    const newErrors: string[] = [];

    for (const userData of operatorUsers) {
      if (!createdUsers.includes(userData.email)) {
        try {
          console.log(`🚀 Creando operador: ${userData.email}`);
          const result = await createUser(userData);
          if (result.success) {
            newCreatedUsers.push(userData.email);
            console.log(`✅ Operador creado exitosamente: ${userData.email}`);
          } else {
            newErrors.push(`${userData.email}: ${result.error}`);
            console.error(`❌ Error creando ${userData.email}:`, result.error);
          }
        } catch (error: any) {
          newErrors.push(`${userData.email}: ${error.message}`);
          console.error(`❌ Error inesperado creando ${userData.email}:`, error);
        }
      }
    }

    setCreatedUsers(prev => [...prev, ...newCreatedUsers]);
    setErrors(newErrors);
    setIsCreating(false);

    if (newCreatedUsers.length > 0) {
      toast({
        title: "Operadores creados",
        description: `${newCreatedUsers.length} operador(es) creado(s) exitosamente`,
      });
    }

    if (newErrors.length > 0) {
      toast({
        title: "Algunos errores ocurrieron",
        description: `${newErrors.length} usuario(s) no pudieron ser creados`,
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Crear Operadores de Alarmas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          {operatorUsers.map((user) => (
            <div
              key={user.email}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div>
                <p className="font-medium">{user.fullName}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <p className="text-xs text-muted-foreground">
                  Contraseña: {user.password}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {createdUsers.includes(user.email) && (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                )}
                {errors.some(error => error.includes(user.email)) && (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
              </div>
            </div>
          ))}
        </div>
        
        <Button
          onClick={createOperators}
          disabled={isCreating || createdUsers.length === operatorUsers.length}
          className="w-full"
        >
          {isCreating ? 'Creando operadores...' : 'Crear Operadores'}
        </Button>
        
        {createdUsers.length > 0 && (
          <div className="text-sm text-green-600">
            ✓ {createdUsers.length} de {operatorUsers.length} operadores creados
          </div>
        )}

        {errors.length > 0 && (
          <div className="text-sm text-red-600 space-y-1">
            <p className="font-medium">Errores:</p>
            {errors.map((error, index) => (
              <p key={index} className="text-xs">• {error}</p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CreateOperatorUsers;