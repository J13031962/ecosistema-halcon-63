import React, { useState } from 'react';
import { OperationalThemeWrapper } from '@/components/layout/OperationalThemeWrapper';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GeneradorTurnosSupervisores } from '@/components/turnos/GeneradorTurnosSupervisores';
import { VisualizadorTurnosSupervisor } from '@/components/turnos/VisualizadorTurnosSupervisor';
import { Calendar, Plus, Eye, Users } from 'lucide-react';
import { useAuthConsolidated } from '@/hooks/useAuthConsolidated';

export default function TurnosSupervisor() {
  const { user } = useAuthConsolidated();

  return (
    <OperationalThemeWrapper>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Users className="h-8 w-8" />
              Gestión de Turnos - Supervisores
            </h1>
            <p className="text-muted-foreground mt-2">
              Sistema de gestión y visualización de turnos para supervisores motorizados
            </p>
          </div>
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Despachador</div>
              <div className="font-semibold">{user?.full_name || user?.email}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs principales */}
        <Tabs defaultValue="calendario" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="calendario" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Ver Turnos
            </TabsTrigger>
            <TabsTrigger value="crear" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Crear Turnos
            </TabsTrigger>
          </TabsList>

          {/* Vista de Turnos */}
          <TabsContent value="calendario" className="space-y-6">
            <VisualizadorTurnosSupervisor />
          </TabsContent>

          {/* Crear Turnos */}
          <TabsContent value="crear" className="space-y-6">
            <GeneradorTurnosSupervisores />
          </TabsContent>
        </Tabs>

        {/* Información adicional */}
        <Card>
          <CardHeader>
            <CardTitle>Información sobre Turnos de Supervisores</CardTitle>
            <CardDescription>
              Instrucciones y buenas prácticas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">📋 Tipos de Turno:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• <strong>Día:</strong> 06:00 - 18:00 (12 horas)</li>
                  <li>• <strong>Noche:</strong> 18:00 - 06:00 (12 horas)</li>
                  <li>• <strong>Descanso:</strong> Día libre sin asignación</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">⚙️ Patrones de Rotación:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• <strong>2-2-2:</strong> 2 días, 2 noches, 2 descansos</li>
                  <li>• <strong>4-4-4:</strong> 4 días trabajo, 4 días descanso</li>
                  <li>• Rotación automática entre supervisores</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </OperationalThemeWrapper>
  );
}
