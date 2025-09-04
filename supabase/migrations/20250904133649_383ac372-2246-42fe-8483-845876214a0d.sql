-- Eliminar las políticas existentes para alarmas
DROP POLICY IF EXISTS "Users can create alarmas" ON public.alarmas;
DROP POLICY IF EXISTS "Users can view alarmas" ON public.alarmas;
DROP POLICY IF EXISTS "Users can update alarmas" ON public.alarmas;

-- Crear nuevas políticas más permisivas para alarmas
CREATE POLICY "Allow all users to view alarmas" ON public.alarmas
FOR SELECT USING (true);

CREATE POLICY "Allow all users to create alarmas" ON public.alarmas
FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all users to update alarmas" ON public.alarmas
FOR UPDATE USING (true) WITH CHECK (true);

-- Mantener la política de DELETE solo para administradores
CREATE POLICY "Only admins can delete alarmas" ON public.alarmas
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'administrador'::user_role
  )
);