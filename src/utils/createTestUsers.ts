import { supabase } from '@/integrations/supabase/client';

interface TestUser {
  email: string;
  password: string;
  fullName: string;
  role: string;
}

const testUsers: TestUser[] = [
  {
    email: 'operador@teleguardia.com',
    password: 'operador123',
    fullName: 'Operador Teleguardia',
    role: 'operador_alarmas'
  },
  {
    email: 'despachador@teleguardia.com',
    password: 'despachador123',
    fullName: 'Despachador Teleguardia',
    role: 'despachador_patrullas'
  },
  {
    email: 'tecnico@teleguardia.com',
    password: 'tecnico123',
    fullName: 'Técnico Teleguardia',
    role: 'tecnico'
  },
  {
    email: 'director@teleguardia.com',
    password: 'director123',
    fullName: 'Director Central',
    role: 'director'
  },
  {
    email: 'asesor@teleguardia.com',
    password: 'asesor123',
    fullName: 'Asesor de Ventas',
    role: 'asesor_ventas'
  },
  {
    email: 'luis.perez@teleguardia.com',
    password: 'Perez2025*',
    fullName: 'Luis Perez',
    role: 'operador_alarmas'
  },
  {
    email: 'jaime.alvarez@teleguardia.com',
    password: 'Alvarez2025*',
    fullName: 'Jaime Alvarez',
    role: 'operador_alarmas'
  },
  {
    email: 'carlos.betancur@teleguardia.com',
    password: 'Betancur2025*',
    fullName: 'Carlos Betancur',
    role: 'operador_alarmas'
  }
];

export const createTestUsers = async () => {
  console.log('Creando usuarios de prueba...');
  
  for (const user of testUsers) {
    try {
      console.log(`Creando usuario: ${user.email}`);
      
      // Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: user.email,
        password: user.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: user.fullName
          }
        }
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          console.log(`Usuario ${user.email} ya existe`);
          continue;
        }
        throw authError;
      }

      if (authData.user) {
        console.log(`Usuario ${user.email} creado exitosamente`);
        
        // Wait for trigger to create profile
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Update profile with full name
        await supabase
          .from('profiles')
          .update({
            full_name: user.fullName
          })
          .eq('user_id', authData.user.id);

        // Update role if not default
        if (user.role !== 'operador_alarmas') {
          // Delete default role
          await supabase
            .from('user_roles')
            .delete()
            .eq('user_id', authData.user.id);
            
          // Insert correct role
          await supabase
            .from('user_roles')
            .insert({
              user_id: authData.user.id,
              role: user.role as any
            });
        }
        
        console.log(`Rol ${user.role} asignado a ${user.email}`);
      }
    } catch (error) {
      console.error(`Error creando usuario ${user.email}:`, error);
    }
  }
  
  console.log('Proceso de creación de usuarios completado');
};