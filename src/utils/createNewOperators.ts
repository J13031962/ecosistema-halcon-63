import { supabase } from '@/integrations/supabase/client';

interface TestUser {
  email: string;
  password: string;
  fullName: string;
  role: string;
}

const newOperators: TestUser[] = [
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

export const createNewOperators = async () => {
  console.log('Creando nuevos operadores...');
  
  for (const user of newOperators) {
    try {
      console.log(`Creando usuario: ${user.email}`);
      
      // Create user using Edge Function
      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: {
          email: user.email,
          password: user.password,
          fullName: user.fullName,
          role: user.role
        }
      });

      if (error) {
        console.error(`Error creating user ${user.email}:`, error);
        continue;
      }

      if (!data?.success) {
        if (data?.error?.includes('already registered') || data?.error?.includes('User already registered')) {
          console.log(`Usuario ${user.email} ya existe`);
          continue;
        }
        console.error(`Error creating user ${user.email}:`, data?.error);
        continue;
      }

      console.log(`Usuario ${user.email} creado exitosamente con rol ${user.role}`);
    } catch (error) {
      console.error(`Error creando usuario ${user.email}:`, error);
    }
  }
  
  console.log('Proceso de creación de operadores completado');
};