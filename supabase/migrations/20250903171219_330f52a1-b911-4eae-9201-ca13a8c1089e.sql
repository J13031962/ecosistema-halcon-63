-- Crear usuario supervisor@teleguardia.com si no existe
DO $$
DECLARE
    supervisor_user_id uuid;
BEGIN
    -- Verificar si ya existe
    SELECT user_id INTO supervisor_user_id 
    FROM profiles 
    WHERE email = 'supervisor@teleguardia.com';
    
    -- Si no existe, crear el perfil
    IF supervisor_user_id IS NULL THEN
        supervisor_user_id := gen_random_uuid();
        
        INSERT INTO public.profiles (id, user_id, email, full_name, active)
        VALUES (supervisor_user_id, supervisor_user_id, 'supervisor@teleguardia.com', 'Supervisor Teleguardia', true);
        
        -- Asignar el rol de supervisor_motorizado
        INSERT INTO public.user_roles (user_id, role)
        VALUES (supervisor_user_id, 'supervisor_motorizado');
        
        RAISE NOTICE 'Usuario supervisor@teleguardia.com creado con rol supervisor_motorizado';
    ELSE
        -- Si existe, verificar que tenga el rol correcto
        IF NOT EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = supervisor_user_id 
            AND role = 'supervisor_motorizado'
        ) THEN
            INSERT INTO public.user_roles (user_id, role)
            VALUES (supervisor_user_id, 'supervisor_motorizado');
            
            RAISE NOTICE 'Rol supervisor_motorizado asignado a usuario existente';
        END IF;
    END IF;
END
$$;