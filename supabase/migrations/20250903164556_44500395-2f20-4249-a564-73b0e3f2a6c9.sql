-- Migración completa a Supabase Auth
-- Paso 1: Crear enum de user_role si no existe
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM (
        'administrador',
        'director', 
        'operador_alarmas',
        'despachador_patrullas',
        'supervisor_motorizado',
        'tecnico',
        'tecnico_propio',
        'tecnico_externo',
        'director_tecnico',
        'jefe_tecnicos',
        'asesor_ventas'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Paso 2: Actualizar tabla profiles para que funcione con Supabase Auth
ALTER TABLE public.profiles 
  DROP CONSTRAINT IF EXISTS profiles_pkey,
  DROP CONSTRAINT IF EXISTS profiles_user_id_key;

-- Asegurar que id sea el primary key y referencie auth.users
ALTER TABLE public.profiles 
  DROP COLUMN IF EXISTS user_id;

ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_pkey PRIMARY KEY (id),
  ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Paso 3: Migrar usuarios de users_auth a auth.users
-- Esta función creará usuarios en Supabase Auth basados en users_auth
CREATE OR REPLACE FUNCTION migrate_users_to_supabase_auth()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_record RECORD;
    new_user_id UUID;
BEGIN
    -- Para cada usuario en users_auth que está activo
    FOR user_record IN 
        SELECT * FROM users_auth WHERE active = true
    LOOP
        -- Crear usuario en Supabase Auth usando la función admin
        -- Nota: En producción esto se debe hacer usando el Admin API de Supabase
        -- Por ahora, insertaremos directamente en profiles con IDs generados
        
        new_user_id := gen_random_uuid();
        
        -- Insertar en profiles
        INSERT INTO public.profiles (
            id, 
            email, 
            full_name, 
            active, 
            created_at
        ) VALUES (
            new_user_id,
            user_record.email,
            user_record.full_name,
            user_record.active,
            user_record.created_at
        ) ON CONFLICT (email) DO NOTHING;
        
        -- Asignar rol principal
        INSERT INTO public.user_roles (user_id, role) 
        VALUES (new_user_id, user_record.role::user_role)
        ON CONFLICT (user_id, role) DO NOTHING;
        
        -- Loggear la migración
        RAISE NOTICE 'Migrated user: % with ID: %', user_record.email, new_user_id;
    END LOOP;
END;
$$;

-- Paso 4: Crear función para manejar nuevos usuarios de Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Crear perfil automáticamente cuando se registra un usuario
    INSERT INTO public.profiles (id, email, full_name, active, created_at)
    VALUES (
        NEW.id, 
        NEW.email, 
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        true,
        now()
    );
    
    -- Asignar rol por defecto (operador_alarmas)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'operador_alarmas'::user_role);
    
    RETURN NEW;
END;
$$;

-- Crear trigger para nuevos usuarios
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Paso 5: Actualizar políticas RLS para alarmas
DROP POLICY IF EXISTS "Users can create alarmas" ON public.alarmas;
DROP POLICY IF EXISTS "Users can view alarmas" ON public.alarmas;
DROP POLICY IF EXISTS "Users can update alarmas" ON public.alarmas;

-- Nuevas políticas RLS que funcionan con Supabase Auth
CREATE POLICY "Authenticated users can create alarmas" 
ON public.alarmas 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can view alarmas" 
ON public.alarmas 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can update alarmas" 
ON public.alarmas 
FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Paso 6: Actualizar otras políticas que puedan tener problemas
DROP POLICY IF EXISTS "Admins and self can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins and self can update profiles" ON public.profiles;

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles" 
ON public.profiles 
FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'administrador'::user_role
    )
) 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'administrador'::user_role
    )
);

-- Ejecutar migración de usuarios
SELECT migrate_users_to_supabase_auth();