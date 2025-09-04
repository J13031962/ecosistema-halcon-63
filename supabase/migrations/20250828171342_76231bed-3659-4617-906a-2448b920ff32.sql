-- ============================================
-- CORRECCIÓN FINAL DE POLÍTICAS DE SEGURIDAD
-- ============================================

-- 1. Crear función de emergencia para acceso de administrador
CREATE OR REPLACE FUNCTION public.emergency_admin_access()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Permite acceso completo al usuario admin@empresa.com o administradores
  SELECT auth.jwt() ->> 'email' = 'admin@empresa.com' OR EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'administrador'::user_role
  );
$$;

-- 2. Eliminar políticas existentes problemáticas
DROP POLICY IF EXISTS "Anyone can view user roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can insert user roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can update user roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can delete user roles" ON user_roles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can manage profiles" ON profiles;

-- 3. Crear políticas corregidas para user_roles (solo usuarios autenticados)
CREATE POLICY "Authenticated users can view user roles"
ON user_roles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can insert user roles"
ON user_roles FOR INSERT
TO authenticated
WITH CHECK (public.emergency_admin_access());

CREATE POLICY "Admins can update user roles"
ON user_roles FOR UPDATE
TO authenticated
USING (public.emergency_admin_access());

CREATE POLICY "Admins can delete user roles"
ON user_roles FOR DELETE
TO authenticated
USING (public.emergency_admin_access());

-- 4. Crear políticas corregidas para profiles (solo usuarios autenticados)
CREATE POLICY "Authenticated users can view profiles"
ON profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins and self can update profiles"
ON profiles FOR UPDATE
TO authenticated
USING (public.emergency_admin_access() OR id = auth.uid());

CREATE POLICY "Admins and self can insert profiles"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (public.emergency_admin_access() OR id = auth.uid());

CREATE POLICY "Admins can delete profiles"
ON profiles FOR DELETE
TO authenticated
USING (public.emergency_admin_access());

-- 5. Verificar que admin@empresa.com tenga rol de administrador
INSERT INTO user_roles (user_id, role)
SELECT id, 'administrador'::user_role
FROM profiles 
WHERE email = 'admin@empresa.com'
AND NOT EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = profiles.id 
  AND role = 'administrador'::user_role
);

-- 6. Activar todos los perfiles por defecto
UPDATE profiles SET active = true WHERE active IS NULL;