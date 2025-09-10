-- Agregar campos faltantes para cronómetros específicos
ALTER TABLE public.alarmas ADD COLUMN IF NOT EXISTS supervisor_llegada TIMESTAMPTZ;
ALTER TABLE public.alarmas ADD COLUMN IF NOT EXISTS supervisor_salida TIMESTAMPTZ;