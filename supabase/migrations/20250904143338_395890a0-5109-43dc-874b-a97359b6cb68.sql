-- Actualizar políticas RLS para que los supervisores puedan ver sus alarmas asignadas
DROP POLICY IF EXISTS "Allow all users to view alarmas" ON public.alarmas;

-- Política más específica para supervisores que puedan ver sus alarmas asignadas
CREATE POLICY "Supervisores pueden ver sus alarmas asignadas" 
ON public.alarmas 
FOR SELECT 
USING (
  supervisor_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = ANY(ARRAY['administrador'::user_role, 'director'::user_role, 'operador_alarmas'::user_role, 'despachador_patrullas'::user_role])
  )
);

-- Política general para otros roles que necesitan ver todas las alarmas
CREATE POLICY "Roles administrativos pueden ver todas las alarmas" 
ON public.alarmas 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = ANY(ARRAY['administrador'::user_role, 'director'::user_role, 'operador_alarmas'::user_role, 'despachador_patrullas'::user_role])
  )
);