-- ============================================
-- CORRECCIÓN CRÍTICA: ASEGURAR ASIGNACIÓN DE ROLES
-- ============================================

-- Asignar roles faltantes a usuarios recientes que no tienen rol
INSERT INTO user_roles (user_id, role)
SELECT p.id, 'asesor_ventas'::user_role
FROM profiles p
LEFT JOIN user_roles ur ON p.id = ur.user_id
WHERE p.email IN ('asesor4@teleguardia.com', 'asesorventas1@teleguardia.com', 'asesorventas3@teleguardia.com')
  AND ur.role IS NULL;

-- Asignar rol de operador_alarmas a usuarios de prueba
INSERT INTO user_roles (user_id, role)
SELECT p.id, 'operador_alarmas'::user_role
FROM profiles p
LEFT JOIN user_roles ur ON p.id = ur.user_id
WHERE p.email LIKE 'test-%@teleguardia.com'
  AND ur.role IS NULL;

-- Función mejorada para debug de creación de roles
CREATE OR REPLACE FUNCTION public.debug_user_creation()
RETURNS TABLE(
  user_id UUID,
  email TEXT,
  has_profile BOOLEAN,
  has_role BOOLEAN,
  current_role user_role
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT 
    p.id as user_id,
    p.email,
    TRUE as has_profile,
    CASE WHEN ur.role IS NOT NULL THEN TRUE ELSE FALSE END as has_role,
    ur.role as current_role
  FROM profiles p
  LEFT JOIN user_roles ur ON p.id = ur.user_id
  WHERE p.created_at > NOW() - INTERVAL '1 day'
  ORDER BY p.created_at DESC;
$$;