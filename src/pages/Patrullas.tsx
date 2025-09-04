import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Car, MapPin, User, Clock, Radio, Battery, Navigation, Fuel } from "lucide-react";

const Patrullas = () => {
  const [patrullas] = useState([
    {
      id: 1,
      codigo: "P-001",
      conductor: "Miguel Hernández",
      ubicacion: "Sector Norte",
      estado: "disponible",
      combustible: 85,
      bateria: 92,
      ultimaActividad: "14:25",
      serviciosHoy: 3,
      kmRecorridos: 45,
      velocidad: 0
    },
    {
      id: 2,
      codigo: "P-002",
      conductor: "Sandra Morales",
      ubicacion: "Centro Comercial",
      estado: "en_servicio",
      combustible: 62,
      bateria: 88,
      ultimaActividad: "14:30",
      serviciosHoy: 5,
      kmRecorridos: 67,
      velocidad: 35
    },
    {
      id: 3,
      codigo: "P-003",
      conductor: "Roberto Silva",
      ubicacion: "Zona Industrial",
      estado: "en_servicio",
      combustible: 45,
      bateria: 95,
      ultimaActividad: "14:28",
      serviciosHoy: 4,
      kmRecorridos: 78,
      velocidad: 25
    },
    {
      id: 4,
      codigo: "P-004",
      conductor: "Diana Castro",
      ubicacion: "Base Central",
      estado: "mantenimiento",
      combustible: 95,
      bateria: 100,
      ultimaActividad: "12:15",
      serviciosHoy: 1,
      kmRecorridos: 12,
      velocidad: 0
    },
    {
      id: 5,
      codigo: "P-005",
      conductor: "Andrés López",
      ubicacion: "Sector Sur",
      estado: "disponible",
      combustible: 78,
      bateria: 89,
      ultimaActividad: "14:20",
      serviciosHoy: 2,
      kmRecorridos: 38,
      velocidad: 0
    }
  ]);

  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [busqueda, setBusqueda] = useState("");

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case "disponible": return "bg-green-100 text-green-800";
      case "en_servicio": return "bg-blue-100 text-blue-800";
      case "fuera_servicio": return "bg-red-100 text-red-800";
      case "mantenimiento": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getCombustibleColor = (nivel: number) => {
    if (nivel >= 70) return "text-green-600";
    if (nivel >= 30) return "text-yellow-600";
    return "text-red-600";
  };

  const patrullasFiltradas = patrullas.filter(patrulla => {
    const matchesEstado = filtroEstado === "todos" || patrulla.estado === filtroEstado;
    const matchesBusqueda = patrulla.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
                           patrulla.conductor.toLowerCase().includes(busqueda.toLowerCase());
    return matchesEstado && matchesBusqueda;
  });

  const totalPatrullas = patrullas.length;
  const patrullasDisponibles = patrullas.filter(p => p.estado === "disponible").length;
  const patrullasEnServicio = patrullas.filter(p => p.estado === "en_servicio").length;
  const serviciosTotal = patrullas.reduce((sum, p) => sum + p.serviciosHoy, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Control de Patrullas</h2>
          <p className="text-muted-foreground">
            Monitoreo en tiempo real de todas las unidades
          </p>
        </div>
        <Button>
          <Car className="h-4 w-4 mr-2" />
          Asignar Servicio
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patrullas</CardTitle>
            <Car className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPatrullas}</div>
            <p className="text-xs text-muted-foreground">Flota activa</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disponibles</CardTitle>
            <Navigation className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{patrullasDisponibles}</div>
            <p className="text-xs text-muted-foreground">Listas para servicio</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Servicio</CardTitle>
            <Radio className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{patrullasEnServicio}</div>
            <p className="text-xs text-muted-foreground">Atendiendo servicios</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Servicios Hoy</CardTitle>
            <Clock className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{serviciosTotal}</div>
            <p className="text-xs text-muted-foreground">Total completados</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por código o conductor..."
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
                  <SelectItem value="disponible">Disponible</SelectItem>
                  <SelectItem value="en_servicio">En Servicio</SelectItem>
                  <SelectItem value="fuera_servicio">Fuera de Servicio</SelectItem>
                  <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de patrullas */}
      <Card>
        <CardHeader>
          <CardTitle>Estado de Patrullas</CardTitle>
          <CardDescription>
            Información en tiempo real de todas las unidades
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Conductor</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Combustible</TableHead>
                <TableHead>Batería</TableHead>
                <TableHead>Velocidad</TableHead>
                <TableHead>Servicios</TableHead>
                <TableHead>Km Hoy</TableHead>
                <TableHead>Última Act.</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patrullasFiltradas.map((patrulla) => (
                <TableRow key={patrulla.id}>
                  <TableCell className="font-medium">{patrulla.codigo}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <User className="h-3 w-3 mr-1 text-muted-foreground" />
                      {patrulla.conductor}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <MapPin className="h-3 w-3 mr-1 text-muted-foreground" />
                      {patrulla.ubicacion}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(patrulla.estado)}>
                      {patrulla.estado.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Fuel className={`h-3 w-3 mr-1 ${getCombustibleColor(patrulla.combustible)}`} />
                      <span className={getCombustibleColor(patrulla.combustible)}>
                        {patrulla.combustible}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Battery className="h-3 w-3 mr-1 text-green-600" />
                      <span className="text-green-600">{patrulla.bateria}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {patrulla.velocidad} km/h
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {patrulla.serviciosHoy}
                    </Badge>
                  </TableCell>
                  <TableCell>{patrulla.kmRecorridos} km</TableCell>
                  <TableCell>{patrulla.ultimaActividad}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm">
                        <MapPin className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Radio className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Patrullas;