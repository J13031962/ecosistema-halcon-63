-- Eliminar todas las políticas conflictivas existentes
DROP POLICY IF EXISTS "Supervisores pueden ver sus alarmas asignadas" ON public.alarmas;
DROP POLICY IF EXISTS "Roles administrativos pueden ver todas las alarmas" ON public.alarmas;
DROP POLICY IF EXISTS "Admins can delete alarmas" ON public.alarmas;
DROP POLICY IF EXISTS "Allow all users to update alarmas" ON public.alarmas;
DROP POLICY IF EXISTS "Only admins can delete alarmas" ON public.alarmas;

-- Crear una política unificada para SELECT que permita:
-- 1. A los supervisores ver sus alarmas asignadas
-- 2. A los roles administrativos ver todas las alarmas
CREATE POLICY "Acceso_unificado_alarmas_lectura" 
ON public.alarmas 
FOR SELECT 
USING (
  -- Supervisores pueden ver sus alarmas asignadas
  supervisor_id = auth.uid() OR 
  -- Roles administrativos pueden ver todas
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = ANY(ARRAY['administrador'::user_role, 'director'::user_role, 'operador_alarmas'::user_role, 'despachador_patrullas'::user_role])
  )
);

-- Política para INSERT
CREATE POLICY "Crear_alarmas_roles_autorizados" 
ON public.alarmas 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = ANY(ARRAY['administrador'::user_role, 'operador_alarmas'::user_role, 'despachador_patrullas'::user_role])
  )
);

-- Política para UPDATE
CREATE POLICY "Actualizar_alarmas_roles_autorizados" 
ON public.alarmas 
FOR UPDATE 
USING (
  supervisor_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = ANY(ARRAY['administrador'::user_role, 'operador_alarmas'::user_role, 'despachador_patrullas'::user_role, 'supervisor_motorizado'::user_role])
  )
);

-- Política para DELETE (solo administradores)
CREATE POLICY "Eliminar_alarmas_solo_admins" 
ON public.alarmas 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'administrador'::user_role
  )
);