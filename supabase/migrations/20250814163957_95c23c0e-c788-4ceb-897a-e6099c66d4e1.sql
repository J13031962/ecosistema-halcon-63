-- Update admin user role to administrador
UPDATE user_roles 
SET role = 'administrador' 
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'admin@empresa.com'
);

-- Update admin user profile
UPDATE profiles 
SET full_name = 'Administrador del Sistema' 
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'admin@empresa.com'
);