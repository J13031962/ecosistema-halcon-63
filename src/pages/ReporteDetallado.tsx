import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Printer, Download, Plus, Minus } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const ReporteDetallado = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();

  // Datos de ejemplo - en producción vendrían de la API
  const reporteData = {
    numero: "#3",
    cliente: "Mall San Lucas",
    fechaHora: "21/05/2025 14:45",
    direccion: "Cra. 24 Sur, El Poblado, Medellín",
    codigoCliente: "SL-7890",
    tipoAlarma: "Pánico",
    prioridad: "Alta",
    supervisor: {
      nombre: "Carlos Rodríguez",
      username: "supervisor1",
      foto: "/placeholder.svg"
    },
    vehiculo: "ABC-1234",
    estado: "Completado",
    resultado: "Asignación completada exitosamente.",
    cronologia: [
      {
        hora: "14:45",
        titulo: "Asignación Creada",
        descripcion: "Se creó la asignación para atender la alarma."
      },
      {
        hora: "14:47",
        titulo: "Asignación Aceptada",
        descripcion: "El supervisor aceptó la asignación y comenzó a desplazarse."
      },
      {
        hora: "15:05",
        titulo: "Llegada al Sitio",
        descripcion: "El supervisor llegó al sitio y comenzó la verificación."
      },
      {
        hora: "15:30",
        titulo: "Asignación Completada",
        descripcion: "La asignación fue completada y el reporte generado."
      }
    ],
    tiempos: {
      aceptacion: "2 minutos",
      traslado: "18 minutos",
      total: "45 minutos"
    },
    descripcion: "Se verificó la alarma activada en el establecimiento. Se encontró una ventana abierta en la parte trasera del edificio, posiblemente forzada. Se realizó una inspección completa del perímetro y se verificó que no hubiera personas no autorizadas en el interior. El sistema de alarma funcionaba correctamente, pero el sensor de la ventana trasera estaba mal calibrado. Se contactó al cliente para informar de la situación y se aseguró el perímetro.",
    observaciones: "El cliente solicitó reforzar vigilancia nocturna en la zona trasera del edificio. También mencionó que han tenido intentos previos de intrusión en los últimos 3 meses. El personal de seguridad del cliente no estaba presente durante la inspección.",
    recomendaciones: "Se recomienda instalar sensores adicionales en todas las ventanas traseras del edificio. Mejorar la iluminación exterior, particularmente en el área de estacionamiento y acceso trasero. Revisar y ajustar la calibración de todos los sensores existentes. Considerar la instalación de cámaras de seguridad adicionales con visión nocturna.",
    contactoSitio: {
      nombre: "Juan Pérez",
      cargo: "Gerente de Seguridad",
      telefono: "+52 555 123 4567"
    }
  };

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad.toLowerCase()) {
      case 'alta': return 'destructive';
      case 'media': return 'default';
      case 'baja': return 'secondary';
      default: return 'default';
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'completado': return 'default';
      case 'en proceso': return 'secondary';
      case 'pendiente': return 'outline';
      default: return 'default';
    }
  };

  const handleVolver = () => {
    // Determinar si venimos de operador o despachador basado en la URL anterior
    const referrer = document.referrer;
    if (referrer.includes('historial-patrullas-operador')) {
      navigate('/historial-patrullas-operador');
    } else if (referrer.includes('historial-patrullas-despachador')) {
      navigate('/historial-patrullas-despachador');
    } else {
      // Fallback: ir hacia atrás en el historial
      navigate(-1);
    }
  };

  const handleImprimir = () => {
    window.print();
    toast({
      title: "Imprimiendo",
      description: "Se ha enviado el reporte a la impresora"
    });
  };

  const handleDescargar = async () => {
    try {
      const jsPDF = (await import('jspdf')).default;
      
      const doc = new jsPDF();
      
      // Título del reporte
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text(`REPORTE ${reporteData.numero}`, 20, 20);
      
      // Línea separadora
      doc.setLineWidth(0.5);
      doc.line(20, 25, 190, 25);
      
      let y = 35;
      
      // Sección: Detalles de la Asignación
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('DETALLES DE LA ASIGNACIÓN', 20, y);
      y += 10;
      
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      doc.text(`Cliente: ${reporteData.cliente}`, 20, y);
      y += 6;
      doc.text(`Fecha y Hora: ${reporteData.fechaHora}`, 20, y);
      y += 6;
      doc.text(`Dirección: ${reporteData.direccion}`, 20, y);
      y += 6;
      doc.text(`Código Cliente: ${reporteData.codigoCliente}`, 20, y);
      y += 6;
      doc.text(`Tipo de Alarma: ${reporteData.tipoAlarma}`, 20, y);
      y += 6;
      doc.text(`Prioridad: ${reporteData.prioridad}`, 20, y);
      y += 12;
      
      // Sección: Supervisor Asignado
      doc.setFont(undefined, 'bold');
      doc.setFontSize(12);
      doc.text('SUPERVISOR ASIGNADO', 20, y);
      y += 10;
      
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      doc.text(`Nombre: ${reporteData.supervisor.nombre}`, 20, y);
      y += 6;
      doc.text(`Usuario: ${reporteData.supervisor.username}`, 20, y);
      y += 12;
      
      // Sección: Vehículo Asignado
      doc.setFont(undefined, 'bold');
      doc.setFontSize(12);
      doc.text('VEHÍCULO ASIGNADO', 20, y);
      y += 10;
      
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      doc.text(reporteData.vehiculo, 20, y);
      y += 12;
      
      // Sección: Estado y Resultado
      doc.setFont(undefined, 'bold');
      doc.setFontSize(12);
      doc.text('ESTADO Y RESULTADO', 20, y);
      y += 10;
      
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      doc.text(`Estado: ${reporteData.estado}`, 20, y);
      y += 6;
      doc.text(`Resultado: ${reporteData.resultado}`, 20, y);
      y += 12;
      
      // Sección: Tiempos
      doc.setFont(undefined, 'bold');
      doc.setFontSize(12);
      doc.text('TIEMPOS', 20, y);
      y += 10;
      
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      doc.text(`Tiempo de Aceptación: ${reporteData.tiempos.aceptacion}`, 20, y);
      y += 6;
      doc.text(`Tiempo de Traslado: ${reporteData.tiempos.traslado}`, 20, y);
      y += 6;
      doc.text(`Tiempo Total: ${reporteData.tiempos.total}`, 20, y);
      y += 12;
      
      // Nueva página si es necesario
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      
      // Sección: Cronología
      doc.setFont(undefined, 'bold');
      doc.setFontSize(12);
      doc.text('CRONOLOGÍA', 20, y);
      y += 10;
      
      doc.setFont(undefined, 'normal');
      doc.setFontSize(9);
      reporteData.cronologia.forEach(item => {
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
        doc.text(`${item.hora} - ${item.titulo}`, 20, y);
        y += 5;
        const descripcionLines = doc.splitTextToSize(item.descripcion, 170);
        doc.text(descripcionLines, 25, y);
        y += descripcionLines.length * 4 + 3;
      });
      
      // Guardar el PDF
      doc.save(`Reporte_${reporteData.numero.replace('#', '')}_${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast({
        title: "Descarga iniciada",
        description: "El reporte PDF se ha descargado exitosamente"
      });
    } catch (error) {
      console.error('Error generando PDF:', error);
      toast({
        title: "Error",
        description: "No se pudo generar el PDF",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleVolver}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
            <h1 className="text-2xl font-bold">Reporte {reporteData.numero}</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleImprimir}
              className="flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDescargar}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Descargar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Detalles de la Asignación */}
            <Card>
              <CardHeader>
                <CardTitle>Detalles de la Asignación</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Cliente</p>
                    <p className="font-medium">{reporteData.cliente}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha y Hora</p>
                    <p className="font-medium">{reporteData.fechaHora}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Dirección</p>
                    <p className="font-medium">{reporteData.direccion}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Código Cliente</p>
                    <p className="font-medium">{reporteData.codigoCliente}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tipo de Alarma</p>
                    <Badge variant="destructive">{reporteData.tipoAlarma}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Prioridad</p>
                    <Badge variant={getPrioridadColor(reporteData.prioridad)}>
                      {reporteData.prioridad}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mapa */}
            <Card>
              <CardContent className="p-0">
                <div className="h-64 bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-blue-100">
                    <div className="absolute top-4 left-4 bg-white px-2 py-1 rounded shadow text-xs">
                      Ebejico
                    </div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                    </div>
                    <div className="absolute bottom-1/3 left-1/3">
                      <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                    </div>
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white px-3 py-2 rounded shadow">
                      <p className="text-sm font-medium">Mall San Lucas</p>
                    </div>
                  </div>
                  <div className="absolute top-2 right-2 flex flex-col gap-1">
                    <Button size="sm" variant="outline" className="w-8 h-8 p-0">
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" className="w-8 h-8 p-0">
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
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
                  {reporteData.cronologia.map((evento, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="w-3 h-3 bg-primary rounded-full mt-1.5 flex-shrink-0"></div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">{evento.hora}</span>
                          <span className="font-medium">{evento.titulo}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{evento.descripcion}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tiempos */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Tiempo de Aceptación</p>
                  <p className="text-lg font-bold text-primary">{reporteData.tiempos.aceptacion}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Tiempo de Traslado</p>
                  <p className="text-lg font-bold text-orange-500">{reporteData.tiempos.traslado}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Tiempo Total</p>
                  <p className="text-lg font-bold text-orange-500">{reporteData.tiempos.total}</p>
                </CardContent>
              </Card>
            </div>

            {/* Reporte con Tabs */}
            <Card>
              <CardHeader>
                <CardTitle>Reporte</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="descripcion" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="descripcion">Descripción</TabsTrigger>
                    <TabsTrigger value="fotos">Fotos</TabsTrigger>
                    <TabsTrigger value="audio">Audio</TabsTrigger>
                    <TabsTrigger value="video">Video</TabsTrigger>
                  </TabsList>
                  <TabsContent value="descripcion" className="mt-4">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Descripción</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {reporteData.descripcion}
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="fotos" className="mt-4">
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No hay fotos disponibles</p>
                    </div>
                  </TabsContent>
                  <TabsContent value="audio" className="mt-4">
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No hay audio disponible</p>
                    </div>
                  </TabsContent>
                  <TabsContent value="video" className="mt-4">
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No hay video disponible</p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Observaciones */}
            <Card>
              <CardHeader>
                <CardTitle>Observaciones</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{reporteData.observaciones}</p>
              </CardContent>
            </Card>

            {/* Recomendaciones */}
            <Card>
              <CardHeader>
                <CardTitle>Recomendaciones</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{reporteData.recomendaciones}</p>
              </CardContent>
            </Card>

            {/* Contacto en Sitio */}
            <Card>
              <CardHeader>
                <CardTitle>Contacto en Sitio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-medium">{reporteData.contactoSitio.nombre}</p>
                  <p className="text-sm text-muted-foreground">{reporteData.contactoSitio.cargo}</p>
                  <p className="text-sm font-medium">{reporteData.contactoSitio.telefono}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Columna Derecha */}
          <div className="space-y-6">
            {/* Supervisor Asignado */}
            <Card>
              <CardHeader>
                <CardTitle>Supervisor Asignado</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={reporteData.supervisor.foto} alt="Supervisor" />
                  <AvatarFallback>
                    {reporteData.supervisor.nombre.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{reporteData.supervisor.nombre}</p>
                  <p className="text-sm text-muted-foreground">{reporteData.supervisor.username}</p>
                </div>
              </CardContent>
            </Card>

            {/* Vehículo Asignado */}
            <Card>
              <CardHeader>
                <CardTitle>Vehículo Asignado</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="bg-yellow-400 text-black px-4 py-2 rounded-lg font-bold text-lg inline-block">
                  {reporteData.vehiculo}
                </div>
              </CardContent>
            </Card>

            {/* Estado y Resultado */}
            <Card>
              <CardHeader>
                <CardTitle>Estado y Resultado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Estado</p>
                  <Badge variant={getEstadoColor(reporteData.estado)}>
                    {reporteData.estado}
                  </Badge>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Resultado</p>
                  <p className="text-sm">{reporteData.resultado}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Notas Adicionales</p>
                  <p className="text-sm">{reporteData.resultado}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReporteDetallado;