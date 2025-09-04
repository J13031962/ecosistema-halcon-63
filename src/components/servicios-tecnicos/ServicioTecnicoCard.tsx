import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ServicioTecnico, useServiciosTecnicos } from "@/hooks/useServiciosTecnicos";
import { 
  Eye, 
  CheckCircle, 
  Play, 
  Download, 
  Mail, 
  MessageCircle,
  Clock,
  MapPin,
  User,
  Phone,
  FileText,
  Wrench
} from "lucide-react";
import { exportToPDF } from "@/utils/exportUtils";
import { toast } from "@/hooks/use-toast";

interface ServicioTecnicoCardProps {
  servicio: ServicioTecnico;
  onRefresh: () => void;
}

export const ServicioTecnicoCard = ({ servicio, onRefresh }: ServicioTecnicoCardProps) => {
  const [showModal, setShowModal] = useState(false);
  const [observaciones, setObservaciones] = useState("");
  const [firmaDigital, setFirmaDigital] = useState("");
  const { aceptarServicio, iniciarServicio, completarServicio, agregarObservacion } = useServiciosTecnicos();

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'completado':
        return <Badge className="bg-green-500 text-white">Completado</Badge>;
      case 'en_progreso':
        return <Badge className="bg-blue-500 text-white">En Progreso</Badge>;
      case 'aceptado':
        return <Badge className="bg-yellow-500 text-white">Aceptado</Badge>;
      case 'pendiente':
        return <Badge variant="outline">Pendiente</Badge>;
      default:
        return <Badge variant="secondary">{estado}</Badge>;
    }
  };

  const getPrioridadBadge = (prioridad: string) => {
    switch (prioridad) {
      case 'urgente':
        return <Badge variant="destructive">Urgente</Badge>;
      case 'alta':
        return <Badge className="bg-red-500 text-white">Alta</Badge>;
      case 'media':
        return <Badge className="bg-yellow-500 text-white">Media</Badge>;
      case 'baja':
        return <Badge variant="outline">Baja</Badge>;
      default:
        return <Badge variant="secondary">{prioridad}</Badge>;
    }
  };

  const handleAceptar = async () => {
    await aceptarServicio(servicio.id);
    onRefresh();
  };

  const handleIniciar = async () => {
    await iniciarServicio(servicio.id);
    onRefresh();
  };

  const handleCompletar = async () => {
    if (observaciones.trim()) {
      await agregarObservacion(servicio.id, observaciones, 'finalizacion');
    }
    await completarServicio(servicio.id, observaciones, firmaDigital);
    onRefresh();
    setShowModal(false);
  };

  const exportarPDF = () => {
    const data = [{
      'Cliente': servicio.cliente_razon_social,
      'Dirección': servicio.cliente_direccion,
      'Contacto': servicio.persona_encargada,
      'Servicio': servicio.motivo_servicio,
      'Tipo': servicio.tipo_servicio,
      'Estado': servicio.estado,
      'Fecha Asignación': new Date(servicio.fecha_asignacion).toLocaleDateString(),
      'Observaciones': servicio.observaciones_tecnico || 'Sin observaciones'
    }];

    exportToPDF(
      data, 
      `Servicio Técnico - ${servicio.cliente_razon_social}`,
      Object.keys(data[0])
    );
  };

  const enviarPorEmail = () => {
    const subject = `Servicio Técnico - ${servicio.cliente_razon_social}`;
    const body = `Estimado cliente,

Le informamos sobre el servicio técnico:

Cliente: ${servicio.cliente_razon_social}
Dirección: ${servicio.cliente_direccion}
Contacto: ${servicio.persona_encargada}
Motivo: ${servicio.motivo_servicio}
Estado: ${servicio.estado}
Fecha: ${new Date(servicio.fecha_asignacion).toLocaleDateString()}

${servicio.observaciones_tecnico ? `Observaciones: ${servicio.observaciones_tecnico}` : ''}

Saludos cordiales,
Equipo Técnico`;

    window.open(`mailto:${servicio.cliente_email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const enviarPorWhatsApp = () => {
    const mensaje = `*Servicio Técnico*\n\n*Cliente:* ${servicio.cliente_razon_social}\n*Dirección:* ${servicio.cliente_direccion}\n*Contacto:* ${servicio.persona_encargada}\n*Motivo:* ${servicio.motivo_servicio}\n*Estado:* ${servicio.estado}\n*Fecha:* ${new Date(servicio.fecha_asignacion).toLocaleDateString()}\n\n${servicio.observaciones_tecnico ? `*Observaciones:* ${servicio.observaciones_tecnico}` : ''}`;
    
    const numeroLimpio = servicio.cliente_telefono?.replace(/[^0-9]/g, '');
    if (numeroLimpio) {
      window.open(`https://wa.me/${numeroLimpio}?text=${encodeURIComponent(mensaje)}`);
    } else {
      toast({
        title: "Error",
        description: "No hay número de teléfono disponible",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <Card className="mb-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              {servicio.motivo_servicio}
            </CardTitle>
            <div className="flex gap-2">
              {getEstadoBadge(servicio.estado)}
              {getPrioridadBadge(servicio.prioridad)}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{servicio.cliente_razon_social}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{servicio.cliente_direccion}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{servicio.persona_encargada}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Asignado: {new Date(servicio.fecha_asignacion).toLocaleDateString()}
                </span>
              </div>
              {servicio.cliente_telefono && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{servicio.cliente_telefono}</span>
                </div>
              )}
              {servicio.tiempo_estimado_horas && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Tiempo estimado: {servicio.tiempo_estimado_horas}h</span>
                </div>
              )}
            </div>
          </div>

          {servicio.descripcion_detallada && (
            <div>
              <Label className="text-sm font-medium">Descripción:</Label>
              <p className="text-sm text-muted-foreground mt-1">{servicio.descripcion_detallada}</p>
            </div>
          )}

          <Separator />

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowModal(true)}>
              <Eye className="h-4 w-4 mr-2" />
              Ver Detalle
            </Button>

            {servicio.estado === 'pendiente' && (
              <Button size="sm" onClick={handleAceptar}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Aceptar
              </Button>
            )}

            {servicio.estado === 'aceptado' && (
              <Button size="sm" onClick={handleIniciar}>
                <Play className="h-4 w-4 mr-2" />
                Iniciar
              </Button>
            )}

            <Button variant="outline" size="sm" onClick={exportarPDF}>
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>

            {servicio.cliente_email && (
              <Button variant="outline" size="sm" onClick={enviarPorEmail}>
                <Mail className="h-4 w-4 mr-2" />
                Email
              </Button>
            )}

            {servicio.cliente_telefono && (
              <Button variant="outline" size="sm" onClick={enviarPorWhatsApp}>
                <MessageCircle className="h-4 w-4 mr-2" />
                WhatsApp
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle del Servicio Técnico</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label className="font-medium">Cliente</Label>
                  <p className="text-sm text-muted-foreground">{servicio.cliente_razon_social}</p>
                </div>
                
                <div>
                  <Label className="font-medium">Dirección</Label>
                  <p className="text-sm text-muted-foreground">{servicio.cliente_direccion}</p>
                </div>
                
                <div>
                  <Label className="font-medium">Persona Encargada</Label>
                  <p className="text-sm text-muted-foreground">{servicio.persona_encargada}</p>
                </div>
                
                {servicio.cliente_telefono && (
                  <div>
                    <Label className="font-medium">Teléfono</Label>
                    <p className="text-sm text-muted-foreground">{servicio.cliente_telefono}</p>
                  </div>
                )}
                
                {servicio.cliente_email && (
                  <div>
                    <Label className="font-medium">Email</Label>
                    <p className="text-sm text-muted-foreground">{servicio.cliente_email}</p>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label className="font-medium">Motivo del Servicio</Label>
                  <p className="text-sm text-muted-foreground">{servicio.motivo_servicio}</p>
                </div>
                
                <div>
                  <Label className="font-medium">Tipo de Servicio</Label>
                  <p className="text-sm text-muted-foreground">{servicio.tipo_servicio}</p>
                </div>
                
                <div>
                  <Label className="font-medium">Estado</Label>
                  <div className="mt-1">{getEstadoBadge(servicio.estado)}</div>
                </div>
                
                <div>
                  <Label className="font-medium">Prioridad</Label>
                  <div className="mt-1">{getPrioridadBadge(servicio.prioridad)}</div>
                </div>
                
                {servicio.tiempo_estimado_horas && (
                  <div>
                    <Label className="font-medium">Tiempo Estimado</Label>
                    <p className="text-sm text-muted-foreground">{servicio.tiempo_estimado_horas} horas</p>
                  </div>
                )}
                
                {servicio.costo_estimado && (
                  <div>
                    <Label className="font-medium">Costo Estimado</Label>
                    <p className="text-sm text-muted-foreground">${servicio.costo_estimado}</p>
                  </div>
                )}
              </div>
            </div>

            {servicio.descripcion_detallada && (
              <div>
                <Label className="font-medium">Descripción Detallada</Label>
                <p className="text-sm text-muted-foreground mt-1">{servicio.descripcion_detallada}</p>
              </div>
            )}

            {servicio.observaciones_tecnico && (
              <div>
                <Label className="font-medium">Observaciones del Técnico</Label>
                <p className="text-sm text-muted-foreground mt-1">{servicio.observaciones_tecnico}</p>
              </div>
            )}

            {servicio.estado === 'en_progreso' && (
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-medium">Completar Servicio</h3>
                
                <div>
                  <Label htmlFor="observaciones">Observaciones Finales</Label>
                  <Textarea
                    id="observaciones"
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    placeholder="Ingrese las observaciones del servicio realizado..."
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="firma">Firma Digital (Opcional)</Label>
                  <Textarea
                    id="firma"
                    value={firmaDigital}
                    onChange={(e) => setFirmaDigital(e.target.value)}
                    placeholder="Ingrese su firma digital..."
                    className="mt-1"
                  />
                </div>
                
                <Button onClick={handleCompletar} className="w-full">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Completar Servicio
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};