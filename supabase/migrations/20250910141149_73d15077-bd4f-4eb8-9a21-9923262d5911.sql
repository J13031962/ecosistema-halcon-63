-- Actualizar políticas RLS para turnos_operador para que los operadores puedan ver todos los turnos
DROP POLICY IF EXISTS "Operadores pueden gestionar sus propios turnos" ON turnos_operador;
DROP POLICY IF EXISTS "Todos pueden ver turnos operador" ON turnos_operador;

-- Política para que los operadores puedan ver TODOS los turnos (no solo los suyos)
CREATE POLICY "Operadores pueden ver todos los turnos"
ON turnos_operador FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = ANY(ARRAY['operador_alarmas'::user_role, 'administrador'::user_role, 'director'::user_role])
  )
);

-- Política para que los operadores puedan gestionar sus propios turnos y administradores todos
CREATE POLICY "Operadores pueden gestionar turnos"
ON turnos_operador FOR ALL
TO authenticated
USING (
  operador_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = ANY(ARRAY['administrador'::user_role, 'director'::user_role])
  )
)
WITH CHECK (
  operador_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = ANY(ARRAY['administrador'::user_role, 'director'::user_role])
  )
);