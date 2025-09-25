import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';

interface ConsolidatedUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  active: boolean;
  auth_source: 'supabase_auth' | 'legacy_auth';
}

interface AuthContextConsolidated {
  user: ConsolidatedUser | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  hasRole: (role: string | string[]) => boolean;
  userRole: string | null;
}

export const useAuthConsolidated = (): AuthContextConsolidated => {
  const [user, setUser] = useState<ConsolidatedUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchConsolidatedUserData = useCallback(async (email: string): Promise<ConsolidatedUser | null> => {
    try {
      console.log('🔍 Fetching consolidated user data for:', email);
      
      // PRIMERO: Verificar en Supabase Auth y profiles con roles
      const { data: supabaseUser } = await supabase.auth.getUser();
      if (supabaseUser.user && supabaseUser.user.email === email) {
        // Obtener perfil y rol desde las tablas actualizadas
        const { data: profile } = await supabase
          .from('profiles')
          .select(`
            id,
            email,
            full_name,
            active,
            user_roles (role)
          `)
          .eq('email', email)
          .single();

        if (profile && profile.user_roles && profile.user_roles.length > 0) {
          const userData = {
            id: profile.id,
            email: profile.email,
            full_name: profile.full_name || profile.email,
            role: (profile.user_roles[0] as any)?.role || 'usuario',
            active: profile.active ?? true,
            auth_source: 'supabase_auth' as const
          };
          
          console.log('✅ Found Supabase user with profile and role:', userData);
          
          // VALIDAR QUE EL USUARIO ESTÉ ACTIVO
          if (!userData.active) {
            console.log('❌ User is inactive, blocking authentication');
            return null;
          }
          
          return userData;
        }
      }

      // FALLBACK: Buscar en users_auth (legacy) para usuarios que aún no migraron
      const { data: legacyData, error: legacyError } = await supabase
        .from('users_auth')
        .select('*')
        .eq('email', email)
        .eq('active', true)
        .single();

      if (!legacyError && legacyData) {
        const userData = {
          id: legacyData.id,
          email: legacyData.email,
          full_name: legacyData.full_name,
          role: legacyData.role,
          active: legacyData.active,
          auth_source: 'legacy_auth' as const
        };
        
        console.log('✅ Found legacy user:', userData);
        return userData;
      }

      console.log('❌ User not found in either system:', { email, legacyError });
      return null;
    } catch (error) {
      console.error('Error in fetchConsolidatedUserData:', error);
      return null;
    }
  }, []);

  const setupSession = useCallback(async (supabaseSession: Session | null) => {
    setSession(supabaseSession);
    
    if (supabaseSession?.user?.email) {
      const consolidatedUser = await fetchConsolidatedUserData(supabaseSession.user.email);
      setUser(consolidatedUser);
    } else {
      setUser(null);
    }
    
    setLoading(false);
  }, [fetchConsolidatedUserData]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('🔐 Intentando login con:', email);
      setLoading(true);
      
      // Primero intentar con Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('📊 Resultado Supabase Auth:', authData);
      console.log('❌ Error Supabase Auth:', authError);

      if (!authError && authData.session) {
        console.log('✅ Login exitoso con Supabase Auth');
        
        // Verificar que el usuario esté activo antes de permitir el login
        const consolidatedUser = await fetchConsolidatedUserData(email);
        if (!consolidatedUser || !consolidatedUser.active) {
          console.log('❌ User is inactive, signing out');
          await supabase.auth.signOut();
          setLoading(false);
          return false;
        }
        
        await setupSession(authData.session);
        return true;
      }

      // Si falla Supabase Auth, intentar con el sistema legacy
      console.log('🔄 Intentando con sistema legacy...');
      const { data: legacyUser, error: legacyError } = await supabase
        .from('users_auth')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .eq('active', true)
        .single();

      console.log('📊 Resultado legacy:', legacyUser);
      console.log('❌ Error legacy:', legacyError);

      if (!legacyError && legacyUser) {
        console.log('✅ Login exitoso con sistema legacy');
        // Crear una sesión simulada para el usuario legacy
        const consolidatedUser: ConsolidatedUser = {
          id: legacyUser.id,
          email: legacyUser.email,
          full_name: legacyUser.full_name,
          role: legacyUser.role,
          active: legacyUser.active,
          auth_source: 'legacy_auth'
        };
        
        setUser(consolidatedUser);
        setSession(null); // No hay sesión real de Supabase para usuarios legacy
        localStorage.setItem('teleguardia_user', JSON.stringify(consolidatedUser));
        setLoading(false);
        return true;
      }

      console.log('❌ Login falló en ambos sistemas');
      setLoading(false);
      return false;
    } catch (error) {
      console.error('❌ Error en login:', error);
      setLoading(false);
      return false;
    } finally {
      // NUEVO: Activar GPS automáticamente para supervisores después del login exitoso
      if (user?.role === 'supervisor_motorizado') {
        console.log('👨‍💼 Usuario supervisor detectado, activando GPS automáticamente...');
        
        // Pequeño delay para asegurar que el componente esté montado
        setTimeout(() => {
          // Disparar evento personalizado para que el hook de GPS se active
          window.dispatchEvent(new CustomEvent('supervisor-login', { 
            detail: { supervisorId: user.id } 
          }));
        }, 1000);
      }
    }
  };

  const logout = async (): Promise<void> => {
    try {
      if (session) {
        await supabase.auth.signOut();
      }
      
      setUser(null);
      setSession(null);
      localStorage.removeItem('teleguardia_user');
      navigate('/auth');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const hasRole = (role: string | string[]): boolean => {
    if (!user) return false;
    
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    
    return user.role === role;
  };

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const initializeAuth = async () => {
      try {
        console.log('🚀 Inicializando autenticación consolidada...');
        
        // Timeout de seguridad para evitar loading infinito
        timeoutId = setTimeout(() => {
          if (mounted) {
            console.warn('⏰ Auth initialization timeout - setting loading to false');
            setLoading(false);
          }
        }, 5000);

        // PRIMERO: Configurar listener para cambios de autenticación
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, supabaseSession) => {
            console.log('🔄 Auth state change:', event, 'Session:', supabaseSession);
            
            if (!mounted) return;
            
            // Configurar sesión sincrónicamente
            setSession(supabaseSession);
            
            if (event === 'SIGNED_IN' && supabaseSession) {
              console.log('✅ Usuario se logueó');
              // Defer user data fetching to avoid blocking
              setTimeout(() => {
                if (mounted && supabaseSession.user?.email) {
                  fetchConsolidatedUserData(supabaseSession.user.email).then(consolidatedUser => {
                    if (mounted) setUser(consolidatedUser);
                  });
                }
              }, 0);
            } else if (event === 'SIGNED_OUT') {
              console.log('🚪 Usuario se deslogueó');
              setUser(null);
              localStorage.removeItem('teleguardia_user');
            } else if (event === 'TOKEN_REFRESHED' && supabaseSession) {
              console.log('🔄 Token refreshed, maintaining session');
              // Don't set loading to true during token refresh
            }
          }
        );

        // SEGUNDO: verificar sesión inicial de Supabase
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        console.log('👤 Sesión actual de Supabase:', currentSession);
        console.log('❌ Error de sesión:', sessionError);
        
        if (currentSession?.user) {
          console.log('✅ Usuario autenticado en Supabase, configurando sesión...');
          setSession(currentSession);
          const consolidatedUser = await fetchConsolidatedUserData(currentSession.user.email);
          if (mounted) setUser(consolidatedUser);
        } else {
          console.log('🔍 No hay sesión de Supabase, verificando localStorage...');
          // FALLBACK: verificar localStorage para usuarios legacy
          const storedUser = localStorage.getItem('teleguardia_user');
          if (storedUser) {
            try {
              const parsedUser = JSON.parse(storedUser) as ConsolidatedUser;
              console.log('📦 Usuario encontrado en localStorage:', parsedUser);
              
              // Verificar si el usuario está activo ANTES de autenticar
              if (parsedUser.active === false) {
                console.log('❌ Usuario inactivo, limpiando localStorage y redirigiendo');
                localStorage.removeItem('teleguardia_user');
                setUser(null);
              } else {
                setUser(parsedUser);
              }
            } catch (error) {
              console.error('❌ Error parsing stored user:', error);
              localStorage.removeItem('teleguardia_user');
            }
          } else {
            console.log('❌ No hay usuario en localStorage');
          }
        }

        // Limpiar timeout si llegamos aquí
        clearTimeout(timeoutId);
        setLoading(false);
        console.log('✅ Autenticación inicializada correctamente');

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('❌ Error inicializando autenticación:', error);
        clearTimeout(timeoutId);
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [fetchConsolidatedUserData]);

  return {
    user,
    session,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    hasRole,
    userRole: user?.role || null,
  };
};