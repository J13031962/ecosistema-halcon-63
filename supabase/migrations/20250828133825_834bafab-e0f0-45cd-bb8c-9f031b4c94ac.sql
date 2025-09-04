-- Crear usuarios de prueba con contraseñas específicas para cada rol

-- El usuario supervisor ya existe, solo vamos a verificar que tenga la contraseña correcta
-- Para eso vamos a insertar usuarios adicionales

-- Crear usuario operador
DO $$
DECLARE
    user_id_operador UUID;
    user_id_despachador UUID;
    user_id_tecnico UUID;
    user_id_director UUID;
    user_id_asesor UUID;
BEGIN
    -- Insertar usuario operador (usando auth.users)
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_user_meta_data,
        is_super_admin
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        'operador@teleguardia.com',
        crypt('operador123', gen_salt('bf')),
        now(),
        now(),
        now(),
        '{"full_name": "Operador Teleguardia"}',
        false
    ) 
    ON CONFLICT (email) DO NOTHING
    RETURNING id INTO user_id_operador;

    -- Insertar usuario despachador
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_user_meta_data,
        is_super_admin
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        'despachador@teleguardia.com',
        crypt('despachador123', gen_salt('bf')),
        now(),
        now(),
        now(),
        '{"full_name": "Despachador Teleguardia"}',
        false
    )
    ON CONFLICT (email) DO NOTHING
    RETURNING id INTO user_id_despachador;

    -- Insertar usuario técnico
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_user_meta_data,
        is_super_admin
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        'tecnico@teleguardia.com',
        crypt('tecnico123', gen_salt('bf')),
        now(),
        now(),
        now(),
        '{"full_name": "Técnico Teleguardia"}',
        false
    )
    ON CONFLICT (email) DO NOTHING
    RETURNING id INTO user_id_tecnico;

    -- Insertar usuario director
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_user_meta_data,
        is_super_admin
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        'director@teleguardia.com',
        crypt('director123', gen_salt('bf')),
        now(),
        now(),
        now(),
        '{"full_name": "Director Central"}',
        false
    )
    ON CONFLICT (email) DO NOTHING
    RETURNING id INTO user_id_director;

    -- Insertar usuario asesor de ventas
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_user_meta_data,
        is_super_admin
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        'asesor@teleguardia.com',
        crypt('asesor123', gen_salt('bf')),
        now(),
        now(),
        now(),
        '{"full_name": "Asesor de Ventas"}',
        false
    )
    ON CONFLICT (email) DO NOTHING
    RETURNING id INTO user_id_asesor;

    -- Crear perfiles si los usuarios fueron creados
    IF user_id_operador IS NOT NULL THEN
        INSERT INTO profiles (id, user_id, email, full_name, active) 
        VALUES (user_id_operador, user_id_operador, 'operador@teleguardia.com', 'Operador Teleguardia', true);
        
        INSERT INTO user_roles (user_id, role) 
        VALUES (user_id_operador, 'operador_alarmas');
    END IF;

    IF user_id_despachador IS NOT NULL THEN
        INSERT INTO profiles (id, user_id, email, full_name, active) 
        VALUES (user_id_despachador, user_id_despachador, 'despachador@teleguardia.com', 'Despachador Teleguardia', true);
        
        INSERT INTO user_roles (user_id, role) 
        VALUES (user_id_despachador, 'despachador_patrullas');
    END IF;

    IF user_id_tecnico IS NOT NULL THEN
        INSERT INTO profiles (id, user_id, email, full_name, active) 
        VALUES (user_id_tecnico, user_id_tecnico, 'tecnico@teleguardia.com', 'Técnico Teleguardia', true);
        
        INSERT INTO user_roles (user_id, role) 
        VALUES (user_id_tecnico, 'tecnico');
    END IF;

    IF user_id_director IS NOT NULL THEN
        INSERT INTO profiles (id, user_id, email, full_name, active) 
        VALUES (user_id_director, user_id_director, 'director@teleguardia.com', 'Director Central', true);
        
        INSERT INTO user_roles (user_id, role) 
        VALUES (user_id_director, 'director_central');
    END IF;

    IF user_id_asesor IS NOT NULL THEN
        INSERT INTO profiles (id, user_id, email, full_name, active) 
        VALUES (user_id_asesor, user_id_asesor, 'asesor@teleguardia.com', 'Asesor de Ventas', true);
        
        INSERT INTO user_roles (user_id, role) 
        VALUES (user_id_asesor, 'asesor_ventas');
    END IF;

END $$;