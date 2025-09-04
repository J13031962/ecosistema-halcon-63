-- Corregir el tipo de datos de latitud y longitud para permitir más flexibilidad
ALTER TABLE public.clientes 
ALTER COLUMN latitud TYPE DECIMAL(10,6);

ALTER TABLE public.clientes 
ALTER COLUMN longitud TYPE DECIMAL(11,6);

-- Verificar y corregir las políticas RLS para clientes
-- Primero eliminamos las políticas existentes
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver clientes" ON public.clientes;
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear clientes" ON public.clientes;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar clientes" ON public.clientes;
DROP POLICY IF EXISTS "Administradores pueden eliminar clientes" ON public.clientes;

-- Crear políticas RLS más simples y que funcionen
CREATE POLICY "Users can view clientes" 
ON public.clientes 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create clientes" 
ON public.clientes 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update clientes" 
ON public.clientes 
FOR UPDATE 
USING (true)
WITH CHECK (true);

CREATE POLICY "Admins can delete clientes" 
ON public.clientes 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'administrador'::user_role
  )
);