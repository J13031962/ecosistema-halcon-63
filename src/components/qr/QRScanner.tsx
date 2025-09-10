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
  const [isInitializing, setIsInitializing] = useState(false);

  // Limpiar scanner cuando se cierra el dialog
  useEffect(() => {
    if (!isOpen) {
      console.log('🔒 Dialog cerrado, limpiando scanner...');
      cleanupScanner();
      setScannedData(null);
      setCameraError(null);
      setIsInitializing(false);
    } else if (isOpen && videoRef.current && !isInitializing && !qrScanner) {
      console.log('🎯 Dialog abierto, iniciando proceso...');
      setIsInitializing(true);
      // Delay para asegurar que el DOM está listo
      setTimeout(() => {
        initializeCamera();
      }, 500);
    }
  }, [isOpen, qrScanner, isInitializing]);

  const cleanupScanner = () => {
    console.log('🧹 Limpiando scanner...');
    if (qrScanner) {
      try {
        qrScanner.stop();
        qrScanner.destroy();
      } catch (error) {
        console.warn('Warning cleaning up scanner:', error);
      }
      setQrScanner(null);
    }
    setIsScanning(false);
    setIsInitializing(false);
  };

  const initializeCamera = async () => {
    console.log('🎬 === INICIANDO PROCESO DE CÁMARA ===');
    
    if (!videoRef.current) {
      console.error('❌ Video element no disponible');
      setCameraError('Error: elemento de video no disponible');
      setIsInitializing(false);
      return;
    }

    try {
      setCameraError(null);
      
      console.log('🔍 Verificando cámaras disponibles...');
      
      // Verificar cámaras disponibles
      const hasCameras = await QrScanner.hasCamera();
      console.log('📹 Cámaras disponibles:', hasCameras);
      
      if (!hasCameras) {
        throw new Error('No hay cámaras disponibles en este dispositivo');
      }

      console.log('🎥 Creando instancia de QrScanner...');
      
      const scanner = new QrScanner(
        videoRef.current,
        (result) => {
          console.log('🎯 QR Code detectado:', result.data);
          
          try {
            const data = JSON.parse(result.data) as QRData;
            console.log('📄 Datos parseados:', data);
            
            if (data.id_cliente && data.coordenadas && data.nombre) {
              console.log('✅ QR válido detectado');
              setScannedData(data);
              setIsScanning(false);
              
              toast({
                title: "QR Escaneado",
                description: `Cliente: ${data.nombre} detectado`,
              });
            } else {
              console.warn('⚠️ QR con datos inválidos:', data);
              toast({
                title: "QR Inválido",
                description: "El código QR no contiene información válida",
                variant: "destructive"
              });
            }
          } catch (parseError) {
            console.error('❌ Error parsing QR data:', parseError);
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

      console.log('📱 Instancia creada, iniciando scanner...');
      setQrScanner(scanner);
      
      // Iniciar con timeout de seguridad
      const startPromise = scanner.start();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout: La cámara tardó demasiado en iniciar')), 15000)
      );
      
      await Promise.race([startPromise, timeoutPromise]);
      
      console.log('✅ ¡Scanner iniciado con éxito!');
      setIsScanning(true);
      setIsInitializing(false);
      
    } catch (error: any) {
      console.error('❌ Error inicializando cámara:', error);
      
      setIsScanning(false);
      setIsInitializing(false);
      cleanupScanner();
      
      // Manejo específico de errores
      let errorMessage = "Error desconocido al acceder a la cámara";
      
      if (error.name === 'NotAllowedError') {
        errorMessage = "Acceso a la cámara denegado. Por favor, permite el acceso en tu navegador.";
      } else if (error.name === 'NotFoundError') {
        errorMessage = "No se encontró ninguna cámara en tu dispositivo.";
      } else if (error.name === 'NotSupportedError') {
        errorMessage = "Tu navegador no soporta el acceso a la cámara.";
      } else if (error.name === 'NotReadableError') {
        errorMessage = "La cámara está siendo usada por otra aplicación.";
      } else if (error.message?.includes('Timeout')) {
        errorMessage = "La cámara tardó demasiado en responder. Intenta nuevamente.";
      } else if (error.message?.includes('HTTPS')) {
        errorMessage = "Se requiere conexión segura (HTTPS) para usar la cámara.";
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
    setIsInitializing(false);
    cleanupScanner();
    
    setTimeout(() => {
      if (videoRef.current) {
        setIsInitializing(true);
        initializeCamera();
      }
    }, 1000);
  };

  const handleClose = () => {
    console.log('🚪 Cerrando QR Scanner...');
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
                  ref={videoRef} 
                  className="w-full h-64 object-cover"
                  playsInline
                  muted
                  autoPlay
                />
                
                {/* Estado de carga/error */}
                {isInitializing && !cameraError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
                    <div className="text-white text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                      <p>Iniciando cámara...</p>
                      <p className="text-xs text-gray-300 mt-1">Puede tomar unos segundos</p>
                    </div>
                  </div>
                )}
                
                {/* Error de cámara */}
                {cameraError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
                    <div className="text-white text-center p-4 max-w-sm">
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
                          Asegúrate de permitir el acceso a la cámara
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Scanner activo */}
                {isScanning && !cameraError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                    <div className="text-white text-center">
                      <div className="animate-pulse mb-2">
                        <Camera className="h-8 w-8 mx-auto" />
                      </div>
                      <p>Apunta la cámara al código QR</p>
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
            // Datos escaneados
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
          
          {/* Botones */}
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