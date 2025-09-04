-- Create a function to automatically assign roles when new users sign up based on email
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
  ELSIF NEW.email = 'supervisor@teleguardia.com' THEN
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
-- This will replace the existing handle_new_user function behavior
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.assign_role_by_email();