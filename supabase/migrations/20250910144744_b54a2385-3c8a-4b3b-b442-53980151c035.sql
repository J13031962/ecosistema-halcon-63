-- Arreglar las políticas RLS para turnos_operador
-- Primero eliminar las políticas existentes que están causando problemas
DROP POLICY IF EXISTS "Administradores pueden gestionar todos los turnos operador" ON turnos_operador;
DROP POLICY IF EXISTS "Operadores pueden gestionar turnos" ON turnos_operador;
DROP POLICY IF EXISTS "Operadores pueden ver todos los turnos" ON turnos_operador;
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear turnos operador" ON turnos_operador;

-- Crear nuevas políticas más permisivas para turnos_operador
CREATE POLICY "Usuarios autenticados pueden ver turnos operador"
ON turnos_operador FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Usuarios autenticados pueden crear turnos operador"
ON turnos_operador FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuarios autenticados pueden actualizar turnos operador"
ON turnos_operador FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Administradores pueden eliminar turnos operador"
ON turnos_operador FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM user_roles ur
  WHERE ur.user_id = auth.uid() 
  AND ur.role = 'administrador'::user_role
));

-- Hacer lo mismo para turnos_supervisor
DROP POLICY IF EXISTS "Authenticated users can manage turnos_supervisor" ON turnos_supervisor;
DROP POLICY IF EXISTS "Authenticated users can view turnos_supervisor" ON turnos_supervisor;

CREATE POLICY "Usuarios autenticados pueden ver turnos supervisor"
ON turnos_supervisor FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Usuarios autenticados pueden crear turnos supervisor"
ON turnos_supervisor FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuarios autenticados pueden actualizar turnos supervisor"
ON turnos_supervisor FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Administradores pueden eliminar turnos supervisor"
ON turnos_supervisor FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM user_roles ur
  WHERE ur.user_id = auth.uid() 
  AND ur.role = 'administrador'::user_role
));