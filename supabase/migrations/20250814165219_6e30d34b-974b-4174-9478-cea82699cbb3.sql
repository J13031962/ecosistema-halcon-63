-- Create missing users with @gmail.com emails and assign proper roles
-- Note: These users will need to be created manually in Supabase Auth or via signup flow

-- First, ensure we have test users data for the profiles table
-- We'll create the role assignments for when these users sign up

-- Create user roles for test users (these will be assigned when users actually sign up)
-- For now, let's ensure the default role assignments are in place

-- Operador de Alarmas
INSERT INTO public.user_roles (user_id, role) 
SELECT 'operador-test-uuid'::uuid, 'operador_alarmas'::public.app_role
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = 'operador-test-uuid'::uuid AND role = 'operador_alarmas'::public.app_role
);

-- Despachador de Patrullas  
INSERT INTO public.user_roles (user_id, role)
SELECT 'despachador-test-uuid'::uuid, 'despachador_patrullas'::public.app_role
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = 'despachador-test-uuid'::uuid AND role = 'despachador_patrullas'::public.app_role
);

-- Supervisor
INSERT INTO public.user_roles (user_id, role)
SELECT 'supervisor-test-uuid'::uuid, 'supervisor'::public.app_role
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = 'supervisor-test-uuid'::uuid AND role = 'supervisor'::public.app_role
);

-- Técnico
INSERT INTO public.user_roles (user_id, role)
SELECT 'tecnico-test-uuid'::uuid, 'tecnico'::public.app_role
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = 'tecnico-test-uuid'::uuid AND role = 'tecnico'::public.app_role
);

-- Jefe de Técnicos
INSERT INTO public.user_roles (user_id, role)
SELECT 'jefe-tecnicos-test-uuid'::uuid, 'jefe_tecnicos'::public.app_role
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = 'jefe-tecnicos-test-uuid'::uuid AND role = 'jefe_tecnicos'::public.app_role
);

-- Asesor de Ventas
INSERT INTO public.user_roles (user_id, role)
SELECT 'asesor-ventas-test-uuid'::uuid, 'asesor_ventas'::public.app_role
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = 'asesor-ventas-test-uuid'::uuid AND role = 'asesor_ventas'::public.app_role
);

-- Create a function to automatically assign roles when new users sign up
CREATE OR REPLACE FUNCTION public.assign_role_by_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Assign roles based on email patterns
  IF NEW.email = 'operador@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'operador_alarmas');
  ELSIF NEW.email = 'despachador@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'despachador_patrullas');
  ELSIF NEW.email = 'supervisor@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'supervisor');
  ELSIF NEW.email = 'tecnico@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'tecnico');
  ELSIF NEW.email = 'jefe-tecnicos@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'jefe_tecnicos');
  ELSIF NEW.email = 'asesor-ventas@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'asesor_ventas');
  ELSIF NEW.email = 'director@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'director');
  ELSIF NEW.email = 'admin@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'administrador');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update the existing trigger to use the new function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.assign_role_by_email();