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
      
      // Get all profiles (both active and inactive)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, numero_documento, foto_url, active, last_login, created_at')
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
      console.log('🚀 Iniciando creación de usuario con Edge Function:', userData.email);
      
      // Usar Edge Function para crear el usuario sin afectar la sesión
      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: {
          email: userData.email,
          password: userData.password,
          fullName: userData.fullName,
          role: userData.role,
          numeroDocumento: userData.numeroDocumento,
          fotoUrl: userData.fotoUrl
        }
      });

      if (error) {
        console.error('❌ Error en Edge Function:', error);
        throw error;
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Error desconocido al crear usuario');
      }

      console.log('✅ Usuario creado exitosamente sin cambiar sesión');

      toast({
        title: "Usuario creado",
        description: `Usuario ${userData.email} creado exitosamente con rol ${userData.role}`,
      });

      await fetchUsers();
      return { success: true };
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
      console.log('🗑️ Eliminando usuario completamente:', { userId, email });
      
      // Use Edge Function to completely delete the user
      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: {
          action: 'delete',
          userId,
          email
        }
      });

      if (error) {
        console.error('❌ Error en Edge Function:', error);
        throw error;
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Error desconocido al eliminar usuario');
      }

      console.log('✅ Usuario eliminado completamente del sistema');

      toast({
        title: "Usuario eliminado",
        description: `${email} ha sido eliminado permanentemente del sistema`,
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