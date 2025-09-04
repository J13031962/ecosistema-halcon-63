-- CRITICAL SECURITY FIXES

-- 1. Enable RLS on all tables that should have it
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. Add missing RLS policies for users table
-- Only admins can manage users
CREATE POLICY "Admins can manage all users" 
ON public.users 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'administrador'::app_role
  )
);

-- 3. Add missing INSERT policy for profiles table
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 4. Add missing DELETE policy for profiles table  
CREATE POLICY "Users can delete their own profile" 
ON public.profiles 
FOR DELETE 
USING (auth.uid() = user_id);

-- 5. Strengthen user_roles policies to prevent privilege escalation
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Only admins can manage roles
CREATE POLICY "Admins can manage all user roles" 
ON public.user_roles 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 
    FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'administrador'::app_role
  )
);

-- 6. Fix function search_path security issue
CREATE OR REPLACE FUNCTION public.has_permission(user_uuid uuid, permission_key text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.get_user_roles(user_uuid uuid DEFAULT auth.uid())
RETURNS app_role[]
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT ARRAY_AGG(role) 
  FROM public.user_roles 
  WHERE user_id = user_uuid;
$function$;

CREATE OR REPLACE FUNCTION public.log_user_change(p_user_id uuid, p_change_type text, p_old_values jsonb DEFAULT NULL::jsonb, p_new_values jsonb DEFAULT NULL::jsonb, p_description text DEFAULT NULL::text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  INSERT INTO public.user_change_history (
    user_id, 
    changed_by, 
    change_type, 
    old_values, 
    new_values, 
    description
  )
  VALUES (
    p_user_id,
    auth.uid(),
    p_change_type,
    p_old_values,
    p_new_values,
    p_description
  );
$function$;

-- 7. Create secure password hashing function
CREATE OR REPLACE FUNCTION public.hash_password(password text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN crypt(password, gen_salt('bf', 12));
END;
$function$;

-- 8. Create secure password verification function
CREATE OR REPLACE FUNCTION public.verify_password(password text, hash text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN hash = crypt(password, hash);
END;
$function$;