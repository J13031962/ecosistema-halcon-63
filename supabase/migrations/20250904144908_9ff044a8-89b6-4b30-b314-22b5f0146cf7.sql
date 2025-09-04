-- Crear usuario administrativo en el sistema si no existe
-- Versión corregida sin ON CONFLICT

DO $$
DECLARE
    admin_user_id uuid;
    admin_exists boolean := false;
BEGIN
    -- Buscar si ya existe el perfil del admin
    SELECT id, true INTO admin_user_id, admin_exists
    FROM public.profiles 
    WHERE email = 'admin@teleguardia.com' 
    LIMIT 1;
    
    -- Si no existe, crearlo
    IF NOT admin_exists THEN
        -- Generar un UUID para el admin
        admin_user_id := gen_random_uuid();
        
        -- Insertar perfil del admin
        INSERT INTO public.profiles (id, user_id, email, full_name, active)
        VALUES (admin_user_id, admin_user_id, 'admin@teleguardia.com', 'Administrador Sistema', true);
        
        RAISE NOTICE 'Perfil de administrador creado con ID: %', admin_user_id;
    ELSE
        RAISE NOTICE 'Perfil de administrador ya existe con ID: %', admin_user_id;
    END IF;
    
    -- Asegurar que tiene el rol de administrador
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'administrador'::user_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- También crear/actualizar en users_auth para compatibilidad
    -- Verificar si existe primero
    IF NOT EXISTS (SELECT 1 FROM public.users_auth WHERE email = 'admin@teleguardia.com') THEN
        INSERT INTO public.users_auth (id, email, full_name, password, role, active)
        VALUES (admin_user_id, 'admin@teleguardia.com', 'Administrador Sistema', 'admin123', 'administrador', true);
    ELSE
        UPDATE public.users_auth 
        SET full_name = 'Administrador Sistema',
            role = 'administrador',
            active = true
        WHERE email = 'admin@teleguardia.com';
    END IF;
        
    RAISE NOTICE 'Usuario administrador configurado correctamente';
END $$;