-- Limpiar y asignar roles correctos a usuarios existentes

-- Primero, limpiar todos los roles existentes
DELETE FROM user_roles;

-- Obtener el ID del admin y asignar rol de administrador
INSERT INTO user_roles (user_id, role) 
SELECT id, 'administrador'::user_role 
FROM profiles 
WHERE email = 'admin@empresa.com';

-- Crear usuarios de prueba faltantes si no existen ya
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at)
VALUES 
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'director@teleguardia.com', '$2a$10$MQKnTQ/XJq.vKMUqTJQVFehfJ5wKGiUNGUKzCKHVFI8xGJpZAKmJa', now(), NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}', '{"full_name": "Director General"}', FALSE, now(), now(), NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, FALSE, NULL),
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'operador@teleguardia.com', '$2a$10$MQKnTQ/XJq.vKMUqTJQVFehfJ5wKGiUNGUKzCKHVFI8xGJpZAKmJa', now(), NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}', '{"full_name": "Operador de Alarmas"}', FALSE, now(), now(), NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, FALSE, NULL),
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'despachador@teleguardia.com', '$2a$10$MQKnTQ/XJq.vKMUqTJQVFehfJ5wKGiUNGUKzCKHVFI8xGJpZAKmJa', now(), NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}', '{"full_name": "Despachador de Patrullas"}', FALSE, now(), now(), NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, FALSE, NULL),
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'supervisor@teleguardia.com', '$2a$10$MQKnTQ/XJq.vKMUqTJQVFehfJ5wKGiUNGUKzCKHVFI8xGJpZAKmJa', now(), NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}', '{"full_name": "Supervisor Motorizado"}', FALSE, now(), now(), NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, FALSE, NULL),
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'tecnico@teleguardia.com', '$2a$10$MQKnTQ/XJq.vKMUqTJQVFehfJ5wKGiUNGUKzCKHVFI8xGJpZAKmJa', now(), NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}', '{"full_name": "Técnico General"}', FALSE, now(), now(), NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, FALSE, NULL),
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'asesor@teleguardia.com', '$2a$10$MQKnTQ/XJq.vKMUqTJQVFehfJ5wKGiUNGUKzCKHVFI8xGJpZAKmJa', now(), NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}', '{"full_name": "Asesor de Ventas"}', FALSE, now(), now(), NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, FALSE, NULL)
ON CONFLICT (email) DO NOTHING;

-- Asignar roles a usuarios de teleguardia si existen en profiles
INSERT INTO user_roles (user_id, role) 
SELECT p.id, 'director'::user_role 
FROM profiles p 
WHERE p.email = 'director@teleguardia.com';

INSERT INTO user_roles (user_id, role) 
SELECT p.id, 'operador_alarmas'::user_role 
FROM profiles p 
WHERE p.email = 'operador@teleguardia.com';

INSERT INTO user_roles (user_id, role) 
SELECT p.id, 'despachador_patrullas'::user_role 
FROM profiles p 
WHERE p.email = 'despachador@teleguardia.com';

INSERT INTO user_roles (user_id, role) 
SELECT p.id, 'supervisor_motorizado'::user_role 
FROM profiles p 
WHERE p.email = 'supervisor@teleguardia.com';

INSERT INTO user_roles (user_id, role) 
SELECT p.id, 'tecnico'::user_role 
FROM profiles p 
WHERE p.email = 'tecnico@teleguardia.com';

INSERT INTO user_roles (user_id, role) 
SELECT p.id, 'asesor_ventas'::user_role 
FROM profiles p 
WHERE p.email = 'asesor@teleguardia.com';