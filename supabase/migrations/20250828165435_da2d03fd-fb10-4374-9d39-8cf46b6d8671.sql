-- Eliminar todas las políticas problemáticas
DROP POLICY IF EXISTS "Admins can view all user roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can insert user roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can update user roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can delete user roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;

-- Crear función security definer para verificar si un usuario es admin
CREATE OR REPLACE FUNCTION public.is_admin_or_same_user(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Permitir si es el mismo usuario O si es administrador
  SELECT target_user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'administrador'::user_role
  );
$$;

-- Políticas más simples para user_roles
CREATE POLICY "Anyone can view user roles"
ON user_roles FOR SELECT
USING (true);

CREATE POLICY "Admins can insert user roles"
ON user_roles FOR INSERT
WITH CHECK (public.is_admin_or_same_user(user_id));

CREATE POLICY "Admins can update user roles"
ON user_roles FOR UPDATE
USING (public.is_admin_or_same_user(user_id));

CREATE POLICY "Admins can delete user roles"
ON user_roles FOR DELETE
USING (public.is_admin_or_same_user(user_id));

-- Política simple para profiles
CREATE POLICY "Anyone can view profiles"
ON profiles FOR SELECT
USING (true);

CREATE POLICY "Admins can manage profiles"
ON profiles FOR ALL
USING (public.is_admin_or_same_user(id));