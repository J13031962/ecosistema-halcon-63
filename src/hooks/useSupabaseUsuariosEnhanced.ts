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
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          user_roles (
            role
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers((data as any) || []);
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
      // En lugar de eliminar completamente, desactivamos el usuario
      const result = await updateUserActive(userId, false);
      
      if (result.success) {
        toast.success('Usuario desactivado exitosamente');
        return { success: true };
      }
      
      return result;
    } catch (error) {
      console.error('Error deactivating user:', error);
      toast.error('Error al desactivar usuario');
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