import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { UserRole, User } from '@/types/auth';
import { useToast } from '@/hooks/use-toast';

interface AuthContextEnhancedType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  hasPermission: (permission: string) => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContextEnhanced = createContext<AuthContextEnhancedType | undefined>(undefined);

export const useAuthEnhanced = () => {
  const context = useContext(AuthContextEnhanced);
  if (context === undefined) {
    throw new Error('useAuthEnhanced must be used within an AuthProviderEnhanced');
  }
  return context;
};

export const useAuthEnhancedHook = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const { toast } = useToast();

  const isAuthenticated = !!session && !!user;

  const fetchUserData = async (supabaseUser: SupabaseUser): Promise<User | null> => {
    try {
      // Obtener perfil del usuario
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (profileError) throw profileError;

      // Obtener roles del usuario
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', supabaseUser.id);

      if (rolesError) throw rolesError;

      // Obtener permisos del usuario
      const { data: permissions, error: permissionsError } = await supabase
        .from('user_permissions')
        .select('function_key')
        .eq('user_id', supabaseUser.id);

      if (permissionsError) throw permissionsError;

      // Obtener permisos adicionales
      const { data: additionalPerms, error: additionalPermsError } = await supabase
        .from('user_additional_permissions')
        .select('permission_name, permission_description')
        .eq('user_id', supabaseUser.id);

      if (additionalPermsError) console.error('Error fetching additional permissions:', additionalPermsError);

      setUserPermissions(permissions?.map(p => p.function_key) || []);

      const roles = userRoles?.map(ur => ur.role as UserRole) || [];
      const primaryRole = roles[0] || 'operador_alarmas';

      return {
        id: supabaseUser.id,
        username: profile.username || profile.email,
        password: '', // No almacenamos contraseñas
        role: primaryRole,
        roles: roles,
        fullName: profile.full_name || 'Usuario',
        active: profile.active,
        createdAt: new Date(profile.created_at),
        lastLogin: profile.last_login ? new Date(profile.last_login) : undefined,
        additionalPermissions: additionalPerms || [],
      };
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  };

  const refreshUser = async () => {
    if (session?.user) {
      const userData = await fetchUserData(session.user);
      setUser(userData);
    }
  };

  const login = async (identifier: string, password: string) => {
    try {
      setLoading(true);
      
      // Intentar login con email primero
      let result = await supabase.auth.signInWithPassword({
        email: identifier,
        password: password,
      });

      // Si falla y el identifier no es un email, buscar por username
      if (result.error && !identifier.includes('@')) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('username', identifier)
          .single();

        if (profile?.email) {
          result = await supabase.auth.signInWithPassword({
            email: profile.email,
            password: password,
          });
        }
      }

      if (result.error) {
        return { success: false, error: result.error.message };
      }

      // Actualizar last_login
      if (result.data.user) {
        await supabase
          .from('profiles')
          .update({ last_login: new Date().toISOString() })
          .eq('id', result.data.user.id);
      }

      toast({
        title: "Inicio de sesión exitoso",
        description: "Bienvenido al sistema HALCON",
      });

      return { success: true };
    } catch (error: any) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setSession(null);
      setUserPermissions([]);
      
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión exitosamente",
      });
    } catch (error: any) {
      console.error('Logout error:', error);
      toast({
        title: "Error",
        description: "Error al cerrar sesión",
        variant: "destructive",
      });
    }
  };

  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (!user?.roles) return false;
    
    const targetRoles = Array.isArray(roles) ? roles : [roles];
    return targetRoles.some(role => user.roles?.includes(role));
  };

  const hasPermission = (permission: string): boolean => {
    return userPermissions.includes(permission);
  };

  // Auth state listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        // Set session synchronously
        setSession(session);
        
        if (event === 'SIGNED_IN' && session?.user) {
          // Defer user data fetching to avoid blocking
          setTimeout(() => {
            fetchUserData(session.user).then(userData => {
              setUser(userData);
              setLoading(false);
            });
          }, 0);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setUserPermissions([]);
          setLoading(false);
        } else if (event === 'TOKEN_REFRESHED' && session) {
          console.log('🔄 Token refreshed, maintaining session');
          // Don't set loading during token refresh
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserData(session.user).then(userData => {
          setUser(userData);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    user,
    session,
    isAuthenticated,
    loading,
    login,
    logout,
    hasRole,
    hasPermission,
    refreshUser,
  };
};

export { AuthContextEnhanced };