-- Eliminar ABSOLUTAMENTE TODAS las políticas de turnos_operador
DROP POLICY IF EXISTS "Acceso completo turnos operador" ON turnos_operador;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar turnos operador" ON turnos_operador;
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear turnos operador" ON turnos_operador;

-- Deshabilitar RLS temporalmente y volver a habilitar para limpiar todo
ALTER TABLE turnos_operador DISABLE ROW LEVEL SECURITY;
ALTER TABLE turnos_operador ENABLE ROW LEVEL SECURITY;

-- Crear UNA SOLA política super permisiva
CREATE POLICY "allow_all_for_authenticated" 
ON turnos_operador 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Hacer lo mismo para turnos_supervisor
DROP POLICY IF EXISTS "Acceso completo turnos supervisor" ON turnos_supervisor;

ALTER TABLE turnos_supervisor DISABLE ROW LEVEL SECURITY;
ALTER TABLE turnos_supervisor ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_for_authenticated" 
ON turnos_supervisor 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);