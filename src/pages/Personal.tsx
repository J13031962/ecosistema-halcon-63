import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Plus } from 'lucide-react';

const Personal = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            PERSONAL
          </h1>
          <p className="text-muted-foreground">
            Gestión de personal y recursos humanos
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nuevo Módulo de Personal</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-12">
          <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Empezar desde cero</h3>
          <p className="text-muted-foreground mb-6">
            Módulo limpio listo para implementar nuevas funcionalidades
          </p>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Agregar Funcionalidad
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Personal;