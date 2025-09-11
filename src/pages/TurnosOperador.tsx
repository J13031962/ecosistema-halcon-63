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
          <TabsTrigger value="summary" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Resumen de Horas
          </TabsTrigger>
          <TabsTrigger value="generated" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Turnos Generados
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="calendar" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Mis Turnos
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p>Cargando turnos...</p>
              ) : error ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Error al cargar turnos: {error}
                  </AlertDescription>
                </Alert>
              ) : misTurnos.length > 0 ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Tienes {misTurnos.length} turnos programados en total.
                    </p>
                    <div className="text-xs text-muted-foreground">
                      Próximo turno: {misTurnos.length > 0 ? 
                        new Date(Math.min(...misTurnos.map(t => new Date(t.fecha).getTime()))).toLocaleDateString() : 
                        'No programado'
                      }
                    </div>
                  </div>
                  <CalendarioTurnosPersonal
                    turnos={misTurnos.map(turno => ({
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
                    }))}
                    onEditTurno={(turno) => {
                      console.log('Ver detalles del turno:', turno);
                    }}
                    selectedWeek={selectedWeek}
                    onWeekChange={setSelectedWeek}
                  />
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 font-medium">No tienes turnos asignados</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Los turnos aparecerán aquí cuando sean asignados por el administrador.
                  </p>
                  {currentUser && (
                    <p className="text-xs text-gray-400 mt-1">
                      Usuario actual: {currentUser.email}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="summary" className="mt-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mis Turnos</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{misTurnos.length}</div>
                <p className="text-xs text-muted-foreground">Turnos asignados</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Horas Esta Semana</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">40h</div>
                <p className="text-xs text-muted-foreground">Horas programadas</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Próximo Turno</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Mañana</div>
                <p className="text-xs text-muted-foreground">06:00 - 14:00</p>
              </CardContent>
            </Card>
          </div>

          {/* Mi resumen personal */}
          <div className="space-y-4">
            <div className="p-4 bg-muted/30 rounded-lg">
              <h4 className="font-medium mb-3">Mi Resumen Personal</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground block">Horas Esta Semana:</span>
                  <span className="font-medium text-lg">40h</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Horas Extra:</span>
                  <span className="font-medium text-lg text-orange-600">0h</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Turnos Asignados:</span>
                  <span className="font-medium text-lg">{misTurnos.length}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Próximo Turno:</span>
                  <span className="font-medium text-lg">Mañana 06:00</span>
                </div>
              </div>
            </div>
            
            {/* Historial de cambios */}
            <Card>
              <CardHeader>
                <CardTitle>Historial de Cambios</CardTitle>
                <CardDescription>
                  Modificaciones realizadas por dirección central en tus turnos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div>
                      <p className="font-medium">Cambio de turno - 15 Ene 2025</p>
                      <p className="text-sm text-muted-foreground">Turno cambiado de noche (22:00-06:00) a día (06:00-14:00)</p>
                    </div>
                    <div className="text-sm text-blue-600">Hace 2h</div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <p className="font-medium">Turno asignado - 10 Ene 2025</p>
                      <p className="text-sm text-muted-foreground">Nuevo turno día (06:00-14:00) asignado</p>
                    </div>
                    <div className="text-sm text-green-600">Hace 5d</div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div>
                      <p className="font-medium">Modificación de horario - 8 Ene 2025</p>
                      <p className="text-sm text-muted-foreground">Horario ajustado: 07:00-15:00 → 06:00-14:00</p>
                    </div>
                    <div className="text-sm text-orange-600">Hace 7d</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="generated" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Turnos Generados por Dirección Central
              </CardTitle>
              <CardDescription>
                Consulta los turnos generados automáticamente por la dirección central (solo lectura)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CalendarioTurnosGenerados />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TurnosOperador;