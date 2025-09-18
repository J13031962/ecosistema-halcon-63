import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { GeneradorTurnosAvanzado } from "@/components/turnos/GeneradorTurnosAvanzado";
import { VisualizadorTurnosOperador } from "@/components/turnos/VisualizadorTurnosOperador";
import { CalendarTurnos } from "@/components/turnos/CalendarTurnos";
import { CalendarioTurnosQuincenal } from "@/components/personal/CalendarioTurnosQuincenal";
import { CalendarioTurnos as CalendarioTurnosPersonal } from "@/components/personal/CalendarioTurnos";
import { CalendarioTurnosGenerados } from "@/components/personal/CalendarioTurnosGenerados";
import { useSupabaseTurnos, TurnoOperador } from "@/hooks/useSupabaseTurnos";
import { Plus, Calendar, Users, Clock, Settings, Eye, AlertCircle, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const TurnosOperador = () => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [misTurnos, setMisTurnos] = useState<TurnoOperador[]>([]);
  const { turnosOperador, loading, error, refetch } = useSupabaseTurnos();
  const { toast } = useToast();

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        console.log('👤 Usuario actual:', user.id, user.email);
        setCurrentUser(user);
        
        // Refrescar los datos de turnos
        await refetch();
      }
    };
    
    getCurrentUser();
  }, [refetch]);

  useEffect(() => {
    if (currentUser && turnosOperador.length >= 0) {
      console.log('📊 Total turnos operador en BD:', turnosOperador.length);
      console.log('📊 Turnos operador completos:', turnosOperador);
      
      // Filtrar turnos del usuario actual - múltiples criterios
      const userTurnos = turnosOperador.filter(turno => {
        const matchesUserId = turno.operador_id === currentUser.id;
        const matchesEmail = turno.operador_nombre?.toLowerCase().includes(currentUser.email?.split('@')[0] || '');
        const emailName = currentUser.email?.split('@')[0]?.toLowerCase();
        const turnoName = turno.operador_nombre?.toLowerCase();
        const matchesPartialName = emailName && turnoName && (
          turnoName.includes(emailName) || 
          emailName.includes(turnoName.split(' ')[0]) ||
          turnoName.includes('luis') && emailName.includes('luis')
        );
        
        console.log(`🔍 Evaluando turno ${turno.id}:`, {
          operador_id: turno.operador_id,
          operador_nombre: turno.operador_nombre,
          user_id: currentUser.id,
          user_email: currentUser.email,
          matchesUserId,
          matchesEmail,
          matchesPartialName
        });
        
        return matchesUserId || matchesEmail || matchesPartialName;
      });
      
      console.log('✅ Turnos filtrados para el usuario:', userTurnos);
      setMisTurnos(userTurnos);
      
      // Si no hay turnos, mostrar mensaje de debug
      if (userTurnos.length === 0 && turnosOperador.length > 0) {
        toast({
          title: "Debug - Turnos no encontrados",
          description: `No se encontraron turnos para ${currentUser.email}. Total turnos en BD: ${turnosOperador.length}`,
          variant: "destructive"
        });
      }
    }
  }, [currentUser, turnosOperador, toast]);

  // Convertir TurnoOperador a formato Turno para el calendario
  const turnosAdaptados = turnosOperador.map(turno => ({
    id: turno.id?.toString() || '',
    fecha: new Date(turno.fecha),
    operador_id: turno.operador_id || '',
    operador_nombre: turno.operador_nombre || `Operador ${turno.operador_id}`,
    hora_inicio: turno.horario_inicio || '08:00',
    hora_fin: turno.horario_fin || '16:00',
    tipo: (turno.turno === 'nocturno' ? 'nocturno' : 'diurno') as 'diurno' | 'nocturno',
    horas_diurnas: 8,
    horas_nocturnas: turno.turno === 'nocturno' ? 8 : 0,
    horas_domingo: 0,
    horas_feriado: 0,
    horas_extra: 0,
    total_horas: 8,
    es_domingo: false,
    es_feriado: false
  }));

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold">Mis Turnos - Operador</h1>
          <p className="text-sm text-muted-foreground">
            Consulta y visualización de tus turnos asignados
          </p>
          {currentUser && (
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary">
                <User className="w-3 h-3 mr-1" />
                {currentUser.email}
              </Badge>
              <Badge variant="outline">
                {misTurnos.length} turnos encontrados
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Debug:</strong> Total turnos en BD: {turnosOperador.length} | 
            Mis turnos: {misTurnos.length} | 
            Usuario: {currentUser?.email || 'No autenticado'}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="calendar" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendario de Turnos
          </TabsTrigger>
          <TabsTrigger value="detailed" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Vista Detallada
          </TabsTrigger>
          <TabsTrigger value="summary" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Resumen de Horas
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="calendar" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Calendario de Turnos Generados
              </CardTitle>
              <CardDescription>
                Consulta los turnos generados automáticamente por la dirección central
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CalendarioTurnosGenerados />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="detailed" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Vista Detallada de Mis Turnos
              </CardTitle>
              <CardDescription>
                Visualización detallada de tus turnos asignados con cálculo de horas trabajadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VisualizadorTurnosOperador />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="summary" className="mt-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {misTurnos.length > 0 && (
              <>
                {/* Calcular horas por operador único */}
                {(() => {
                  const operadoresUnicos = [...new Set(misTurnos.map(t => t.operador_nombre))];
                  return operadoresUnicos.map((operadorNombre, index) => {
                    const turnosOperador = misTurnos.filter(t => t.operador_nombre === operadorNombre);
                    const horasDiurnas = turnosOperador.filter(t => t.turno === 'diurno').length * 12;
                    const horasNocturnas = turnosOperador.filter(t => t.turno === 'nocturno').length * 12;
                    const turnosDomingo = turnosOperador.filter(t => new Date(t.fecha).getDay() === 0);
                    const horasDominicalesDiurnas = turnosDomingo.filter(t => t.turno === 'diurno').length * 12;
                    const horasDominicalesNocturnas = turnosDomingo.filter(t => t.turno === 'nocturno').length * 12;
                    const horasExtras = Math.max(0, (horasDiurnas + horasNocturnas) - 160); // Asumiendo 160h normales por mes
                    const totalHoras = horasDiurnas + horasNocturnas;
                    
                    const colorClasses = [
                      'bg-blue-50 border-blue-200',
                      'bg-green-50 border-green-200', 
                      'bg-purple-50 border-purple-200',
                      'bg-orange-50 border-orange-200'
                    ];
                    
                    return (
                      <Card key={operadorNombre} className={`${colorClasses[index % 4]} p-4`}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg font-bold">{operadorNombre}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">Horas Diurnas Ordinarias:</span>
                            <span className="font-bold">{Math.max(0, horasDiurnas - horasExtras).toFixed(1)}h</span>
                          </div>
                          {horasExtras > 0 && (
                            <div className="flex justify-between">
                              <span className="text-sm text-orange-600">Horas Extras Diurnas:</span>
                              <span className="font-bold text-orange-600">{horasExtras.toFixed(1)}h</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-sm">Horas Nocturnas:</span>
                            <span className="font-bold">{horasNocturnas.toFixed(1)}h</span>
                          </div>
                          {horasDominicalesDiurnas > 0 && (
                            <div className="flex justify-between">
                              <span className="text-sm text-blue-600">Horas Dominicales Diurnas:</span>
                              <span className="font-bold text-blue-600">{horasDominicalesDiurnas.toFixed(1)}h</span>
                            </div>
                          )}
                          {horasDominicalesNocturnas > 0 && (
                            <div className="flex justify-between">
                              <span className="text-sm text-blue-600">Horas Dominicales Nocturnas:</span>
                              <span className="font-bold text-blue-600">{horasDominicalesNocturnas.toFixed(1)}h</span>
                            </div>
                          )}
                          <div className="border-t pt-2 mt-2">
                            <div className="flex justify-between font-bold">
                              <span>Total:</span>
                              <span>{totalHoras.toFixed(1)}h</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  });
                })()}
              </>
            )}
          </div>

          {/* Si no hay turnos, mostrar mensaje */}
          {misTurnos.length === 0 && (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 font-medium">No hay turnos para mostrar resumen</p>
              <p className="text-sm text-gray-400 mt-2">
                Los resúmenes aparecerán cuando se generen turnos desde dirección central.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TurnosOperador;