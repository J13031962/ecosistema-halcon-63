import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Car, AlertTriangle, Filter, Calendar, Users, MapPin } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface PatrullaRecord {
  id: string;
  cliente: string;
  tipoAlarma: 'Alarma' | 'Pánico' | 'Revisión' | 'Fuego';
  fechaHora: string;
  tiempoRespuesta: string;
  patrullasUsadas: number;
  patrullasExtras: number;
  estado: 'Completado' | 'Cancelado';
  operador: string;
}

const HistorialPatrullas = () => {
  const [records] = useState<PatrullaRecord[]>([
    {
      id: "1",
      cliente: "Residencial Los Pinos",
      tipoAlarma: "Alarma",
      fechaHora: "2024-01-15 14:35:22",
      tiempoRespuesta: "05:32",
      patrullasUsadas: 1,
      patrullasExtras: 0,
      estado: "Completado",
      operador: "María González"
    },
    {
      id: "2",
      cliente: "Oficinas Centro",
      tipoAlarma: "Pánico",
      fechaHora: "2024-01-15 14:32:15",
      tiempoRespuesta: "08:45",
      patrullasUsadas: 1,
      patrullasExtras: 1,
      estado: "Completado",
      operador: "Carlos Ruiz"
    },
    {
      id: "3",
      cliente: "Comercial Plaza Norte",
      tipoAlarma: "Fuego",
      fechaHora: "2024-01-15 14:28:45",
      tiempoRespuesta: "12:10",
      patrullasUsadas: 2,
      patrullasExtras: 0,
      estado: "Completado",
      operador: "Ana Martínez"
    },
    {
      id: "4",
      cliente: "Residencial Los Pinos",
      tipoAlarma: "Revisión",
      fechaHora: "2024-01-14 16:20:10",
      tiempoRespuesta: "15:22",
      patrullasUsadas: 1,
      patrullasExtras: 2,
      estado: "Completado",
      operador: "María González"
    }
  ]);

  const [filtroCliente, setFiltroCliente] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("all");
  const [filtroEstado, setFiltroEstado] = useState("all");

  const clientesUnicos = [...new Set(records.map(r => r.cliente))];

  const recordsFiltrados = records.filter(record => {
    return (
      (!filtroCliente || record.cliente.toLowerCase().includes(filtroCliente.toLowerCase())) &&
      (filtroTipo === "all" || record.tipoAlarma === filtroTipo) &&
      (filtroEstado === "all" || record.estado === filtroEstado)
    );
  });

  const getTipoAlarmaBadge = (tipo: string) => {
    const colors = {
      'Alarma': 'bg-orange-100 text-orange-800',
      'Pánico': 'bg-red-100 text-red-800',
      'Revisión': 'bg-blue-100 text-blue-800',
      'Fuego': 'bg-red-200 text-red-900'
    };
    return colors[tipo as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getEstadoBadge = (estado: string) => {
    return estado === 'Completado' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-gray-100 text-gray-800';
  };

  const totalPatrullasUsadas = recordsFiltrados.reduce((sum, record) => sum + record.patrullasUsadas, 0);
  const totalPatrullasExtras = recordsFiltrados.reduce((sum, record) => sum + record.patrullasExtras, 0);
  const promedioTiempoRespuesta = recordsFiltrados.length > 0 
    ? Math.round(recordsFiltrados.reduce((sum, record) => {
        const [min, sec] = record.tiempoRespuesta.split(':').map(Number);
        return sum + (min * 60 + sec);
      }, 0) / recordsFiltrados.length / 60)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Clock className="h-8 w-8 text-primary" />
          Historial de Patrullas
        </h1>
        <p className="text-muted-foreground">Reportes detallados del uso de patrullas por cliente</p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patrullas Usadas</CardTitle>
            <Car className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalPatrullasUsadas}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patrullas Extras</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{totalPatrullasExtras}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiempo Promedio</CardTitle>
            <Clock className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{promedioTiempoRespuesta} min</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Registros</CardTitle>
            <Calendar className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{recordsFiltrados.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Cliente</label>
              <Input
                placeholder="Buscar cliente..."
                value={filtroCliente}
                onChange={(e) => setFiltroCliente(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Tipo de Alarma</label>
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="Alarma">Alarma</SelectItem>
                  <SelectItem value="Pánico">Pánico</SelectItem>
                  <SelectItem value="Revisión">Revisión</SelectItem>
                  <SelectItem value="Fuego">Fuego</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Estado</label>
              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="Completado">Completado</SelectItem>
                  <SelectItem value="Cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setFiltroCliente("");
                  setFiltroTipo("all");
                  setFiltroEstado("all");
                }}
                className="w-full"
              >
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Historial */}
      <Card>
        <CardHeader>
          <CardTitle>Historial Detallado</CardTitle>
          <CardDescription>Registro completo de servicios y uso de patrullas</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Tipo Alarma</TableHead>
                <TableHead>Fecha y Hora</TableHead>
                <TableHead>Tiempo Respuesta</TableHead>
                <TableHead>Patrullas Normales</TableHead>
                <TableHead>Patrullas Extras</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Operador</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recordsFiltrados.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      {record.cliente}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getTipoAlarmaBadge(record.tipoAlarma)}>
                      {record.tipoAlarma}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {record.fechaHora}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {record.tiempoRespuesta}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-blue-600">
                      {record.patrullasUsadas}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {record.patrullasExtras > 0 ? (
                      <Badge variant="outline" className="text-orange-600">
                        {record.patrullasExtras}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={getEstadoBadge(record.estado)}>
                      {record.estado}
                    </Badge>
                  </TableCell>
                  <TableCell>{record.operador}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {recordsFiltrados.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron registros con los filtros aplicados
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HistorialPatrullas;