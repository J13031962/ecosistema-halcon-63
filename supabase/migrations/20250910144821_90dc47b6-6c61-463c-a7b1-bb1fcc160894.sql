-- Eliminar todas las políticas existentes de turnos_operador
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver turnos operador" ON turnos_operador;
DROP POLICY IF EXISTS "Authenticated users can view turnos_operador" ON turnos_operador;

-- Crear políticas simplificadas para turnos_operador
CREATE POLICY "Ver todos los turnos operador"
ON turnos_operador FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Crear turnos operador"
ON turnos_operador FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Actualizar turnos operador"
ON turnos_operador FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Eliminar todas las políticas existentes de turnos_supervisor
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver turnos supervisor" ON turnos_supervisor;
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear turnos supervisor" ON turnos_supervisor;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar turnos supervisor" ON turnos_supervisor;

-- Crear políticas simplificadas para turnos_supervisor
CREATE POLICY "Ver todos los turnos supervisor"
ON turnos_supervisor FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Crear turnos supervisor"
ON turnos_supervisor FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Actualizar turnos supervisor"
ON turnos_supervisor FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);