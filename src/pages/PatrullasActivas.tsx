import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSupabasePatrullas } from "@/hooks/useSupabasePatrullas";
import { useSupabaseAlarmas } from "@/hooks/useSupabaseAlarmas";
import { Car, MapPin, Clock, Search, Filter, Download, Shield, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

const PatrullasActivas = () => {
  const { patrullas, loading: patrullasLoading } = useSupabasePatrullas();
  const { alarmas } = useSupabaseAlarmas();
  
  // Filtrar solo supervisores (que tienen patrullas asignadas)
  const supervisores = patrullas.filter(p => p.supervisor_nombre);
  
  // Supervisores que están atendiendo alarmas
  const supervisoresConAlarmas = alarmas
    .filter(a => a.estado === 'asignada' && a.supervisor && a.patrulla_asignada)
    .map(a => ({
      supervisor: a.supervisor,
      patrulla: a.patrulla_asignada,
      tiempo_respuesta: a.attended_at ? 
        Math.floor((new Date().getTime() - new Date(a.attended_at).getTime()) / 60000) : 0
    }));

  const getStatusColor = (estado: string) => {
    switch (estado?.toLowerCase()) {
      case "disponible": return "secondary";
      case "en servicio": return "default";
      case "ocupado": return "destructive";
      case "mantenimiento": return "outline";
      default: return "outline";
    }
  };

  if (patrullasLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded w-2/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Patrullas Activas</h1>
        <p className="text-muted-foreground">Monitoreo de supervisores registrados en el sistema</p>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Supervisores</CardTitle>
            <Car className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{supervisores.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Servicio</CardTitle>
            <Shield className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {supervisores.filter(s => s.estado === 'en servicio').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disponibles</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {supervisores.filter(s => s.estado === 'disponible').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atendiendo Alarmas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{supervisoresConAlarmas.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y búsqueda */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Input 
              placeholder="Buscar supervisor..." 
              className="max-w-xs"
            />
            <Button variant="outline">
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </Button>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filtros Avanzados
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de supervisores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {supervisores.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <CardContent className="py-8 text-center">
                <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No hay supervisores registrados</h3>
                <p className="text-muted-foreground">
                  Los supervisores con patrullas asignadas aparecerán aquí.
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          supervisores.map((supervisor) => (
            <Card key={supervisor.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{supervisor.numero_patrulla}</CardTitle>
                  <Badge variant={getStatusColor(supervisor.estado)}>
                    {supervisor.estado || 'Sin estado'}
                  </Badge>
                </div>
                <p className="text-muted-foreground">
                  Supervisor: {supervisor.supervisor_nombre}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Información básica */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Estado:</p>
                    <p className="font-medium">{supervisor.estado || 'No especificado'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Ubicación:</p>
                    <p className="font-medium">{supervisor.ubicacion || 'No especificada'}</p>
                  </div>
                </div>

                {/* Si está atendiendo una alarma */}
                {supervisoresConAlarmas.find(s => s.supervisor === supervisor.supervisor_nombre) && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-800">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-medium">Atendiendo Alarma</span>
                    </div>
                    <p className="text-sm text-red-600 mt-1">
                      Tiempo: {supervisoresConAlarmas.find(s => s.supervisor === supervisor.supervisor_nombre)?.tiempo_respuesta || 0} min
                    </p>
                  </div>
                )}

                <div className="text-xs text-muted-foreground">
                  <p>Actualizado: {format(new Date(supervisor.updated_at), 'dd/MM/yyyy HH:mm')}</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default PatrullasActivas;