import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Plus, Clock, Calendar, Download, Edit2 } from 'lucide-react';
import { FormularioOperador } from '@/components/personal/FormularioOperador';
import { GeneradorTurnos } from '@/components/personal/GeneradorTurnos';
import { CalendarioTurnos } from '@/components/personal/CalendarioTurnos';
import { generarTurnosAutomaticos, calcularHorasTurno, esDomingo as esDomingoUtil, esFeriado as esFeriadoUtil } from '@/components/personal/TurnosCalculadorHoras';
import { useSupabaseTurnos } from '@/hooks/useSupabaseTurnos';
import { useSupabaseUsuarios } from '@/hooks/useSupabaseUsuarios';
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
  const { turnosOperador, addTurnoOperador, addTurnoSupervisor, refetch } = useSupabaseTurnos();
  
  // Hook para obtener usuarios reales de la BD
  const { users, loading: usersLoading, fetchUsers, createUser } = useSupabaseUsuarios();
  
  // Filtrar operadores reales de la BD que tienen rol operador_alarmas
  const personal = users
    .filter(user => user.user_roles?.some(role => role.role === 'operador_alarmas'))
    .map(user => ({
      id: user.id,
      nombres: user.full_name?.split(' ')[0] || 'Usuario',
      apellidos: user.full_name?.split(' ').slice(1).join(' ') || '',
      cargo: 'operador'
    }));
  
  // Adaptador: convierte turnos de BD al formato del calendario local
  const adaptarTurnosBD = (turnosBD: any[]) => {
    return (turnosBD || []).map((t) => ({
      id: t.id,
      fecha: new Date(t.fecha),
      operador_id: t.operador_id || '',
      operador_nombre: t.operador_nombre || 'Operador',
      hora_inicio: t.horario_inicio || (t.turno?.includes('18:00') ? '18:00' : '06:00'),
      hora_fin: t.horario_fin || (t.turno?.includes('06:00') ? '06:00' : '18:00'),
      tipo: (t.turno?.includes('18:00-06:00') || (t.horario_inicio === '18:00')) ? 'nocturno' : 'diurno',
      // Horas base si no vienen calculadas (el calendario requiere estos campos)
      horas_diurnas: ((t.horario_inicio || '').startsWith('06') ? 12 : 1),
      horas_nocturnas: ((t.horario_inicio || '').startsWith('18') ? 11 : 0),
      horas_domingo: 0,
      horas_feriado: 0,
      es_domingo: false,
      es_feriado: false,
      horas_diurnas_ordinarias: 0,
      horas_nocturnas_ordinarias: 0,
      horas_diurnas_dominicales: 0,
      horas_nocturnas_dominicales: 0,
      horas_extras: 0,
      total_horas: 12,
    }));
  };

  // Cargar usuarios al montar el componente
  useEffect(() => {
    fetchUsers();
  }, []);

  // Cargar turnos desde la BD para que el calendario persista
  useEffect(() => {
    if (turnosOperador && turnosOperador.length > 0) {
      const adaptados = adaptarTurnosBD(turnosOperador);
      setTurnosGenerados(adaptados);
    }
  }, [turnosOperador]);

  const handleSubmitPersonal = async (data: any) => {
    try {
      console.log('Creando nuevo operador:', data);
      
      // Crear email basado en nombres y apellidos
      const email = `${data.nombres.toLowerCase().replace(/\s+/g, '')}.${data.apellidos.toLowerCase().replace(/\s+/g, '')}@teleguardia.com`;
      
      // Crear usuario con rol de operador
      await createUser({
        email,
        password: data.numero_identificacion, // Usar número de identificación como password inicial
        fullName: `${data.nombres} ${data.apellidos}`,
        role: 'operador_alarmas',
        numeroDocumento: data.numero_identificacion
      });
      
      // Refrescar lista de usuarios
      await fetchUsers();
      
      toast.success(`Operador ${data.nombres} ${data.apellidos} creado exitosamente. Email: ${email}, Password inicial: ${data.numero_identificacion}`);
      setIsFormOpen(false);
    } catch (error: any) {
      console.error('Error al crear operador:', error);
      toast.error(`Error al crear el operador: ${error.message || 'Error desconocido'}`);
    }
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
    console.log('Guardando turnos en BD:', turnos);
    let ok = 0, fail = 0;
    for (const turno of turnos) {
      try {
        const operador = personal.find(p => p.id === turno.operador_id);
        console.log('Operador encontrado:', operador, 'para ID:', turno.operador_id);
        if (!operador) { fail++; continue; }

        if (operador.cargo === 'operador') {
          const turnoData = {
            fecha: turno.fecha.toISOString().split('T')[0], // YYYY-MM-DD
            turno: `${turno.hora_inicio}-${turno.hora_fin}`,
            operador_id: turno.operador_id,
            operador_nombre: turno.operador_nombre,
            horario_inicio: turno.hora_inicio,
            horario_fin: turno.hora_fin,
          };
          console.log('Datos del turno operador:', turnoData);
          await addTurnoOperador(turnoData);
          ok++;
        } else if (operador.cargo === 'supervisor') {
          const turnoData = {
            fecha: turno.fecha.toISOString().split('T')[0],
            turno: `${turno.hora_inicio}-${turno.hora_fin}`,
            supervisor_id: turno.operador_id,
            supervisor_nombre: turno.operador_nombre,
            horario_inicio: turno.hora_inicio,
            horario_fin: turno.hora_fin,
          };
          console.log('Datos del turno supervisor:', turnoData);
          await addTurnoSupervisor(turnoData);
          ok++;
        }
      } catch (e: any) {
        console.error('Fallo guardando turno:', e?.message || e);
        fail++;
      }
    }

    // Refrescar desde BD para que el calendario persista y se sincronice
    try {
      await refetch();
    } catch (e) {
      console.warn('No se pudo refetch turnos después de guardar');
    }

    if (ok > 0 && fail === 0) {
      toast.success('Todos los turnos guardados exitosamente');
    } else if (ok > 0 && fail > 0) {
      toast.info(`Se guardaron ${ok} turnos; ${fail} fallaron (ver consola)`);
    } else {
      toast.error('No se pudieron guardar los turnos. Asegúrate de estar autenticado.');
    }
  };

  // Función para guardar un turno individual
  const guardarTurnoIndividual = async (turno: any) => {
    try {
      console.log('Guardando turno individual:', turno);
      const operador = personal.find(p => p.id === turno.operador_id);
      
      if (operador && operador.cargo === 'operador') {
        const turnoData = {
          fecha: turno.fecha.toISOString().split('T')[0],
          turno: `${turno.hora_inicio}-${turno.hora_fin}`,
          operador_id: turno.operador_id,
          operador_nombre: turno.operador_nombre,
          horario_inicio: turno.hora_inicio,
          horario_fin: turno.hora_fin
        };
        console.log('Guardando turno individual con datos:', turnoData);
        
        await addTurnoOperador(turnoData);
        // Refrescar y sincronizar
        await refetch();
        toast.success(`Turno guardado para ${operador.nombres}`);
      }
    } catch (error: any) {
      console.error('Error guardando turno individual:', error);
      toast.error(`Error al guardar el turno: ${error.message || error}`);
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
    try {
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

      // Crear tabla manualmente sin autoTable
      let yPosition = 40;
      const lineHeight = 10;
      
      // Encabezados
      doc.setFontSize(10);
      doc.text('Fecha', 20, yPosition);
      doc.text('Operador', 50, yPosition);
      doc.text('Horario', 100, yPosition);
      doc.text('Tipo', 130, yPosition);
      doc.text('H. Diurnas', 150, yPosition);
      doc.text('H. Nocturnas', 180, yPosition);
      
      yPosition += lineHeight;
      
      // Datos
      tableData.forEach(row => {
        doc.text(row[0], 20, yPosition);
        doc.text(row[1], 50, yPosition);
        doc.text(row[2], 100, yPosition);
        doc.text(row[3], 130, yPosition);
        doc.text(row[4], 150, yPosition);
        doc.text(row[5], 180, yPosition);
        yPosition += lineHeight;
      });

      doc.save('turnos-personal.pdf');
      toast.success('Archivo PDF descargado');
    } catch (error) {
      console.error('Error generando PDF:', error);
      toast.error('Error al generar PDF');
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            GESTIÓN DE PERSONAL OPERADORES
          </h1>
          <p className="text-muted-foreground">
            Gestión de operadores y recursos humanos
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
            Ingresar Operador
          </Button>
        </div>
      </div>

      {/* Vista principal - siempre mostrar calendario si hay turnos */}
      {turnosGenerados.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Calendario de Turnos Generados
            </CardTitle>
            <CardDescription>
              Vista semanal de los turnos asignados al personal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CalendarioTurnos
              turnos={turnosGenerados}
              onEditTurno={handleEditTurno}
              selectedWeek={selectedWeek}
              onWeekChange={setSelectedWeek}
            />
          </CardContent>
        </Card>
      )}

      {/* Grid de información */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Personal Activo</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{personal.length}</div>
            <p className="text-xs text-muted-foreground">
              Operadores registrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Turnos Generados</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{turnosGenerados.length}</div>
            <p className="text-xs text-muted-foreground">
              Turnos asignados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Operadores con Turnos</CardTitle>
            <Edit2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(turnosGenerados.map(t => t.operador_id)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              Con horarios asignados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Modales */}
      <FormularioOperador
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