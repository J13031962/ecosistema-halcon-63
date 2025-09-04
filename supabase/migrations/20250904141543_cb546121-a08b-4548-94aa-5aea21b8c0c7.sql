-- Solo corregir las políticas con el email correcto, sin tocar perfiles aún

-- Eliminar políticas con email incorrecto
DROP POLICY IF EXISTS "admin_only_policy" ON public.user_roles;
DROP POLICY IF EXISTS "read_only_policy" ON public.user_roles;
DROP POLICY IF EXISTS "Ultra simple profiles access" ON public.profiles;

-- Crear políticas con el email CORRECTO: admin@teleguardia.com
CREATE POLICY "teleguardia_admin_only_policy" ON public.user_roles
FOR ALL USING (
  (auth.jwt() ->> 'email') = 'admin@teleguardia.com'
);

CREATE POLICY "teleguardia_read_only_policy" ON public.user_roles
FOR SELECT USING (true);

CREATE POLICY "teleguardia_profiles_access" ON public.profiles
FOR ALL USING (
  (auth.jwt() ->> 'email') = 'admin@teleguardia.com' OR id = auth.uid()
);

-- Actualizar funciones con el email correcto
CREATE OR REPLACE FUNCTION public.is_admin_email()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (auth.jwt() ->> 'email') = 'admin@teleguardia.com';
$$;

CREATE OR REPLACE FUNCTION public.emergency_admin_check()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (auth.jwt() ->> 'email') = 'admin@teleguardia.com';
$$;