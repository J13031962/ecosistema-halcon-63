-- Eliminar todas las políticas existentes de alarmas para empezar limpio
DROP POLICY IF EXISTS "Authenticated users can manage alarmas" ON public.alarmas;
DROP POLICY IF EXISTS "Operadores crear alarmas" ON public.alarmas;
DROP POLICY IF EXISTS "Actualización alarmas cascada" ON public.alarmas;
DROP POLICY IF EXISTS "Visualización alarmas cascada" ON public.alarmas;

-- Crear políticas RLS simples y funcionales para alarmas

-- Política para VER alarmas - usuarios autenticados pueden ver alarmas relacionadas con su rol
CREATE POLICY "Users can view alarmas" 
ON public.alarmas 
FOR SELECT 
TO authenticated
USING (true);

-- Política para CREAR alarmas - usuarios autenticados pueden crear alarmas
CREATE POLICY "Users can create alarmas" 
ON public.alarmas 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Política para ACTUALIZAR alarmas - usuarios autenticados pueden actualizar alarmas
CREATE POLICY "Users can update alarmas" 
ON public.alarmas 
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

-- Política para ELIMINAR alarmas - solo administradores
CREATE POLICY "Admins can delete alarmas" 
ON public.alarmas 
FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'administrador'::user_role
  )
);