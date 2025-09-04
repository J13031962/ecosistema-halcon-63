-- Simplificar políticas RLS para alarmas
-- Eliminar política restrictiva actual
DROP POLICY IF EXISTS "Crear_alarmas_temporal_permisivo" ON public.alarmas;

-- Crear nueva política más permisiva para inserción
CREATE POLICY "Crear_alarmas_simplificado" 
ON public.alarmas 
FOR INSERT 
WITH CHECK (true);

-- Asegurar que la política de lectura también sea más permisiva
DROP POLICY IF EXISTS "Acceso_unificado_alarmas_lectura" ON public.alarmas;

CREATE POLICY "Leer_alarmas_simplificado" 
ON public.alarmas 
FOR SELECT 
USING (true);