import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Plus, Clock, Calendar, Download, Edit2 } from 'lucide-react';
import { FormularioNuevoPersonal } from '@/components/personal/FormularioNuevoPersonal';
import { GeneradorTurnos } from '@/components/personal/GeneradorTurnos';
import { CalendarioTurnos } from '@/components/personal/CalendarioTurnos';
import { generarTurnosAutomaticos } from '@/components/personal/TurnosCalculadorHoras';
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
    // Crear una entrada para cada tipo de turno posible
    const turnosCompletos = tiposTurnos.map(tipoTurno => {
      const turnoExistente = turnosDelDia.find(t => 
        t.hora_inicio === tipoTurno.horas.split('-')[0] && 
        t.hora_fin === tipoTurno.horas.split('-')[1]
      );
      
      if (turnoExistente) {
        return turnoExistente;
      } else {
        // Crear un turno vacío para este tipo
        return {
          id: `new_${tipoTurno.value}`,
          fecha: fecha,
          operador_id: '',
          operador_nombre: 'Sin asignar',
          hora_inicio: tipoTurno.horas.split('-')[0],
          hora_fin: tipoTurno.horas.split('-')[1],
          tipo: tipoTurno.tipo,
          horas_diurnas: tipoTurno.tipo === 'diurno' ? (tipoTurno.value === 'dia_completo' ? 12 : 8) : 0,
          horas_nocturnas: tipoTurno.tipo === 'nocturno' ? (tipoTurno.value === 'noche' ? 12 : 8) : 0,
          horas_domingo: 0,
          horas_feriado: 0,
          es_domingo: fecha.getDay() === 0,
          es_feriado: false,
          tipo_turno_label: tipoTurno.label
        };
      }
    });
    
    setSelectedDateTurnos({fecha, turnos: turnosCompletos});
    setIsEditDialogOpen(true);
  };

  const handleUpdateTurno = (turnoId: string, nuevoOperadorId: string, nuevoTipo: string) => {
    const nuevoOperador = personal.find(p => p.id === nuevoOperadorId);
    
    setTurnosGenerados(prev => prev.map(turno => {
      if (turno.id === turnoId) {
        return {
          ...turno,
          operador_id: nuevoOperadorId,
          operador_nombre: nuevoOperador ? `${nuevoOperador.nombres} ${nuevoOperador.apellidos}` : 'Operador',
          tipo: nuevoTipo
        };
      }
      return turno;
    }));
    
    setIsEditDialogOpen(false);
    toast.success('Turno actualizado exitosamente');
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="h-5 w-5" />
              Editar Turnos - {selectedDateTurnos.fecha.toLocaleDateString()}
            </DialogTitle>
            <DialogDescription>
              Cambia el operador o el tipo de cada turno. Debajo verás las horas diurnas, nocturnas y el total por turno.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedDateTurnos.turnos.map((turno, index) => (
              <div key={`${turno.hora_inicio}-${turno.hora_fin}-${index}`} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {turno.tipo_turno_label || `${turno.hora_inicio} - ${turno.hora_fin}`}
                  </span>
                  <span className="text-sm text-muted-foreground">{turno.tipo}</span>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="text-sm font-medium">Operador:</label>
                    <Select
                      value={turno.operador_id}
                      onValueChange={(value) => {
                        const operadorSeleccionado = personal.find(p => p.id === value);
                        const nuevosTurnos = selectedDateTurnos.turnos.map(t => 
                          t === turno 
                            ? { 
                                ...t, 
                                operador_id: value, 
                                operador_nombre: operadorSeleccionado ? `${operadorSeleccionado.nombres} ${operadorSeleccionado.apellidos}` : 'Sin asignar'
                              }
                            : t
                        );
                        setSelectedDateTurnos(prev => ({...prev, turnos: nuevosTurnos}));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar operador" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Sin asignar</SelectItem>
                        {personal.filter(p => p.cargo === 'operador').map((operador) => (
                          <SelectItem key={operador.id} value={operador.id}>
                            {operador.nombres} {operador.apellidos}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="rounded-md border p-2">
                    <div className="text-muted-foreground">H. Diurnas</div>
                    <div className="font-semibold">{Number(turno.horas_diurnas || 0).toFixed(2)}h</div>
                  </div>
                  <div className="rounded-md border p-2">
                    <div className="text-muted-foreground">H. Nocturnas</div>
                    <div className="font-semibold">{Number(turno.horas_nocturnas || 0).toFixed(2)}h</div>
                  </div>
                  <div className="rounded-md border p-2">
                    <div className="text-muted-foreground">Total</div>
                    <div className="font-semibold">{(Number(turno.horas_diurnas || 0) + Number(turno.horas_nocturnas || 0)).toFixed(2)}h</div>
                  </div>
                </div>
              </div>
            ))}
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