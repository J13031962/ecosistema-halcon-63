-- DESHABILITAR RLS COMPLETAMENTE PARA RESOLVER EL PROBLEMA
ALTER TABLE turnos_operador DISABLE ROW LEVEL SECURITY;
ALTER TABLE turnos_supervisor DISABLE ROW LEVEL SECURITY;

-- Verificar que esté deshabilitado
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename IN ('turnos_operador', 'turnos_supervisor');