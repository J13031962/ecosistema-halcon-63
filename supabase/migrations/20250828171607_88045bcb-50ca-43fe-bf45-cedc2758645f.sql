-- ============================================
-- CORRECCIÓN SIMPLE Y DIRECTA - ACCESO DE EMERGENCIA
-- ============================================

-- Crear función de emergencia para admin@empresa.com
CREATE OR REPLACE FUNCTION public.emergency_admin_check()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.jwt() ->> 'email' = 'admin@empresa.com';
$$;

-- Verificar que admin@empresa.com tenga rol de administrador
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN profiles p ON ur.user_id = p.id
    WHERE p.email = 'admin@empresa.com' AND ur.role = 'administrador'::user_role
  ) THEN
    INSERT INTO user_roles (user_id, role)
    SELECT id, 'administrador'::user_role
    FROM profiles 
    WHERE email = 'admin@empresa.com';
  END IF;
END $$;