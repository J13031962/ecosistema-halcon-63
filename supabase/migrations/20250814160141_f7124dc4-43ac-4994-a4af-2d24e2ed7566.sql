-- Create user roles enum
CREATE TYPE public.user_role AS ENUM (
  'administrador',
  'director', 
  'operador_alarmas',
  'despachador_patrullas',
  'supervisor',
  'tecnico',
  'jefe_tecnicos',
  'asesor_ventas'
);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Create user_permissions table
CREATE TABLE public.user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  function_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, function_key)
);

-- Create clientes table
CREATE TABLE public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  direccion TEXT,
  telefono TEXT,
  email TEXT,
  municipio TEXT,
  tipo_servicio TEXT,
  estado TEXT DEFAULT 'activo',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create alarmas table
CREATE TABLE public.alarmas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES public.clientes(id),
  tipo TEXT NOT NULL,
  estado TEXT DEFAULT 'activa',
  prioridad TEXT DEFAULT 'media',
  descripcion TEXT,
  direccion TEXT,
  municipio TEXT,
  operador_id UUID REFERENCES auth.users(id),
  patrulla_asignada TEXT,
  supervisor TEXT,
  tiempo_respuesta_segundos INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  attended_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Create patrullas table
CREATE TABLE public.patrullas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_patrulla TEXT NOT NULL UNIQUE,
  supervisor_id UUID REFERENCES auth.users(id),
  supervisor_nombre TEXT,
  estado TEXT DEFAULT 'disponible',
  ubicacion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create personal table
CREATE TABLE public.personal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  nombre TEXT NOT NULL,
  cargo TEXT,
  estado TEXT DEFAULT 'activo',
  turno TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create operaciones_diarias table
CREATE TABLE public.operaciones_diarias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha DATE NOT NULL UNIQUE,
  tiempo_respuesta_promedio INTEGER DEFAULT 0,
  efectividad_porcentaje INTEGER DEFAULT 0,
  ingresos_dia DECIMAL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create servicios_tecnicos table
CREATE TABLE public.servicios_tecnicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES public.clientes(id),
  tecnico_id UUID REFERENCES auth.users(id),
  tipo_servicio TEXT,
  descripcion TEXT,
  estado TEXT DEFAULT 'pendiente',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create eventos_sistema table
CREATE TABLE public.eventos_sistema (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_evento TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create turnos_operador table
CREATE TABLE public.turnos_operador (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha DATE NOT NULL,
  turno TEXT NOT NULL,
  operador_id UUID REFERENCES auth.users(id),
  operador_nombre TEXT,
  horario_inicio TIME,
  horario_fin TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(fecha, turno)
);

-- Create turnos_supervisor table
CREATE TABLE public.turnos_supervisor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha DATE NOT NULL,
  turno TEXT NOT NULL,
  supervisor_id UUID REFERENCES auth.users(id),
  supervisor_nombre TEXT,
  horario_inicio TIME,
  horario_fin TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(fecha, turno)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alarmas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patrullas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operaciones_diarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicios_tecnicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turnos_operador ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turnos_supervisor ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users
CREATE POLICY "Authenticated users can view profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view user_roles" ON public.user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view user_permissions" ON public.user_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view clientes" ON public.clientes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage clientes" ON public.clientes FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can view alarmas" ON public.alarmas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage alarmas" ON public.alarmas FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can view patrullas" ON public.patrullas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage patrullas" ON public.patrullas FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can view personal" ON public.personal FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view operaciones_diarias" ON public.operaciones_diarias FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view servicios_tecnicos" ON public.servicios_tecnicos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view eventos_sistema" ON public.eventos_sistema FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view turnos_operador" ON public.turnos_operador FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage turnos_operador" ON public.turnos_operador FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can view turnos_supervisor" ON public.turnos_supervisor FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage turnos_supervisor" ON public.turnos_supervisor FOR ALL TO authenticated USING (true);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, user_id, email, full_name)
  VALUES (NEW.id, NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  
  -- Assign default role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'operador_alarmas');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;