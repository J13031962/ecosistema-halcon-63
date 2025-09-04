-- Insertar datos de muestra para historial_patrullas_despachador
INSERT INTO historial_patrullas_despachador (patrulla_numero, supervisor_nombre, actividad, ubicacion, fecha_inicio, fecha_fin, duracion_minutos) VALUES
('P-001', 'Carlos Rodriguez', 'Despacho', 'Zona Norte', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour', 60),
('P-002', 'Enrique Vargas', 'Coordinacion', 'Centro Comercial', NOW() - INTERVAL '4 hours', NOW() - INTERVAL '3 hours', 90),
('P-003', 'Luis Perez', 'Emergencia', 'Residencial Sur', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '5 hours', 45);

-- Insertar datos de muestra para historial_patrullas_operador
INSERT INTO historial_patrullas_operador (patrulla_numero, supervisor_nombre, actividad, ubicacion, fecha_inicio, fecha_fin, duracion_minutos) VALUES
('P-001', 'Carlos Rodriguez', 'Patrullaje', 'Zona Norte', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour', 60),
('P-002', 'Enrique Vargas', 'Mantenimiento', 'Centro Comercial', NOW() - INTERVAL '4 hours', NOW() - INTERVAL '3 hours', 90),
('P-003', 'Luis Perez', 'Emergencia', 'Residencial Sur', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '5 hours', 45);