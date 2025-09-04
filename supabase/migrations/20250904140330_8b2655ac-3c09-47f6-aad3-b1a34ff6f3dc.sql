-- Primero, eliminar las políticas existentes que causan problemas
DROP POLICY IF EXISTS "Admin can manage all user roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
DROP POLICY IF EXISTS "Authenticated users can view user roles" ON user_roles;

-- Crear nuevas políticas más permisivas y claras para user_roles
-- Política para administradores (crear, leer, actualizar, eliminar roles)
CREATE POLICY "Administrators can manage all user roles" 
ON user_roles FOR ALL 
USING (
  auth.jwt() ->> 'email' = 'admin@empresa.com' 
  OR 
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND EXISTS (
      SELECT 1 FROM user_roles ur2 
      WHERE ur2.user_id = p.id 
      AND ur2.role = 'administrador'
    )
  )
)
WITH CHECK (
  auth.jwt() ->> 'email' = 'admin@empresa.com' 
  OR 
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND EXISTS (
      SELECT 1 FROM user_roles ur2 
      WHERE ur2.user_id = p.id 
      AND ur2.role = 'administrador'
    )
  )
);

-- Política para que los usuarios vean sus propios roles
CREATE POLICY "Users can view their own roles" 
ON user_roles FOR SELECT 
USING (user_id = auth.uid());

-- Política para que usuarios autenticados puedan ver roles (solo lectura)
CREATE POLICY "Authenticated users can view user roles" 
ON user_roles FOR SELECT 
USING (auth.role() = 'authenticated');