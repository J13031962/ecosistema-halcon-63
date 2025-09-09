import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Plus, Clock, Calendar } from 'lucide-react';
import { FormularioNuevoPersonal } from '@/components/personal/FormularioNuevoPersonal';
import { GeneradorTurnos } from '@/components/personal/GeneradorTurnos';
import { CalendarioTurnos } from '@/components/personal/CalendarioTurnos';
import { generarTurnosAutomaticos } from '@/components/personal/TurnosCalculadorHoras';
import { toast } from 'sonner';

const Personal = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isTurnosOpen, setIsTurnosOpen] = useState(false);
  const [turnosGenerados, setTurnosGenerados] = useState<any[]>([]);
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  
  // Datos de ejemplo del personal
  const [personal] = useState([
    { id: '1', nombres: 'Juan Carlos', apellidos: 'Pérez García', cargo: 'operador' },
    { id: '2', nombres: 'María Elena', apellidos: 'Rodríguez López', cargo: 'operador' },
    { id: '3', nombres: 'Carlos Alberto', apellidos: 'González Ruiz', cargo: 'operador' },
    { id: '4', nombres: 'Ana Sofia', apellidos: 'Martínez Vega', cargo: 'supervisor' },
  ]);

  const handleSubmitPersonal = async (data: any) => {
    console.log('Datos del personal:', data);
    // Aquí se implementará la lógica para guardar en la base de datos
    toast.success('Personal registrado exitosamente');
  };

  const handleGenerarTurnos = async (data: any) => {
    console.log('Generando turnos con:', data);
    
    try {
      // Si viene del nuevo GeneradorTurnos, usar los turnos directamente
      if (data.turnos && Array.isArray(data.turnos)) {
        const turnosConNombres = data.turnos.map((turno: any) => ({
          ...turno,
          operador_nombre: turno.operador_nombre || 'Operador'
        }));
        
        setTurnosGenerados(turnosConNombres);
        toast.success(`${turnosConNombres.length} turnos generados exitosamente`);
        return;
      }

      // Código anterior para compatibilidad con otros generadores
      if (!data.personal_asignado || !Array.isArray(data.personal_asignado)) {
        toast.error('No se especificó personal asignado');
        return;
      }

      // Obtener nombres de operadores
      const operadoresConNombres = data.personal_asignado.map((id: string) => {
        const operador = personal.find(p => p.id === id);
        return {
          id,
          nombre: operador ? `${operador.nombres} ${operador.apellidos}` : 'Operador'
        };
      });
      
      // Generar turnos automáticamente (función anterior)
      const turnosNuevos = generarTurnosAutomaticos(
        data.fecha_inicio,
        data.duracion_dias,
        data.personal_asignado,
        {
          turno_diurno_inicio: data.turno_diurno_inicio,
          turno_diurno_fin: data.turno_diurno_fin,
          turno_nocturno_inicio: data.turno_nocturno_inicio,
          turno_nocturno_fin: data.turno_nocturno_fin
        }
      );
      
      // Agregar nombres a los turnos
      const turnosConNombres = turnosNuevos.map(turno => ({
        ...turno,
        operador_nombre: operadoresConNombres.find(op => op.id === turno.operador_id)?.nombre || 'Operador'
      }));
      
      setTurnosGenerados(turnosConNombres);
      toast.success(`${turnosNuevos.length} turnos generados exitosamente`);
    } catch (error) {
      console.error('Error en handleGenerarTurnos:', error);
      toast.error('Error al generar los turnos');
    }
  };

  const handleEditTurno = (turno: any) => {
    console.log('Editando turno:', turno);
    toast.info('Función de edición en desarrollo');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            PERSONAL
          </h1>
          <p className="text-muted-foreground">
            Gestión de personal y recursos humanos
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsTurnosOpen(true)} variant="outline">
            <Clock className="h-4 w-4 mr-2" />
            Generar Turnos
          </Button>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Ingresar Personal
          </Button>
        </div>
      </div>

      {/* Vista de turnos generados */}
      {turnosGenerados.length > 0 ? (
        <CalendarioTurnos
          turnos={turnosGenerados}
          onEditTurno={handleEditTurno}
          selectedWeek={selectedWeek}
          onWeekChange={setSelectedWeek}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Gestión de Personal
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Registrar Nuevo Personal</h3>
              <p className="text-muted-foreground mb-4">
                Comienza registrando el personal de la empresa
              </p>
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Ingresar Personal
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Sistema de Turnos
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center py-8">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Generar Turnos Automáticamente</h3>
              <p className="text-muted-foreground mb-4">
                Crea horarios flexibles con cálculo automático de horas
              </p>
              <Button onClick={() => setIsTurnosOpen(true)} variant="outline">
                <Clock className="h-4 w-4 mr-2" />
                Generar Turnos
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Personal registrado */}
      {personal.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Personal Registrado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {personal.map((persona) => (
                <div key={persona.id} className="p-4 border rounded-lg">
                  <h4 className="font-medium">{persona.nombres} {persona.apellidos}</h4>
                  <p className="text-sm text-muted-foreground capitalize">{persona.cargo}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <FormularioNuevoPersonal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSubmitPersonal}
      />

      <GeneradorTurnos
        isOpen={isTurnosOpen}
        onClose={() => setIsTurnosOpen(false)}
        onGenerate={handleGenerarTurnos}
        personal={personal}
      />
    </div>
  );
};

export default Personal;