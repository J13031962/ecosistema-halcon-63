import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarTurnos } from '@/components/turnos/CalendarTurnos';
import { useSupabaseTurnos } from '@/hooks/useSupabaseTurnos';
import { Users, Calendar, Settings, FileText, Wrench, Briefcase } from 'lucide-react';

const DirectorTecnicoSection = () => {
  // Cargar turnos desde la base de datos
  const { turnosOperador, turnosSupervisor, loading: turnosLoading } = useSupabaseTurnos();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Briefcase className="h-8 w-8 text-primary" />
            DIRECTOR TÉCNICO
          </h1>
          <p className="text-muted-foreground">
            Panel de administración y supervisión técnica
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          DIRECTOR TÉCNICO
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Gestión de Técnicos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Administrar personal técnico, asignaciones y supervisión de equipos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Servicios Técnicos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Supervisión de servicios técnicos y mantenimiento de equipos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Reportes Técnicos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Análisis y reportes de rendimiento técnico
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Planificación Técnica
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Planificación de instalaciones y proyectos técnicos
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Turnos Quincenales - Técnicos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CalendarTurnos />
        </CardContent>
      </Card>
    </div>
  );
};

export default DirectorTecnicoSection;