import { supabase } from '@/integrations/supabase/client';

interface NewOperator {
  email: string;
  password: string;
  fullName: string;
}

const newOperators: NewOperator[] = [
  {
    email: 'luis.perez@teleguardia.com',
    password: 'Perez2025*',
    fullName: 'Luis Perez'
  },
  {
    email: 'jaime.alvarez@teleguardia.com',
    password: 'Alvarez2025*',
    fullName: 'Jaime Alvarez'
  },
  {
    email: 'carlos.betancur@teleguardia.com',
    password: 'Betancur2025*',
    fullName: 'Carlos Betancur'
  }
];

export const createNewOperators = async () => {
  console.log('Creando nuevos operadores...');
  
  for (const operator of newOperators) {
    try {
      console.log(`Creando operador: ${operator.email}`);
      
      // Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: operator.email,
        password: operator.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: operator.fullName
          }
        }
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          console.log(`Operador ${operator.email} ya existe`);
          continue;
        }
        throw authError;
      }

      if (authData.user) {
        console.log(`Operador ${operator.email} creado exitosamente`);
        
        // Wait for trigger to create profile
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Update profile with full name
        await supabase
          .from('profiles')
          .update({
            full_name: operator.fullName
          })
          .eq('user_id', authData.user.id);

        // Assign operador_alarmas role
        await supabase
          .from('user_roles')
          .insert({
            user_id: authData.user.id,
            role: 'operador_alarmas' as any
          });
        
        console.log(`Rol operador_alarmas asignado a ${operator.email}`);
      }
    } catch (error) {
      console.error(`Error creando operador ${operator.email}:`, error);
    }
  }
  
  console.log('Proceso de creación de operadores completado');
};