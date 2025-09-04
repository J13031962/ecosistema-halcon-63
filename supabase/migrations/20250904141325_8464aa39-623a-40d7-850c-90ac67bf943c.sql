-- Limpiar TODAS las políticas de user_roles
DROP POLICY IF EXISTS "Admin email full access" ON public.user_roles;
DROP POLICY IF EXISTS "Everyone can view roles" ON public.user_roles;
DROP POLICY IF EXISTS "Administrators can manage all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Authenticated users can view user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Deshabilitar y volver a habilitar RLS
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Política ULTRA SIMPLE: solo el admin puede gestionar roles
CREATE POLICY "Ultra simple admin access" ON public.user_roles
FOR ALL USING (
  (auth.jwt() ->> 'email') = 'admin@empresa.com'
);

-- Política ULTRA SIMPLE: todos pueden ver roles
CREATE POLICY "Ultra simple view access" ON public.user_roles
FOR SELECT USING (true);

-- Limpiar políticas de profiles
DROP POLICY IF EXISTS "Simple admin or self profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins and self can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins and self can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

-- Política ULTRA SIMPLE para profiles
CREATE POLICY "Ultra simple profiles access" ON public.profiles
FOR ALL USING (
  (auth.jwt() ->> 'email') = 'admin@empresa.com' OR id = auth.uid()
);