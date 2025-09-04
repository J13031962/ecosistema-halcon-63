-- Crear usuario administrativo en el sistema si no existe
-- Primero verificar si ya existe el usuario admin@teleguardia.com en profiles

DO $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- Buscar si ya existe el perfil del admin
    SELECT id INTO admin_user_id 
    FROM public.profiles 
    WHERE email = 'admin@teleguardia.com' 
    LIMIT 1;
    
    -- Si no existe, crearlo
    IF admin_user_id IS NULL THEN
        -- Generar un UUID para el admin
        admin_user_id := gen_random_uuid();
        
        -- Insertar perfil del admin
        INSERT INTO public.profiles (id, user_id, email, full_name, active)
        VALUES (admin_user_id, admin_user_id, 'admin@teleguardia.com', 'Administrador Sistema', true)
        ON CONFLICT (email) DO UPDATE SET
            full_name = EXCLUDED.full_name,
            active = EXCLUDED.active;
        
        RAISE NOTICE 'Perfil de administrador creado con ID: %', admin_user_id;
    ELSE
        RAISE NOTICE 'Perfil de administrador ya existe con ID: %', admin_user_id;
    END IF;
    
    -- Asegurar que tiene el rol de administrador
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'administrador'::user_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- También crear/actualizar en users_auth para compatibilidad
    INSERT INTO public.users_auth (id, email, full_name, password, role, active)
    VALUES (admin_user_id, 'admin@teleguardia.com', 'Administrador Sistema', 'admin123', 'administrador', true)
    ON CONFLICT (email) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        active = EXCLUDED.active;
        
    RAISE NOTICE 'Usuario administrador configurado correctamente';
END $$;