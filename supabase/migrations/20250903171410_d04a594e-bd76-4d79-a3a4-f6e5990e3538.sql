-- Primero verificar qué usuarios existen en auth.users pero no en profiles
-- y crear el perfil para supervisor@teleguardia.com

-- Buscar el usuario en auth.users y crear su perfil si no existe
DO $$
DECLARE
    auth_user_record record;
    supervisor_profile_id uuid;
BEGIN
    -- Buscar usuarios en auth.users que tengan emails con 'supervisor' y 'teleguardia'
    FOR auth_user_record IN 
        SELECT id, email, raw_user_meta_data
        FROM auth.users 
        WHERE email LIKE '%supervisor%' AND email LIKE '%teleguardia%'
    LOOP
        -- Verificar si ya existe el perfil
        SELECT id INTO supervisor_profile_id 
        FROM profiles 
        WHERE user_id = auth_user_record.id;
        
        -- Si no existe, crear el perfil
        IF supervisor_profile_id IS NULL THEN
            INSERT INTO public.profiles (id, user_id, email, full_name, active)
            VALUES (
                auth_user_record.id, 
                auth_user_record.id, 
                auth_user_record.email, 
                COALESCE(auth_user_record.raw_user_meta_data->>'full_name', 'Supervisor Teleguardia'), 
                true
            );
            
            RAISE NOTICE 'Perfil creado para usuario: %', auth_user_record.email;
        END IF;
        
        -- Asignar el rol de supervisor_motorizado si no lo tiene
        IF NOT EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth_user_record.id 
            AND role = 'supervisor_motorizado'
        ) THEN
            INSERT INTO public.user_roles (user_id, role)
            VALUES (auth_user_record.id, 'supervisor_motorizado');
            
            RAISE NOTICE 'Rol supervisor_motorizado asignado a: %', auth_user_record.email;
        END IF;
    END LOOP;
    
    -- Si no encontramos ningún usuario, reportarlo
    IF NOT FOUND THEN
        RAISE NOTICE 'No se encontró ningún usuario supervisor en auth.users';
    END IF;
END
$$;