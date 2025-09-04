-- ============================================
-- CORRECCIÓN COMPLETA DEL SISTEMA DE AUTENTICACIÓN
-- ============================================

-- 1. Corregir funciones existentes con search_path
DROP FUNCTION IF EXISTS public.update_observaciones_count();
DROP FUNCTION IF EXISTS public.calculate_patrulla_duration();
DROP FUNCTION IF EXISTS public.update_servicios_tecnicos_timestamp();
DROP FUNCTION IF EXISTS public.generate_numero_cuenta();
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Recrear funciones con search_path correcto
CREATE OR REPLACE FUNCTION public.update_observaciones_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.alarmas 
  SET observaciones_count = (
    SELECT COUNT(*) 
    FROM public.observaciones_alarmas 
    WHERE alarma_id = NEW.alarma_id
  )
  WHERE id = NEW.alarma_id;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_patrulla_duration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.tiempo_fin IS NOT NULL AND NEW.tiempo_inicio IS NOT NULL THEN
    NEW.duracion_segundos = EXTRACT(EPOCH FROM (NEW.tiempo_fin - NEW.tiempo_inicio))::INTEGER;
  END IF;
  
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_servicios_tecnicos_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_numero_cuenta()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.numero_cuenta IS NULL OR NEW.numero_cuenta = '' THEN
    NEW.numero_cuenta := 'CTE-' || LPAD(nextval('clientes_numero_cuenta_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$;

-- Corregir función handle_new_user para no asignar rol automático
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- 2. Crear función de emergencia para acceso de administrador
CREATE OR REPLACE FUNCTION public.emergency_admin_access()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Permite acceso completo al usuario admin@empresa.com
  SELECT auth.jwt() ->> 'email' = 'admin@empresa.com' OR EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'administrador'::user_role
  );
$$;

-- 3. Aplicar políticas de emergencia más permisivas para roles y perfiles
DROP POLICY IF EXISTS "Anyone can view user roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can insert user roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can update user roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can delete user roles" ON user_roles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can manage profiles" ON profiles;

-- Políticas de emergencia para user_roles
CREATE POLICY "Emergency access for user roles - SELECT"
ON user_roles FOR SELECT
USING (true);  -- Lectura libre para todos

CREATE POLICY "Emergency access for user roles - INSERT"
ON user_roles FOR INSERT
WITH CHECK (public.emergency_admin_access());

CREATE POLICY "Emergency access for user roles - UPDATE"
ON user_roles FOR UPDATE
USING (public.emergency_admin_access());

CREATE POLICY "Emergency access for user roles - DELETE"
ON user_roles FOR DELETE
USING (public.emergency_admin_access());

-- Políticas de emergencia para profiles
CREATE POLICY "Emergency access for profiles - SELECT"
ON profiles FOR SELECT
USING (true);  -- Lectura libre para todos

CREATE POLICY "Emergency access for profiles - UPDATE"
ON profiles FOR UPDATE
USING (public.emergency_admin_access() OR id = auth.uid());

CREATE POLICY "Emergency access for profiles - INSERT"
ON profiles FOR INSERT
WITH CHECK (public.emergency_admin_access() OR id = auth.uid());

CREATE POLICY "Emergency access for profiles - DELETE"
ON profiles FOR DELETE
USING (public.emergency_admin_access());

-- 4. Verificar que admin@empresa.com tenga rol de administrador
INSERT INTO user_roles (user_id, role)
SELECT id, 'administrador'::user_role
FROM profiles 
WHERE email = 'admin@empresa.com'
AND NOT EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = profiles.id 
  AND role = 'administrador'::user_role
);

-- 5. Activar todos los perfiles por defecto
UPDATE profiles SET active = true WHERE active IS NULL;