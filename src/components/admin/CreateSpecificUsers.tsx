import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSupabaseUsuarios } from '@/hooks/useSupabaseUsuarios';
import { UserPlus, CheckCircle } from 'lucide-react';

export const CreateSpecificUsers = () => {
  const { createUser } = useSupabaseUsuarios();
  const [isCreating, setIsCreating] = useState(false);
  const [createdUsers, setCreatedUsers] = useState<string[]>([]);

  const specificUsers = [
    {
      email: 'directortecnico@teleguardia.com',
      fullName: 'Director Técnico',
      role: 'jefe_tecnicos' as const,
      password: 'TeleGuardia2024!'
    },
    {
      email: 'asesorventas@teleguardia.com',
      fullName: 'Asesor de Ventas',
      role: 'asesor_ventas' as const,
      password: 'TeleGuardia2024!'
    }
  ];

  const createSpecificUsers = async () => {
    setIsCreating(true);
    const newCreatedUsers: string[] = [];

    for (const userData of specificUsers) {
      if (!createdUsers.includes(userData.email)) {
        const result = await createUser(userData);
        if (result.success) {
          newCreatedUsers.push(userData.email);
        }
      }
    }

    setCreatedUsers(prev => [...prev, ...newCreatedUsers]);
    setIsCreating(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Crear Usuarios Específicos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          {specificUsers.map((user) => (
            <div
              key={user.email}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div>
                <p className="font-medium">{user.fullName}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <p className="text-xs text-muted-foreground">
                  Rol: {user.role === 'jefe_tecnicos' ? 'Jefe de Técnicos' : 'Asesor de Ventas'}
                </p>
              </div>
              {createdUsers.includes(user.email) && (
                <CheckCircle className="h-5 w-5 text-green-600" />
              )}
            </div>
          ))}
        </div>
        
        <Button
          onClick={createSpecificUsers}
          disabled={isCreating || createdUsers.length === specificUsers.length}
          className="w-full"
        >
          {isCreating ? 'Creando usuarios...' : 'Crear Usuarios Específicos'}
        </Button>
        
        {createdUsers.length > 0 && (
          <div className="text-sm text-green-600">
            ✓ {createdUsers.length} de {specificUsers.length} usuarios creados
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CreateSpecificUsers;