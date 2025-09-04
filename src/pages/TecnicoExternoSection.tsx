import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarTurnos } from '@/components/turnos/CalendarTurnos';
import { UserCheck, Calendar, Headphones, FileText, ExternalLink } from 'lucide-react';

const TecnicoExternoSection = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <UserCheck className="h-8 w-8 text-primary" />
            TÉCNICO EXTERNO
          </h1>
          <p className="text-muted-foreground">
            Panel de trabajo técnico externo y soporte especializado
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          TÉCNICO EXTERNO
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              Servicios Técnicos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Servicios técnicos especializados y soporte externo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Headphones className="h-5 w-5" />
              Soporte Técnico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Atención técnica especializada y resolución de incidencias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Reportes de Trabajo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Informes detallados de trabajos externos realizados
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Turnos Quincenales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CalendarTurnos />
        </CardContent>
      </Card>
    </div>
  );
};

export default TecnicoExternoSection;