-- Asignar rol de operador_alarmas al usuario operador@teleguardia.com
INSERT INTO user_roles (user_id, role)
SELECT user_id, 'operador_alarmas'::user_role
FROM profiles 
WHERE email = 'operador@teleguardia.com'
ON CONFLICT (user_id, role) DO NOTHING;