-- Corregir políticas RLS para alarmas para que operadores puedan acceder
DROP POLICY IF EXISTS "Leer_alarmas_simplificado" ON public.alarmas;
DROP POLICY IF EXISTS "Crear_alarmas_simplificado" ON public.alarmas;
DROP POLICY IF EXISTS "Actualizar_alarmas_unificado" ON public.alarmas;

-- Política de lectura para usuarios autenticados
CREATE POLICY "Operadores_pueden_leer_alarmas" 
ON public.alarmas 
FOR SELECT 
TO authenticated
USING (
  -- Permitir a administradores ver todo
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'administrador'::user_role
  ) OR
  -- Permitir a operadores ver alarmas
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'operador_alarmas'::user_role
  ) OR
  -- Permitir a despachadores ver alarmas
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'despachador_patrullas'::user_role
  ) OR
  -- Permitir a supervisores ver sus alarmas asignadas
  (supervisor_id = auth.uid()) OR
  -- Permitir a directores ver todo
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'director'::user_role
  )
);

-- Política de creación para operadores y administradores
CREATE POLICY "Operadores_pueden_crear_alarmas" 
ON public.alarmas 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('administrador'::user_role, 'operador_alarmas'::user_role)
  )
);

-- Política de actualización para usuarios autorizados
CREATE POLICY "Usuarios_autorizados_pueden_actualizar_alarmas" 
ON public.alarmas 
FOR UPDATE 
TO authenticated
USING (
  -- Permitir a administradores actualizar todo
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'administrador'::user_role
  ) OR
  -- Permitir a operadores actualizar alarmas
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'operador_alarmas'::user_role
  ) OR
  -- Permitir a despachadores actualizar alarmas
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'despachador_patrullas'::user_role
  ) OR
  -- Permitir a supervisores actualizar sus alarmas asignadas
  (supervisor_id = auth.uid()) OR
  -- Permitir a directores actualizar todo
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'director'::user_role
  )
);