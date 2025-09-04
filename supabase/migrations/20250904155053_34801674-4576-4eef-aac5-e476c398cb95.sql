-- Limpiar roles duplicados para supervisor4@teleguardia.com
-- Primero eliminar el rol incorrecto de operador_alarmas
DELETE FROM user_roles 
WHERE user_id = (SELECT id FROM profiles WHERE email = 'supervisor4@teleguardia.com')
AND role = 'operador_alarmas';

-- Asegurar que solo tenga el rol de supervisor_motorizado
INSERT INTO user_roles (user_id, role)
SELECT id, 'supervisor_motorizado'::user_role
FROM profiles 
WHERE email = 'supervisor4@teleguardia.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Actualizar también en users_auth para compatibilidad
UPDATE users_auth 
SET role = 'supervisor_motorizado'
WHERE email = 'supervisor4@teleguardia.com';