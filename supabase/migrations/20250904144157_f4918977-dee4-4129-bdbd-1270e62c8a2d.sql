-- Arreglar políticas RLS para la tabla clientes
-- Primero eliminamos las políticas existentes
DROP POLICY IF EXISTS "Admins can delete clientes" ON public.clientes;
DROP POLICY IF EXISTS "Authenticated users can create clientes" ON public.clientes;
DROP POLICY IF EXISTS "Authenticated users can update clientes" ON public.clientes;
DROP POLICY IF EXISTS "Authenticated users can view clientes" ON public.clientes;

-- Crear nuevas políticas más específicas y seguras
-- Política para ver clientes (solo usuarios autenticados)
CREATE POLICY "Usuarios autenticados pueden ver clientes" 
ON public.clientes 
FOR SELECT 
TO authenticated
USING (true);

-- Política para crear clientes (solo usuarios autenticados)
CREATE POLICY "Usuarios autenticados pueden crear clientes" 
ON public.clientes 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Política para actualizar clientes (solo usuarios autenticados)
CREATE POLICY "Usuarios autenticados pueden actualizar clientes" 
ON public.clientes 
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

-- Política para eliminar clientes (solo administradores)
CREATE POLICY "Solo administradores pueden eliminar clientes" 
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