-- Crear el usuario operador@teleguardia.com correctamente
DO $$
DECLARE
    new_user_id UUID := gen_random_uuid();
BEGIN
    -- Insertar en profiles
    INSERT INTO profiles (id, user_id, email, full_name, active, created_at)
    VALUES (
        new_user_id,
        new_user_id,
        'operador@teleguardia.com',
        'Operador Teleguardia',
        true,
        now()
    );
    
    -- Asignar rol
    INSERT INTO user_roles (user_id, role)
    VALUES (new_user_id, 'operador_alarmas'::user_role);
END $$;