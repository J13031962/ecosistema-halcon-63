-- Crear usuarios de prueba con sus roles correctos
DO $$
DECLARE
    admin_user_id UUID;
    director_user_id UUID;
    operador_user_id UUID;
    despachador_user_id UUID;
    supervisor_user_id UUID;
    tecnico_user_id UUID;
    asesor_user_id UUID;
    dt_user_id UUID;
    tp_user_id UUID;
    te_user_id UUID;
BEGIN
    -- Verificar si el usuario admin ya existe y obtener su ID
    SELECT id INTO admin_user_id FROM profiles WHERE email = 'admin@empresa.com' LIMIT 1;
    
    -- Si el admin existe, asegurar que tenga el rol de administrador
    IF admin_user_id IS NOT NULL THEN
        -- Limpiar roles existentes del admin
        DELETE FROM user_roles WHERE user_id = admin_user_id;
        -- Asignar rol de administrador
        INSERT INTO user_roles (user_id, role) VALUES (admin_user_id, 'administrador');
    END IF;

    -- Crear o actualizar usuarios de prueba
    
    -- Director
    INSERT INTO profiles (id, user_id, email, full_name, active, username) 
    VALUES (gen_random_uuid(), gen_random_uuid(), 'director@teleguardia.com', 'Director General', true, 'director')
    ON CONFLICT (email) DO UPDATE SET 
        full_name = EXCLUDED.full_name,
        active = true,
        username = EXCLUDED.username
    RETURNING id INTO director_user_id;
    
    IF director_user_id IS NULL THEN
        SELECT id INTO director_user_id FROM profiles WHERE email = 'director@teleguardia.com';
    END IF;
    
    DELETE FROM user_roles WHERE user_id = director_user_id;
    INSERT INTO user_roles (user_id, role) VALUES (director_user_id, 'director');

    -- Operador de Alarmas
    INSERT INTO profiles (id, user_id, email, full_name, active, username) 
    VALUES (gen_random_uuid(), gen_random_uuid(), 'operador@teleguardia.com', 'Operador de Alarmas', true, 'operador')
    ON CONFLICT (email) DO UPDATE SET 
        full_name = EXCLUDED.full_name,
        active = true,
        username = EXCLUDED.username
    RETURNING id INTO operador_user_id;
    
    IF operador_user_id IS NULL THEN
        SELECT id INTO operador_user_id FROM profiles WHERE email = 'operador@teleguardia.com';
    END IF;
    
    DELETE FROM user_roles WHERE user_id = operador_user_id;
    INSERT INTO user_roles (user_id, role) VALUES (operador_user_id, 'operador_alarmas');

    -- Despachador de Patrullas
    INSERT INTO profiles (id, user_id, email, full_name, active, username) 
    VALUES (gen_random_uuid(), gen_random_uuid(), 'despachador@teleguardia.com', 'Despachador de Patrullas', true, 'despachador')
    ON CONFLICT (email) DO UPDATE SET 
        full_name = EXCLUDED.full_name,
        active = true,
        username = EXCLUDED.username
    RETURNING id INTO despachador_user_id;
    
    IF despachador_user_id IS NULL THEN
        SELECT id INTO despachador_user_id FROM profiles WHERE email = 'despachador@teleguardia.com';
    END IF;
    
    DELETE FROM user_roles WHERE user_id = despachador_user_id;
    INSERT INTO user_roles (user_id, role) VALUES (despachador_user_id, 'despachador_patrullas');

    -- Supervisor Motorizado
    INSERT INTO profiles (id, user_id, email, full_name, active, username) 
    VALUES (gen_random_uuid(), gen_random_uuid(), 'supervisor@teleguardia.com', 'Supervisor Motorizado', true, 'supervisor')
    ON CONFLICT (email) DO UPDATE SET 
        full_name = EXCLUDED.full_name,
        active = true,
        username = EXCLUDED.username
    RETURNING id INTO supervisor_user_id;
    
    IF supervisor_user_id IS NULL THEN
        SELECT id INTO supervisor_user_id FROM profiles WHERE email = 'supervisor@teleguardia.com';
    END IF;
    
    DELETE FROM user_roles WHERE user_id = supervisor_user_id;
    INSERT INTO user_roles (user_id, role) VALUES (supervisor_user_id, 'supervisor_motorizado');

    -- Técnico General
    INSERT INTO profiles (id, user_id, email, full_name, active, username) 
    VALUES (gen_random_uuid(), gen_random_uuid(), 'tecnico@teleguardia.com', 'Técnico General', true, 'tecnico')
    ON CONFLICT (email) DO UPDATE SET 
        full_name = EXCLUDED.full_name,
        active = true,
        username = EXCLUDED.username
    RETURNING id INTO tecnico_user_id;
    
    IF tecnico_user_id IS NULL THEN
        SELECT id INTO tecnico_user_id FROM profiles WHERE email = 'tecnico@teleguardia.com';
    END IF;
    
    DELETE FROM user_roles WHERE user_id = tecnico_user_id;
    INSERT INTO user_roles (user_id, role) VALUES (tecnico_user_id, 'tecnico');

    -- Asesor de Ventas
    INSERT INTO profiles (id, user_id, email, full_name, active, username) 
    VALUES (gen_random_uuid(), gen_random_uuid(), 'asesor@teleguardia.com', 'Asesor de Ventas', true, 'asesor')
    ON CONFLICT (email) DO UPDATE SET 
        full_name = EXCLUDED.full_name,
        active = true,
        username = EXCLUDED.username
    RETURNING id INTO asesor_user_id;
    
    IF asesor_user_id IS NULL THEN
        SELECT id INTO asesor_user_id FROM profiles WHERE email = 'asesor@teleguardia.com';
    END IF;
    
    DELETE FROM user_roles WHERE user_id = asesor_user_id;
    INSERT INTO user_roles (user_id, role) VALUES (asesor_user_id, 'asesor_ventas');

    -- Director Técnico
    INSERT INTO profiles (id, user_id, email, full_name, active, username) 
    VALUES (gen_random_uuid(), gen_random_uuid(), 'director.tecnico@teleguardia.com', 'Director Técnico', true, 'director_tecnico')
    ON CONFLICT (email) DO UPDATE SET 
        full_name = EXCLUDED.full_name,
        active = true,
        username = EXCLUDED.username
    RETURNING id INTO dt_user_id;
    
    IF dt_user_id IS NULL THEN
        SELECT id INTO dt_user_id FROM profiles WHERE email = 'director.tecnico@teleguardia.com';
    END IF;
    
    DELETE FROM user_roles WHERE user_id = dt_user_id;
    INSERT INTO user_roles (user_id, role) VALUES (dt_user_id, 'director_tecnico');

    -- Técnico Propio
    INSERT INTO profiles (id, user_id, email, full_name, active, username) 
    VALUES (gen_random_uuid(), gen_random_uuid(), 'tecnico.propio@teleguardia.com', 'Técnico Propio', true, 'tecnico_propio')
    ON CONFLICT (email) DO UPDATE SET 
        full_name = EXCLUDED.full_name,
        active = true,
        username = EXCLUDED.username
    RETURNING id INTO tp_user_id;
    
    IF tp_user_id IS NULL THEN
        SELECT id INTO tp_user_id FROM profiles WHERE email = 'tecnico.propio@teleguardia.com';
    END IF;
    
    DELETE FROM user_roles WHERE user_id = tp_user_id;
    INSERT INTO user_roles (user_id, role) VALUES (tp_user_id, 'tecnico_propio');

    -- Técnico Externo
    INSERT INTO profiles (id, user_id, email, full_name, active, username) 
    VALUES (gen_random_uuid(), gen_random_uuid(), 'tecnico.externo@teleguardia.com', 'Técnico Externo', true, 'tecnico_externo')
    ON CONFLICT (email) DO UPDATE SET 
        full_name = EXCLUDED.full_name,
        active = true,
        username = EXCLUDED.username
    RETURNING id INTO te_user_id;
    
    IF te_user_id IS NULL THEN
        SELECT id INTO te_user_id FROM profiles WHERE email = 'tecnico.externo@teleguardia.com';
    END IF;
    
    DELETE FROM user_roles WHERE user_id = te_user_id;
    INSERT INTO user_roles (user_id, role) VALUES (te_user_id, 'tecnico_externo');

    RAISE NOTICE 'Usuarios de prueba creados/actualizados con roles correctos';
END $$;