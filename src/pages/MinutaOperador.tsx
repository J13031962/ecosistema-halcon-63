import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle, FileText, Users, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseMinutaOperaciones } from '@/hooks/useSupabaseMinutaOperaciones';
import { useAuthConsolidated } from '@/hooks/useAuthConsolidated';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function MinutaOperador() {
  const { entradas, loading, addEntrada, refetch } = useSupabaseMinutaOperaciones();
  const { user } = useAuthConsolidated();
  const { toast } = useToast();
  
  const [nuevaEntrada, setNuevaEntrada] = useState({
    tipo_entrada: 'general' as 'general' | 'cambio_turno' | 'consigna' | 'incidente' | 'mantenimiento',
    contenido: '',
    turno: 'none',
    prioridad: 'normal' as 'normal' | 'alta' | 'critica'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nuevaEntrada.contenido.trim()) {
      toast({
        title: "Error",
        description: "El contenido de la entrada es requerido",
        variant: "destructive"
      });
      return;
    }

    try {
      await addEntrada(nuevaEntrada);
      setNuevaEntrada({
        tipo_entrada: 'general',
        contenido: '',
        turno: 'none',
        prioridad: 'normal'
      });
    } catch (error) {
      console.error('Error al agregar entrada:', error);
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'cambio_turno': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'consigna': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'incidente': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'mantenimiento': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case 'critica': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'alta': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      default: return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'cambio_turno': return 'Cambio de Turno';
      case 'consigna': return 'Consigna';
      case 'incidente': return 'Incidente';
      case 'mantenimiento': return 'Mantenimiento';
      default: return 'General';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Cargando minuta de operaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Minuta de Operador</h1>
          <p className="text-muted-foreground">
            Registro de eventos, cambios de turno y observaciones del turno
          </p>
        </div>
        <Button 
          onClick={refetch}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Actualizar
        </Button>
      </div>

      {/* Formulario para nueva entrada */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Nueva Entrada
          </CardTitle>
          <CardDescription>
            Registra eventos importantes del turno, cambios de puesto y observaciones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipo_entrada">Tipo de Entrada</Label>
                <Select 
                  value={nuevaEntrada.tipo_entrada} 
                  onValueChange={(value: any) => setNuevaEntrada(prev => ({ ...prev, tipo_entrada: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="cambio_turno">Cambio de Turno</SelectItem>
                    <SelectItem value="consigna">Consigna</SelectItem>
                    <SelectItem value="incidente">Incidente</SelectItem>
                    <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="turno">Turno (opcional)</Label>
                <Select 
                  value={nuevaEntrada.turno} 
                  onValueChange={(value) => setNuevaEntrada(prev => ({ ...prev, turno: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar turno" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin especificar</SelectItem>
                    <SelectItem value="mañana">Mañana (06:00 - 14:00)</SelectItem>
                    <SelectItem value="tarde">Tarde (14:00 - 22:00)</SelectItem>
                    <SelectItem value="noche">Noche (22:00 - 06:00)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="prioridad">Prioridad</Label>
                <Select 
                  value={nuevaEntrada.prioridad} 
                  onValueChange={(value: any) => setNuevaEntrada(prev => ({ ...prev, prioridad: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar prioridad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="critica">Crítica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contenido">Descripción del Evento</Label>
              <Textarea
                id="contenido"
                placeholder="Describe el evento, observación o cambio de turno..."
                value={nuevaEntrada.contenido}
                onChange={(e) => setNuevaEntrada(prev => ({ ...prev, contenido: e.target.value }))}
                className="min-h-[100px]"
                required
              />
            </div>

            <Button type="submit" className="w-full">
              <FileText className="h-4 w-4 mr-2" />
              Registrar Entrada
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Lista de entradas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Historial de Eventos ({entradas.length})
          </CardTitle>
          <CardDescription>
            Registro cronológico de todas las entradas del turno
          </CardDescription>
        </CardHeader>
        <CardContent>
          {entradas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay entradas registradas</p>
              <p className="text-sm">Agrega la primera entrada del turno</p>
            </div>
          ) : (
            <div className="space-y-4">
              {entradas.map((entrada) => (
                <div 
                  key={entrada.id} 
                  className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={getTipoColor(entrada.tipo_entrada)}>
                          {getTipoLabel(entrada.tipo_entrada)}
                        </Badge>
                        {entrada.prioridad !== 'normal' && (
                          <Badge className={getPrioridadColor(entrada.prioridad)}>
                            {entrada.prioridad.charAt(0).toUpperCase() + entrada.prioridad.slice(1)}
                          </Badge>
                        )}
                        {entrada.turno && (
                          <Badge variant="outline">
                            Turno: {entrada.turno}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {entrada.contenido}
                      </p>
                    </div>
                    <div className="text-right text-sm text-muted-foreground min-w-fit">
                      <div className="flex items-center gap-1 mb-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(entrada.created_at), 'HH:mm', { locale: es })}
                      </div>
                      <div>
                        {format(new Date(entrada.created_at), 'dd/MM/yyyy', { locale: es })}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <Users className="h-3 w-3" />
                        <span className="text-xs">{entrada.usuario_nombre}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}