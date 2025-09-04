-- Corregir las políticas RLS para user_roles
-- Primero eliminar las políticas existentes
DROP POLICY IF EXISTS "Admins can manage all user roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;

-- Crear políticas más específicas y funcionales
-- Política para que administradores puedan ver todos los roles
CREATE POLICY "Admins can view all user roles"
ON user_roles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'administrador'::user_role
  )
);

-- Política para que usuarios puedan ver sus propios roles
CREATE POLICY "Users can view their own roles"
ON user_roles FOR SELECT
USING (user_id = auth.uid());

-- Política para que administradores puedan insertar roles a cualquier usuario
CREATE POLICY "Admins can insert user roles"
ON user_roles FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'administrador'::user_role
  )
);

-- Política para que administradores puedan actualizar roles
CREATE POLICY "Admins can update user roles"
ON user_roles FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'administrador'::user_role
  )
);

-- Política para que administradores puedan eliminar roles
CREATE POLICY "Admins can delete user roles"
ON user_roles FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'administrador'::user_role
  )
);

-- También actualizar las políticas de profiles para que sea consistente
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;

CREATE POLICY "Admins can manage all profiles"
ON profiles FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'administrador'::user_role
  )
);