-- Agregar la política faltante para inserción de alarmas que se requería
CREATE POLICY "Acceso_completo_alarmas_insercion_with_check" 
ON public.alarmas 
FOR INSERT 
WITH CHECK (true);