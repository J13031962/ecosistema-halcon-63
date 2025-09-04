-- Asignar rol de administrador usando el user_id correcto de profiles
INSERT INTO public.user_roles (user_id, role)
VALUES ('11111111-1111-1111-1111-111111111111', 'administrador'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;