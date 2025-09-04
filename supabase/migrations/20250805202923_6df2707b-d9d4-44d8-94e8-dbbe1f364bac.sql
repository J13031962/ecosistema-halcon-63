-- Create alarmas table
CREATE TABLE public.alarmas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID REFERENCES public.clientes(id),
  tipo_alarma TEXT NOT NULL,
  prioridad TEXT NOT NULL DEFAULT 'media' CHECK (prioridad IN ('baja', 'media', 'alta', 'critica')),
  estado TEXT NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa', 'en_proceso', 'resuelta', 'falsa')),
  descripcion TEXT,
  ubicacion_lat NUMERIC,
  ubicacion_lng NUMERIC,
  tiempo_respuesta_segundos INTEGER,
  asignada_a UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resuelta_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create patrullas table
CREATE TABLE public.patrullas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_unidad TEXT NOT NULL UNIQUE,
  oficial_nombre TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'disponible' CHECK (estado IN ('disponible', 'en_servicio', 'emergencia', 'mantenimiento', 'fuera_servicio')),
  ubicacion_lat NUMERIC,
  ubicacion_lng NUMERIC,
  zona TEXT,
  velocidad_actual NUMERIC DEFAULT 0,
  nivel_bateria INTEGER DEFAULT 100 CHECK (nivel_bateria >= 0 AND nivel_bateria <= 100),
  nivel_combustible INTEGER DEFAULT 100 CHECK (nivel_combustible >= 0 AND nivel_combustible <= 100),
  asignacion_actual TEXT,
  ultima_actividad TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create personal table
CREATE TABLE public.personal (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre_completo TEXT NOT NULL,
  puesto TEXT NOT NULL,
  departamento TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo', 'vacaciones', 'licencia')),
  turno TEXT CHECK (turno IN ('mañana', 'tarde', 'noche', 'rotativo')),
  telefono TEXT,
  email TEXT,
  fecha_ingreso DATE NOT NULL,
  salario NUMERIC,
  supervisor_id UUID REFERENCES public.personal(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create eventos_sistema table
CREATE TABLE public.eventos_sistema (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo_evento TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  usuario_id UUID,
  modulo TEXT,
  nivel TEXT NOT NULL DEFAULT 'info' CHECK (nivel IN ('info', 'warning', 'error', 'critical')),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create operaciones_diarias table
CREATE TABLE public.operaciones_diarias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  total_servicios INTEGER DEFAULT 0,
  servicios_completados INTEGER DEFAULT 0,
  tiempo_respuesta_promedio NUMERIC DEFAULT 0,
  efectividad_porcentaje NUMERIC DEFAULT 0,
  ingresos_dia NUMERIC DEFAULT 0,
  gastos_operacionales NUMERIC DEFAULT 0,
  personal_activo INTEGER DEFAULT 0,
  patrullas_activas INTEGER DEFAULT 0,
  alarmas_procesadas INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(fecha)
);

-- Enable Row Level Security
ALTER TABLE public.alarmas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patrullas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operaciones_diarias ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Authenticated users can view alarmas" ON public.alarmas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins and operators can manage alarmas" ON public.alarmas FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('administrador', 'operador', 'jefe_tecnicos')
  )
);

CREATE POLICY "Authenticated users can view patrullas" ON public.patrullas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage patrullas" ON public.patrullas FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'administrador'
  )
);

CREATE POLICY "Users can view personal info" ON public.personal FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage personal" ON public.personal FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'administrador'
  )
);

CREATE POLICY "Authenticated users can view eventos" ON public.eventos_sistema FOR SELECT TO authenticated USING (true);
CREATE POLICY "System can insert eventos" ON public.eventos_sistema FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can view operaciones" ON public.operaciones_diarias FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage operaciones" ON public.operaciones_diarias FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'administrador'
  )
);

-- Create triggers for updated_at
CREATE TRIGGER update_alarmas_updated_at
  BEFORE UPDATE ON public.alarmas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patrullas_updated_at
  BEFORE UPDATE ON public.patrullas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_personal_updated_at
  BEFORE UPDATE ON public.personal
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_operaciones_diarias_updated_at
  BEFORE UPDATE ON public.operaciones_diarias
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();