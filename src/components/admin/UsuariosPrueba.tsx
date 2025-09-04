import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, User, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface UsuarioPrueba {
  email: string;
  password: string;
  nombre: string;
  rol: string;
  rolColor: 'default' | 'secondary' | 'destructive' | 'outline';
}

const usuariosPrueba: UsuarioPrueba[] = [
  {
    email: 'admin@teleguardia.com',
    password: 'Tele2025*',
    nombre: 'Administrador Teleguardia',
    rol: 'Administrador',
    rolColor: 'destructive'
  },
  {
    email: 'directortec@teleguardia.com',
    password: 'Dirtecnico2025*',
    nombre: 'Director Técnico',
    rol: 'Jefe Técnicos',
    rolColor: 'default'
  },
  {
    email: 'directorcentral@teleguardia.com',
    password: 'Dircentral2025*',
    nombre: 'Director Central',
    rol: 'Director Central',
    rolColor: 'default'
  },
  {
    email: 'operador@teleguardia.com',
    password: 'Operador2025*',
    nombre: 'Operador de Alarmas',
    rol: 'Operador de Alarmas',
    rolColor: 'secondary'
  },
  {
    email: 'despachador@teleguardia.com',
    password: 'Despachador2025*',
    nombre: 'Despachador de Patrullas',
    rol: 'Despachador de Patrullas',
    rolColor: 'outline'
  },
  {
    email: 'supervisor@teleguardia.com',
    password: 'Supervisor2025*',
    nombre: 'Supervisor Motorizado',
    rol: 'Supervisor Motorizado',
    rolColor: 'secondary'
  },
  {
    email: 'tecnico@teleguardia.com',
    password: 'Tecnico2025*',
    nombre: 'Técnico de Campo',
    rol: 'Técnico',
    rolColor: 'outline'
  }
];

export const UsuariosPrueba: React.FC = () => {
  const { toast } = useToast();

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado",
      description: `${type} copiado al portapapeles`,
    });
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          Usuarios de Prueba del Sistema
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Estos son los usuarios preconfigurados para el sistema Teleguardia. Cada usuario tiene su contraseña específica.
          </p>
          
          <div className="grid gap-4 md:grid-cols-2">
            {usuariosPrueba.map((usuario, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant={usuario.rolColor}>{usuario.rol}</Badge>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">{usuario.nombre}</h4>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground min-w-0">Email:</span>
                    <code className="text-sm bg-muted px-2 py-1 rounded flex-1 truncate">
                      {usuario.email}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(usuario.email, 'Email')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground min-w-0">Clave:</span>
                    <code className="text-sm bg-muted px-2 py-1 rounded flex-1">
                      {usuario.password}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(usuario.password, 'Contraseña')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <div className="flex items-start gap-2">
              <Key className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-blue-900 dark:text-blue-100">Instrucciones de Acceso</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  1. Ve a la página de login (/auth)<br/>
                  2. Usa cualquiera de los emails de Teleguardia mostrados arriba<br/>
                  3. Cada usuario tiene su propia contraseña específica<br/>
                  4. Cada usuario tendrá acceso según su rol asignado
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};