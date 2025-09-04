-- Fix the security warnings by updating functions with proper search_path and correct enum type
CREATE OR REPLACE FUNCTION public.assign_role_by_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Assign roles based on email patterns
  IF NEW.email = 'operador@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'operador_alarmas'::user_role);
  ELSIF NEW.email = 'despachador@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'despachador_patrullas'::user_role);
  ELSIF NEW.email = 'supervisor@teleguardia.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'supervisor'::user_role);
  ELSIF NEW.email = 'tecnico@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'tecnico'::user_role);
  ELSIF NEW.email = 'jefe-tecnicos@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'jefe_tecnicos'::user_role);
  ELSIF NEW.email = 'asesor-ventas@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'asesor_ventas'::user_role);
  ELSIF NEW.email = 'director@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'director'::user_role);
  ELSIF NEW.email = 'admin@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'administrador'::user_role);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Also fix the other functions to have proper search_path
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role user_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_roles(target_user_id uuid)
RETURNS SETOF public.user_roles
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT * FROM public.user_roles WHERE user_id = target_user_id;
$$;

CREATE OR REPLACE FUNCTION public.has_permission(target_user_id uuid, permission_key text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_permissions 
    WHERE user_id = target_user_id AND function_key = permission_key
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin_user(user_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = user_id_param AND role = 'administrador'::user_role
  );
$$;