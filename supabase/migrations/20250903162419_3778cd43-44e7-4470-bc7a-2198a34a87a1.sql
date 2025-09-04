-- Eliminar políticas existentes problemáticas para clientes
DROP POLICY IF EXISTS "Authenticated users can manage clientes" ON public.clientes;
DROP POLICY IF EXISTS "Authenticated users can view clientes" ON public.clientes;

-- Crear políticas RLS más específicas y correctas para clientes
CREATE POLICY "Usuarios autenticados pueden ver clientes" 
ON public.clientes 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Usuarios autenticados pueden crear clientes" 
ON public.clientes 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden actualizar clientes" 
ON public.clientes 
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Administradores pueden eliminar clientes" 
ON public.clientes 
FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'administrador'::user_role
  )
);