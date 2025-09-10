import React, { useRef, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Camera, X, MapPin, User, CheckCircle } from "lucide-react";
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

  useEffect(() => {
    if (isOpen && videoRef.current && !qrScanner) {
      console.log('🎯 Dialog abierto, iniciando scanner...');
      startScanner();
    }

    return () => {
      if (!isOpen) {
        cleanupScanner();
      }
    };
  }, [isOpen, qrScanner]);

  const cleanupScanner = () => {
    if (qrScanner) {
      try {
        qrScanner.stop();
        qrScanner.destroy();
      } catch (error) {
        console.warn('Error cleaning up scanner:', error);
      }
      setQrScanner(null);
    }
    setIsScanning(false);
    setCameraError(null);
  };

  const startScanner = async () => {
    console.log('🎬 === INICIANDO SCANNER QR ===');
    
    if (!videoRef.current) {
      console.error('❌ Video ref no disponible');
      setCameraError('Error: elemento de video no disponible');
      setIsScanning(false);
      return;
    }

    try {
      console.log('🎥 Limpiando estado inicial...');
      setCameraError(null);
      setIsScanning(true);
      
      // Limpiar cualquier scanner previo
      if (qrScanner) {
        console.log('🧹 Limpiando scanner previo...');
        try {
          qrScanner.stop();
          qrScanner.destroy();
        } catch (e) {
          console.warn('⚠️ Error limpiando scanner previo:', e);
        }
        setQrScanner(null);
      }

      console.log('🔍 Verificando disponibilidad de cámara...');
      
      // Primero verificar si hay cámaras disponibles
      const hasCamera = await QrScanner.hasCamera();
      console.log('📹 Tiene cámara:', hasCamera);
      
      if (!hasCamera) {
        throw new Error('No hay cámara disponible en este dispositivo');
      }

      // Listar cámaras disponibles para debugging
      try {
        const cameras = await QrScanner.listCameras(true);
        console.log('📱 Cámaras disponibles:', cameras);
      } catch (e) {
        console.warn('⚠️ No se pudieron listar las cámaras:', e);
      }

      console.log('✅ Cámara disponible, creando QrScanner...');
      console.log('📺 Video element:', videoRef.current);
      
      // Configurar el scanner con configuración más robusta
      const scanner = new QrScanner(
        videoRef.current,
        (result) => {
          console.log('🎯 QR detectado:', result.data);
          try {
            const data = JSON.parse(result.data) as QRData;
            
            if (data.id_cliente && data.coordenadas && data.nombre) {
              console.log('✅ QR válido:', data);
              setScannedData(data);
              scanner.stop();
              setIsScanning(false);
              
              toast({
                title: "QR Escaneado",
                description: `Cliente: ${data.nombre} detectado`,
              });

              if (onScanSuccess) {
                onScanSuccess(data);
              }
            } else {
              console.warn('⚠️ QR inválido:', data);
              toast({
                title: "QR Inválido",
                description: "El código QR no contiene información válida de cliente",
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
          highlightCodeOutline: true,
          preferredCamera: 'environment', // Intentar cámara trasera primero
          maxScansPerSecond: 2,
        }
      );

      console.log('🎬 Scanner creado, verificando permisos de cámara...');
      
      // Solicitar permisos explícitamente antes de iniciar el scanner
      try {
        console.log('🔐 Solicitando permisos de cámara...');
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        });
        console.log('✅ Permisos concedidos, stream obtenido:', stream);
        
        // Detener el stream temporal ya que QrScanner manejará la cámara
        stream.getTracks().forEach(track => track.stop());
        console.log('🛑 Stream temporal detenido');
        
      } catch (permError: any) {
        console.error('❌ Error al solicitar permisos:', permError);
        throw new Error(`Error de permisos: ${permError.message}`);
      }

      console.log('🚀 Iniciando QrScanner...');
      
      // Intentar iniciar el scanner con timeout
      const startPromise = scanner.start();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout: La cámara tardó demasiado en iniciar')), 10000)
      );
      
      await Promise.race([startPromise, timeoutPromise]);
      
      console.log('✅ QrScanner iniciado exitosamente');
      setQrScanner(scanner);
      setIsScanning(true);
      
    } catch (error: any) {
      console.error('❌ Error completo al iniciar scanner:', error);
      console.error('❌ Error name:', error.name);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
      
      setIsScanning(false);
      
      let errorMessage = "No se pudo acceder a la cámara";
      
      if (error.name === 'NotAllowedError' || error.message?.includes('Permission')) {
        errorMessage = "Permisos de cámara denegados. Permite el acceso a la cámara en tu navegador.";
      } else if (error.name === 'NotFoundError' || error.message?.includes('camera')) {
        errorMessage = "No se encontró cámara en este dispositivo.";
      } else if (error.name === 'NotSupportedError') {
        errorMessage = "Tu navegador no soporta el acceso a la cámara.";
      } else if (error.name === 'NotReadableError') {
        errorMessage = "La cámara está siendo usada por otra aplicación.";
      } else if (error.message?.includes('Timeout')) {
        errorMessage = "La cámara tardó demasiado en iniciar. Verifica que no esté siendo usada por otra aplicación.";
      } else if (error.message?.includes('HTTPS')) {
        errorMessage = "Se requiere conexión segura (HTTPS) para acceder a la cámara.";
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

  const retryCamera = () => {
    console.log('🔄 Reintentando acceso a cámara...');
    setCameraError(null);
    setIsScanning(false);
    cleanupScanner();
    setTimeout(() => {
      startScanner();
    }, 500);
  };

  const handleClose = () => {
    cleanupScanner();
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
              <div className="relative rounded-lg overflow-hidden bg-black">
                <video 
                  ref={(el) => {
                    videoRef.current = el;
                    if (isOpen && el && !qrScanner) {
                      console.log('📷 Video element mounted, starting scanner...');
                      setTimeout(() => startScanner(), 0);
                    }
                  }} 
                  className="w-full h-64 object-cover"
                  playsInline
                  muted
                  autoPlay
                />
                {cameraError ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
                    <div className="text-white text-center p-4">
                      <Camera className="h-8 w-8 mx-auto mb-2 text-red-400" />
                      <p className="text-sm mb-3">{cameraError}</p>
                      <div className="space-y-2">
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          onClick={retryCamera}
                          className="bg-white text-black hover:bg-gray-200 w-full"
                        >
                          Reintentar
                        </Button>
                        <p className="text-xs text-gray-300">
                          Asegúrate de permitir el acceso a la cámara cuando tu navegador lo solicite
                        </p>
                      </div>
                    </div>
                  </div>
                ) : isScanning ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="text-white text-center">
                      <div className="animate-pulse mb-2">
                        <Camera className="h-8 w-8 mx-auto" />
                      </div>
                      <p>Apunta la cámara al código QR</p>
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
                    <div className="text-white text-center">
                      <Camera className="h-8 w-8 mx-auto mb-2" />
                      <p>Iniciando cámara...</p>
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
                Confirmar Llegada
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};