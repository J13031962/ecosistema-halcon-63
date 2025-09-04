import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Users, 
  Car,
  Radio,
  Battery,
  Wifi,
  Server,
  Eye,
  RefreshCw
} from "lucide-react";

const EstadoGeneral = () => {
  const sistemasEstado = [
    { nombre: "Central de Alarmas", estado: "operativo", uptime: "99.8%", usuarios: 12 },
    { nombre: "Despacho de Patrullas", estado: "operativo", uptime: "99.5%", usuarios: 8 },
    { nombre: "Comunicaciones", estado: "alerta", uptime: "97.2%", usuarios: 15 },
    { nombre: "Monitoreo GPS", estado: "operativo", uptime: "99.9%", usuarios: 20 },
    { nombre: "Base de Datos", estado: "operativo", uptime: "100%", usuarios: 25 }
  ];

  const equiposActivos = [
    { tipo: "Patrullas", total: 12, activas: 10, mantenimiento: 1, fuera: 1 },
    { tipo: "Operadores", total: 15, activos: 12, descanso: 2, ausente: 1 },
    { tipo: "Radios", total: 25, operativos: 23, reparación: 1, perdido: 1 },
    { tipo: "Sensores", total: 156, activos: 151, falla: 3, mantenimiento: 2 }
  ];

  const alertasActivas = [
    { id: 1, tipo: "Técnica", descripcion: "Radio P-003 sin señal", prioridad: "media", tiempo: "15 min" },
    { id: 2, tipo: "Operacional", descripcion: "Patrulla P-007 combustible bajo", prioridad: "baja", tiempo: "8 min" },
    { id: 3, tipo: "Sistema", descripcion: "Latencia alta en comunicaciones", prioridad: "alta", tiempo: "22 min" }
  ];

  const metricas24h = {
    alarmasAtendidas: 47,
    tiempoPromedio: 2.8,
    efectividad: 97.8,
    serviciosCompletados: 35,
    kmRecorridos: 1250,
    combustibleConsumido: 180
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case "operativo": return "bg-green-100 text-green-800";
      case "alerta": return "bg-yellow-100 text-yellow-800";
      case "critico": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (prioridad: string) => {
    switch (prioridad) {
      case "alta": return "bg-red-100 text-red-800";
      case "media": return "bg-yellow-100 text-yellow-800";
      case "baja": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Estado General del Sistema</h2>
          <p className="text-muted-foreground">
            Monitoreo integral de todos los componentes operacionales
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button onClick={() => console.log('Vista detallada clicked')}>
            <Eye className="h-4 w-4 mr-2" />
            Vista Detallada
          </Button>
        </div>
      </div>

      {/* Estado de Sistemas Críticos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Server className="h-5 w-5 mr-2" />
            Estado de Sistemas Críticos
          </CardTitle>
          <CardDescription>Monitoreo en tiempo real de los sistemas principales</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sistemasEstado.map((sistema) => (
              <div key={sistema.nombre} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{sistema.nombre}</span>
                  <Badge className={getStatusColor(sistema.estado)}>
                    {sistema.estado}
                  </Badge>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Uptime:</span>
                    <span className="font-medium">{sistema.uptime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Usuarios:</span>
                    <span className="font-medium">{sistema.usuarios}</span>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-1">
                    <div 
                      className="bg-green-600 h-1 rounded-full" 
                      style={{ width: sistema.uptime }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Métricas de Rendimiento 24h */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alarmas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metricas24h.alarmasAtendidas}</div>
            <p className="text-xs text-muted-foreground">Últimas 24h</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiempo Resp.</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metricas24h.tiempoPromedio} min</div>
            <p className="text-xs text-green-600">-0.2 min</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efectividad</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metricas24h.efectividad}%</div>
            <p className="text-xs text-green-600">+0.3%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Servicios</CardTitle>
            <Shield className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metricas24h.serviciosCompletados}</div>
            <p className="text-xs text-muted-foreground">Completados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kilómetros</CardTitle>
            <Car className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metricas24h.kmRecorridos}</div>
            <p className="text-xs text-muted-foreground">Recorridos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Combustible</CardTitle>
            <Battery className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metricas24h.combustibleConsumido}L</div>
            <p className="text-xs text-muted-foreground">Consumidos</p>
          </CardContent>
        </Card>
      </div>

      {/* Estado de Equipos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Car className="h-5 w-5 mr-2" />
            Estado de Equipos y Personal
          </CardTitle>
          <CardDescription>Disponibilidad y estado de recursos operacionales</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {equiposActivos.map((equipo) => (
              <div key={equipo.tipo} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium">{equipo.tipo}</span>
                  <Badge variant="outline">{equipo.total}</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Activos:</span>
                    <span className="font-medium">{equipo.activas}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-yellow-600">Mantenimiento:</span>
                    <span className="font-medium">{equipo.mantenimiento}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-red-600">Fuera de servicio:</span>
                    <span className="font-medium">{equipo.fuera}</span>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${(equipo.activas / equipo.total) * 100}%` }}
                    />
                  </div>
                  <div className="text-xs text-center mt-1 text-muted-foreground">
                    {((equipo.activas / equipo.total) * 100).toFixed(0)}% operativo
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Alertas Activas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Alertas Activas del Sistema
          </CardTitle>
          <CardDescription>Incidencias que requieren atención</CardDescription>
        </CardHeader>
        <CardContent>
          {alertasActivas.length > 0 ? (
            <div className="space-y-3">
              {alertasActivas.map((alerta) => (
                <div key={alerta.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <div>
                      <div className="font-medium">{alerta.descripcion}</div>
                      <div className="text-sm text-muted-foreground">
                        Tipo: {alerta.tipo} • Hace {alerta.tiempo}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getPriorityColor(alerta.prioridad)}>
                      {alerta.prioridad}
                    </Badge>
                    <Button variant="outline" size="sm" onClick={() => console.log(`Atendiendo alerta ${alerta.id}`)}>
                      Atender
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-green-800">Sistema Estable</h3>
              <p className="text-green-600">No hay alertas activas en este momento</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Estado de Comunicaciones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Radio className="h-5 w-5 mr-2" />
              Estado de Comunicaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Radio Central</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Operativo</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Red WiFi</span>
                <div className="flex items-center space-x-2">
                  <Wifi className="h-4 w-4 text-green-600" />
                  <span className="text-sm">100% Señal</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Conexión Internet</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Estable</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Servidores</span>
                <div className="flex items-center space-x-2">
                  <Server className="h-4 w-4 text-green-600" />
                  <span className="text-sm">En línea</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumen Operacional</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Personal en turno:</span>
                <span className="font-medium">12/15 activos</span>
              </div>
              <div className="flex justify-between">
                <span>Patrullas disponibles:</span>
                <span className="font-medium">10/12 unidades</span>
              </div>
              <div className="flex justify-between">
                <span>Zonas cubiertas:</span>
                <span className="font-medium">5/5 sectores</span>
              </div>
              <div className="flex justify-between">
                <span>Tiempo promedio respuesta:</span>
                <span className="font-medium text-green-600">2.8 minutos</span>
              </div>
              <div className="flex justify-between">
                <span>Estado general:</span>
                <Badge className="bg-green-100 text-green-800">
                  Operativo
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EstadoGeneral;