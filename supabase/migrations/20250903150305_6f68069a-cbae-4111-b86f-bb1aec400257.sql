-- Actualizar el perfil del administrador para que tenga la contraseña correcta
-- y crear usuarios de prueba manualmente por verificar que ya existen en auth

-- Primero vamos a verificar si tenemos usuarios existentes y sus roles
DO $$
DECLARE
    admin_user_id UUID;
    user_count INTEGER;
BEGIN
    -- Verificar usuario admin
    SELECT id INTO admin_user_id FROM profiles WHERE email = 'admin@empresa.com' LIMIT 1;
    
    IF admin_user_id IS NOT NULL THEN
        -- Limpiar roles existentes del admin
        DELETE FROM user_roles WHERE user_id = admin_user_id;
        -- Asignar rol de administrador
        INSERT INTO user_roles (user_id, role) VALUES (admin_user_id, 'administrador');
        RAISE NOTICE 'Rol de administrador asignado a: %', admin_user_id;
    END IF;

    -- Contar cuántos usuarios existen en profiles
    SELECT COUNT(*) INTO user_count FROM profiles;
    RAISE NOTICE 'Total de usuarios en profiles: %', user_count;

    -- Verificar usuarios específicos y sus roles
    FOR user_rec IN 
        SELECT p.id, p.email, p.full_name, 
               COALESCE(array_agg(ur.role) FILTER (WHERE ur.role IS NOT NULL), ARRAY[]::user_role[]) as roles
        FROM profiles p
        LEFT JOIN user_roles ur ON p.id = ur.user_id
        GROUP BY p.id, p.email, p.full_name
        ORDER BY p.email
    LOOP
        RAISE NOTICE 'Usuario: % (%): %', user_rec.full_name, user_rec.email, user_rec.roles;
    END LOOP;

END $$;