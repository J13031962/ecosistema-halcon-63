import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Camera, MessageSquare, Image, Send, X, Eye } from 'lucide-react';
import { useSupabaseObservacionesSupervisor } from '@/hooks/useSupabaseObservacionesSupervisor';
import { useAuthConsolidated } from '@/hooks/useAuthConsolidated';
import { format } from 'date-fns';

interface SupervisorObservacionesCardProps {
  alarmaId: string;
  isActive: boolean; // Solo mostrar si está entre llegada y salida
}

export const SupervisorObservacionesCard = ({ alarmaId, isActive }: SupervisorObservacionesCardProps) => {
  const { user } = useAuthConsolidated();
  const { observaciones, loading, agregarObservacion, subirFoto } = useSupabaseObservacionesSupervisor(alarmaId);
  const [textoObservacion, setTextoObservacion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isActive) {
    return null;
  }

  const handleAgregarTexto = async () => {
    if (!textoObservacion.trim() || !user) return;

    try {
      setSubmitting(true);
      await agregarObservacion({
        alarma_id: alarmaId,
        supervisor_id: user.id,
        supervisor_nombre: user.full_name || user.email,
        observacion_texto: textoObservacion.trim(),
        tipo_observacion: 'texto'
      });
      setTextoObservacion('');
    } catch (error) {
      console.error('Error agregando observación:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSeleccionarFoto = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubirFoto = async () => {
    if (!selectedImage || !user) return;

    try {
      setSubmitting(true);
      const fotoUrl = await subirFoto(selectedImage, user.id);
      
      await agregarObservacion({
        alarma_id: alarmaId,
        supervisor_id: user.id,
        supervisor_nombre: user.full_name || user.email,
        foto_url: fotoUrl,
        observacion_texto: textoObservacion.trim() || undefined,
        tipo_observacion: textoObservacion.trim() ? 'mixta' : 'foto'
      });
      
      setTextoObservacion('');
      setSelectedImage(null);
      setPreviewImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error subiendo foto:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelarFoto = () => {
    setSelectedImage(null);
    setPreviewImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'foto': return <Image className="h-3 w-3" />;
      case 'mixta': return <Camera className="h-3 w-3" />;
      default: return <MessageSquare className="h-3 w-3" />;
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'foto': return 'bg-blue-100 text-blue-800';
      case 'mixta': return 'bg-purple-100 text-purple-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          Observaciones del Servicio
        </CardTitle>
        <CardDescription>
          Agrega observaciones de texto o fotografías durante el servicio
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Formulario para agregar observación */}
        <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
          <div className="space-y-2">
            <Textarea
              placeholder="Escribe una observación sobre el servicio..."
              value={textoObservacion}
              onChange={(e) => setTextoObservacion(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Preview de imagen seleccionada */}
          {previewImage && (
            <div className="relative inline-block">
              <img 
                src={previewImage} 
                alt="Preview" 
                className="max-w-32 max-h-32 rounded-lg border"
              />
              <Button
                size="sm"
                variant="destructive"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                onClick={handleCancelarFoto}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSeleccionarFoto}
              disabled={submitting}
            >
              <Camera className="h-4 w-4 mr-2" />
              Foto
            </Button>
            
            {selectedImage ? (
              <Button
                onClick={handleSubirFoto}
                disabled={submitting}
                size="sm"
              >
                <Send className="h-4 w-4 mr-2" />
                Subir
              </Button>
            ) : (
              <Button
                onClick={handleAgregarTexto}
                disabled={!textoObservacion.trim() || submitting}
                size="sm"
              >
                <Send className="h-4 w-4 mr-2" />
                Enviar
              </Button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Lista de observaciones */}
        {loading ? (
          <div className="text-center py-4 text-muted-foreground">
            Cargando observaciones...
          </div>
        ) : observaciones.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No hay observaciones aún</p>
            <p className="text-sm">Agrega observaciones para documentar el servicio</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {observaciones.map((obs) => (
              <div key={obs.id} className="p-3 border rounded-lg bg-background">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge className={getTipoColor(obs.tipo_observacion)}>
                        {getTipoIcon(obs.tipo_observacion)}
                        <span className="ml-1 capitalize">{obs.tipo_observacion}</span>
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(obs.created_at), 'HH:mm:ss')}
                      </span>
                    </div>
                    
                    {obs.observacion_texto && (
                      <p className="text-sm">{obs.observacion_texto}</p>
                    )}
                    
                    {obs.foto_url && (
                      <div className="flex items-center gap-2">
                        <img 
                          src={obs.foto_url} 
                          alt="Observación" 
                          className="max-w-24 max-h-24 rounded border cursor-pointer hover:opacity-80"
                          onClick={() => window.open(obs.foto_url, '_blank')}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(obs.foto_url, '_blank')}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};