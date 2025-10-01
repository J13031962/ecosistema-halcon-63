import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseTurnos } from '@/hooks/useSupabaseTurnos';
import { Calendar as CalendarIcon, Clock, Users, Save } from 'lucide-react';
import { format, addDays, parseISO, isSunday } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface TurnoGenerado {
  id: string;
  fecha: string;
  supervisor_id: string;
  supervisor_nombre: string;
  turno: string;
  horario_inicio: string;
  horario_fin: string;
}

interface ConfiguracionTurnos {
  fechaInicio: Date;
  diasGenerar: number;
  supervisoresSeleccionados: string[];
  patronRotacion: string;
  generarDomingos: boolean;
}

let SUPERVISORES_DISPONIBLES: Array<{ id: string; nombre: string }> = [];

const TIPOS_TURNO = {
  dia: { 
    label: 'Día', 
    horario: '06:00-18:00', 
    inicio: '06:00', 
    fin: '18:00',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200' 
  },
  noche: { 
    label: 'Noche', 
    horario: '18:00-06:00', 
    inicio: '18:00', 
    fin: '06:00',
    color: 'bg-purple-100 text-purple-800 border-purple-200' 
  },
  descanso: { 
    label: 'Descanso', 
    horario: '---', 
    inicio: '', 
    fin: '',
    color: 'bg-gray-100 text-gray-600 border-gray-200' 
  }
};

const PATRONES_ROTACION = {
  '2-2-2': { 
    nombre: 'Patrón 2-2-2', 
    descripcion: '2 días, 2 noches, 2 descansos',
    ciclo: ['dia', 'dia', 'noche', 'noche', 'descanso', 'descanso']
  },
  '4-4-4': { 
    nombre: 'Patrón 4-4-4', 
    descripcion: '4 días trabajo, 4 descanso',
    ciclo: ['dia', 'dia', 'dia', 'dia', 'descanso', 'descanso', 'descanso', 'descanso']
  }
};

const DIAS_FESTIVOS_2025 = [
  '2025-01-01', '2025-01-06', '2025-03-24', '2025-04-17', '2025-04-18',
  '2025-05-01', '2025-06-02', '2025-06-23', '2025-06-30', '2025-07-20',
  '2025-08-07', '2025-08-18', '2025-10-13', '2025-11-03', '2025-11-17',
  '2025-12-08', '2025-12-25'
];

export function GeneradorTurnosSupervisores() {
  const { toast } = useToast();
  const { addTurnoSupervisor, turnosSupervisor, refetch } = useSupabaseTurnos();
  
  useEffect(() => {
    const loadSupervisores = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            id,
            full_name,
            email,
            user_roles!inner(role)
          `)
          .eq('user_roles.role', 'supervisor_motorizado')
          .eq('active', true)
          .order('full_name');

        if (error) throw error;

        if (data && data.length > 0) {
          SUPERVISORES_DISPONIBLES = data.map(sup => ({
            id: sup.id,
            nombre: sup.full_name || sup.email
          }));
        }
      } catch (error) {
        console.error('Error cargando supervisores:', error);
      }
    };

    loadSupervisores();
  }, []);
  
  const [configuracion, setConfiguracion] = useState<ConfiguracionTurnos>({
    fechaInicio: new Date(),
    diasGenerar: 14,
    supervisoresSeleccionados: [],
    patronRotacion: '2-2-2',
    generarDomingos: true
  });

  const [turnosGenerados, setTurnosGenerados] = useState<TurnoGenerado[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const esFestivo = (fecha: string) => DIAS_FESTIVOS_2025.includes(fecha);

  const generarTurnos = async () => {
    if (configuracion.supervisoresSeleccionados.length === 0) {
      toast({
        title: "Error",
        description: "Debe seleccionar al menos un supervisor",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const supervisoresSeleccionados = SUPERVISORES_DISPONIBLES.filter(sup => 
        configuracion.supervisoresSeleccionados.includes(sup.id)
      );
      
      const patron = PATRONES_ROTACION[configuracion.patronRotacion];
      const nuevosTurnos: TurnoGenerado[] = [];
      
      for (let dia = 0; dia < configuracion.diasGenerar; dia++) {
        const fecha = addDays(configuracion.fechaInicio, dia);
        const fechaStr = format(fecha, 'yyyy-MM-dd');
        const esDom = isSunday(fecha);
        const esFest = esFestivo(fechaStr);
        
        if ((esDom && !configuracion.generarDomingos) || esFest) {
          continue;
        }
        
        supervisoresSeleccionados.forEach((supervisor, supervisorIndex) => {
          let tipoTurno: string;
          
          if (supervisoresSeleccionados.length === 1) {
            const posicionPatron = dia % patron.ciclo.length;
            tipoTurno = patron.ciclo[posicionPatron];
          } else {
            const posicionCiclo = dia % 6;
            const cicloSupervisor = Math.floor(dia / 6);
            const supervisorRotado = (supervisorIndex + cicloSupervisor) % supervisoresSeleccionados.length;
            
            if (posicionCiclo < 2) {
              tipoTurno = supervisorRotado === 0 ? 'dia' : 'descanso';
            } else if (posicionCiclo < 4) {
              tipoTurno = supervisorRotado === 1 ? 'noche' : 'descanso';
            } else {
              tipoTurno = supervisorRotado >= 2 ? 'dia' : 'descanso';
            }
          }
          
          const turnoInfo = TIPOS_TURNO[tipoTurno];
          
          nuevosTurnos.push({
            id: `${supervisor.id}-${fechaStr}`,
            fecha: fechaStr,
            supervisor_id: supervisor.id,
            supervisor_nombre: supervisor.nombre,
            turno: tipoTurno,
            horario_inicio: turnoInfo.inicio,
            horario_fin: turnoInfo.fin
          });
        });
      }
      
      setTurnosGenerados(nuevosTurnos);
      
      toast({
        title: "Turnos generados exitosamente",
        description: `Se generaron ${nuevosTurnos.length} asignaciones de turnos`,
      });
      
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron generar los turnos",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const guardarTurnos = async () => {
    if (turnosGenerados.length === 0) {
      toast({
        title: "Error",
        description: "No hay turnos generados para guardar",
        variant: "destructive"
      });
      return;
    }

    const turnosParaGuardar = turnosGenerados.filter(turno => turno.turno !== 'descanso');
    
    if (turnosParaGuardar.length === 0) {
      toast({
        title: "Error",
        description: "No hay turnos válidos para guardar",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsGenerating(true);
      
      const turnosValidados = turnosParaGuardar.map((turno) => {
        const turnoMapeado = turno.turno === 'dia' ? 'diurno' : 
                            turno.turno === 'noche' ? 'nocturno' : turno.turno;
        
        return addTurnoSupervisor({
          fecha: turno.fecha,
          turno: turnoMapeado,
          supervisor_id: turno.supervisor_id,
          supervisor_nombre: turno.supervisor_nombre,
          horario_inicio: turno.horario_inicio,
          horario_fin: turno.horario_fin
        });
      });
      
      await Promise.all(turnosValidados);
      
      toast({
        title: "✅ Turnos guardados exitosamente",
        description: `Se guardaron ${turnosParaGuardar.length} turnos en la base de datos`,
      });
      
      setTurnosGenerados([]);
      setConfiguracion(prev => ({ ...prev, supervisoresSeleccionados: [] }));
      
      await refetch();
      
    } catch (error: any) {
      console.error('❌ Error al guardar turnos:', error);
      
      toast({
        title: "❌ Error al guardar turnos",
        description: error.message || "Error desconocido al guardar turnos",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Generador de Turnos para Supervisores
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Fecha de Inicio */}
          <div className="space-y-2">
            <Label>Fecha de Inicio</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(configuracion.fechaInicio, 'PPP', { locale: es })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={configuracion.fechaInicio}
                  onSelect={(date) => date && setConfiguracion({ ...configuracion, fechaInicio: date })}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Días a generar */}
          <div className="space-y-2">
            <Label>Días a generar</Label>
            <Input
              type="number"
              min="7"
              max="60"
              value={configuracion.diasGenerar}
              onChange={(e) => setConfiguracion({ ...configuracion, diasGenerar: parseInt(e.target.value) || 14 })}
            />
          </div>

          {/* Selección de Supervisores */}
          <div className="space-y-2">
            <Label>Supervisores ({configuracion.supervisoresSeleccionados.length} seleccionados)</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-md p-3">
              {SUPERVISORES_DISPONIBLES.map(supervisor => (
                <div key={supervisor.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={supervisor.id}
                    checked={configuracion.supervisoresSeleccionados.includes(supervisor.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setConfiguracion({
                          ...configuracion,
                          supervisoresSeleccionados: [...configuracion.supervisoresSeleccionados, supervisor.id]
                        });
                      } else {
                        setConfiguracion({
                          ...configuracion,
                          supervisoresSeleccionados: configuracion.supervisoresSeleccionados.filter(id => id !== supervisor.id)
                        });
                      }
                    }}
                  />
                  <label htmlFor={supervisor.id} className="text-sm cursor-pointer">
                    {supervisor.nombre}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Patrón de Rotación */}
          <div className="space-y-2">
            <Label>Patrón de Rotación</Label>
            <Select value={configuracion.patronRotacion} onValueChange={(value) => setConfiguracion({ ...configuracion, patronRotacion: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PATRONES_ROTACION).map(([key, patron]) => (
                  <SelectItem key={key} value={key}>
                    {patron.nombre} - {patron.descripcion}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Opciones */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="domingos"
                checked={configuracion.generarDomingos}
                onCheckedChange={(checked) => setConfiguracion({ ...configuracion, generarDomingos: !!checked })}
              />
              <label htmlFor="domingos" className="text-sm cursor-pointer">
                Generar turnos en domingos
              </label>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-2">
            <Button onClick={generarTurnos} disabled={isGenerating} className="flex-1">
              <Clock className="h-4 w-4 mr-2" />
              Generar Turnos
            </Button>
            {turnosGenerados.length > 0 && (
              <Button onClick={guardarTurnos} disabled={isGenerating} variant="default" className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                Guardar {turnosGenerados.filter(t => t.turno !== 'descanso').length} Turnos
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Vista previa de turnos generados */}
      {turnosGenerados.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Vista Previa - Turnos Generados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {SUPERVISORES_DISPONIBLES
                .filter(sup => configuracion.supervisoresSeleccionados.includes(sup.id))
                .map(supervisor => {
                  const turnosSupervisor = turnosGenerados.filter(t => t.supervisor_id === supervisor.id);
                  return (
                    <div key={supervisor.id} className="space-y-2">
                      <h4 className="font-medium">{supervisor.nombre}</h4>
                      <div className="grid grid-cols-7 gap-2">
                        {turnosSupervisor.slice(0, 14).map(turno => {
                          const tipoTurno = TIPOS_TURNO[turno.turno];
                          return (
                            <Badge key={turno.id} variant="outline" className={tipoTurno.color}>
                              {format(parseISO(turno.fecha), 'dd/MM')} - {tipoTurno.label}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
