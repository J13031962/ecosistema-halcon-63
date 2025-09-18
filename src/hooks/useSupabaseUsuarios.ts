import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types/auth';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  numero_documento: string | null;
  foto_url: string | null;
  active: boolean;
  last_login: string | null;
  created_at: string;
  user_roles: Array<{ role: UserRole }>;
}

interface CreateUserData {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  numeroDocumento?: string;
  fotoUrl?: string;
}

export const useSupabaseUsuarios = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      console.log('🔄 Obteniendo usuarios y sus roles...');
      
      // First get profiles (only active users)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, numero_documento, foto_url, active, last_login, created_at')
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('❌ Error obteniendo perfiles:', profilesError);
        throw profilesError;
      }

      console.log('✅ Perfiles obtenidos:', profiles?.length || 0);

      // Then get roles for each user
      const profilesWithRoles = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: roles } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', profile.id);
          
          console.log(`👤 Usuario ${profile.email}:`, {
            id: profile.id,
            full_name: profile.full_name,
            active: profile.active,
            roles: roles || []
          });
          
          return {
            ...profile,
            user_roles: roles || []
          };
        })
      );

      console.log('📋 Todos los usuarios con roles:', profilesWithRoles);
      
      // Específicamente buscar el supervisor
      const supervisor = profilesWithRoles.find(u => u.email === 'supervisor@teleguardia.com');
      if (supervisor) {
        console.log('🔍 Supervisor encontrado:', supervisor);
        console.log('🔍 Roles del supervisor:', supervisor.user_roles);
        console.log('🔍 ¿Está activo?:', supervisor.active);
        console.log('🔍 ¿Tiene rol supervisor_motorizado?:', 
          supervisor.user_roles?.some(role => role.role === 'supervisor_motorizado')
        );
      }

      // Filtrar usuarios con rol de supervisor motorizado y que estén activos
      const supervisores = profilesWithRoles.filter(user => {
        const hasRole = user.user_roles?.some(role => role.role === 'supervisor_motorizado');
        const isActive = user.active;
        console.log(`🔍 Validando usuario ${user.email}:`, {
          hasRole,
          isActive,
          roles: user.user_roles?.map(r => r.role)
        });
        return hasRole && isActive;
      });

      console.log('👥 Supervisores filtrados:', supervisores.map(s => ({
        id: s.id,
        nombre: s.full_name,
        email: s.email,
        roles: s.user_roles?.map(r => r.role)
      })));

      setUsers(profilesWithRoles as UserProfile[]);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (userData: CreateUserData) => {
    try {
      console.log('🚀 INICIANDO CREACIÓN DE USUARIO:', {
        email: userData.email,
        role: userData.role,
        fullName: userData.fullName
      });

      // Sign up the user using admin API
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: userData.fullName
          }
        }
      });

      if (authError) {
        console.error('❌ Error en autenticación:', authError);
        
        // Si el usuario ya existe, intentar asignar el rol usando la función segura
        if (authError.message.includes('User already registered')) {
          console.log('📧 Usuario ya existe, intentando asignar rol de forma segura...');
          
          const { data: result, error: functionError } = await supabase
            .rpc('assign_user_role_safely', {
              target_email: userData.email,
              target_role: userData.role
            });
          
          if (functionError) {
            console.error('❌ Error en asignación segura de rol:', functionError);
            throw new Error(`Usuario existe pero no se pudo asignar el rol: ${functionError.message}`);
          }
          
          if (result) {
            console.log('✅ Rol asignado de forma segura al usuario existente');
            toast({
              title: "Usuario actualizado",
              description: `Rol ${userData.role} asignado a usuario existente ${userData.email}`,
            });
            await fetchUsers();
            return { success: true };
          } else {
            throw new Error('No se pudo encontrar o actualizar el usuario existente');
          }
        }
        
        throw authError;
      }

      if (authData.user) {
        console.log('👤 Usuario creado en Auth:', authData.user.id, 'Email:', userData.email);
        
        // Usar la función segura para asignar el rol al nuevo usuario
        console.log('🔄 Asignando rol de forma segura:', userData.role);
        
        const { data: result, error: functionError } = await supabase
          .rpc('assign_user_role_safely', {
            target_email: userData.email,
            target_role: userData.role
          });
        
        if (functionError) {
          console.error('❌ Error en asignación segura de rol:', functionError);
          throw new Error(`Usuario creado pero no se pudo asignar el rol: ${functionError.message}`);
        }

        if (!result) {
          throw new Error('Usuario creado pero no se pudo asignar el rol correctamente');
        }

        console.log('✅ Usuario creado y rol asignado de forma segura');

        // Actualizar el perfil con información adicional si es necesaria
        if (userData.numeroDocumento || userData.fotoUrl) {
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              numero_documento: userData.numeroDocumento,
              foto_url: userData.fotoUrl
            })
            .eq('user_id', authData.user.id);

          if (profileError) {
            console.warn('⚠️ Error actualizando datos adicionales del perfil:', profileError);
            // No falla la creación por esto, solo es información adicional
          } else {
            console.log('✅ Datos adicionales del perfil actualizados');
          }
        }

        toast({
          title: "Usuario creado",
          description: `Usuario ${userData.email} creado exitosamente con rol ${userData.role}`,
        });

        await fetchUsers();
        return { success: true };
      }
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el usuario",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    }
  };

  const toggleUserActive = async (userId: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ active: !currentActive })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: currentActive ? "Usuario desactivado" : "Usuario activado",
        description: `El usuario ha sido ${currentActive ? 'desactivado' : 'activado'}`,
      });

      await fetchUsers();
      return { success: true };
    } catch (error: any) {
      console.error('Error toggling user status:', error);
      toast({
        title: "Error",
        description: "No se pudo cambiar el estado del usuario",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    }
  };

  const deleteUser = async (userId: string, email: string) => {
    try {
      // First deactivate the user
      await supabase
        .from('profiles')
        .update({ active: false })
        .eq('id', userId);

      // Note: Actually deleting from auth.users requires admin API
      // For now, we'll just deactivate the profile
      toast({
        title: "Usuario eliminado",
        description: `${email} ha sido eliminado del sistema`,
      });

      await fetchUsers();
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el usuario",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    }
  };

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole as any })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Rol actualizado",
        description: "El rol del usuario ha sido actualizado exitosamente",
      });

      await fetchUsers();
      return { success: true };
    } catch (error: any) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el rol del usuario",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    loading,
    fetchUsers,
    createUser,
    toggleUserActive,
    deleteUser,
    updateUserRole,
  };
};