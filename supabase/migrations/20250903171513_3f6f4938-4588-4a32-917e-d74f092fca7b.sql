-- Crear directamente el usuario supervisor@teleguardia.com en profiles y asignar rol
-- Ya que parece que no existe en auth.users

DO $$
DECLARE
    new_user_id uuid;
BEGIN
    -- Generar un UUID para el nuevo usuario
    new_user_id := gen_random_uuid();
    
    -- Verificar si ya existe
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'supervisor@teleguardia.com') THEN
        -- Crear el perfil
        INSERT INTO public.profiles (id, user_id, email, full_name, active)
        VALUES (new_user_id, new_user_id, 'supervisor@teleguardia.com', 'Supervisor Teleguardia', true);
        
        -- Asignar el rol de supervisor_motorizado
        INSERT INTO public.user_roles (user_id, role)
        VALUES (new_user_id, 'supervisor_motorizado');
        
        RAISE NOTICE 'Usuario supervisor@teleguardia.com creado con rol supervisor_motorizado';
    ELSE
        RAISE NOTICE 'Usuario supervisor@teleguardia.com ya existe';
    END IF;
END
$$;