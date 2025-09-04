-- Primero eliminar los roles de usuarios existentes
DELETE FROM public.user_roles WHERE user_id IN (
  SELECT user_id FROM public.profiles WHERE email IN (
    'admin@empresa.com', 
    'director1@empresa.com', 
    'operador1@empresa.com', 
    'despachador1@empresa.com', 
    'supervisor1@empresa.com', 
    'tecnico1@empresa.com'
  )
);

-- Eliminar perfiles existentes
DELETE FROM public.profiles WHERE email IN (
  'admin@empresa.com', 
  'director1@empresa.com', 
  'operador1@empresa.com', 
  'despachador1@empresa.com', 
  'supervisor1@empresa.com', 
  'tecnico1@empresa.com'
);

-- Crear tabla de usuarios con contraseñas para autenticación (simulada) sin foreign keys
DROP TABLE IF EXISTS public.users_auth;
CREATE TABLE public.users_auth (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.users_auth ENABLE ROW LEVEL SECURITY;

-- Política para que usuarios autenticados puedan ver todos los usuarios
CREATE POLICY "Authenticated users can view users_auth" 
ON public.users_auth 
FOR SELECT 
USING (true);

-- Insertar las credenciales de los usuarios de Teleguardia
INSERT INTO public.users_auth (email, password, full_name, role) VALUES
('admin@teleguardia.com', 'Tele2025*', 'Administrador Teleguardia', 'administrador'),
('directortec@teleguardia.com', 'Dirtecnico2025*', 'Director Técnico Teleguardia', 'jefe_tecnicos'),
('directorcentral@teleguardia.com', 'Dircentral2025*', 'Director Central Teleguardia', 'director_central'),
('operador@teleguardia.com', 'Operador2025*', 'Operador Teleguardia', 'operador_alarmas'),
('despachador@teleguardia.com', 'Despachador2025*', 'Despachador Teleguardia', 'despachador_patrullas'),
('supervisor@teleguardia.com', 'Supervisor2025*', 'Supervisor Teleguardia', 'supervisor_motorizado'),
('tecnico@teleguardia.com', 'Tecnico2025*', 'Técnico Teleguardia', 'tecnico');