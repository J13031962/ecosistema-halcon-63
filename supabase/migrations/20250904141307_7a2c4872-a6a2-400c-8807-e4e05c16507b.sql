-- Eliminar todas las políticas complejas de user_roles
DROP POLICY IF EXISTS "Administrators can manage all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Authenticated users can view user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Deshabilitar RLS temporalmente para limpiar
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- Crear políticas super simples
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Política simple: admin@empresa.com puede hacer todo
CREATE POLICY "Admin email full access" ON public.user_roles
FOR ALL USING (
  (auth.jwt() ->> 'email') = 'admin@empresa.com'
);

-- Política simple: todos pueden ver roles (sin recursión)
CREATE POLICY "Everyone can view roles" ON public.user_roles
FOR SELECT USING (true);

-- Crear función simple para verificar admin sin recursión
CREATE OR REPLACE FUNCTION public.is_admin_email()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (auth.jwt() ->> 'email') = 'admin@empresa.com';
$$;

-- Simplificar la función de verificación de roles
CREATE OR REPLACE FUNCTION public.user_has_role(check_user_id uuid, check_role text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = check_user_id 
    AND role::text = check_role
  );
$$;

-- Simplificar políticas de profiles
DROP POLICY IF EXISTS "Admins and self can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins and self can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

CREATE POLICY "Simple admin or self profiles" ON public.profiles
FOR ALL USING (
  (auth.jwt() ->> 'email') = 'admin@empresa.com' OR id = auth.uid()
);

-- Asegurar que el administrador principal existe y puede asignar roles
INSERT INTO public.profiles (id, user_id, email, full_name, active) 
VALUES (
  'd2c8ee73-0823-4edd-a0ae-8fd35d694221',
  'd2c8ee73-0823-4edd-a0ae-8fd35d694221',
  'admin@empresa.com',
  'Administrador Principal',
  true
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  active = EXCLUDED.active;

-- Asegurar que tiene el rol de administrador
INSERT INTO public.user_roles (user_id, role) 
VALUES ('d2c8ee73-0823-4edd-a0ae-8fd35d694221', 'administrador'::user_role)
ON CONFLICT (user_id, role) DO NOTHING;