-- Create missing tables and setup real-time for alarms and shifts

-- Enable real-time for alarmas table
ALTER TABLE public.alarmas REPLICA IDENTITY FULL;

-- Enable real-time for turnos tables  
ALTER TABLE public.turnos_operador REPLICA IDENTITY FULL;
ALTER TABLE public.turnos_supervisor REPLICA IDENTITY FULL;

-- Enable real-time for patrullas table
ALTER TABLE public.patrullas REPLICA IDENTITY FULL;

-- Create table for supervisor activities
CREATE TABLE public.supervisor_actividades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supervisor_id UUID REFERENCES auth.users(id),
  supervisor_nombre TEXT,
  tipo_actividad TEXT NOT NULL,
  descripcion TEXT,
  ubicacion TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for incidents
CREATE TABLE public.incidentes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supervisor_id UUID REFERENCES auth.users(id),
  supervisor_nombre TEXT,
  tipo_incidente TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  ubicacion TEXT,
  gravedad TEXT DEFAULT 'media',
  estado TEXT DEFAULT 'reportado',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Create table for patrol history (separate for operador and despachador)
CREATE TABLE public.historial_patrullas_operador (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patrulla_numero TEXT NOT NULL,
  supervisor_nombre TEXT,
  actividad TEXT NOT NULL,
  ubicacion TEXT,
  fecha_inicio TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  fecha_fin TIMESTAMP WITH TIME ZONE,
  duracion_minutos INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.historial_patrullas_despachador (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patrulla_numero TEXT NOT NULL,
  supervisor_nombre TEXT,
  actividad TEXT NOT NULL,
  ubicacion TEXT,
  fecha_inicio TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  fecha_fin TIMESTAMP WITH TIME ZONE,
  duracion_minutos INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.supervisor_actividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historial_patrullas_operador ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historial_patrullas_despachador ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for new tables
CREATE POLICY "Authenticated users can view supervisor_actividades" ON public.supervisor_actividades FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage supervisor_actividades" ON public.supervisor_actividades FOR ALL USING (true);

CREATE POLICY "Authenticated users can view incidentes" ON public.incidentes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage incidentes" ON public.incidentes FOR ALL USING (true);

CREATE POLICY "Authenticated users can view historial_patrullas_operador" ON public.historial_patrullas_operador FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage historial_patrullas_operador" ON public.historial_patrullas_operador FOR ALL USING (true);

CREATE POLICY "Authenticated users can view historial_patrullas_despachador" ON public.historial_patrullas_despachador FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage historial_patrullas_despachador" ON public.historial_patrullas_despachador FOR ALL USING (true);

-- Add realtime publication for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.alarmas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.turnos_operador;
ALTER PUBLICATION supabase_realtime ADD TABLE public.turnos_supervisor;
ALTER PUBLICATION supabase_realtime ADD TABLE public.patrullas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.supervisor_actividades;
ALTER PUBLICATION supabase_realtime ADD TABLE public.incidentes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.historial_patrullas_operador;
ALTER PUBLICATION supabase_realtime ADD TABLE public.historial_patrullas_despachador;