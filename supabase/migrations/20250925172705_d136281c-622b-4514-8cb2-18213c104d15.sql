-- Actualizar la función is_authenticated_user para trabajar con sistema híbrido
CREATE OR REPLACE FUNCTION public.is_authenticated_user()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- Verificar si el usuario está autenticado en Supabase Auth O existe en users_auth
  SELECT CASE 
    WHEN auth.uid() IS NOT NULL THEN true
    WHEN EXISTS (
      SELECT 1 FROM public.users_auth 
      WHERE email = (auth.jwt() ->> 'email') AND active = true
    ) THEN true
    ELSE false
  END;
$$;

-- Actualizar políticas de clientes para usar mejor autenticación híbrida
DROP POLICY IF EXISTS "Acceso_completo_clientes_insercion" ON public.clientes;
DROP POLICY IF EXISTS "Acceso_completo_clientes_actualizacion" ON public.clientes;
DROP POLICY IF EXISTS "Acceso_completo_clientes_lectura" ON public.clientes;

-- Crear nuevas políticas que funcionen con autenticación híbrida
CREATE POLICY "Usuarios_autenticados_pueden_insertar_clientes" 
ON public.clientes 
FOR INSERT 
WITH CHECK (is_authenticated_user());

CREATE POLICY "Usuarios_autenticados_pueden_actualizar_clientes" 
ON public.clientes 
FOR UPDATE 
USING (is_authenticated_user())
WITH CHECK (is_authenticated_user());

CREATE POLICY "Usuarios_autenticados_pueden_leer_clientes" 
ON public.clientes 
FOR SELECT 
USING (is_authenticated_user());

-- Actualizar política de minuta_operaciones para consistencia
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear entradas" ON public.minuta_operaciones;

CREATE POLICY "Usuarios_autenticados_pueden_crear_minuta" 
ON public.minuta_operaciones 
FOR INSERT 
WITH CHECK (is_authenticated_user());