-- Arreglar las funciones con search_path inseguro
CREATE OR REPLACE FUNCTION public.get_user_roles(user_uuid uuid DEFAULT auth.uid())
RETURNS app_role[]
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT ARRAY_AGG(role) 
  FROM public.user_roles 
  WHERE user_id = user_uuid;
$$;

CREATE OR REPLACE FUNCTION public.has_permission(user_uuid uuid, permission_key text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  -- Verificar si tiene el permiso específico asignado
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_permissions up
    WHERE up.user_id = user_uuid 
    AND up.function_key = permission_key
  )
  OR
  -- O si su rol principal incluye esa función
  EXISTS (
    SELECT 1 
    FROM public.user_roles ur
    JOIN public.system_functions sf ON sf.role_origin = ur.role::text
    WHERE ur.user_id = user_uuid 
    AND sf.function_key = permission_key
  );
$$;