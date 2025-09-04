-- Crear perfil para supervisor@teleguardia.com
INSERT INTO profiles (
    id, 
    user_id, 
    email, 
    full_name, 
    active
) VALUES (
    '51f4e21a-0438-49df-96a5-d85f1324e57e',
    '51f4e21a-0438-49df-96a5-d85f1324e57e',
    'supervisor@teleguardia.com',
    'Supervisor Teleguardia',
    true
) ON CONFLICT (id) DO NOTHING;

-- Asignar rol de supervisor_motorizado
INSERT INTO user_roles (
    user_id,
    role
) VALUES (
    '51f4e21a-0438-49df-96a5-d85f1324e57e',
    'supervisor_motorizado'::user_role
) ON CONFLICT (user_id, role) DO NOTHING;

-- Crear alarma de prueba asignada a supervisor@teleguardia.com
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
    'Alarma asignada para supervisor@teleguardia.com', 
    (SELECT id FROM clientes LIMIT 1), 
    'asignada', 
    '51f4e21a-0438-49df-96a5-d85f1324e57e', 
    'Supervisor Teleguardia', 
    'Alta', 
    'Calle Principal 456', 
    'Teleguardia Centro'
);