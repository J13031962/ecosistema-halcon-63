-- Crear usuarios de prueba en auth.users para testing
-- Nota: En un entorno real, estos usuarios se crearían a través del panel administrativo

-- Insertar usuarios directamente en auth.users (solo para testing)
-- En producción esto se haría através de la funcionalidad de administrador

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@empresa.com',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  NULL,
  NULL,
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Administrador del Sistema"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Insertamos también el perfil correspondiente
INSERT INTO public.profiles (user_id, email, full_name, active)
SELECT 
  u.id,
  'admin@empresa.com',
  'Administrador del Sistema',
  true
FROM auth.users u 
WHERE u.email = 'admin@empresa.com'
ON CONFLICT (user_id) DO NOTHING;

-- Asignamos el rol
INSERT INTO public.user_roles (user_id, role)
SELECT 
  u.id,
  'administrador'::public.app_role
FROM auth.users u 
WHERE u.email = 'admin@empresa.com'
ON CONFLICT (user_id, role) DO NOTHING;