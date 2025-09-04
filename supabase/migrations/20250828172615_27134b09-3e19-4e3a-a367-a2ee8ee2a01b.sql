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