-- Agregar campo supervisor_id a la tabla alarmas
ALTER TABLE public.alarmas ADD COLUMN IF NOT EXISTS supervisor_id UUID;

-- Crear índice para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_alarmas_supervisor_id ON public.alarmas(supervisor_id);