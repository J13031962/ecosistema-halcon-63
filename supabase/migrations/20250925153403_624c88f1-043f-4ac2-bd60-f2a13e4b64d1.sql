-- Asegurar que hay un placeholder para tracking general de GPS (no asociado a una alarma específica)
-- Esto permite que los supervisores envíen ubicaciones GPS incluso cuando no tienen alarmas asignadas

-- Crear función para limpiar ubicaciones GPS antiguas (mantener solo las últimas 24 horas por supervisor)
CREATE OR REPLACE FUNCTION public.cleanup_old_gps_locations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Eliminar ubicaciones GPS más antiguas de 24 horas
  DELETE FROM public.supervisor_ubicaciones_tiempo_real 
  WHERE created_at < NOW() - INTERVAL '24 hours';
  
  -- Mantener solo las últimas 50 ubicaciones por supervisor para evitar acumulación excesiva
  DELETE FROM public.supervisor_ubicaciones_tiempo_real 
  WHERE id IN (
    SELECT id FROM (
      SELECT id,
        ROW_NUMBER() OVER (
          PARTITION BY supervisor_id 
          ORDER BY created_at DESC
        ) as rn
      FROM public.supervisor_ubicaciones_tiempo_real
    ) t WHERE t.rn > 50
  );
  
  RAISE NOTICE 'Limpieza de ubicaciones GPS completada';
END;
$$;

-- Agregar comentario a la tabla para documentar el uso del placeholder
COMMENT ON TABLE public.supervisor_ubicaciones_tiempo_real IS 
'Tabla para almacenar ubicaciones GPS en tiempo real de supervisores. 
Para tracking general (no asociado a alarma específica), usar alarma_id = 00000000-0000-0000-0000-000000000000';

-- Crear índice compuesto para mejorar el rendimiento de consultas de ubicaciones recientes
CREATE INDEX IF NOT EXISTS idx_supervisor_ubicaciones_recent 
ON public.supervisor_ubicaciones_tiempo_real (supervisor_id, created_at DESC, alarma_id);

-- Crear índice para el placeholder de tracking general
CREATE INDEX IF NOT EXISTS idx_supervisor_ubicaciones_general_tracking 
ON public.supervisor_ubicaciones_tiempo_real (supervisor_id, created_at DESC) 
WHERE alarma_id = '00000000-0000-0000-0000-000000000000';