-- Insertar usuarios de prueba con sus roles
INSERT INTO auth.users (
  id, 
  email, 
  encrypted_password, 
  email_confirmed_at, 
  created_at, 
  updated_at,
  raw_user_meta_data
) VALUES 
  (
    'a1111111-1111-1111-1111-111111111111'::uuid,
    'operador1@empresa.com',
    '$2a$10$yE4p4VJZt7eW.mHlS1C6TOHrcJvXlgqC4Y3j2qG1M0V5bP1tAjO8K', -- password: Test123456
    now(),
    now(),
    now(),
    '{"full_name": "Operador de Prueba 1"}'::jsonb
  ),
  (
    'b2222222-2222-2222-2222-222222222222'::uuid,
    'despachador1@empresa.com',
    '$2a$10$yE4p4VJZt7eW.mHlS1C6TOHrcJvXlgqC4Y3j2qG1M0V5bP1tAjO8K', -- password: Test123456
    now(),
    now(),
    now(),
    '{"full_name": "Despachador de Prueba 1"}'::jsonb
  ),
  (
    'c3333333-3333-3333-3333-333333333333'::uuid,
    'supervisor1@empresa.com',
    '$2a$10$yE4p4VJZt7eW.mHlS1C6TOHrcJvXlgqC4Y3j2qG1M0V5bP1tAjO8K', -- password: Test123456
    now(),
    now(),
    now(),
    '{"full_name": "Supervisor de Prueba 1"}'::jsonb
  ),
  (
    'd4444444-4444-4444-4444-444444444444'::uuid,
    'tecnico1@empresa.com',
    '$2a$10$yE4p4VJZt7eW.mHlS1C6TOHrcJvXlgqC4Y3j2qG1M0V5bP1tAjO8K', -- password: Test123456
    now(),
    now(),
    now(),
    '{"full_name": "Técnico de Prueba 1"}'::jsonb
  ),
  (
    'e5555555-5555-5555-5555-555555555555'::uuid,
    'director1@empresa.com',
    '$2a$10$yE4p4VJZt7eW.mHlS1C6TOHrcJvXlgqC4Y3j2qG1M0V5bP1tAjO8K', -- password: Test123456
    now(),
    now(),
    now(),
    '{"full_name": "Director de Prueba 1"}'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

-- Insertar perfiles correspondientes
INSERT INTO public.profiles (
  id, 
  user_id, 
  email, 
  full_name,
  numero_documento,
  active
) VALUES 
  (
    'a1111111-1111-1111-1111-111111111111'::uuid,
    'a1111111-1111-1111-1111-111111111111'::uuid,
    'operador1@empresa.com',
    'Operador de Prueba 1',
    '12345678',
    true
  ),
  (
    'b2222222-2222-2222-2222-222222222222'::uuid,
    'b2222222-2222-2222-2222-222222222222'::uuid,
    'despachador1@empresa.com',
    'Despachador de Prueba 1',
    '12345679',
    true
  ),
  (
    'c3333333-3333-3333-3333-333333333333'::uuid,
    'c3333333-3333-3333-3333-333333333333'::uuid,
    'supervisor1@empresa.com',
    'Supervisor de Prueba 1',
    '12345680',
    true
  ),
  (
    'd4444444-4444-4444-4444-444444444444'::uuid,
    'd4444444-4444-4444-4444-444444444444'::uuid,
    'tecnico1@empresa.com',
    'Técnico de Prueba 1',
    '12345681',
    true
  ),
  (
    'e5555555-5555-5555-5555-555555555555'::uuid,
    'e5555555-5555-5555-5555-555555555555'::uuid,
    'director1@empresa.com',
    'Director de Prueba 1',
    '12345682',
    true
  )
ON CONFLICT (id) DO NOTHING;

-- Insertar roles correspondientes
INSERT INTO public.user_roles (user_id, role) VALUES 
  ('a1111111-1111-1111-1111-111111111111'::uuid, 'operador_alarmas'::user_role),
  ('b2222222-2222-2222-2222-222222222222'::uuid, 'despachador_patrullas'::user_role),
  ('c3333333-3333-3333-3333-333333333333'::uuid, 'supervisor_motorizado'::user_role),
  ('d4444444-4444-4444-4444-444444444444'::uuid, 'tecnico'::user_role),
  ('e5555555-5555-5555-5555-555555555555'::uuid, 'director'::user_role)
ON CONFLICT (user_id, role) DO NOTHING;