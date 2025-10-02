-- Agregar columna empresa_contratada_id a la tabla alarmas
ALTER TABLE public.alarmas 
ADD COLUMN IF NOT EXISTS empresa_contratada_id UUID REFERENCES public.empresas_contratadas(id);

-- Crear índice para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_alarmas_empresa_contratada 
ON public.alarmas(empresa_contratada_id);

-- Migrar datos históricos: Asignar todas las alarmas sin empresa a Coraza
UPDATE public.alarmas 
SET empresa_contratada_id = 'ab265e8a-ec4c-469a-a50c-3ba6d77e339a'
WHERE empresa_contratada_id IS NULL;

COMMENT ON COLUMN public.alarmas.empresa_contratada_id IS 'ID de la empresa contratada que presta el servicio de patrulla (ej: Coraza)';