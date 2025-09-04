import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthContextType, UserRole } from '@/types/auth';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setLoading(true);
        
        if (session?.user) {
          // Defer the async operations to avoid blocking the auth state change
      setTimeout(async () => {
        try {
          // Fetch user profile and roles using id field consistently  
          console.log('🔍 Fetching profile for user:', session.user.id);
          
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)  // Usar 'id' ya que profiles.id = auth.users.id
            .maybeSingle();
            
          if (profileError) {
            console.error('❌ Error fetching profile:', profileError);
          }
            
          const { data: userRoles, error: rolesError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id);  // user_roles.user_id = auth.users.id
            
          if (rolesError) {
            console.error('❌ Error fetching roles:', rolesError);
          }
            
          // Fetch additional permissions
          const { data: additionalPermissions } = await supabase
            .from('user_additional_permissions')
            .select('permission_name, permission_description')
            .eq('user_id', session.user.id);
            
          if (profile && !profileError) {
            // DETERMINAR ROL PRINCIPAL BASADO EN LA BASE DE DATOS
            const primaryRole = (userRoles?.[0]?.role as UserRole) || 'operador_alarmas';
            const allRoles = (userRoles?.map(r => r.role as UserRole)) || ['operador_alarmas'];
            
            console.log('🎯 ROL PRINCIPAL DETERMINADO:', primaryRole);
            console.log('📋 TODOS LOS ROLES:', allRoles);
            
            const userData: User = {
              id: session.user.id,
              username: profile.username || profile.email,
              password: '',
              role: primaryRole, // USAR ROL DE LA BASE DE DATOS, NO HARDCODEADO
              roles: allRoles, // USAR ROLES DE LA BASE DE DATOS
              fullName: profile.full_name || session.user.user_metadata?.full_name || 'Usuario',
              active: profile.active !== false,
              createdAt: new Date(profile.created_at),
              lastLogin: profile.last_login ? new Date(profile.last_login) : undefined,
              fotoUrl: profile.foto_url,
              numeroDocumento: profile.numero_documento,
              additionalPermissions: additionalPermissions || []
            };
            
            console.log('✅ USUARIO FINAL CREADO CON ROL:', userData.role);
            console.log('🔍 DATOS USUARIO COMPLETOS:', JSON.stringify(userData, null, 2));
            
            setUser(userData);
            setIsAuthenticated(true);
          } else if (!profile && !profileError) {
            // No hay perfil para este usuario, crear uno básico
            console.log('Creando perfil para usuario sin perfil:', session.user.email);
            
            const userData: User = {
              id: session.user.id,
              username: session.user.email || 'usuario',
              password: '',
              role: 'operador_alarmas',
              roles: ['operador_alarmas'],
              fullName: session.user.user_metadata?.full_name || 'Usuario',
              active: true,
              createdAt: new Date(),
              lastLogin: new Date(),
              additionalPermissions: []
            };
            
            setUser(userData);
            setIsAuthenticated(true);
          } else {
            console.error('Error loading profile:', profileError);
            setUser(null);
            setIsAuthenticated(false);
          }
        } catch (error) {
          console.error('Error in auth state change:', error);
          setUser(null);
          setIsAuthenticated(false);
        } finally {
          setLoading(false);
        }
      }, 0);
        } else {
          setUser(null);
          setIsAuthenticated(false);
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (identifier: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      // Verificar credenciales en users_auth
      const { data: authData, error } = await supabase
        .from('users_auth')
        .select('*')
        .eq('email', identifier)
        .eq('password', password)
        .eq('active', true)
        .single();

      if (error || !authData) {
        console.error('Login error:', error);
        return false;
      }

      // Simular sesión exitosa estableciendo el usuario
      const mockUser = {
        id: authData.id,
        email: authData.email,
        user_metadata: { full_name: authData.full_name },
        role: authData.role
      };

      // Crear sesión simulada
      const mockSession = {
        user: mockUser,
        access_token: 'mock_token',
        refresh_token: 'mock_refresh',
        expires_in: 3600,
        token_type: 'bearer'
      };

      // Mapear rol a UserRole
      const userRoles: UserRole[] = [authData.role as UserRole];
      
      const userData: User = {
        id: authData.id,
        username: authData.email,
        password: '',
        role: authData.role as UserRole,
        roles: userRoles,
        fullName: authData.full_name,
        active: authData.active,
        createdAt: new Date(authData.created_at),
        lastLogin: new Date(),
        additionalPermissions: []
      };

      setUser(userData);
      setSession(mockSession as any);
      setIsAuthenticated(true);

      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      // Limpiar estado local
      setUser(null);
      setSession(null);
      setIsAuthenticated(false);
      // Redirigir a la página de login
      window.location.href = '/auth';
    } catch (error) {
      console.error('Logout error:', error);
      // Limpiar estado aunque haya error
      setUser(null);
      setSession(null);
      setIsAuthenticated(false);
      window.location.href = '/auth';
    }
  };

  const hasRole = (role: UserRole | UserRole[]): boolean => {
    if (!user || !user.roles) return false;
    
    if (Array.isArray(role)) {
      return role.some(r => user.roles?.includes(r));
    }
    
    return user.roles.includes(role);
  };

  const hasAdditionalPermission = (permission: string): boolean => {
    if (!user?.additionalPermissions) return false;
    return user.additionalPermissions.some(p => p.permission_name === permission);
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isAuthenticated,
    hasRole,
    hasAdditionalPermission,
    loading,
    userRole: user?.role,
    userPermissions: user?.additionalPermissions
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};