-- Crear usuarios de prueba en auth.users y profiles
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  invited_at,
  confirmation_token,
  confirmation_sent_at,
  recovery_token,
  recovery_sent_at,
  email_change_token_new,
  email_change,
  email_change_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at,
  phone_change,
  phone_change_token,
  phone_change_sent_at,
  email_change_token_current,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at,
  is_sso_user,
  deleted_at
) VALUES 
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated', 'admin@halcon.com', crypt('Admin123', gen_salt('bf')), NOW(), NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider":"email","providers":["email"]}', '{}', FALSE, NOW(), NOW(), NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, FALSE, NULL),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated', 'director@halcon.com', crypt('Director123', gen_salt('bf')), NOW(), NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider":"email","providers":["email"]}', '{}', FALSE, NOW(), NOW(), NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, FALSE, NULL),
  ('00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333', 'authenticated', 'authenticated', 'operador@halcon.com', crypt('Operador123', gen_salt('bf')), NOW(), NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider":"email","providers":["email"]}', '{}', FALSE, NOW(), NOW(), NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, FALSE, NULL),
  ('00000000-0000-0000-0000-000000000000', '44444444-4444-4444-4444-444444444444', 'authenticated', 'authenticated', 'despachador@halcon.com', crypt('Desp123', gen_salt('bf')), NOW(), NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider":"email","providers":["email"]}', '{}', FALSE, NOW(), NOW(), NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, FALSE, NULL),
  ('00000000-0000-0000-0000-000000000000', '55555555-5555-5555-5555-555555555555', 'authenticated', 'authenticated', 'sup1@halcon.com', crypt('Sup123', gen_salt('bf')), NOW(), NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider":"email","providers":["email"]}', '{}', FALSE, NOW(), NOW(), NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, FALSE, NULL),
  ('00000000-0000-0000-0000-000000000000', '66666666-6666-6666-6666-666666666666', 'authenticated', 'authenticated', 'tecnico1@halcon.com', crypt('Tecnico123', gen_salt('bf')), NOW(), NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider":"email","providers":["email"]}', '{}', FALSE, NOW(), NOW(), NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, FALSE, NULL),
  ('00000000-0000-0000-0000-000000000000', '77777777-7777-7777-7777-777777777777', 'authenticated', 'authenticated', 'jefetec@halcon.com', crypt('Jefe123', gen_salt('bf')), NOW(), NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider":"email","providers":["email"]}', '{}', FALSE, NOW(), NOW(), NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, FALSE, NULL),
  ('00000000-0000-0000-0000-000000000000', '88888888-8888-8888-8888-888888888888', 'authenticated', 'authenticated', 'asesor1@halcon.com', crypt('Asesor123', gen_salt('bf')), NOW(), NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider":"email","providers":["email"]}', '{}', FALSE, NOW(), NOW(), NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, FALSE, NULL);

-- Crear perfiles para los usuarios
INSERT INTO public.profiles (id, email, full_name, document, active) VALUES
  ('11111111-1111-1111-1111-111111111111', 'admin@halcon.com', 'Administrador HALCON', '12345678', true),
  ('22222222-2222-2222-2222-222222222222', 'director@halcon.com', 'Director Central', '12345679', true),
  ('33333333-3333-3333-3333-333333333333', 'operador@halcon.com', 'Operador de Alarmas', '12345680', true),
  ('44444444-4444-4444-4444-444444444444', 'despachador@halcon.com', 'Despachador', '12345681', true),
  ('55555555-5555-5555-5555-555555555555', 'sup1@halcon.com', 'Supervisor', '12345682', true),
  ('66666666-6666-6666-6666-666666666666', 'tecnico1@halcon.com', 'Técnico', '12345683', true),
  ('77777777-7777-7777-7777-777777777777', 'jefetec@halcon.com', 'Jefe de Técnicos', '12345684', true),
  ('88888888-8888-8888-8888-888888888888', 'asesor1@halcon.com', 'Asesor de Ventas', '12345685', true);

-- Asignar roles a los usuarios
INSERT INTO public.user_roles (user_id, role) VALUES
  ('11111111-1111-1111-1111-111111111111', 'administrador'),
  ('22222222-2222-2222-2222-222222222222', 'director'),
  ('33333333-3333-3333-3333-333333333333', 'operador_alarmas'),
  ('44444444-4444-4444-4444-444444444444', 'despachador'),
  ('55555555-5555-5555-5555-555555555555', 'supervisor'),
  ('66666666-6666-6666-6666-666666666666', 'tecnico'),
  ('77777777-7777-7777-7777-777777777777', 'jefe_tecnicos'),
  ('88888888-8888-8888-8888-888888888888', 'asesor_ventas');

-- Usuario con múltiples roles (ejemplo: supervisor que también es técnico)
INSERT INTO public.user_roles (user_id, role) VALUES
  ('55555555-5555-5555-5555-555555555555', 'tecnico');