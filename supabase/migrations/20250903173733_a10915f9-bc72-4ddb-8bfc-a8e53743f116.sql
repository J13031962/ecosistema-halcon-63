-- Corregir la función get_consolidated_user_data para manejar tipos correctamente
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
    au.email::text,
    COALESCE(p.full_name, (au.raw_user_meta_data->>'full_name')::text, au.email::text) as full_name,
    COALESCE(ur.role::text, 'usuario'::text) as role,
    COALESCE(p.active, true) as active,
    'supabase_auth'::text as auth_source
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
      ua.email::text,
      ua.full_name::text,
      ua.role::text,
      ua.active,
      'legacy_auth'::text as auth_source
    FROM public.users_auth ua
    WHERE ua.email = user_email
    AND ua.active = true
    LIMIT 1;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verificar y sincronizar específicamente el supervisor
UPDATE public.profiles 
SET email = 'supervisor@teleguardia.com', 
    full_name = 'Supervisor Motorizado'
WHERE id = '51f4e21a-0438-49df-96a5-d85f1324e57e';

-- Asegurar que el supervisor tiene el rol correcto
INSERT INTO public.user_roles (user_id, role)
VALUES ('51f4e21a-0438-49df-96a5-d85f1324e57e', 'supervisor_motorizado'::user_role)
ON CONFLICT (user_id, role) DO NOTHING;

-- Actualizar las alarmas para usar el ID correcto del supervisor
UPDATE public.alarmas 
SET supervisor_id = '51f4e21a-0438-49df-96a5-d85f1324e57e',
    supervisor = 'Supervisor Motorizado'
WHERE supervisor = 'Supervisor Teleguardia' 
   OR supervisor_id = '51f4e21a-0438-49df-96a5-d85f1324e57e';