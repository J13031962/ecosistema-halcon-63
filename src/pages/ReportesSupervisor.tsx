import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  MapPin, 
  User, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Car, 
  Phone, 
  Camera, 
  Mic, 
  Video,
  Printer,
  Download,
  ArrowLeft
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import LeafletMap from '@/components/map/LeafletMap';

interface ReportData {
  id: string;
  cliente: string;
  direccion: string;
  codigoCliente: string;
  fechaHora: string;
  tipoAlarma: 'Pánico' | 'Robo' | 'Médica' | 'Incendio';
  prioridad: 'Alta' | 'Media' | 'Baja';
  supervisor: {
    nombre: string;
    codigo: string;
    avatar?: string;
  };
  vehiculo: {
    codigo: string;
    tipo: string;
  };
  estado: 'Completado' | 'En proceso' | 'Pendiente';
  resultado: 'Solucionado' | 'Parcial' | 'Sin resolver';
  cronologia: Array<{
    hora: string;
    evento: string;
    descripcion: string;
  }>;
  tiempos: {
    aceptacion: number;
    traslado: number;
    total: number;
  };
  descripcion: string;
  observaciones: string;
  recomendaciones: string;
  contactoSitio: {
    nombre: string;
    cargo: string;
    telefono: string;
  };
  evidencias: {
    fotos: string[];
    audios: string[];
    videos: string[];
  };
}

const ReportesSupervisor = () => {
  const [reporteSeleccionado, setReporteSeleccionado] = useState<ReportData | null>(null);
  const [mostrarLista, setMostrarLista] = useState(true);

  // Datos de ejemplo basados en las imágenes
  const reportesEjemplo: ReportData[] = [
    {
      id: 'RPT-001',
      cliente: 'Residencial Las Palmas',
      direccion: 'Urbanización Las Palmas, Casa 78',
      codigoCliente: 'C34567',
      fechaHora: '18/09/2023 14:45',
      tipoAlarma: 'Pánico',
      prioridad: 'Alta',
      supervisor: {
        nombre: 'Carlos Rodríguez',
        codigo: 'supervisor1',
        avatar: ''
      },
      vehiculo: {
        codigo: 'P-003',
        tipo: 'Patrulla'
      },
      estado: 'Completado',
      resultado: 'Solucionado',
      cronologia: [
        {
          hora: '14:45',
          evento: 'Asignación Creada',
          descripcion: 'Se creó la asignación para atender la alarma.'
        },
        {
          hora: '14:47',
          evento: 'Asignación Aceptada',
          descripcion: 'El supervisor aceptó la asignación y comenzó a desplazarse.'
        },
        {
          hora: '15:05',
          evento: 'Llegada al Sitio',
          descripcion: 'El supervisor llegó al sitio y comenzó la verificación.'
        },
        {
          hora: '15:30',
          evento: 'Asignación Completada',
          descripcion: 'La asignación fue completada y el reporte generado.'
        }
      ],
      tiempos: {
        aceptacion: 2,
        traslado: 18,
        total: 45
      },
      descripcion: 'Se verificó la alarma activada en el establecimiento. Se encontró una ventana abierta en la parte trasera del edificio, posiblemente forzada. Se realizó una inspección completa del perímetro y se verificó que no hubiera personas no autorizadas en el interior. El sistema de alarma funcionaba correctamente, pero el sensor de la ventana trasera estaba mal calibrado. Se contactó al cliente para informar de la situación y se aseguró el perímetro.',
      observaciones: 'El cliente solicitó reforzar vigilancia nocturna en la zona trasera del edificio. También mencionó que han tenido intentos previos de intrusión en los últimos 3 meses. El personal de seguridad del cliente no estaba presente durante la inspección.',
      recomendaciones: 'Se recomienda instalar sensores adicionales en todas las ventanas traseras del edificio. Mejorar la iluminación exterior, particularmente en el área de estacionamiento y acceso trasero. Revisar y ajustar la calibración de todos los sensores existentes. Considerar la instalación de cámaras de seguridad adicionales con visión nocturna.',
      contactoSitio: {
        nombre: 'Juan Pérez',
        cargo: 'Gerente de Seguridad',
        telefono: '+52 555 123 4567'
      },
      evidencias: {
        fotos: ['evidencia1.jpg', 'evidencia2.jpg'],
        audios: ['nota_voz_1.mp3', 'nota_voz_2.mp3'],
        videos: ['inspeccion_perimetro.mp4']
      }
    }
  ];

  const handleVerReporte = (reporte: ReportData) => {
    setReporteSeleccionado(reporte);
    setMostrarLista(false);
  };

  const handleVolver = () => {
    setMostrarLista(true);
    setReporteSeleccionado(null);
  };

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case 'Alta': return 'destructive';
      case 'Media': return 'default';
      case 'Baja': return 'secondary';
      default: return 'secondary';
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Completado': return 'bg-green-100 text-green-800';
      case 'En proceso': return 'bg-yellow-100 text-yellow-800';
      case 'Pendiente': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getResultadoColor = (resultado: string) => {
    switch (resultado) {
      case 'Solucionado': return 'bg-green-100 text-green-800';
      case 'Parcial': return 'bg-yellow-100 text-yellow-800';
      case 'Sin resolver': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (mostrarLista) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-700 text-white p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-6 w-6" />
                  <h1 className="text-2xl font-bold">REPORTES DE SUPERVISOR</h1>
                </div>
                <p className="text-slate-200">Gestión de reportes de asignaciones completadas</p>
              </div>
              <div className="text-right text-sm">
                <p>TELEGUARDIA.COM</p>
                <p>FECHA: {new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Lista de Reportes */}
          <Card>
            <CardHeader>
              <CardTitle>Reportes Disponibles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportesEjemplo.map((reporte) => (
                  <div
                    key={reporte.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleVerReporte(reporte)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">Reporte #{reporte.id}</h3>
                          <Badge variant={getPrioridadColor(reporte.prioridad)}>
                            {reporte.prioridad}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {reporte.cliente} - {reporte.direccion}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {reporte.fechaHora} - {reporte.tipoAlarma}
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <Badge className={getEstadoColor(reporte.estado)}>
                          {reporte.estado}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          Supervisor: {reporte.supervisor.nombre}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header con botones de acción */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={handleVolver}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-2xl font-bold">Reporte #{reporteSeleccionado?.id}</h1>
          <div className="flex gap-2">
            <Button variant="outline">
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
            <Button>
              <Download className="h-4 w-4 mr-2" />
              Descargar
            </Button>
          </div>
        </div>

        {reporteSeleccionado && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columna izquierda - Detalles principales */}
            <div className="lg:col-span-2 space-y-6">
              {/* Detalles de la Asignación */}
              <Card>
                <CardHeader>
                  <CardTitle>Detalles de la Asignación</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Cliente</Label>
                      <p className="font-medium">{reporteSeleccionado.cliente}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Fecha y Hora</Label>
                      <p className="font-medium">{reporteSeleccionado.fechaHora}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Dirección</Label>
                      <p className="font-medium">{reporteSeleccionado.direccion}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Código Cliente</Label>
                      <p className="font-medium">{reporteSeleccionado.codigoCliente}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Tipo de Alarma</Label>
                      <Badge variant={getPrioridadColor(reporteSeleccionado.prioridad)}>
                        {reporteSeleccionado.tipoAlarma}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Prioridad</Label>
                      <Badge variant={getPrioridadColor(reporteSeleccionado.prioridad)}>
                        {reporteSeleccionado.prioridad}
                      </Badge>
                    </div>
                  </div>

                  {/* Mapa con ubicación y recorrido del supervisor */}
                  <div className="mt-6">
                    <h4 className="font-semibold mb-2">Recorrido del Supervisor</h4>
                    <LeafletMap
                      center={[25.674, -100.309]}
                      zoom={15}
                      height="320px"
                      markers={[
                        {
                          position: [25.674, -100.309],
                          title: `Inicio - ${reporteSeleccionado.supervisor.nombre}`,
                          popupContent: `Punto de inicio del recorrido\nHora: ${reporteSeleccionado.cronologia[0]?.hora || 'N/A'}`
                        },
                        {
                          position: [25.676, -100.307],
                          title: reporteSeleccionado.cliente,
                          popupContent: `${reporteSeleccionado.direccion}\nSupervisor: ${reporteSeleccionado.supervisor.nombre}\nVehículo: ${reporteSeleccionado.vehiculo.codigo}\nTiempo en sitio: ${reporteSeleccionado.tiempos.total} min`
                        }
                      ]}
                      showTraffic={true}
                      withControls={true}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Cronología */}
              <Card>
                <CardHeader>
                  <CardTitle>Cronología</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reporteSeleccionado.cronologia.map((evento, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{evento.hora}</span>
                            <span className="text-sm text-muted-foreground">{evento.evento}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{evento.descripcion}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Tiempos */}
                  <div className="mt-6 grid grid-cols-3 gap-4">
                    <div className="text-center p-3 border rounded">
                      <p className="text-sm text-muted-foreground">Tiempo de Aceptación</p>
                      <p className="text-lg font-bold text-green-600">{reporteSeleccionado.tiempos.aceptacion} minutos</p>
                    </div>
                    <div className="text-center p-3 border rounded">
                      <p className="text-sm text-muted-foreground">Tiempo de Traslado</p>
                      <p className="text-lg font-bold text-orange-600">{reporteSeleccionado.tiempos.traslado} minutos</p>
                    </div>
                    <div className="text-center p-3 border rounded">
                      <p className="text-sm text-muted-foreground">Tiempo Total</p>
                      <p className="text-lg font-bold text-blue-600">{reporteSeleccionado.tiempos.total} minutos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Descripción del Reporte */}
              <Card>
                <CardHeader>
                  <CardTitle>Reporte</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Descripción</Label>
                      <p className="text-sm mt-1">{reporteSeleccionado.descripcion}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Observaciones y Recomendaciones */}
              <Card>
                <CardHeader>
                  <CardTitle>Observaciones</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{reporteSeleccionado.observaciones}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recomendaciones</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{reporteSeleccionado.recomendaciones}</p>
                </CardContent>
              </Card>

              {/* Contacto en Sitio */}
              <Card>
                <CardHeader>
                  <CardTitle>Contacto en Sitio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="font-medium">{reporteSeleccionado.contactoSitio.nombre}</p>
                    <p className="text-sm text-muted-foreground">{reporteSeleccionado.contactoSitio.cargo}</p>
                    <p className="text-sm">{reporteSeleccionado.contactoSitio.telefono}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Evidencias */}
              <Card>
                <CardHeader>
                  <CardTitle>Fotos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {reporteSeleccionado.evidencias.fotos.map((foto, index) => (
                      <div key={index} className="bg-muted rounded-lg h-32 flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                          <Camera className="h-8 w-8 mx-auto mb-1" />
                          <p className="text-xs">{foto}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Audio y Video */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Grabaciones de Audio</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {reporteSeleccionado.evidencias.audios.map((audio, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 border rounded">
                          <Mic className="h-4 w-4" />
                          <span className="text-sm flex-1">{audio}</span>
                          <Button size="sm" variant="outline">Play</Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Video</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {reporteSeleccionado.evidencias.videos.map((video, index) => (
                        <div key={index} className="bg-muted rounded-lg h-32 flex items-center justify-center">
                          <div className="text-center text-muted-foreground">
                            <Video className="h-8 w-8 mx-auto mb-1" />
                            <p className="text-xs">{video}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Columna derecha - Info del supervisor y vehículo */}
            <div className="space-y-6">
              {/* Supervisor Asignado */}
              <Card>
                <CardHeader>
                  <CardTitle>Supervisor Asignado</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={reporteSeleccionado.supervisor.avatar} />
                      <AvatarFallback>
                        {reporteSeleccionado.supervisor.nombre.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{reporteSeleccionado.supervisor.nombre}</p>
                      <p className="text-sm text-muted-foreground">{reporteSeleccionado.supervisor.codigo}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Vehículo Asignado */}
              <Card>
                <CardHeader>
                  <CardTitle>Vehículo Asignado</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Car className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{reporteSeleccionado.vehiculo.codigo}</p>
                      <p className="text-sm text-muted-foreground">{reporteSeleccionado.vehiculo.tipo}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Estado y Resultado */}
              <Card>
                <CardHeader>
                  <CardTitle>Estado y Resultado</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Estado</Label>
                      <div className="mt-1">
                        <Badge className={getEstadoColor(reporteSeleccionado.estado)}>
                          {reporteSeleccionado.estado}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Resultado</Label>
                      <div className="mt-1">
                        <Badge className={getResultadoColor(reporteSeleccionado.resultado)}>
                          {reporteSeleccionado.resultado}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-green-50 rounded">
                    <p className="text-sm text-green-800">Asignación completada exitosamente.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportesSupervisor;