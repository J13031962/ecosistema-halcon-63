-- Corregir TODAS las políticas para usar el email correcto: admin@teleguardia.com

-- Eliminar políticas con email incorrecto
DROP POLICY IF EXISTS "admin_only_policy" ON public.user_roles;
DROP POLICY IF EXISTS "read_only_policy" ON public.user_roles;
DROP POLICY IF EXISTS "Ultra simple profiles access" ON public.profiles;

-- Crear políticas con el email CORRECTO
CREATE POLICY "teleguardia_admin_only_policy" ON public.user_roles
FOR ALL USING (
  (auth.jwt() ->> 'email') = 'admin@teleguardia.com'
);

CREATE POLICY "teleguardia_read_only_policy" ON public.user_roles
FOR SELECT USING (true);

CREATE POLICY "teleguardia_profiles_access" ON public.profiles
FOR ALL USING (
  (auth.jwt() ->> 'email') = 'admin@teleguardia.com' OR id = auth.uid()
);

-- Actualizar la función de verificación de admin
CREATE OR REPLACE FUNCTION public.is_admin_email()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (auth.jwt() ->> 'email') = 'admin@teleguardia.com';
$$;

-- Actualizar función emergency_admin_check
CREATE OR REPLACE FUNCTION public.emergency_admin_check()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (auth.jwt() ->> 'email') = 'admin@teleguardia.com';
$$;

-- Buscar el ID correcto del administrador de teleguardia
DO $$
DECLARE
    admin_id uuid;
BEGIN
    -- Buscar en auth.users
    SELECT id INTO admin_id 
    FROM auth.users 
    WHERE email = 'admin@teleguardia.com'
    LIMIT 1;
    
    -- Si no existe en auth.users, buscar en users_auth
    IF admin_id IS NULL THEN
        SELECT id INTO admin_id 
        FROM public.users_auth 
        WHERE email = 'admin@teleguardia.com'
        LIMIT 1;
    END IF;
    
    -- Si encontramos el admin, configurarlo
    IF admin_id IS NOT NULL THEN
        -- Asegurar que existe en profiles
        INSERT INTO public.profiles (id, user_id, email, full_name, active) 
        VALUES (
          admin_id,
          admin_id,
          'admin@teleguardia.com',
          'Administrador Teleguardia',
          true
        ) ON CONFLICT (id) DO UPDATE SET
          email = EXCLUDED.email,
          full_name = EXCLUDED.full_name,
          active = EXCLUDED.active;

        -- Asegurar que tiene el rol de administrador
        INSERT INTO public.user_roles (user_id, role) 
        VALUES (admin_id, 'administrador'::user_role)
        ON CONFLICT (user_id, role) DO NOTHING;
        
        RAISE NOTICE 'Administrador Teleguardia configurado correctamente: %', admin_id;
    ELSE
        RAISE NOTICE 'No se encontró admin@teleguardia.com en ningún sistema de autenticación';
    END IF;
END $$;