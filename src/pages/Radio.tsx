import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Radio as RadioIcon, Mic, MicOff, Volume2, Users, Phone } from "lucide-react";

const Radio = () => {
  const [isMicOn, setIsMicOn] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState(1);
  
  const channels = [
    { id: 1, name: "Canal Principal", active: 8, type: "Operativo" },
    { id: 2, name: "Emergencias", active: 2, type: "Emergencia" },
    { id: 3, name: "Patrullas Norte", active: 4, type: "Zona" },
    { id: 4, name: "Patrullas Sur", active: 3, type: "Zona" },
    { id: 5, name: "Supervisores", active: 2, type: "Supervisión" }
  ];

  const radioLog = [
    {
      time: "14:35:22",
      from: "Patrulla 05",
      to: "Central",
      message: "Código verde en sector 7, situación bajo control",
      type: "routine"
    },
    {
      time: "14:32:15", 
      from: "Central",
      to: "Patrulla 03",
      message: "Proceder a calle 15 #234, alarma de intrusión",
      type: "dispatch"
    },
    {
      time: "14:28:45",
      from: "Supervisor 01",
      to: "Central", 
      message: "Solicitando apoyo adicional en zona comercial",
      type: "emergency"
    }
  ];

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case "emergency": return "text-red-600";
      case "dispatch": return "text-orange-600";
      case "routine": return "text-green-600";
      default: return "text-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Sistema de Radio</h1>
        <p className="text-muted-foreground">Comunicación directa con patrullas y personal de campo</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Control de Radio */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <RadioIcon className="h-5 w-5" />
                <span>Control de Radio</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Canales */}
              <div>
                <label className="text-sm font-medium mb-2 block">Canales Disponibles</label>
                <div className="space-y-2">
                  {channels.map((channel) => (
                    <div
                      key={channel.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedChannel === channel.id 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:bg-muted'
                      }`}
                      onClick={() => setSelectedChannel(channel.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{channel.name}</p>
                          <p className="text-xs text-muted-foreground">{channel.type}</p>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="h-3 w-3" />
                          <span className="text-sm">{channel.active}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Controles de Micrófono */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Button
                    variant={isMicOn ? "destructive" : "default"}
                    size="lg"
                    className="flex-1 mr-2"
                    onClick={() => setIsMicOn(!isMicOn)}
                  >
                    {isMicOn ? (
                      <>
                        <MicOff className="h-4 w-4 mr-2" />
                        Silenciar
                      </>
                    ) : (
                      <>
                        <Mic className="h-4 w-4 mr-2" />
                        Transmitir
                      </>
                    )}
                  </Button>
                  <Button variant="outline" size="lg">
                    <Volume2 className="h-4 w-4" />
                  </Button>
                </div>
                
                {isMicOn && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700 font-medium">🔴 EN VIVO</p>
                    <p className="text-xs text-red-600">Canal {selectedChannel} activo</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Historial y Mensaje */}
        <div className="lg:col-span-2 space-y-6">
          {/* Historial de Comunicaciones */}
          <Card>
            <CardHeader>
              <CardTitle>Historial de Comunicaciones</CardTitle>
              <CardDescription>Canal {selectedChannel} - {channels.find(c => c.id === selectedChannel)?.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {radioLog.map((log, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <div className="text-xs text-muted-foreground min-w-[60px]">
                      {log.time}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {log.from} → {log.to}
                        </Badge>
                      </div>
                      <p className={`text-sm ${getMessageTypeColor(log.type)}`}>
                        {log.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Enviar Mensaje */}
          <Card>
            <CardHeader>
              <CardTitle>Enviar Comunicación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Destinatario</label>
                  <Input placeholder="Ej: Patrulla 05, Todas las unidades..." />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Prioridad</label>
                  <select className="w-full px-3 py-2 border border-border rounded-md">
                    <option value="routine">Rutina</option>
                    <option value="dispatch">Despacho</option>
                    <option value="emergency">Emergencia</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Mensaje</label>
                <Textarea 
                  placeholder="Escriba su mensaje aquí..." 
                  className="min-h-[80px]"
                />
              </div>
              
              <div className="flex space-x-2">
                <Button className="flex-1">
                  <Phone className="h-4 w-4 mr-2" />
                  Enviar Mensaje
                </Button>
                <Button variant="outline">
                  Plantilla
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Radio;