-- Función para asignar roles de forma segura (evitando problemas de RLS)
CREATE OR REPLACE FUNCTION public.assign_user_role_safely(
  target_email text,
  target_role user_role
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id uuid;
  profile_exists boolean;
BEGIN
  -- Buscar el usuario en auth.users por email
  SELECT au.id INTO target_user_id
  FROM auth.users au
  WHERE au.email = target_email;
  
  IF target_user_id IS NULL THEN
    RAISE NOTICE 'Usuario no encontrado: %', target_email;
    RETURN false;
  END IF;
  
  -- Verificar si existe el perfil, si no, crearlo
  SELECT EXISTS(SELECT 1 FROM profiles WHERE user_id = target_user_id) INTO profile_exists;
  
  IF NOT profile_exists THEN
    INSERT INTO profiles (id, user_id, email, full_name, active)
    VALUES (target_user_id, target_user_id, target_email, target_email, true)
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      active = EXCLUDED.active;
  END IF;
  
  -- Asignar el rol (eliminar roles existentes primero para evitar duplicados)
  DELETE FROM user_roles WHERE user_id = target_user_id;
  
  INSERT INTO user_roles (user_id, role)
  VALUES (target_user_id, target_role);
  
  -- Actualizar o crear en users_auth para compatibilidad
  INSERT INTO users_auth (id, email, full_name, password, role, active)
  VALUES (target_user_id, target_email, target_email, 'supabase_managed', target_role::text, true)
  ON CONFLICT (email) DO UPDATE SET
    role = EXCLUDED.role,
    active = EXCLUDED.active;
  
  RAISE NOTICE 'Rol % asignado exitosamente a %', target_role, target_email;
  RETURN true;
END;
$$;

-- Asignar el rol de supervisor a supervisor3@teleguardia.com
SELECT public.assign_user_role_safely('supervisor3@teleguardia.com', 'supervisor_motorizado');

-- Verificar que admin@teleguardia.com tenga rol de administrador
SELECT public.assign_user_role_safely('admin@teleguardia.com', 'administrador');

-- Función para verificar y corregir usuarios sin roles
CREATE OR REPLACE FUNCTION public.fix_users_without_roles()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Buscar usuarios en profiles que no tienen roles asignados
  FOR user_record IN
    SELECT p.user_id, p.email, p.full_name
    FROM profiles p
    LEFT JOIN user_roles ur ON ur.user_id = p.user_id
    WHERE ur.user_id IS NULL
      AND p.active = true
  LOOP
    -- Asignar rol de usuario por defecto
    INSERT INTO user_roles (user_id, role)
    VALUES (user_record.user_id, 'usuario')
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Rol de usuario asignado a: %', user_record.email;
  END LOOP;
END;
$$;

-- Ejecutar la corrección
SELECT public.fix_users_without_roles();