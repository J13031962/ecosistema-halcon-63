-- Crear el usuario operador@teleguardia.com si no existe
DO $$
DECLARE
    new_user_id UUID := gen_random_uuid();
BEGIN
    -- Insertar en profiles si no existe
    INSERT INTO profiles (id, user_id, email, full_name, active, created_at)
    VALUES (
        new_user_id,
        new_user_id,
        'operador@teleguardia.com',
        'Operador Teleguardia',
        true,
        now()
    )
    ON CONFLICT (id) DO NOTHING;
    
    -- Asignar rol si el usuario existe
    INSERT INTO user_roles (user_id, role)
    SELECT new_user_id, 'operador_alarmas'::user_role
    WHERE EXISTS (SELECT 1 FROM profiles WHERE email = 'operador@teleguardia.com')
    ON CONFLICT (user_id, role) DO NOTHING;
END $$;