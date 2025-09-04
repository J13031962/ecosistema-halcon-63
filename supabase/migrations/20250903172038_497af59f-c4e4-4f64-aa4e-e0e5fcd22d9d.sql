-- Insertar una alarma de prueba asignada al supervisor existente
INSERT INTO alarmas (
    tipo, 
    descripcion, 
    cliente_id, 
    estado, 
    supervisor_id, 
    supervisor, 
    prioridad, 
    direccion, 
    municipio
) VALUES (
    'Técnica', 
    'Alarma de prueba para verificar vista del supervisor', 
    (SELECT id FROM clientes LIMIT 1), 
    'asignada', 
    'cf95fa4c-c6b1-4c56-8eb6-74813f579051', 
    'Supervisor Campo', 
    'Media', 
    'Dirección de prueba 123', 
    'Municipio de prueba'
);