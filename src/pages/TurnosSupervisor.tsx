import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CalendarTurnosDespachador } from "@/components/turnos/CalendarTurnosDespachador";
import { 
  Calendar, 
  Users, 
  Clock, 
  Plus, 
  Filter,
  RotateCcw,
  UserCheck,
  AlertTriangle,
  CheckCircle,
  Calendar as CalendarIcon,
  RefreshCw,
  Settings,
  FileText,
  TrendingUp
} from "lucide-react";

const TurnosSupervisor = () => {
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedView, setSelectedView] = useState("semanal");
  const [filterPeriod, setFilterPeriod] = useState("esta-semana");

  // Datos de ejemplo de empleados
  const empleados = [
    { id: 1, nombre: "Juan Pérez", cargo: "Operador", avatar: "JP", disponible: true, turnoActual: "Mañana" },
    { id: 2, nombre: "María García", cargo: "Despachador", avatar: "MG", disponible: true, turnoActual: "Tarde" },
    { id: 3, nombre: "Carlos López", cargo: "Supervisor", avatar: "CL", disponible: false, turnoActual: "Descanso" },
    { id: 4, nombre: "Ana Martín", cargo: "Operador", avatar: "AM", disponible: true, turnoActual: "Noche" },
    { id: 5, nombre: "Luis Fernández", cargo: "Técnico", avatar: "LF", disponible: true, turnoActual: "Día" },
    { id: 6, nombre: "Elena Ruiz", cargo: "Operador", avatar: "ER", disponible: true, turnoActual: "Mañana" },
  ];

  // Solicitudes de cambio
  const solicitudesCambio = [
    {
      id: 1,
      empleado: "Juan Pérez",
      fechaOriginal: "2024-01-15",
      turnoOriginal: "Mañana",
      fechaSolicitada: "2024-01-16",
      turnoSolicitado: "Tarde",
      motivo: "Cita médica",
      estado: "pendiente",
      fechaSolicitud: "2024-01-10"
    },
    {
      id: 2,
      empleado: "María García",
      fechaOriginal: "2024-01-18",
      turnoOriginal: "Noche",
      fechaSolicitada: "2024-01-20",
      turnoSolicitado: "Mañana",
      motivo: "Asunto familiar",
      estado: "aprobada",
      fechaSolicitud: "2024-01-12"
    }
  ];

  // Estadísticas
  const estadisticas = {
    turnosProgramados: 42,
    empleadosActivos: 18,
    coberturaHoras: 95,
    solicitudesPendientes: 3,
    intercambiosAprobados: 8,
    ausenciasEstesMes: 5
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Turnos Supervisor</h1>
          <p className="text-muted-foreground">
            Sistema personalizable de turnos para supervisores con horarios flexibles
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showRequestModal} onOpenChange={setShowRequestModal}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Solicitar Cambio
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Solicitar Cambio de Turno</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="empleado">Empleado</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar empleado" />
                    </SelectTrigger>
                    <SelectContent>
                      {empleados.map(emp => (
                        <SelectItem key={emp.id} value={emp.id.toString()}>
                          {emp.nombre} - {emp.cargo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="motivo">Motivo del cambio</Label>
                  <Textarea placeholder="Describe el motivo del cambio..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Fecha actual</Label>
                    <Input type="date" />
                  </div>
                  <div>
                    <Label>Fecha solicitada</Label>
                    <Input type="date" />
                  </div>
                </div>
                <Button className="w-full">Enviar Solicitud</Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={showCalendar} onOpenChange={setShowCalendar}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Asignar Turnos
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Calendario de Turnos - Vista Completa</DialogTitle>
              </DialogHeader>
              <CalendarTurnosDespachador />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filtros y controles */}
      <div className="flex items-center gap-4">
        <Select value={selectedView} onValueChange={setSelectedView}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="semanal">Vista Semanal</SelectItem>
            <SelectItem value="mensual">Vista Mensual</SelectItem>
            <SelectItem value="individual">Vista Individual</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={filterPeriod} onValueChange={setFilterPeriod}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="esta-semana">Esta Semana</SelectItem>
            <SelectItem value="siguiente-semana">Siguiente Semana</SelectItem>
            <SelectItem value="este-mes">Este Mes</SelectItem>
            <SelectItem value="siguiente-mes">Siguiente Mes</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Filtros
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Turnos Programados</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estadisticas.turnosProgramados}</div>
            <p className="text-xs text-muted-foreground">Esta semana</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empleados Activos</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estadisticas.empleadosActivos}</div>
            <p className="text-xs text-muted-foreground">Personal disponible</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cobertura</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estadisticas.coberturaHoras}%</div>
            <p className="text-xs text-muted-foreground">Horas cubiertas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Solicitudes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estadisticas.solicitudesPendientes}</div>
            <p className="text-xs text-muted-foreground">Pendientes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Intercambios</CardTitle>
            <RefreshCw className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estadisticas.intercambiosAprobados}</div>
            <p className="text-xs text-muted-foreground">Este mes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ausencias</CardTitle>
            <UserCheck className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estadisticas.ausenciasEstesMes}</div>
            <p className="text-xs text-muted-foreground">Este mes</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs principales */}
      <Tabs defaultValue="calendario" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="calendario">Calendario</TabsTrigger>
          <TabsTrigger value="empleados">Empleados</TabsTrigger>
          <TabsTrigger value="solicitudes">Solicitudes</TabsTrigger>
          <TabsTrigger value="reportes">Reportes</TabsTrigger>
        </TabsList>

        {/* Vista Calendario */}
        <TabsContent value="calendario" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Calendario de Turnos - Semana Actual</CardTitle>
              <CardDescription>
                Vista general de los turnos asignados para la semana
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Leyenda de turnos */}
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 rounded"></div>
                    <span>Mañana (06:00-14:00)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span>Tarde (14:00-22:00)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-purple-500 rounded"></div>
                    <span>Noche (18:00-06:00)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                    <span>Día Completo (06:00-18:00)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span>Descanso</span>
                  </div>
                </div>

                {/* Tabla de empleados y turnos */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium">Empleado</th>
                        <th className="text-center p-3 font-medium">Lun<br/><span className="text-xs text-muted-foreground">1</span></th>
                        <th className="text-center p-3 font-medium">Mar<br/><span className="text-xs text-muted-foreground">2</span></th>
                        <th className="text-center p-3 font-medium">Mié<br/><span className="text-xs text-muted-foreground">3</span></th>
                        <th className="text-center p-3 font-medium">Jue<br/><span className="text-xs text-muted-foreground">4</span></th>
                        <th className="text-center p-3 font-medium">Vie<br/><span className="text-xs text-muted-foreground">5</span></th>
                        <th className="text-center p-3 font-medium">Sáb<br/><span className="text-xs text-muted-foreground">6</span></th>
                        <th className="text-center p-3 font-medium">Dom<br/><span className="text-xs text-muted-foreground">7</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Juan Pérez - Supervisor */}
                      <tr className="border-b hover:bg-muted/30">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium">
                              JP
                            </div>
                            <div>
                              <p className="font-medium">Juan Pérez</p>
                              <p className="text-xs text-muted-foreground">Supervisor</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-2 text-center">
                          <div className="bg-purple-500 text-white text-xs p-2 rounded">Noche</div>
                        </td>
                        <td className="p-2 text-center">
                          <div className="bg-purple-500 text-white text-xs p-2 rounded">Noche</div>
                        </td>
                        <td className="p-2 text-center">
                          <div className="bg-red-500 text-white text-xs p-2 rounded">Descanso</div>
                        </td>
                        <td className="p-2 text-center">
                          <div className="bg-red-500 text-white text-xs p-2 rounded">Descanso</div>
                        </td>
                        <td className="p-2 text-center">
                          <div className="bg-yellow-500 text-white text-xs p-2 rounded">Día</div>
                        </td>
                        <td className="p-2 text-center">
                          <div className="bg-yellow-500 text-white text-xs p-2 rounded">Día</div>
                        </td>
                        <td className="p-2 text-center">
                          <div className="bg-purple-500 text-white text-xs p-2 rounded">Noche</div>
                        </td>
                      </tr>

                      {/* María García - Supervisor */}
                      <tr className="border-b hover:bg-muted/30">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium">
                              MG
                            </div>
                            <div>
                              <p className="font-medium">María García</p>
                              <p className="text-xs text-muted-foreground">Supervisor</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-2 text-center">
                          <div className="bg-yellow-500 text-white text-xs p-2 rounded">Día</div>
                        </td>
                        <td className="p-2 text-center">
                          <div className="bg-yellow-500 text-white text-xs p-2 rounded">Día</div>
                        </td>
                        <td className="p-2 text-center">
                          <div className="bg-purple-500 text-white text-xs p-2 rounded">Noche</div>
                        </td>
                        <td className="p-2 text-center">
                          <div className="bg-purple-500 text-white text-xs p-2 rounded">Noche</div>
                        </td>
                        <td className="p-2 text-center">
                          <div className="bg-red-500 text-white text-xs p-2 rounded">Descanso</div>
                        </td>
                        <td className="p-2 text-center">
                          <div className="bg-red-500 text-white text-xs p-2 rounded">Descanso</div>
                        </td>
                        <td className="p-2 text-center">
                          <div className="bg-yellow-500 text-white text-xs p-2 rounded">Día</div>
                        </td>
                      </tr>

                      {/* Carlos López - Supervisor */}
                      <tr className="border-b hover:bg-muted/30">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium">
                              CL
                            </div>
                            <div>
                              <p className="font-medium">Carlos López</p>
                              <p className="text-xs text-muted-foreground">Supervisor</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-2 text-center">
                          <div className="bg-red-500 text-white text-xs p-2 rounded">Descanso</div>
                        </td>
                        <td className="p-2 text-center">
                          <div className="bg-blue-500 text-white text-xs p-2 rounded">Mañana</div>
                        </td>
                        <td className="p-2 text-center">
                          <div className="bg-yellow-500 text-white text-xs p-2 rounded">Día</div>
                        </td>
                        <td className="p-2 text-center">
                          <div className="bg-red-500 text-white text-xs p-2 rounded">Descanso</div>
                        </td>
                        <td className="p-2 text-center">
                          <div className="bg-red-500 text-white text-xs p-2 rounded">Descanso</div>
                        </td>
                        <td className="p-2 text-center">
                          <div className="bg-blue-500 text-white text-xs p-2 rounded">Mañana</div>
                        </td>
                        <td className="p-2 text-center">
                          <div className="bg-purple-500 text-white text-xs p-2 rounded">Noche</div>
                        </td>
                      </tr>

                      {/* Ana Martín - Operador */}
                      <tr className="border-b hover:bg-muted/30">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium">
                              AM
                            </div>
                            <div>
                              <p className="font-medium">Ana Martín</p>
                              <p className="text-xs text-muted-foreground">Operador</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-2 text-center">
                          <div className="bg-green-500 text-white text-xs p-2 rounded">Tarde</div>
                        </td>
                        <td className="p-2 text-center">
                          <div className="bg-purple-500 text-white text-xs p-2 rounded">Noche</div>
                        </td>
                        <td className="p-2 text-center">
                          <div className="bg-blue-500 text-white text-xs p-2 rounded">Mañana</div>
                        </td>
                        <td className="p-2 text-center">
                          <div className="bg-yellow-500 text-white text-xs p-2 rounded">Día</div>
                        </td>
                        <td className="p-2 text-center">
                          <div className="bg-red-500 text-white text-xs p-2 rounded">Descanso</div>
                        </td>
                        <td className="p-2 text-center">
                          <div className="bg-green-500 text-white text-xs p-2 rounded">Tarde</div>
                        </td>
                        <td className="p-2 text-center">
                          <div className="bg-blue-500 text-white text-xs p-2 rounded">Mañana</div>
                        </td>
                      </tr>

                      {/* Luis Fernández - Técnico */}
                      <tr className="border-b hover:bg-muted/30">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium">
                              LF
                            </div>
                            <div>
                              <p className="font-medium">Luis Fernández</p>
                              <p className="text-xs text-muted-foreground">Técnico</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-2 text-center">
                          <div className="bg-yellow-500 text-white text-xs p-2 rounded">Día</div>
                        </td>
                        <td className="p-2 text-center">
                          <div className="bg-yellow-500 text-white text-xs p-2 rounded">Día</div>
                        </td>
                        <td className="p-2 text-center">
                          <div className="bg-red-500 text-white text-xs p-2 rounded">Descanso</div>
                        </td>
                        <td className="p-2 text-center">
                          <div className="bg-yellow-500 text-white text-xs p-2 rounded">Día</div>
                        </td>
                        <td className="p-2 text-center">
                          <div className="bg-yellow-500 text-white text-xs p-2 rounded">Día</div>
                        </td>
                        <td className="p-2 text-center">
                          <div className="bg-red-500 text-white text-xs p-2 rounded">Descanso</div>
                        </td>
                        <td className="p-2 text-center">
                          <div className="bg-red-500 text-white text-xs p-2 rounded">Descanso</div>
                        </td>
                      </tr>

                      {/* Elena Ruiz - Operador */}
                      <tr className="border-b hover:bg-muted/30">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium">
                              ER
                            </div>
                            <div>
                              <p className="font-medium">Elena Ruiz</p>
                              <p className="text-xs text-muted-foreground">Operador</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-2 text-center">
                          <div className="bg-blue-500 text-white text-xs p-2 rounded">Mañana</div>
                        </td>
                        <td className="p-2 text-center">
                          <div className="bg-green-500 text-white text-xs p-2 rounded">Tarde</div>
                        </td>
                        <td className="p-2 text-center">
                          <div className="bg-red-500 text-white text-xs p-2 rounded">Descanso</div>
                        </td>
                        <td className="p-2 text-center">
                          <div className="bg-blue-500 text-white text-xs p-2 rounded">Mañana</div>
                        </td>
                        <td className="p-2 text-center">
                          <div className="bg-green-500 text-white text-xs p-2 rounded">Tarde</div>
                        </td>
                        <td className="p-2 text-center">
                          <div className="bg-purple-500 text-white text-xs p-2 rounded">Noche</div>
                        </td>
                        <td className="p-2 text-center">
                          <div className="bg-yellow-500 text-white text-xs p-2 rounded">Día</div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vista Empleados */}
        <TabsContent value="empleados" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lista de Empleados</CardTitle>
              <CardDescription>
                Gestión del personal y sus horarios preferidos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {empleados.map((empleado) => (
                  <div key={empleado.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center font-medium">
                        {empleado.avatar}
                      </div>
                      <div>
                        <h3 className="font-medium">{empleado.nombre}</h3>
                        <p className="text-sm text-muted-foreground">{empleado.cargo}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={empleado.disponible ? "default" : "secondary"}>
                            {empleado.disponible ? "Disponible" : "No disponible"}
                          </Badge>
                          <Badge variant="outline">{empleado.turnoActual}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        Ver Horarios
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Configurar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vista Solicitudes */}
        <TabsContent value="solicitudes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Solicitudes de Cambio</CardTitle>
              <CardDescription>
                Gestión de solicitudes de intercambio y cambios de turno
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {solicitudesCambio.map((solicitud) => (
                  <div key={solicitud.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium">{solicitud.empleado}</h3>
                        <Badge variant={
                          solicitud.estado === 'pendiente' ? 'default' :
                          solicitud.estado === 'aprobada' ? 'default' : 'destructive'
                        }>
                          {solicitud.estado}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Solicitado: {solicitud.fechaSolicitud}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium text-muted-foreground">Turno Original</p>
                        <p>{solicitud.fechaOriginal} - {solicitud.turnoOriginal}</p>
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground">Turno Solicitado</p>
                        <p>{solicitud.fechaSolicitada} - {solicitud.turnoSolicitado}</p>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <p className="font-medium text-muted-foreground text-sm">Motivo</p>
                      <p className="text-sm">{solicitud.motivo}</p>
                    </div>
                    
                    {solicitud.estado === 'pendiente' && (
                      <div className="flex gap-2 mt-4">
                        <Button size="sm" variant="default">Aprobar</Button>
                        <Button size="sm" variant="destructive">Rechazar</Button>
                        <Button size="sm" variant="outline">Ver Detalles</Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vista Reportes */}
        <TabsContent value="reportes" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Reporte de Cobertura</CardTitle>
                <CardDescription>Análisis de cobertura de turnos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Cobertura Mañana</span>
                    <span className="font-medium">98%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Cobertura Tarde</span>
                    <span className="font-medium">95%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Cobertura Noche</span>
                    <span className="font-medium">92%</span>
                  </div>
                  <Button className="w-full mt-4" variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    Generar Reporte Completo
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Métricas de Eficiencia</CardTitle>
                <CardDescription>Indicadores de rendimiento</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Satisfacción del Personal</span>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="font-medium">87%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Intercambios Exitosos</span>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="font-medium">94%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Tiempo Promedio Asignación</span>
                    <span className="font-medium">2.3 min</span>
                  </div>
                  <Button className="w-full mt-4" variant="outline">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Ver Análisis Detallado
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TurnosSupervisor;