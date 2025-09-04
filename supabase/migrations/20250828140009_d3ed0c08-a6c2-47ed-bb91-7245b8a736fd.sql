-- Crear usuarios de prueba adicionales con las credenciales que se muestran en la página
-- First, let's create the missing users for all the test credentials shown

-- Insert profiles for all test users (if they don't exist)
INSERT INTO public.profiles (id, user_id, email, full_name, active) 
VALUES 
  (gen_random_uuid(), (SELECT id FROM auth.users WHERE email = 'despachador@teleguardia.com' LIMIT 1), 'despachador@teleguardia.com', 'Despachador de Patrullas', true),
  (gen_random_uuid(), (SELECT id FROM auth.users WHERE email = 'tecnico@teleguardia.com' LIMIT 1), 'tecnico@teleguardia.com', 'Técnico del Sistema', true),
  (gen_random_uuid(), (SELECT id FROM auth.users WHERE email = 'director@teleguardia.com' LIMIT 1), 'director@teleguardia.com', 'Director Central', true),
  (gen_random_uuid(), (SELECT id FROM auth.users WHERE email = 'asesor@teleguardia.com' LIMIT 1), 'asesor@teleguardia.com', 'Asesor de Ventas', true)
ON CONFLICT (id) DO NOTHING;

-- Insert user roles for test users
INSERT INTO public.user_roles (user_id, role)
VALUES 
  ((SELECT id FROM auth.users WHERE email = 'despachador@teleguardia.com' LIMIT 1), 'despachador_patrullas'),
  ((SELECT id FROM auth.users WHERE email = 'tecnico@teleguardia.com' LIMIT 1), 'tecnico_propio'),
  ((SELECT id FROM auth.users WHERE email = 'director@teleguardia.com' LIMIT 1), 'director_central'),
  ((SELECT id FROM auth.users WHERE email = 'asesor@teleguardia.com' LIMIT 1), 'asesor_ventas')
ON CONFLICT (user_id, role) DO NOTHING;

-- Update the profiles table structure to ensure we have the right columns
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS username TEXT,
ADD COLUMN IF NOT EXISTS numero_documento TEXT,
ADD COLUMN IF NOT EXISTS foto_url TEXT;