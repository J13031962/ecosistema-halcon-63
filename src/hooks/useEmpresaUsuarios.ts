import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UsuarioEmpresa {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  empresa_contratada_id: string | null;
  role: string;
}

export function useEmpresaUsuarios(empresaId?: string) {
  const [despachadores, setDespachadores] = useState<UsuarioEmpresa[]>([]);
  const [supervisores, setSupervisores] = useState<UsuarioEmpresa[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchUsuariosPorRol = async () => {
    setLoading(true);
    try {
      // Fetch despachadores
      const { data: despachadoresData, error: errorDesp } = await supabase
        .from('profiles')
        .select(`
          id,
          user_id,
          email,
          full_name,
          empresa_contratada_id,
          user_roles!inner(role)
        `)
        .eq('user_roles.role', 'despachador_patrullas')
        .eq('active', true);

      if (errorDesp) throw errorDesp;

      // Fetch supervisores
      const { data: supervisoresData, error: errorSup } = await supabase
        .from('profiles')
        .select(`
          id,
          user_id,
          email,
          full_name,
          empresa_contratada_id,
          user_roles!inner(role)
        `)
        .eq('user_roles.role', 'supervisor_motorizado')
        .eq('active', true);

      if (errorSup) throw errorSup;

      setDespachadores(despachadoresData?.map(d => ({
        id: d.id,
        user_id: d.user_id,
        email: d.email,
        full_name: d.full_name,
        empresa_contratada_id: d.empresa_contratada_id,
        role: 'despachador_patrullas'
      })) || []);

      setSupervisores(supervisoresData?.map(s => ({
        id: s.id,
        user_id: s.user_id,
        email: s.email,
        full_name: s.full_name,
        empresa_contratada_id: s.empresa_contratada_id,
        role: 'supervisor_motorizado'
      })) || []);

    } catch (error: any) {
      console.error('Error fetching usuarios:', error);
      toast({
        title: "Error al cargar usuarios",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const asignarUsuarioAEmpresa = async (userId: string, empresaIdParam: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ empresa_contratada_id: empresaIdParam })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Usuario asignado",
        description: "El usuario ha sido asignado a la empresa exitosamente"
      });

      await fetchUsuariosPorRol();
    } catch (error: any) {
      console.error('Error asignando usuario:', error);
      toast({
        title: "Error al asignar usuario",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const desasignarUsuarioDeEmpresa = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ empresa_contratada_id: null })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Usuario desasignado",
        description: "El usuario ha sido removido de la empresa"
      });

      await fetchUsuariosPorRol();
    } catch (error: any) {
      console.error('Error desasignando usuario:', error);
      toast({
        title: "Error al desasignar usuario",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getEmpresaDelUsuario = async (userId: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('empresa_contratada_id')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data?.empresa_contratada_id || null;
    } catch (error: any) {
      console.error('Error obteniendo empresa del usuario:', error);
      return null;
    }
  };

  useEffect(() => {
    fetchUsuariosPorRol();
  }, [empresaId]);

  return {
    despachadores,
    supervisores,
    loading,
    asignarUsuarioAEmpresa,
    desasignarUsuarioDeEmpresa,
    getEmpresaDelUsuario,
    refetch: fetchUsuariosPorRol
  };
}
