import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Building, Shield, AlertTriangle, Clock, Navigation, Eye } from "lucide-react";

const Ubicaciones = () => {
  const [ubicaciones] = useState([
    {
      id: 1,
      nombre: "Banco Central",
      direccion: "Av. Principal 123",
      tipo: "financiero",
      zona: "Centro",
      estado: "activo",
      patrulla: "P-001",
      ultimaVisita: "14:25",
      sensores: {
        movimiento: true,
        puerta: true,
        ventana: true,
        panico: true
      },
      coordenadas: "4.6097, -74.0817",
      contacto: "Juan Pérez - 3001234567"
    },
    {
      id: 2,
      nombre: "Centro Comercial Plaza",
      direccion: "Calle 45 #67-89",
      tipo: "comercial",
      zona: "Norte",
      estado: "activo",
      patrulla: "P-003",
      ultimaVisita: "13:45",
      sensores: {
        movimiento: true,
        puerta: true,
        ventana: false,
        panico: true
      },
      coordenadas: "4.6518, -74.0598",
      contacto: "María González - 3009876543"
    },
    {
      id: 3,
      nombre: "Residencial Los Pinos",
      direccion: "Carrera 15 #23-45",
      tipo: "residencial",
      zona: "Sur",
      estado: "activo",
      patrulla: "P-002",
      ultimaVisita: "12:30",
      sensores: {
        movimiento: true,
        puerta: true,
        ventana: true,
        panico: false
      },
      coordenadas: "4.5709, -74.1069",
      contacto: "Carlos Martínez - 3005551234"
    },
    {
      id: 4,
      nombre: "Zona Industrial Este",
      direccion: "Av. Industrial 456",
      tipo: "industrial",
      zona: "Este",
      estado: "mantenimiento",
      patrulla: null,
      ultimaVisita: "10:15",
      sensores: {
        movimiento: false,
        puerta: true,
        ventana: false,
        panico: true
      },
      coordenadas: "4.6351, -74.0456",
      contacto: "Ana Rodríguez - 3007778888"
    }
  ]);

  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroZona, setFiltroZona] = useState("todas");
  const [busqueda, setBusqueda] = useState("");

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case "financiero": return "bg-red-100 text-red-800";
      case "comercial": return "bg-blue-100 text-blue-800";
      case "residencial": return "bg-green-100 text-green-800";
      case "industrial": return "bg-purple-100 text-purple-800";
      case "educativo": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case "activo": return "bg-green-100 text-green-800";
      case "inactivo": return "bg-red-100 text-red-800";
      case "mantenimiento": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const ubicacionesFiltradas = ubicaciones.filter(ubicacion => {
    const matchesTipo = filtroTipo === "todos" || ubicacion.tipo === filtroTipo;
    const matchesZona = filtroZona === "todas" || ubicacion.zona === filtroZona;
    const matchesBusqueda = ubicacion.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                           ubicacion.direccion.toLowerCase().includes(busqueda.toLowerCase());
    return matchesTipo && matchesZona && matchesBusqueda;
  });

  const totalUbicaciones = ubicaciones.length;
  const ubicacionesActivas = ubicaciones.filter(u => u.estado === "activo").length;
  const ubicacionesConPatrulla = ubicaciones.filter(u => u.patrulla).length;
  const sensoresActivos = ubicaciones.reduce((sum, u) => {
    return sum + Object.values(u.sensores).filter(Boolean).length;
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Control de Ubicaciones</h2>
          <p className="text-muted-foreground">
            Monitoreo y gestión de todas las ubicaciones protegidas
          </p>
        </div>
        <Button>
          <Building className="h-4 w-4 mr-2" />
          Nueva Ubicación
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ubicaciones</CardTitle>
            <Building className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUbicaciones}</div>
            <p className="text-xs text-muted-foreground">Registradas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activas</CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{ubicacionesActivas}</div>
            <p className="text-xs text-muted-foreground">Con protección</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Con Patrulla</CardTitle>
            <Navigation className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{ubicacionesConPatrulla}</div>
            <p className="text-xs text-muted-foreground">Asignadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sensores</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{sensoresActivos}</div>
            <p className="text-xs text-muted-foreground">Activos</p>
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
                placeholder="Buscar por nombre o dirección..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <div className="w-full md:w-48">
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los tipos</SelectItem>
                  <SelectItem value="financiero">Financiero</SelectItem>
                  <SelectItem value="comercial">Comercial</SelectItem>
                  <SelectItem value="residencial">Residencial</SelectItem>
                  <SelectItem value="industrial">Industrial</SelectItem>
                  <SelectItem value="educativo">Educativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-48">
              <Select value={filtroZona} onValueChange={setFiltroZona}>
                <SelectTrigger>
                  <SelectValue placeholder="Zona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas las zonas</SelectItem>
                  <SelectItem value="Centro">Centro</SelectItem>
                  <SelectItem value="Norte">Norte</SelectItem>
                  <SelectItem value="Sur">Sur</SelectItem>
                  <SelectItem value="Este">Este</SelectItem>
                  <SelectItem value="Oeste">Oeste</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de ubicaciones */}
      <Card>
        <CardHeader>
          <CardTitle>Ubicaciones Protegidas</CardTitle>
          <CardDescription>
            Información detallada de todas las ubicaciones del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Dirección</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Zona</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Patrulla</TableHead>
                <TableHead>Sensores</TableHead>
                <TableHead>Última Visita</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ubicacionesFiltradas.map((ubicacion) => (
                <TableRow key={ubicacion.id}>
                  <TableCell className="font-medium">{ubicacion.nombre}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <MapPin className="h-3 w-3 mr-1 text-muted-foreground" />
                      {ubicacion.direccion}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getTipoColor(ubicacion.tipo)}>
                      {ubicacion.tipo}
                    </Badge>
                  </TableCell>
                  <TableCell>{ubicacion.zona}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(ubicacion.estado)}>
                      {ubicacion.estado}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {ubicacion.patrulla ? (
                      <Badge variant="outline">
                        {ubicacion.patrulla}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">Sin asignar</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {ubicacion.sensores.movimiento && (
                        <Badge variant="secondary" className="text-xs">M</Badge>
                      )}
                      {ubicacion.sensores.puerta && (
                        <Badge variant="secondary" className="text-xs">P</Badge>
                      )}
                      {ubicacion.sensores.ventana && (
                        <Badge variant="secondary" className="text-xs">V</Badge>
                      )}
                      {ubicacion.sensores.panico && (
                        <Badge variant="secondary" className="text-xs">PAN</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                      {ubicacion.ultimaVisita}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">{ubicacion.contacto}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm">
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <MapPin className="h-3 w-3" />
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

export default Ubicaciones;