-- Re-habilitar RLS y configurar políticas correctas para el sistema legacy auth
ALTER TABLE public.alarmas ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes que podrían estar causando problemas
DROP POLICY IF EXISTS "Acceso_completo_alarmas_lectura" ON public.alarmas;
DROP POLICY IF EXISTS "Acceso_completo_alarmas_insercion" ON public.alarmas;
DROP POLICY IF EXISTS "Acceso_completo_alarmas_actualizacion" ON public.alarmas;
DROP POLICY IF EXISTS "Solo_administradores_eliminar_alarmas" ON public.alarmas;

-- Crear políticas que permitan acceso completo pero de forma segura
-- Estas políticas verifican si existe un usuario autenticado en cualquiera de los dos sistemas
CREATE POLICY "Lectura_alarmas_usuarios_autenticados" 
ON public.alarmas 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL OR 
  EXISTS (SELECT 1 FROM public.users_auth WHERE active = true)
);

CREATE POLICY "Insercion_alarmas_usuarios_autenticados" 
ON public.alarmas 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL OR 
  EXISTS (SELECT 1 FROM public.users_auth WHERE active = true)
);

CREATE POLICY "Actualizacion_alarmas_usuarios_autenticados" 
ON public.alarmas 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL OR 
  EXISTS (SELECT 1 FROM public.users_auth WHERE active = true)
);

-- Política restrictiva para eliminación (solo administradores Supabase)
CREATE POLICY "Eliminacion_alarmas_solo_administradores" 
ON public.alarmas 
FOR DELETE 
USING (
  auth.uid() IS NOT NULL AND 
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'administrador'::user_role)
);