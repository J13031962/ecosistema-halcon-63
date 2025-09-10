-- Crear el usuario operador@teleguardia.com que falta
INSERT INTO profiles (id, user_id, email, full_name, active, created_at)
VALUES (
  gen_random_uuid(),
  gen_random_uuid(),
  'operador@teleguardia.com',
  'Operador Teleguardia',
  true,
  now()
)
ON CONFLICT (email) DO NOTHING;

-- Asignar rol de operador_alarmas al usuario operador@teleguardia.com
INSERT INTO user_roles (user_id, role)
SELECT user_id, 'operador_alarmas'::user_role
FROM profiles 
WHERE email = 'operador@teleguardia.com'
ON CONFLICT (user_id, role) DO NOTHING;