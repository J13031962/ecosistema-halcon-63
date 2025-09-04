import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Car, Clock, CheckCircle, MapPin, Users, AlertTriangle, Siren, Shield, Flame, Eye, UserCheck, Search, Filter, Download, Calendar } from "lucide-react";
import { useAlarmas, Alarm } from "@/contexts/AlarmasContext";
import { useSupabasePatrullas } from "@/hooks/useSupabasePatrullas";
import { useSupabaseAlarmas } from "@/hooks/useSupabaseAlarmas";
import { useSupabaseTurnos } from "@/hooks/useSupabaseTurnos";
import { useSupabaseUsuarios } from "@/hooks/useSupabaseUsuarios";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AsignarPatrullaModal } from "@/components/modals/AsignarPatrullaModal";
import { CalendarTurnosDespachador } from "@/components/turnos/CalendarTurnosDespachador";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";


const SeccionDespachador = () => {
  const { state, assignPatrolToAlarm, getTimerColor } = useAlarmas();
  const { patrullas, loading: patrullasLoading } = useSupabasePatrullas();
  const { alarmas } = useSupabaseAlarmas();
  const { turnosSupervisor, addTurnoSupervisor, loading: turnosLoading } = useSupabaseTurnos();
  const { users } = useSupabaseUsuarios();
  
  const [timers, setTimers] = useState<{ [key: number]: string }>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAlarm, setSelectedAlarm] = useState<Alarm | null>(null);
  const [turnoModalOpen, setTurnoModalOpen] = useState(false);
  const [selectedSupervisor, setSelectedSupervisor] = useState("");
  const [selectedTurno, setSelectedTurno] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  
  // Filtrar supervisores
  const supervisores = users.filter(user => 
    user.user_roles?.some(role => role.role === 'supervisor_motorizado')
  );
  
  // Supervisores que están atendiendo alarmas
  const supervisoresConAlarmas = alarmas
    .filter(a => a.estado === 'asignada' && a.supervisor && a.patrulla_asignada)
    .map(a => ({
      supervisor: a.supervisor,
      patrulla: a.patrulla_asignada,
      tiempo_respuesta: a.attended_at ? 
        Math.floor((new Date().getTime() - new Date(a.attended_at).getTime()) / 60000) : 0
    }));

  // Actualizar timers cada segundo para alarmas activas
  useEffect(() => {
    const interval = setInterval(() => {
      const newTimers: { [key: number]: string } = {};
      if (state.alarmasActivas) {
        state.alarmasActivas.forEach(alarm => {
          const now = new Date();
          const elapsed = Math.floor((now.getTime() - alarm.startTime.getTime()) / 1000);
          const minutes = Math.floor(elapsed / 60);
          const seconds = elapsed % 60;
          newTimers[alarm.id] = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        });
      }
      setTimers(newTimers);
    }, 1000);

    return () => clearInterval(interval);
  }, [state.alarmasActivas]);


  const getAlarmTypeIcon = (type: Alarm['type']) => {
    switch (type) {
      case "Fuego": return <Flame className="h-4 w-4" />;
      case "Pánico": return <Shield className="h-4 w-4" />;
      case "Revisión": return <Eye className="h-4 w-4" />;
      case "Acompañamiento": return <UserCheck className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getAlarmTypeColor = (type: Alarm['type']) => {
    switch (type) {
      case "Fuego": return "border-red-500 bg-red-50";
      case "Pánico": return "border-purple-500 bg-purple-50";
      case "Revisión": return "border-blue-500 bg-blue-50";
      case "Acompañamiento": return "border-green-500 bg-green-50";
      default: return "border-orange-500 bg-orange-50";
    }
  };

  const getAlarmStatusColor = (status: string) => {
    switch (status) {
      case "Activa": return "destructive";
      case "En Proceso": return "default";
      default: return "outline";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Alta": return "text-red-600";
      case "Media": return "text-orange-500";
      case "Baja": return "text-yellow-500";
      default: return "text-gray-500";
    }
  };

  const handleAttendAlarm = (alarm: Alarm) => {
    setSelectedAlarm(alarm);
    setModalOpen(true);
  };

  const handleAssignPatrol = (alarmId: number, supervisor: { name: string; patrullaUnit: string }) => {
    assignPatrolToAlarm(alarmId, supervisor);
  };

  const handleAssignTurno = async () => {
    if (!selectedSupervisor || !selectedTurno || !selectedDate) return;

    try {
      const supervisor = supervisores.find(s => s.id === selectedSupervisor);
      await addTurnoSupervisor({
        fecha: selectedDate,
        turno: selectedTurno,
        supervisor_id: selectedSupervisor,
        supervisor_nombre: supervisor?.full_name || supervisor?.email || '',
        horario_inicio: getHorarioInicio(selectedTurno),
        horario_fin: getHorarioFin(selectedTurno)
      });
      
      setTurnoModalOpen(false);
      setSelectedSupervisor("");
      setSelectedTurno("");
      setSelectedDate("");
    } catch (error) {
      console.error('Error al asignar turno:', error);
    }
  };

  const getHorarioInicio = (turno: string) => {
    switch (turno) {
      case 'MAÑANA': return '06:00:00';
      case 'TARDE': return '14:00:00';
      case 'NOCHE': return '22:00:00';
      default: return '00:00:00';
    }
  };

  const getHorarioFin = (turno: string) => {
    switch (turno) {
      case 'MAÑANA': return '14:00:00';
      case 'TARDE': return '22:00:00';
      case 'NOCHE': return '06:00:00';
      default: return '00:00:00';
    }
  };

  const getStatusColor = (estado: string) => {
    switch (estado?.toLowerCase()) {
      case "disponible": return "secondary";
      case "en servicio": return "default";
      case "ocupado": return "destructive";
      case "mantenimiento": return "outline";
      default: return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Car className="h-8 w-8 text-primary" />
          Sección Despachador
        </h1>
        <p className="text-muted-foreground">Gestión de alarmas despachadas, seguimiento de patrullas y asignación de turnos</p>
      </div>

      <Tabs defaultValue="alarmas" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="alarmas">Gestión de Alarmas</TabsTrigger>
          <TabsTrigger value="patrullas">Patrullas Activas</TabsTrigger>
          <TabsTrigger value="turnos">Turnos Supervisores</TabsTrigger>
        </TabsList>

        <TabsContent value="alarmas" className="space-y-6">

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alarmas Pendientes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {state.alarmasActivas?.length || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rutas Asignadas</CardTitle>
            <Car className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {state.rutasAsignadas?.length || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patrullas Activas</CardTitle>
            <MapPin className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {state.rutasAsignadas?.filter(r => r.status === 'En Proceso').length || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resueltas Hoy</CardTitle>
            <CheckCircle className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {state.alarmasResueltas}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alarmas Pendientes de Atención */}
      <Card>
        <CardHeader>
          <CardTitle>Alarmas Pendientes de Atención</CardTitle>
          <CardDescription>Alarmas que requieren asignación de patrulla</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {!state.alarmasActivas || state.alarmasActivas.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Siren className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>No hay alarmas pendientes en este momento</p>
                <p className="text-sm">Las nuevas alarmas aparecerán aquí automáticamente</p>
              </div>
            ) : (
              state.alarmasActivas.map((alarm) => (
                <AccordionItem key={alarm.id} value={`alarm-${alarm.id}`} className={`border-2 rounded-lg mb-4 ${getAlarmTypeColor(alarm.type)}`}>
                  <AccordionTrigger className="px-4 py-2 hover:no-underline">
                    <div className="flex items-center justify-between w-full mr-4">
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-full ${alarm.priority === 'Alta' ? 'bg-red-100' : 'bg-orange-100'}`}>
                          {getAlarmTypeIcon(alarm.type)}
                        </div>
                        <div className="text-left">
                          <h4 className="font-semibold">{alarm.client}</h4>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="font-medium">
                              {alarm.type}
                            </Badge>
                            <span className="text-sm text-muted-foreground">📍 {alarm.municipality}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <Badge variant={getAlarmStatusColor(alarm.status)}>{alarm.status}</Badge>
                        <Badge variant="outline" className={getPriorityColor(alarm.priority)}>
                          {alarm.priority}
                        </Badge>
                        <span className={`font-mono text-lg font-bold ${getTimerColor(alarm.startTime)}`}>
                          <Clock className="h-4 w-4 inline mr-1" />
                          {timers[alarm.id] || '00:00'}
                        </span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p><strong>Dirección:</strong> {alarm.address}</p>
                          <p><strong>Municipio:</strong> {alarm.municipality}</p>
                          <p><strong>Hora de inicio:</strong> {alarm.startTime.toLocaleTimeString()}</p>
                        </div>
                        <div>
                          <p><strong>Estado:</strong> {alarm.status}</p>
                          <p><strong>Prioridad:</strong> {alarm.priority}</p>
                          {alarm.operator && <p><strong>Operador:</strong> {alarm.operator}</p>}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-4 border-t">
                        <Button 
                          size="sm" 
                          onClick={() => handleAttendAlarm(alarm)}
                          className="flex items-center gap-1 bg-green-600 hover:bg-green-700"
                        >
                          <Car className="h-4 w-4" />
                          Atender - Asignar Patrulla
                        </Button>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))
            )}
          </Accordion>
        </CardContent>
      </Card>

      {/* Estado de Patrullas */}
      <Card>
        <CardHeader>
          <CardTitle>Estado de Patrullas</CardTitle>
          <CardDescription>Control de unidades disponibles y en servicio</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <div key={num} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Car className="h-5 w-5 text-blue-500" />
                    <span className="font-semibold">Patrulla {num.toString().padStart(2, '0')}</span>
                  </div>
                  <Badge variant={num <= 2 ? "outline" : "secondary"}>
                    {num <= 2 ? "En Servicio" : "Disponible"}
                  </Badge>
                </div>
                {num <= 2 && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Asignada a alarma #{num}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Asignación */}
      <AsignarPatrullaModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        alarm={selectedAlarm}
        onAssign={handleAssignPatrol}
      />
      </TabsContent>

      <TabsContent value="patrullas" className="space-y-6">
        {/* Estadísticas de patrullas */}
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
                {patrullas.filter(s => s.estado === 'en servicio').length}
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
                {patrullas.filter(s => s.estado === 'disponible').length}
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
          {patrullas.length === 0 ? (
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
            patrullas.map((supervisor) => (
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
      </TabsContent>

      <TabsContent value="turnos" className="space-y-6">
        {/* Estadísticas de turnos */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Turnos Programados</CardTitle>
              <Calendar className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{turnosSupervisor.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Supervisores</CardTitle>
              <Users className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{supervisores.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Turnos Hoy</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {turnosSupervisor.filter(t => t.fecha === format(new Date(), 'yyyy-MM-dd')).length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Acciones</CardTitle>
              <Calendar className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <Dialog open={turnoModalOpen} onOpenChange={setTurnoModalOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full" size="sm">
                    Asignar Turno
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Asignar Turno a Supervisor</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="supervisor">Supervisor</Label>
                      <Select value={selectedSupervisor} onValueChange={setSelectedSupervisor}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar supervisor" />
                        </SelectTrigger>
                        <SelectContent>
                          {supervisores.map((supervisor) => (
                            <SelectItem key={supervisor.id} value={supervisor.id}>
                              {supervisor.full_name || supervisor.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="turno">Tipo de Turno</Label>
                      <Select value={selectedTurno} onValueChange={setSelectedTurno}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar turno" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MAÑANA">Mañana (06:00 - 14:00)</SelectItem>
                          <SelectItem value="TARDE">Tarde (14:00 - 22:00)</SelectItem>
                          <SelectItem value="NOCHE">Noche (22:00 - 06:00)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="fecha">Fecha</Label>
                      <Input 
                        type="date" 
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                      />
                    </div>
                    
                    <Button onClick={handleAssignTurno} className="w-full">
                      Asignar Turno
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>

        {/* Calendario de turnos */}
        <Card>
          <CardHeader>
            <CardTitle>Calendario de Turnos</CardTitle>
            <CardDescription>Visualización y gestión de turnos de supervisores</CardDescription>
          </CardHeader>
          <CardContent>
            <CalendarTurnosDespachador />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
    </div>
  );
};

export default SeccionDespachador;