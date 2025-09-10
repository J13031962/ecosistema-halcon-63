import { supabase } from '@/integrations/supabase/client';

export const createTestTurnos = async () => {
  try {
    console.log('🔄 Creando turnos de prueba...');
    
    // Obtener usuarios operadores
    const { data: operadores, error: operadoresError } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        user_roles!inner(role)
      `)
      .eq('user_roles.role', 'operador_alarmas');

    if (operadoresError) throw operadoresError;
    
    console.log('👥 Operadores encontrados:', operadores);

    if (!operadores || operadores.length === 0) {
      throw new Error('No se encontraron operadores');
    }

    // Crear turnos para los próximos 7 días
    const fechaInicio = new Date();
    const turnosAPruebasParaLuis = [];

    for (let i = 0; i < 7; i++) {
      const fecha = new Date(fechaInicio);
      fecha.setDate(fecha.getDate() + i);
      
      // Buscar específicamente a Luis
      const luisOperador = operadores.find(op => 
        op.email?.includes('luis.perez') || 
        op.full_name?.toLowerCase().includes('luis')
      );

      if (luisOperador) {
        const tipoTurno = i % 3 === 0 ? 'mañana' : i % 3 === 1 ? 'tarde' : 'noche';
        const horarios = {
          'mañana': { inicio: '06:00', fin: '14:00' },
          'tarde': { inicio: '14:00', fin: '22:00' },
          'noche': { inicio: '22:00', fin: '06:00' }
        };

        turnosAPruebasParaLuis.push({
          fecha: fecha.toISOString().split('T')[0],
          turno: tipoTurno,
          operador_id: luisOperador.id,
          operador_nombre: luisOperador.full_name || luisOperador.email?.split('@')[0] || 'Luis Perez',
          horario_inicio: horarios[tipoTurno].inicio,
          horario_fin: horarios[tipoTurno].fin
        });
      }
    }

    console.log('📅 Turnos a insertar para Luis:', turnosAPruebasParaLuis);

    if (turnosAPruebasParaLuis.length > 0) {
      const { data: nuevosTurnos, error: turnosError } = await supabase
        .from('turnos_operador')
        .insert(turnosAPruebasParaLuis)
        .select();

      if (turnosError) throw turnosError;

      console.log('✅ Turnos creados exitosamente:', nuevosTurnos);
      return nuevosTurnos;
    } else {
      throw new Error('No se pudo encontrar a Luis para asignar turnos');
    }

  } catch (error: any) {
    console.error('❌ Error creando turnos:', error);
    throw error;
  }
};

// También crear función para limpiar turnos de prueba
export const cleanTestTurnos = async () => {
  try {
    const { error } = await supabase
      .from('turnos_operador')
      .delete()
      .gte('fecha', new Date().toISOString().split('T')[0]);

    if (error) throw error;
    console.log('🧹 Turnos de prueba eliminados');
  } catch (error: any) {
    console.error('❌ Error eliminando turnos:', error);
    throw error;
  }
};