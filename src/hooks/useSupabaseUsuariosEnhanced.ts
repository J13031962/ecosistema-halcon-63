import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserRole } from '@/types/auth';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  active: boolean;
  last_login?: string;
  created_at: string;
  foto_url?: string;
  numero_documento?: string;
  user_roles: { role: UserRole }[];
}

interface CreateUserData {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  numeroDocumento?: string;
  fotoUrl?: string;
}

export const useSupabaseUsuariosEnhanced = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // 1) Obtener IDs de usuarios con rol supervisor_motorizado evitando joins anidados
      const { data: supervisorRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .eq('role', 'supervisor_motorizado');

      if (rolesError) throw rolesError;

      const supervisorIds = (supervisorRoles || []).map((r: any) => r.user_id);

      // Si no hay supervisores, retornar lista vacía sin error
      if (supervisorIds.length === 0) {
        setUsers([]);
        return;
      }

      // 2) Cargar perfiles únicamente de esos IDs (sin relación anidada)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', supervisorIds)
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // 3) Adjuntar user_roles compatible para la UI
      const usersWithRoles = (profiles as any[]).map((p) => ({
        ...p,
        user_roles: [{ role: 'supervisor_motorizado' }],
      }));

      setUsers(usersWithRoles || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Error al cargar usuarios');
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

      toast.success('Usuario creado exitosamente');
      await fetchUsers();
      return { success: true };
    } catch (error: any) {
      console.error('Error creating user:', error);
      const errorMessage = error.message || 'Error al crear usuario';
      toast.error(errorMessage);
      return { success: false, error };
    }
  };

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      // Eliminar roles existentes
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      // Insertar nuevo rol
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: newRole
        });

      if (insertError) throw insertError;

      toast.success('Rol actualizado exitosamente');
      await fetchUsers();
      return { success: true };
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Error al actualizar rol');
      return { success: false, error };
    }
  };

  const updateUserActive = async (userId: string, active: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ active })
        .eq('id', userId);

      if (error) throw error;

      toast.success(`Usuario ${active ? 'activado' : 'desactivado'} exitosamente`);
      await fetchUsers();
      return { success: true };
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Error al actualizar estado del usuario');
      return { success: false, error };
    }
  };

  const toggleUserActive = async (userId: string, currentActive: boolean) => {
    return await updateUserActive(userId, !currentActive);
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

      toast.success('Usuario eliminado permanentemente del sistema');
      await fetchUsers();
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting user:', error);
      const errorMessage = error.message || 'Error al eliminar usuario';
      toast.error(errorMessage);
      return { success: false, error };
    }
  };

  const updateUserProfile = async (userId: string, profileData: Partial<{
    full_name: string;
    numero_documento: string;
    foto_url: string;
  }>) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', userId);

      if (error) throw error;

      toast.success('Perfil actualizado exitosamente');
      await fetchUsers();
      return { success: true };
    } catch (error) {
      console.error('Error updating user profile:', error);
      toast.error('Error al actualizar perfil');
      return { success: false, error };
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
    updateUserRole,
    updateUserActive,
    toggleUserActive,
    deleteUser,
    updateUserProfile
  };
};