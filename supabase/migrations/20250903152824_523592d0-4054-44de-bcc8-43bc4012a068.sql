-- Eliminar usuarios existentes
DELETE FROM public.user_roles WHERE user_id IN (
  SELECT id FROM public.profiles WHERE email IN (
    'admin@empresa.com', 
    'director1@empresa.com', 
    'operador1@empresa.com', 
    'despachador1@empresa.com', 
    'supervisor1@empresa.com', 
    'tecnico1@empresa.com'
  )
);

DELETE FROM public.profiles WHERE email IN (
  'admin@empresa.com', 
  'director1@empresa.com', 
  'operador1@empresa.com', 
  'despachador1@empresa.com', 
  'supervisor1@empresa.com', 
  'tecnico1@empresa.com'
);

-- Crear nuevos usuarios de Teleguardia
INSERT INTO public.profiles (id, user_id, email, full_name, active) VALUES
(gen_random_uuid(), gen_random_uuid(), 'admin@teleguardia.com', 'Administrador Teleguardia', true),
(gen_random_uuid(), gen_random_uuid(), 'directortec@teleguardia.com', 'Director Técnico Teleguardia', true),
(gen_random_uuid(), gen_random_uuid(), 'directorcentral@teleguardia.com', 'Director Central Teleguardia', true),
(gen_random_uuid(), gen_random_uuid(), 'operador@teleguardia.com', 'Operador Teleguardia', true),
(gen_random_uuid(), gen_random_uuid(), 'despachador@teleguardia.com', 'Despachador Teleguardia', true),
(gen_random_uuid(), gen_random_uuid(), 'supervisor@teleguardia.com', 'Supervisor Teleguardia', true),
(gen_random_uuid(), gen_random_uuid(), 'tecnico@teleguardia.com', 'Técnico Teleguardia', true);

-- Asignar roles a los nuevos usuarios
INSERT INTO public.user_roles (user_id, role) 
SELECT id, 'administrador'::user_role FROM public.profiles WHERE email = 'admin@teleguardia.com';

INSERT INTO public.user_roles (user_id, role) 
SELECT id, 'jefe_tecnicos'::user_role FROM public.profiles WHERE email = 'directortec@teleguardia.com';

INSERT INTO public.user_roles (user_id, role) 
SELECT id, 'director_central'::user_role FROM public.profiles WHERE email = 'directorcentral@teleguardia.com';

INSERT INTO public.user_roles (user_id, role) 
SELECT id, 'operador_alarmas'::user_role FROM public.profiles WHERE email = 'operador@teleguardia.com';

INSERT INTO public.user_roles (user_id, role) 
SELECT id, 'despachador_patrullas'::user_role FROM public.profiles WHERE email = 'despachador@teleguardia.com';

INSERT INTO public.user_roles (user_id, role) 
SELECT id, 'supervisor_motorizado'::user_role FROM public.profiles WHERE email = 'supervisor@teleguardia.com';

INSERT INTO public.user_roles (user_id, role) 
SELECT id, 'tecnico'::user_role FROM public.profiles WHERE email = 'tecnico@teleguardia.com';

-- Crear tabla de usuarios con contraseñas para autenticación (simulada)
CREATE TABLE IF NOT EXISTS public.users_auth (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Insertar las credenciales de los usuarios de Teleguardia
INSERT INTO public.users_auth (email, password_hash) VALUES
('admin@teleguardia.com', 'Tele2025*'),
('directortec@teleguardia.com', 'Dirtecnico2025*'),
('directorcentral@teleguardia.com', 'Dircentral2025*'),
('operador@teleguardia.com', 'Operador2025*'),
('despachador@teleguardia.com', 'Despachador2025*'),
('supervisor@teleguardia.com', 'Supervisor2025*'),
('tecnico@teleguardia.com', 'Tecnico2025*');