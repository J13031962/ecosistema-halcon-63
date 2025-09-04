-- Crear perfil para el usuario autenticado actual
INSERT INTO public.profiles (user_id, full_name, email, active)
VALUES ('e99a279d-472d-457f-8189-84d7642d730d', 'Usuario Admin', 'admin@sistema.com', true)
ON CONFLICT (user_id) DO NOTHING;

-- Asignar rol de administrador al usuario actual
INSERT INTO public.user_roles (user_id, role)
VALUES ('e99a279d-472d-457f-8189-84d7642d730d', 'administrador'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;