import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SupervisorDisponible {
  id: string;
  email: string;
  full_name: string | null;
  numero_documento: string | null;
  foto_url: string | null;
  active: boolean;
  role: string;
}

export const useSupabaseSupervisores = () => {
  const [supervisores, setSupervisores] = useState<SupervisorDisponible[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchSupervisores = async () => {
    try {
      setLoading(true);
      console.log('🔍 Obteniendo supervisores disponibles...');

      // Estrategia mejorada: buscar en múltiples fuentes
      
      // 1. Primero buscar en profiles con JOIN a user_roles
      const { data: profilesConRoles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          numero_documento,
          foto_url,
          active,
          user_roles!inner(role)
        `)
        .eq('active', true)
        .eq('user_roles.role', 'supervisor_motorizado')
        .order('full_name', { ascending: true });

      console.log('✅ Supervisores desde profiles con roles:', profilesConRoles);

      let supervisoresEncontrados: SupervisorDisponible[] = [];

      if (profilesConRoles && profilesConRoles.length > 0) {
        supervisoresEncontrados = profilesConRoles.map(supervisor => ({
          id: supervisor.id,
          email: supervisor.email,
          full_name: supervisor.full_name,
          numero_documento: supervisor.numero_documento,
          foto_url: supervisor.foto_url,
          active: supervisor.active,
          role: 'supervisor_motorizado'
        }));
      }

      // 2. FALLBACK: Buscar supervisores conocidos específicos
      const supervisoresEspecificos = [
        'supervisor@teleguardia.com',
        'supervisor1@teleguardia.com', 
        'supervisor2@teleguardia.com',
        'supervisor3@teleguardia.com',
        'supervisor4@teleguardia.com'
      ];

      for (const emailSupervisor of supervisoresEspecificos) {
        // Verificar si ya está en la lista
        const yaExiste = supervisoresEncontrados.some(s => s.email === emailSupervisor);
        if (yaExiste) continue;

        // Buscar en profiles
        const { data: supervisor, error: supervisorError } = await supabase
          .from('profiles')
          .select('id, email, full_name, numero_documento, foto_url, active')
          .eq('email', emailSupervisor)
          .eq('active', true)
          .maybeSingle();

        if (!supervisorError && supervisor) {
          // Verificar si tiene el rol correcto
          const { data: tieneRol } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', supervisor.id)
            .eq('role', 'supervisor_motorizado')
            .maybeSingle();

          if (tieneRol) {
            supervisoresEncontrados.push({
              id: supervisor.id,
              email: supervisor.email,
              full_name: supervisor.full_name,
              numero_documento: supervisor.numero_documento,
              foto_url: supervisor.foto_url,
              active: supervisor.active,
              role: 'supervisor_motorizado'
            });
          }
        }
      }

      // 3. Último fallback: buscar en users_auth (sistema legacy)
      const { data: supervisoresLegacy, error: legacyError } = await supabase
        .from('users_auth')
        .select('id, email, full_name, active')
        .eq('role', 'supervisor_motorizado')
        .eq('active', true);

      if (!legacyError && supervisoresLegacy) {
        for (const supervisorLegacy of supervisoresLegacy) {
          const yaExiste = supervisoresEncontrados.some(s => s.email === supervisorLegacy.email);
          if (!yaExiste) {
            supervisoresEncontrados.push({
              id: supervisorLegacy.id,
              email: supervisorLegacy.email,
              full_name: supervisorLegacy.full_name,
              numero_documento: null,
              foto_url: null,
              active: supervisorLegacy.active,
              role: 'supervisor_motorizado'
            });
          }
        }
      }

      console.log('📋 Total supervisores encontrados:', supervisoresEncontrados.length);
      console.log('👥 Lista final de supervisores:', supervisoresEncontrados.map(s => ({
        id: s.id,
        email: s.email,
        nombre: s.full_name
      })));

      setSupervisores(supervisoresEncontrados);

      if (supervisoresEncontrados.length === 0) {
        toast({
          title: "Sin supervisores",
          description: "No se encontraron supervisores disponibles. Verifique que estén registrados con el rol correcto.",
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('❌ Error global fetching supervisores:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los supervisores disponibles",
        variant: "destructive",
      });
      setSupervisores([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupervisores();
  }, []);

  return {
    supervisores,
    loading,
    refetch: fetchSupervisores,
  };
};