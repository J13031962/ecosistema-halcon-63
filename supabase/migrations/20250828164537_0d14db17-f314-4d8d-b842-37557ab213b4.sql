-- Modificar el trigger para no asignar rol automáticamente
-- Eliminar el trigger existente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recrear la función sin asignación de rol automático
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Solo crear el perfil, SIN asignar rol automático
  INSERT INTO public.profiles (id, user_id, email, full_name)
  VALUES (NEW.id, NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  
  -- NO asignar rol automático aquí
  -- El rol se asignará desde la aplicación según la selección del admin
  
  RETURN NEW;
END;
$$;

-- Recrear el trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Eliminar también el trigger de assign_role_by_email ya que no lo necesitamos
DROP TRIGGER IF EXISTS assign_role_by_email_trigger ON auth.users;