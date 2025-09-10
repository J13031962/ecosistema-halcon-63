import { supabase } from '@/integrations/supabase/client';

export const testDirectInsert = async () => {
  try {
    console.log('🧪 Probando inserción directa en turnos_operador...');
    
    // Probar inserción directa
    const { data, error } = await supabase
      .from('turnos_operador')
      .insert([
        {
          fecha: '2025-01-10',
          turno: 'mañana',
          operador_id: '9b930af5-8967-4570-8642-47aff09a984f', // ID de Luis Perez
          operador_nombre: 'Luis Perez',
          horario_inicio: '06:00',
          horario_fin: '14:00'
        }
      ])
      .select();

    if (error) {
      console.error('❌ Error en inserción:', error);
      throw error;
    }

    console.log('✅ Inserción exitosa:', data);
    return data;
  } catch (error: any) {
    console.error('❌ Error en testDirectInsert:', error);
    throw error;
  }
};