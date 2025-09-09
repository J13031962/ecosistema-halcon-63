import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Plus, Clock, Calendar, Download, Edit2 } from 'lucide-react';
import { FormularioNuevoPersonal } from '@/components/personal/FormularioNuevoPersonal';
import { GeneradorTurnos } from '@/components/personal/GeneradorTurnos';
import { CalendarioTurnos } from '@/components/personal/CalendarioTurnos';
import { generarTurnosAutomaticos, calcularHorasTurno, esDomingo as esDomingoUtil, esFeriado as esFeriadoUtil } from '@/components/personal/TurnosCalculadorHoras';
import { useSupabaseTurnos } from '@/hooks/useSupabaseTurnos';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const Personal = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isTurnosOpen, setIsTurnosOpen] = useState(false);
  const [turnosGenerados, setTurnosGenerados] = useState<any[]>([]);
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedDateTurnos, setSelectedDateTurnos] = useState<{fecha: Date, turnos: any[]}>({fecha: new Date(), turnos: []});
  const [newTurno, setNewTurno] = useState({ operador_id: '', tipo: '' });
  const [selectedDate, setSelectedDate] = useState('');

  // Hook para manejar turnos en Supabase
  const { addTurnoOperador, addTurnoSupervisor } = useSupabaseTurnos();
  
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
        const turnosRecalculados = data.turnos.map((t: any) => {
          const fecha = t?.fecha instanceof Date ? t.fecha : new Date(t?.fecha);
          const es_domingo_calc = esDomingoUtil(fecha);
          const es_feriado_calc = esFeriadoUtil(fecha);

          const calculo = calcularHorasTurno({
            fecha,
            hora_inicio: t.hora_inicio,
            hora_fin: t.hora_fin,
            es_domingo: es_domingo_calc,
            es_feriado: es_feriado_calc,
          });

          return {
            ...t,
            fecha,
            es_domingo: es_domingo_calc,
            es_feriado: es_feriado_calc,
            horas_diurnas: calculo.horas_diurnas,
            horas_nocturnas: calculo.horas_nocturnas,
            horas_domingo: calculo.horas_domingo,
            horas_feriado: calculo.horas_feriado,
            horas_diurnas_ordinarias: calculo.horas_diurnas_ordinarias,
            horas_nocturnas_ordinarias: calculo.horas_nocturnas_ordinarias,
            horas_diurnas_dominicales: calculo.horas_diurnas_dominicales,
            horas_nocturnas_dominicales: calculo.horas_nocturnas_dominicales,
            horas_extras: calculo.horas_extras,
            total_horas: calculo.total_horas,
          };
        });
        setTurnosGenerados(turnosRecalculados);
        
        // Guardar turnos en la base de datos
        guardarTurnosEnBD(turnosRecalculados);
        
        toast.success(`${turnosRecalculados.length} turnos generados y guardados exitosamente`);
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
      
      // Guardar turnos en la base de datos
      guardarTurnosEnBD(turnosConNombres);
      
      toast.success(`${turnosNuevos.length} turnos generados y guardados exitosamente`);
    } catch (error) {
      console.error('Error en handleGenerarTurnos:', error);
      toast.error('Error al generar los turnos');
    }
  };

  const handleEditTurno = (turno: any) => {
    console.log('Editando turno:', turno);
    toast.info('Función de edición en desarrollo');
  };

  // Tipos de turnos disponibles con sus horarios
  const tiposTurnos = [
    { label: 'Sin asignar', value: 'sin_asignar', horas: '00:00-00:00', tipo: 'descanso' },
    { label: 'Descanso', value: 'descanso', horas: '00:00-00:00', tipo: 'descanso' },
    { label: 'Día (06:00-18:00)', value: 'dia_completo', horas: '06:00-18:00', tipo: 'diurno' },
    { label: 'Mañana (06:00-14:00)', value: 'manana', horas: '06:00-14:00', tipo: 'diurno' },
    { label: 'Tarde (14:00-22:00)', value: 'tarde', horas: '14:00-22:00', tipo: 'diurno' },
    { label: 'Noche (18:00-06:00)', value: 'noche', horas: '18:00-06:00', tipo: 'nocturno' },
    { label: 'Noche (22:00-06:00)', value: 'noche_tarde', horas: '22:00-06:00', tipo: 'nocturno' },
  ];

  const handleChangeTurno = (fecha: Date, turnosDelDia: any[]) => {
    setSelectedDate(fecha.toLocaleDateString());
    setNewTurno({ operador_id: '', tipo: '' });
    setIsEditDialogOpen(true);
  };

  const handleGuardarTurno = () => {
    if (!newTurno.operador_id || !newTurno.tipo) {
      toast.error('Por favor selecciona operador y tipo de turno');
      return;
    }

    const operador = personal.find(p => p.id === newTurno.operador_id);
    const tipoTurno = tiposTurnos.find(t => t.value === newTurno.tipo);
    
    if (!operador || !tipoTurno) {
      toast.error('Operador o tipo de turno no válido');
      return;
    }

    // Crear nuevo turno con cálculo real
    const [horaInicio, horaFin] = tipoTurno.horas.split('-');
    const fechaTurno = new Date(selectedDate);
    const es_domingo = esDomingoUtil(fechaTurno);
    const es_feriado = esFeriadoUtil(fechaTurno);

    const calculo = calcularHorasTurno({
      fecha: fechaTurno,
      hora_inicio: horaInicio,
      hora_fin: horaFin,
      es_domingo,
      es_feriado,
    });

    const nuevoTurno = {
      id: `turno_${Date.now()}`,
      fecha: fechaTurno,
      operador_id: newTurno.operador_id,
      operador_nombre: `${operador.nombres} ${operador.apellidos}`,
      hora_inicio: horaInicio,
      hora_fin: horaFin,
      tipo: tipoTurno.tipo,
      horas_diurnas: calculo.horas_diurnas,
      horas_nocturnas: calculo.horas_nocturnas,
      horas_domingo: calculo.horas_domingo,
      horas_feriado: calculo.horas_feriado,
      horas_diurnas_ordinarias: calculo.horas_diurnas_ordinarias,
      horas_nocturnas_ordinarias: calculo.horas_nocturnas_ordinarias,
      horas_diurnas_dominicales: calculo.horas_diurnas_dominicales,
      horas_nocturnas_dominicales: calculo.horas_nocturnas_dominicales,
      horas_extras: calculo.horas_extras,
      es_domingo,
      es_feriado,
      total_horas: calculo.total_horas,
    } as any;

    setTurnosGenerados(prev => [...prev, nuevoTurno]);
    
    // Guardar turno individual en la base de datos
    guardarTurnoIndividual(nuevoTurno);
    
    setIsEditDialogOpen(false);
    setNewTurno({ operador_id: '', tipo: '' });
    toast.success('Turno asignado y guardado exitosamente');
  };

  // Función para guardar turnos en la base de datos
  const guardarTurnosEnBD = async (turnos: any[]) => {
    try {
      for (const turno of turnos) {
        const operador = personal.find(p => p.id === turno.operador_id);
        if (operador && operador.cargo === 'operador') {
          await addTurnoOperador({
            fecha: turno.fecha.toISOString().split('T')[0], // Formato YYYY-MM-DD
            turno: `${turno.hora_inicio}-${turno.hora_fin}`,
            operador_id: turno.operador_id,
            operador_nombre: turno.operador_nombre,
            horario_inicio: turno.hora_inicio,
            horario_fin: turno.hora_fin
          });
        } else if (operador && operador.cargo === 'supervisor') {
          await addTurnoSupervisor({
            fecha: turno.fecha.toISOString().split('T')[0],
            turno: `${turno.hora_inicio}-${turno.hora_fin}`,
            supervisor_id: turno.operador_id,
            supervisor_nombre: turno.operador_nombre,
            horario_inicio: turno.hora_inicio,
            horario_fin: turno.hora_fin
          });
        }
      }
    } catch (error) {
      console.error('Error guardando turnos:', error);
      toast.error('Error al guardar algunos turnos en la base de datos');
    }
  };

  // Función para guardar un turno individual
  const guardarTurnoIndividual = async (turno: any) => {
    try {
      const operador = personal.find(p => p.id === turno.operador_id);
      if (operador && operador.cargo === 'operador') {
        await addTurnoOperador({
          fecha: turno.fecha.toISOString().split('T')[0],
          turno: `${turno.hora_inicio}-${turno.hora_fin}`,
          operador_id: turno.operador_id,
          operador_nombre: turno.operador_nombre,
          horario_inicio: turno.hora_inicio,
          horario_fin: turno.hora_fin
        });
      }
    } catch (error) {
      console.error('Error guardando turno individual:', error);
      toast.error('Error al guardar el turno en la base de datos');
    }
  };

  const downloadExcel = () => {
    const dataForExcel = turnosGenerados.map(turno => ({
      'Fecha': turno.fecha.toLocaleDateString(),
      'Operador': turno.operador_nombre,
      'Hora Inicio': turno.hora_inicio,
      'Hora Fin': turno.hora_fin,
      'Tipo': turno.tipo,
      'Horas Diurnas': turno.horas_diurnas,
      'Horas Nocturnas': turno.horas_nocturnas,
      'Es Domingo': turno.es_domingo ? 'Sí' : 'No',
      'Es Feriado': turno.es_feriado ? 'Sí' : 'No'
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Turnos');
    XLSX.writeFile(workbook, 'turnos-personal.xlsx');
    toast.success('Archivo Excel descargado');
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Reporte de Turnos de Personal', 20, 20);
    
    const tableData = turnosGenerados.map(turno => [
      turno.fecha.toLocaleDateString(),
      turno.operador_nombre,
      `${turno.hora_inicio}-${turno.hora_fin}`,
      turno.tipo,
      turno.horas_diurnas.toString(),
      turno.horas_nocturnas.toString()
    ]);

    (doc as any).autoTable({
      head: [['Fecha', 'Operador', 'Horario', 'Tipo', 'H. Diurnas', 'H. Nocturnas']],
      body: tableData,
      startY: 30,
      styles: { fontSize: 8 }
    });

    doc.save('turnos-personal.pdf');
    toast.success('Archivo PDF descargado');
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
          {turnosGenerados.length > 0 && (
            <>
              <Button onClick={downloadExcel} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Descargar Excel
              </Button>
              <Button onClick={downloadPDF} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Descargar PDF
              </Button>
            </>
          )}
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
          onChangeTurno={handleChangeTurno}
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

      {/* Modal de edición */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Asignar Turno - {selectedDate}</DialogTitle>
            <DialogDescription>
              Selecciona el operador y el tipo de turno para este día.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Operador:</label>
                <Select
                  value={newTurno.operador_id}
                  onValueChange={(value) => setNewTurno({ ...newTurno, operador_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar operador" />
                  </SelectTrigger>
                  <SelectContent>
                    {personal.filter(p => p.cargo === 'operador').map((operador) => (
                      <SelectItem key={operador.id} value={operador.id}>
                        {operador.nombres} {operador.apellidos}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Turno:</label>
                <Select
                  value={newTurno.tipo}
                  onValueChange={(value) => setNewTurno({ ...newTurno, tipo: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar turno" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposTurnos.filter(t => t.value !== 'sin_asignar').map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleGuardarTurno}>
                Guardar Cambios
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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