-- Habilitar tiempo real para las tablas de turnos
ALTER TABLE turnos_operador REPLICA IDENTITY FULL;
ALTER TABLE turnos_supervisor REPLICA IDENTITY FULL;

-- Añadir las tablas a la publicación de tiempo real
ALTER PUBLICATION supabase_realtime ADD TABLE turnos_operador;
ALTER PUBLICATION supabase_realtime ADD TABLE turnos_supervisor;