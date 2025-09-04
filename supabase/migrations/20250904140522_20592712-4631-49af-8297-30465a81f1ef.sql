-- Completar la configuración del administrador existente
INSERT INTO profiles (id, user_id, email, full_name, active) 
VALUES (
  'd2c8ee73-0823-4edd-a0ae-8fd35d694221',
  'd2c8ee73-0823-4edd-a0ae-8fd35d694221',
  'admin@empresa.com',
  'Administrador Principal',
  true
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  active = EXCLUDED.active;

-- Asegurar que tenga el rol de administrador
INSERT INTO user_roles (user_id, role) 
VALUES ('d2c8ee73-0823-4edd-a0ae-8fd35d694221', 'administrador'::user_role)
ON CONFLICT (user_id, role) DO NOTHING;