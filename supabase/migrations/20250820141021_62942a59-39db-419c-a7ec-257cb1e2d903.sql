-- FASE 1: Estructura de Base de Datos Mejorada

-- Añadir tabla para observaciones de alarmas (comentarios en tiempo real del supervisor)
CREATE TABLE public.observaciones_alarmas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alarma_id UUID NOT NULL,
  supervisor_id UUID NOT NULL,
  supervisor_nombre TEXT NOT NULL,
  observacion TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Añadir tabla para estados de patrulla (seguimiento de tiempos y estados)
CREATE TABLE public.estados_patrulla (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alarma_id UUID NOT NULL UNIQUE,
  supervisor_id UUID,
  supervisor_nombre TEXT,
  estado TEXT NOT NULL DEFAULT 'pendiente', -- pendiente, iniciada, finalizada
  tiempo_inicio TIMESTAMP WITH TIME ZONE,
  tiempo_fin TIMESTAMP WITH TIME ZONE,
  duracion_segundos INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Añadir campo username a profiles para login alternativo
ALTER TABLE public.profiles ADD COLUMN username TEXT UNIQUE;

-- Actualizar tabla alarmas con campos necesarios para el flujo completo
ALTER TABLE public.alarmas ADD COLUMN IF NOT EXISTS operador_nombre TEXT;
ALTER TABLE public.alarmas ADD COLUMN IF NOT EXISTS despachador_id UUID;
ALTER TABLE public.alarmas ADD COLUMN IF NOT EXISTS despachador_nombre TEXT;
ALTER TABLE public.alarmas ADD COLUMN IF NOT EXISTS tiempo_atencion TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.alarmas ADD COLUMN IF NOT EXISTS tiempo_asignacion TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.alarmas ADD COLUMN IF NOT EXISTS observaciones_count INTEGER DEFAULT 0;

-- Enable Row Level Security en nuevas tablas
ALTER TABLE public.observaciones_alarmas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estados_patrulla ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para observaciones_alarmas
CREATE POLICY "Authenticated users can view observaciones_alarmas"
ON public.observaciones_alarmas
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create observaciones_alarmas"
ON public.observaciones_alarmas
FOR INSERT
WITH CHECK (true);

-- Políticas RLS para estados_patrulla
CREATE POLICY "Authenticated users can view estados_patrulla"
ON public.estados_patrulla
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can manage estados_patrulla"
ON public.estados_patrulla
FOR ALL
USING (true);

-- Función para actualizar contador de observaciones
CREATE OR REPLACE FUNCTION public.update_observaciones_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.alarmas 
  SET observaciones_count = (
    SELECT COUNT(*) 
    FROM public.observaciones_alarmas 
    WHERE alarma_id = NEW.alarma_id
  )
  WHERE id = NEW.alarma_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar contador automáticamente
CREATE TRIGGER update_observaciones_count_trigger
AFTER INSERT ON public.observaciones_alarmas
FOR EACH ROW
EXECUTE FUNCTION public.update_observaciones_count();

-- Función para calcular duración de patrulla
CREATE OR REPLACE FUNCTION public.calculate_patrulla_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tiempo_fin IS NOT NULL AND NEW.tiempo_inicio IS NOT NULL THEN
    NEW.duracion_segundos = EXTRACT(EPOCH FROM (NEW.tiempo_fin - NEW.tiempo_inicio))::INTEGER;
  END IF;
  
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para calcular duración automáticamente
CREATE TRIGGER calculate_patrulla_duration_trigger
BEFORE UPDATE ON public.estados_patrulla
FOR EACH ROW
EXECUTE FUNCTION public.calculate_patrulla_duration();

-- Configurar real-time para nuevas tablas
ALTER publication supabase_realtime ADD TABLE public.observaciones_alarmas;
ALTER publication supabase_realtime ADD TABLE public.estados_patrulla;