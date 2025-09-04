-- Crear tabla de usuarios con autenticación manual
CREATE TABLE public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  full_name text NOT NULL,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  last_login timestamp with time zone
);

-- Insertar usuarios de prueba con passwords hasheados simples
INSERT INTO public.users (email, password_hash, full_name) VALUES
('admin@empresa.com', 'admin123', 'Administrador del Sistema'),
('director@empresa.com', 'director123', 'Director General'),
('operador@empresa.com', 'operador123', 'Operador de Alarmas'),
('despachador@empresa.com', 'despachador123', 'Despachador de Patrullas'),
('supervisor@teleguardia.com', 'supervisor123', 'Supervisor Motorizado'),
('tecnico@empresa.com', 'tecnico123', 'Técnico'),
('jefe.tecnico@empresa.com', 'jefe123', 'Jefe de Técnicos'),
('ventas@empresa.com', 'ventas123', 'Asesor de Ventas');

-- Crear tabla de roles de usuario para mapear usuarios a roles
CREATE TABLE public.user_role_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  role text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Asignar roles a cada usuario
INSERT INTO public.user_role_mappings (user_id, role) 
SELECT u.id, 'administrador' 
FROM public.users u WHERE u.email = 'admin@empresa.com'
UNION ALL
SELECT u.id, 'director' 
FROM public.users u WHERE u.email = 'director@empresa.com'
UNION ALL
SELECT u.id, 'operador_alarmas' 
FROM public.users u WHERE u.email = 'operador@empresa.com'
UNION ALL
SELECT u.id, 'despachador_patrullas' 
FROM public.users u WHERE u.email = 'despachador@empresa.com'
UNION ALL
SELECT u.id, 'supervisor' 
FROM public.users u WHERE u.email = 'supervisor@teleguardia.com'
UNION ALL
SELECT u.id, 'tecnico' 
FROM public.users u WHERE u.email = 'tecnico@empresa.com'
UNION ALL
SELECT u.id, 'jefe_tecnicos' 
FROM public.users u WHERE u.email = 'jefe.tecnico@empresa.com'
UNION ALL
SELECT u.id, 'asesor_ventas' 
FROM public.users u WHERE u.email = 'ventas@empresa.com';

-- Habilitar RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_role_mappings ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (permitir a todos leer para login)
CREATE POLICY "Allow public read for authentication" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow public read for roles" ON public.user_role_mappings FOR SELECT USING (true);