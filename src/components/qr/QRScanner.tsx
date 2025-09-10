import React, { useRef, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Camera, X, MapPin, User, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import QrScanner from 'qr-scanner';

interface QRData {
  id_cliente: string;
  coordenadas: {
    latitud: string;
    longitud: string;
  };
  nombre: string;
  direccion: string;
}

interface QRScannerProps {
  onScanSuccess?: (data: QRData) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const QRScannerComponent = ({ onScanSuccess, isOpen, onClose }: QRScannerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [qrScanner, setQrScanner] = useState<QrScanner | null>(null);
  const [scannedData, setScannedData] = useState<QRData | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);

  // Limpiar cuando se cierre
  useEffect(() => {
    if (!isOpen) {
      cleanup();
      setScannedData(null);
      setAttempts(0);
    } else if (isOpen && attempts === 0) {
      // Solo iniciar en el primer intento
      setAttempts(1);
      initCamera();
    }
  }, [isOpen]);

  const cleanup = () => {
    if (qrScanner) {
      try {
        qrScanner.stop();
        qrScanner.destroy();
      } catch (e) {
        console.warn('Cleanup warning:', e);
      }
      setQrScanner(null);
    }
    setIsScanning(false);
    setCameraError(null);
  };

  const initCamera = async () => {
    console.log('🎥 Inicializando cámara...');
    
    if (!videoRef.current) {
      console.error('Video element not found');
      setCameraError('Error: elemento de video no encontrado');
      return;
    }

    try {
      // Limpiar cualquier instancia previa
      cleanup();
      
      console.log('📱 Verificando disponibilidad de cámara...');
      const hasCamera = await QrScanner.hasCamera();
      
      if (!hasCamera) {
        setCameraError('No hay cámara disponible en este dispositivo');
        return;
      }

      console.log('✅ Cámara disponible, creando scanner...');
      
      const scanner = new QrScanner(
        videoRef.current,
        (result) => {
          console.log('🎯 QR Code detectado:', result.data);
          
          try {
            const data = JSON.parse(result.data) as QRData;
            
            if (data.id_cliente && data.coordenadas && data.nombre) {
              console.log('✅ QR válido:', data);
              setScannedData(data);
              setIsScanning(false);
              
              toast({
                title: "QR Escaneado",
                description: `Cliente: ${data.nombre} detectado`,
              });
            } else {
              console.warn('⚠️ QR inválido:', data);
              toast({
                title: "QR Inválido",
                description: "El código QR no contiene información válida",
                variant: "destructive"
              });
            }
          } catch (error) {
            console.error('❌ Error parsing QR:', error);
            toast({
              title: "Error",
              description: "No se pudo leer la información del QR",
              variant: "destructive"
            });
          }
        },
        {
          returnDetailedScanResult: true,
          highlightScanRegion: true,
          preferredCamera: 'environment'
        }
      );

      console.log('🚀 Iniciando scanner...');
      setQrScanner(scanner);
      
      await scanner.start();
      
      console.log('✅ Scanner iniciado exitosamente');
      setIsScanning(true);
      setCameraError(null);
      
    } catch (error: any) {
      console.error('❌ Error iniciando cámara:', error);
      
      setIsScanning(false);
      let errorMessage = "Error al acceder a la cámara";
      
      if (error.name === 'NotAllowedError') {
        errorMessage = "Permisos de cámara denegados. Permite el acceso en tu navegador.";
      } else if (error.name === 'NotFoundError') {
        errorMessage = "No se encontró cámara en este dispositivo.";
      } else if (error.name === 'NotSupportedError') {
        errorMessage = "Tu navegador no soporta el acceso a la cámara.";
      } else if (error.name === 'NotReadableError') {
        errorMessage = "La cámara está siendo usada por otra aplicación.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setCameraError(errorMessage);
      
      toast({
        title: "Error de Cámara",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const retry = () => {
    console.log('🔄 Reintentando...');
    setAttempts(prev => prev + 1);
    setCameraError(null);
    cleanup();
    setTimeout(() => {
      initCamera();
    }, 1000);
  };

  const handleClose = () => {
    cleanup();
    setScannedData(null);
    onClose();
  };

  const confirmScan = () => {
    if (scannedData && onScanSuccess) {
      onScanSuccess(scannedData);
    }
    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Escanear Código QR
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {!scannedData ? (
            <div className="space-y-4">
              <div className="relative rounded-lg overflow-hidden bg-black h-64">
                <video 
                  ref={videoRef} 
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                  autoPlay
                />
                
                {/* Estados overlay */}
                {cameraError ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80">
                    <div className="text-white text-center p-4">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2 text-red-400" />
                      <p className="text-sm mb-3 max-w-xs">{cameraError}</p>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={retry}
                        className="bg-white text-black hover:bg-gray-200"
                      >
                        Reintentar ({attempts}/3)
                      </Button>
                      {attempts >= 3 && (
                        <p className="text-xs text-gray-300 mt-2">
                          Si el problema persiste, verifica los permisos de cámara
                        </p>
                      )}
                    </div>
                  </div>
                ) : !isScanning ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60">
                    <div className="text-white text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                      <p>Iniciando cámara...</p>
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="border-2 border-white rounded-lg w-48 h-48 flex items-center justify-center">
                      <div className="text-white text-center">
                        <Camera className="h-8 w-8 mx-auto mb-2 animate-pulse" />
                        <p className="text-sm">Escanea el QR aquí</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Mantén el código QR dentro del marco para escanearlo
                </p>
              </div>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Cliente Detectado
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{scannedData.nombre}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{scannedData.direccion}</span>
                </div>
                
                <div>
                  <Badge variant="outline">ID: {scannedData.id_cliente}</Badge>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  <p>Coordenadas:</p>
                  <p>Lat: {scannedData.coordenadas.latitud}</p>
                  <p>Lng: {scannedData.coordenadas.longitud}</p>
                </div>
              </CardContent>
            </Card>
          )}
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            {scannedData && (
              <Button onClick={confirmScan}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirmar
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};