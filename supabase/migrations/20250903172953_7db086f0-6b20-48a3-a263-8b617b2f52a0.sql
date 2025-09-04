-- Crear función para sincronizar usuarios entre sistemas de autenticación
CREATE OR REPLACE FUNCTION public.sync_user_auth_systems()
RETURNS TRIGGER AS $$
BEGIN
  -- Cuando se crea un usuario en auth.users, crear/actualizar en users_auth si no existe
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.users_auth (id, email, full_name, password, role, active)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
      'supabase_managed', -- Password especial para usuarios gestionados por Supabase
      'usuario', -- Rol por defecto
      true
    )
    ON CONFLICT (email) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      active = EXCLUDED.active;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger para sincronización automática
DROP TRIGGER IF EXISTS sync_auth_systems_trigger ON auth.users;
CREATE TRIGGER sync_auth_systems_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_auth_systems();

-- Crear función para obtener datos de usuario consolidados
CREATE OR REPLACE FUNCTION public.get_consolidated_user_data(user_email text)
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  role text,
  active boolean,
  auth_source text
) AS $$
BEGIN
  -- Primero buscar en auth.users (Supabase Auth)
  RETURN QUERY
  SELECT 
    au.id,
    au.email,
    COALESCE(p.full_name, au.raw_user_meta_data->>'full_name', au.email) as full_name,
    COALESCE(ur.role::text, 'usuario') as role,
    COALESCE(p.active, true) as active,
    'supabase_auth' as auth_source
  FROM auth.users au
  LEFT JOIN public.profiles p ON p.user_id = au.id
  LEFT JOIN public.user_roles ur ON ur.user_id = au.id
  WHERE au.email = user_email
  LIMIT 1;
  
  -- Si no se encuentra, buscar en users_auth
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      ua.id,
      ua.email,
      ua.full_name,
      ua.role,
      ua.active,
      'legacy_auth' as auth_source
    FROM public.users_auth ua
    WHERE ua.email = user_email
    AND ua.active = true
    LIMIT 1;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Sincronizar usuarios existentes de users_auth a auth.users/profiles
DO $$
DECLARE
  user_record RECORD;
BEGIN
  -- Recorrer usuarios de users_auth que no están en auth.users
  FOR user_record IN 
    SELECT ua.* FROM public.users_auth ua
    LEFT JOIN auth.users au ON au.email = ua.email
    WHERE au.id IS NULL AND ua.active = true
  LOOP
    -- Crear usuario en auth.users usando la función de admin
    -- Nota: Esto requiere privilegios especiales, en producción se debe hacer manualmente
    BEGIN
      -- Crear perfil directamente (simulando la creación de usuario)
      INSERT INTO public.profiles (id, user_id, email, full_name, active)
      VALUES (user_record.id, user_record.id, user_record.email, user_record.full_name, user_record.active)
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        active = EXCLUDED.active;
      
      -- Crear rol si no existe
      INSERT INTO public.user_roles (user_id, role)
      VALUES (user_record.id, user_record.role::user_role)
      ON CONFLICT (user_id, role) DO NOTHING;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error sincronizando usuario %: %', user_record.email, SQLERRM;
    END;
  END LOOP;
END $$;

-- Función para verificar y sincronizar datos específicos del supervisor
CREATE OR REPLACE FUNCTION public.ensure_supervisor_data_integrity()
RETURNS void AS $$
DECLARE
  supervisor_email text := 'supervisor@teleguardia.com';
  supervisor_id uuid;
  supervisor_name text := 'Supervisor Motorizado';
BEGIN
  -- Buscar el supervisor en cualquiera de los sistemas
  SELECT id INTO supervisor_id 
  FROM (
    SELECT p.id FROM public.profiles p WHERE p.email = supervisor_email
    UNION
    SELECT ua.id FROM public.users_auth ua WHERE ua.email = supervisor_email
  ) combined_users
  LIMIT 1;
  
  IF supervisor_id IS NOT NULL THEN
    -- Asegurar que existe en profiles
    INSERT INTO public.profiles (id, user_id, email, full_name, active)
    VALUES (supervisor_id, supervisor_id, supervisor_email, supervisor_name, true)
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      active = EXCLUDED.active;
    
    -- Asegurar que tiene el rol correcto
    INSERT INTO public.user_roles (user_id, role)
    VALUES (supervisor_id, 'supervisor_motorizado'::user_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Asegurar que existe en users_auth para compatibilidad
    INSERT INTO public.users_auth (id, email, full_name, password, role, active)
    VALUES (supervisor_id, supervisor_email, supervisor_name, 'supabase_managed', 'supervisor_motorizado', true)
    ON CONFLICT (email) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      role = EXCLUDED.role,
      active = EXCLUDED.active;
      
    RAISE NOTICE 'Supervisor data synchronized successfully for ID: %', supervisor_id;
  ELSE
    RAISE NOTICE 'Supervisor not found in any authentication system';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Ejecutar la sincronización del supervisor
SELECT public.ensure_supervisor_data_integrity();

-- Crear índices para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS idx_alarmas_supervisor_id ON public.alarmas(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_alarmas_supervisor_nombre ON public.alarmas(supervisor);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);