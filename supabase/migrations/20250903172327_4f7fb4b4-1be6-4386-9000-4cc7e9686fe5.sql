-- Crear el usuario en auth.users usando los datos de users_auth
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    '51f4e21a-0438-49df-96a5-d85f1324e57e',
    'authenticated',
    'authenticated',
    'supervisor@teleguardia.com',
    crypt('Supervisor2025*', gen_salt('bf')),
    now(),
    '{"full_name": "Supervisor Teleguardia"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
) ON CONFLICT (id) DO NOTHING;

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