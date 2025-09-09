import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarioTurnosQuincenal } from "@/components/personal/CalendarioTurnosQuincenal";
import { GeneradorTurnos } from "@/components/personal/GeneradorTurnos";
import { CalendarioTurnosGenerados } from "@/components/personal/CalendarioTurnosGenerados";
import { FormularioNuevoPersonal } from "@/components/personal/FormularioNuevoPersonal";
import TurnosCalculadorHoras from "@/components/turnos/TurnosCalculadorHoras";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Clock, 
  Phone, 
  MapPin, 
  Shield, 
  AlertCircle,
  CheckCircle,
  Calendar,
  Filter,
  Eye,
  Edit,
  Settings
} from "lucide-react";

const Personal = () => {
  const { toast } = useToast();
  const [vistaActual, setVistaActual] = useState<'personal' | 'turnos' | 'generador' | 'calculador'>('personal');
  const [isFormularioOpen, setIsFormularioOpen] = useState(false);
  const [personal] = useState([
    {
      id: 1,
      nombre: "Ana García",
      cargo: "Operador de Alarmas",
      turno: "Mañana (06:00-14:00)",
      estado: "activo",
      ubicacion: "Central de Monitoreo",
      telefono: "3001234567",
      ingreso: "08:00",
      horasHoy: "6.0",
      alarmasAtendidas: 15,
      efectividad: 98,
      avatar: "/avatars/ana.jpg"
    },
    {
      id: 2,
      nombre: "Luis Martín",
      cargo: "Despachador de Patrullas",
      turno: "Tarde (14:00-22:00)",
      estado: "activo",
      ubicacion: "Centro de Despacho",
      telefono: "3009876543",
      ingreso: "14:00",
      horasHoy: "4.5",
      serviciosAsignados: 8,
      efectividad: 95,
      avatar: "/avatars/luis.jpg"
    },
    {
      id: 3,
      nombre: "María López",
      cargo: "Supervisor Motorizado",
      turno: "Noche (22:00-06:00)",
      estado: "patrulla",
      ubicacion: "Sector Norte",
      telefono: "3005551234",
      ingreso: "22:00",
      horasHoy: "8.0",
      kmRecorridos: 45,
      efectividad: 97,
      avatar: "/avatars/maria.jpg"
    },
    {
      id: 4,
      nombre: "Carlos Ruiz",
      cargo: "Técnico",
      turno: "Mañana (08:00-16:00)",
      estado: "mantenimiento",
      ubicacion: "Taller",
      telefono: "3007778888",
      ingreso: "08:00",
      horasHoy: "7.2",
      equiposRevisados: 5,
      efectividad: 100,
      avatar: "/avatars/carlos.jpg"
    },
    {
      id: 5,
      nombre: "Sandra Morales",
      cargo: "Operador de Alarmas",
      turno: "Tarde (14:00-22:00)",
      estado: "descanso",
      ubicacion: "Área de Descanso",
      telefono: "3004445555",
      ingreso: "14:00",
      horasHoy: "6.5",
      alarmasAtendidas: 12,
      efectividad: 96,
      avatar: "/avatars/sandra.jpg"
    }
  ]);

  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroCargo, setFiltroCargo] = useState("todos");
  const [busqueda, setBusqueda] = useState("");

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case "activo": return "bg-green-100 text-green-800";
      case "patrulla": return "bg-blue-100 text-blue-800";
      case "descanso": return "bg-yellow-100 text-yellow-800";
      case "mantenimiento": return "bg-purple-100 text-purple-800";
      case "ausente": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const personalFiltrado = personal.filter(persona => {
    const matchesEstado = filtroEstado === "todos" || persona.estado === filtroEstado;
    const matchesCargo = filtroCargo === "todos" || persona.cargo.toLowerCase().includes(filtroCargo.toLowerCase());
    const matchesBusqueda = persona.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                           persona.cargo.toLowerCase().includes(busqueda.toLowerCase());
    return matchesEstado && matchesCargo && matchesBusqueda;
  });

  const totalPersonal = personal.length;
  const personalActivo = personal.filter(p => p.estado === "activo" || p.estado === "patrulla").length;
  const horasTrabajadas = personal.reduce((sum, p) => sum + parseFloat(p.horasHoy), 0);
  const efectividadPromedio = personal.reduce((sum, p) => sum + p.efectividad, 0) / personal.length;

  const handleNuevoPersonal = async (data: any) => {
    // Aquí se implementaría la lógica para guardar en la base de datos
    console.log('Nuevo personal:', data);
    // Simular guardado exitoso
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  if (vistaActual === 'turnos') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Calendario de Turnos - Semana Actual</h2>
            <p className="text-muted-foreground">
              Vista general de los turnos asignados para la semana
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setVistaActual('generador')}>
              <Settings className="h-4 w-4 mr-2" />
              Generar Turnos
            </Button>
            <Button variant="outline" onClick={() => setVistaActual('personal')}>
              <Users className="h-4 w-4 mr-2" />
              Ver Personal
            </Button>
          </div>
        </div>
        
        {/* Calendario de turnos generados con vista tabular */}
        <CalendarioTurnosGenerados />
      </div>
    );
  }

  if (vistaActual === 'generador') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Generador Automático de Turnos</h2>
            <p className="text-muted-foreground">
              Herramienta inteligente para planificación de turnos y rotaciones
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setVistaActual('turnos')}>
              <Calendar className="h-4 w-4 mr-2" />
              Ver Calendario
            </Button>
            <Button variant="outline" onClick={() => setVistaActual('calculador')}>
              <Clock className="h-4 w-4 mr-2" />
              Calendario Operadores
            </Button>
            <Button variant="outline" onClick={() => setVistaActual('personal')}>
              <Users className="h-4 w-4 mr-2" />
              Ver Personal
            </Button>
          </div>
        </div>
        <GeneradorTurnos />
      </div>
    );
  }

  if (vistaActual === 'calculador') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Calendario de Operadores</h2>
            <p className="text-muted-foreground">
              Visualización de turnos programados para operadores
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setVistaActual('turnos')}>
              <Calendar className="h-4 w-4 mr-2" />
              Ver Turnos Generados
            </Button>
            <Button variant="outline" onClick={() => setVistaActual('generador')}>
              <Settings className="h-4 w-4 mr-2" />
              Generar Turnos
            </Button>
            <Button variant="outline" onClick={() => setVistaActual('personal')}>
              <Users className="h-4 w-4 mr-2" />
              Ver Personal
            </Button>
          </div>
        </div>
        <CalendarioTurnosQuincenal />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Gestión de Personal</h2>
          <p className="text-muted-foreground">
            Control y seguimiento del personal operativo
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setVistaActual('generador')}>
            <Settings className="h-4 w-4 mr-2" />
            Generar Turnos
          </Button>
          <Button variant="outline" onClick={() => setVistaActual('calculador')}>
            <Clock className="h-4 w-4 mr-2" />
            Calendario Operadores
          </Button>
          <Button variant="outline" onClick={() => setVistaActual('turnos')}>
            <Calendar className="h-4 w-4 mr-2" />
            Ver Calendario
          </Button>
          <Button onClick={() => setIsFormularioOpen(true)}>
            <Users className="h-4 w-4 mr-2" />
            Nuevo Personal
          </Button>
        </div>
      </div>

      {/* Métricas del Personal */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Personal</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPersonal}</div>
            <p className="text-xs text-muted-foreground">Empleados registrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Personal Activo</CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{personalActivo}</div>
            <p className="text-xs text-muted-foreground">En servicio ahora</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Horas Trabajadas</CardTitle>
            <Clock className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{horasTrabajadas.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Total hoy</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efectividad</CardTitle>
            <CheckCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{efectividadPromedio.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Promedio del equipo</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filtros y Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nombre o cargo..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <div className="w-full md:w-48">
              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="patrulla">En Patrulla</SelectItem>
                  <SelectItem value="descanso">En Descanso</SelectItem>
                  <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                  <SelectItem value="ausente">Ausente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-48">
              <Select value={filtroCargo} onValueChange={setFiltroCargo}>
                <SelectTrigger>
                  <SelectValue placeholder="Cargo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los cargos</SelectItem>
                  <SelectItem value="operador">Operador</SelectItem>
                  <SelectItem value="despachador">Despachador</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                  <SelectItem value="tecnico">Técnico</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendario de Turnos Quincenales */}
      <div className="space-y-6">
        <CalendarioTurnosQuincenal />
      </div>

      {/* Lista de Personal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Personal en Servicio
          </CardTitle>
          <CardDescription>Estado actual y rendimiento del personal</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Personal</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Turno</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Ingreso</TableHead>
                <TableHead>Horas Hoy</TableHead>
                <TableHead>Resumen Horas</TableHead>
                <TableHead>Rendimiento</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {personalFiltrado.map((persona) => (
                <TableRow key={persona.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={persona.avatar} />
                        <AvatarFallback>
                          {persona.nombre.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{persona.nombre}</div>
                        <div className="text-xs text-muted-foreground">ID: {persona.id}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{persona.cargo}</TableCell>
                  <TableCell className="text-sm">{persona.turno}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(persona.estado)}>
                      {persona.estado}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <MapPin className="h-3 w-3 mr-1 text-muted-foreground" />
                      <span className="text-sm">{persona.ubicacion}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                      {persona.ingreso}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {persona.horasHoy}h
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs space-y-1">
                      <div className="grid grid-cols-2 gap-1">
                        <span className="text-blue-600">D: 32h</span>
                        <span className="text-purple-600">N: 12h</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        <span className="text-green-600">Dom: 8h</span>
                        <span className="text-orange-600">Ext: 4h</span>
                      </div>
                      <div className="text-xs text-muted-foreground border-t pt-1">
                        Total: 44h
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-1 mr-2">
                          <div 
                            className="bg-green-600 h-1 rounded-full" 
                            style={{ width: `${persona.efectividad}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium">{persona.efectividad}%</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {persona.alarmasAtendidas && `${persona.alarmasAtendidas} alarmas`}
                        {persona.serviciosAsignados && `${persona.serviciosAsignados} servicios`}
                        {persona.kmRecorridos && `${persona.kmRecorridos} km`}
                        {persona.equiposRevisados && `${persona.equiposRevisados} equipos`}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Phone className="h-3 w-3 mr-1 text-muted-foreground" />
                      <span className="text-sm">{persona.telefono}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm">
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Resumen por Turnos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Turno Mañana (06:00-14:00)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Personal asignado:</span>
                <span className="font-medium">3</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Activos:</span>
                <span className="font-medium text-green-600">2</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Efectividad:</span>
                <span className="font-medium">99%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Turno Tarde (14:00-22:00)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Personal asignado:</span>
                <span className="font-medium">2</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Activos:</span>
                <span className="font-medium text-green-600">2</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Efectividad:</span>
                <span className="font-medium">95.5%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Turno Noche (22:00-06:00)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Personal asignado:</span>
                <span className="font-medium">1</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Activos:</span>
                <span className="font-medium text-blue-600">1</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Efectividad:</span>
                <span className="font-medium">97%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Formulario de Nuevo Personal */}
      <FormularioNuevoPersonal
        isOpen={isFormularioOpen}
        onClose={() => setIsFormularioOpen(false)}
        onSubmit={handleNuevoPersonal}
      />
    </div>
  );
};

export default Personal;