-- Función para obtener comparativos mensuales
CREATE OR REPLACE FUNCTION public.get_monthly_comparisons()
RETURNS TABLE (
  month text,
  alarmas_total bigint,
  alarmas_resueltas bigint,
  servicios_tecnicos bigint,
  clientes_nuevos bigint,
  ingresos_estimados numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH monthly_data AS (
    SELECT 
      TO_CHAR(generate_series(
        date_trunc('month', CURRENT_DATE - INTERVAL '5 months'),
        date_trunc('month', CURRENT_DATE),
        INTERVAL '1 month'
      ), 'Mon YYYY') as month_name,
      generate_series(
        date_trunc('month', CURRENT_DATE - INTERVAL '5 months'),
        date_trunc('month', CURRENT_DATE),
        INTERVAL '1 month'
      ) as month_start
  )
  SELECT 
    md.month_name as month,
    COALESCE(
      (SELECT COUNT(*) FROM alarmas 
       WHERE date_trunc('month', created_at) = md.month_start), 0
    )::bigint as alarmas_total,
    COALESCE(
      (SELECT COUNT(*) FROM alarmas 
       WHERE date_trunc('month', created_at) = md.month_start 
       AND resolved_at IS NOT NULL), 0
    )::bigint as alarmas_resueltas,
    COALESCE(
      (SELECT COUNT(*) FROM servicios_tecnicos_asignados 
       WHERE date_trunc('month', created_at) = md.month_start), 0
    )::bigint as servicios_tecnicos,
    COALESCE(
      (SELECT COUNT(*) FROM clientes 
       WHERE date_trunc('month', created_at) = md.month_start), 0
    )::bigint as clientes_nuevos,
    COALESCE(
      (SELECT COUNT(*) FROM alarmas 
       WHERE date_trunc('month', created_at) = md.month_start) * 150 +
      (SELECT COUNT(*) FROM servicios_tecnicos_asignados 
       WHERE date_trunc('month', created_at) = md.month_start) * 300, 0
    )::numeric as ingresos_estimados
  FROM monthly_data md
  ORDER BY md.month_start;
END;
$$;

-- Función para obtener consumo de clientes
CREATE OR REPLACE FUNCTION public.get_top_clients_consumption()
RETURNS TABLE (
  cliente_nombre text,
  total_alarmas bigint,
  total_servicios bigint,
  score numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH client_stats AS (
    SELECT 
      c.nombre as cliente_nombre,
      COALESCE(COUNT(DISTINCT a.id), 0) as total_alarmas,
      COALESCE(COUNT(DISTINCT sta.id), 0) as total_servicios
    FROM clientes c
    LEFT JOIN alarmas a ON a.cliente_id = c.id 
      AND a.created_at >= CURRENT_DATE - INTERVAL '3 months'
    LEFT JOIN servicios_tecnicos_asignados sta ON sta.cliente_id = c.id 
      AND sta.created_at >= CURRENT_DATE - INTERVAL '3 months'
    WHERE c.estado = 'activo'
    GROUP BY c.id, c.nombre
    HAVING COALESCE(COUNT(DISTINCT a.id), 0) > 0 OR COALESCE(COUNT(DISTINCT sta.id), 0) > 0
  )
  SELECT 
    cs.cliente_nombre,
    cs.total_alarmas,
    cs.total_servicios,
    (cs.total_alarmas * 2 + cs.total_servicios * 3)::numeric as score
  FROM client_stats cs
  ORDER BY score DESC
  LIMIT 10;
END;
$$;

-- Función para obtener estadísticas de servicios técnicos
CREATE OR REPLACE FUNCTION public.get_service_tech_stats()
RETURNS TABLE (
  pendientes bigint,
  en_proceso bigint,
  completados bigint,
  tiempo_promedio_resolucion numeric,
  costo_total_estimado numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM servicios_tecnicos_asignados WHERE estado = 'pendiente')::bigint,
    (SELECT COUNT(*) FROM servicios_tecnicos_asignados WHERE estado = 'en_proceso')::bigint,
    (SELECT COUNT(*) FROM servicios_tecnicos_asignados WHERE estado = 'completado')::bigint,
    COALESCE(
      (SELECT AVG(EXTRACT(EPOCH FROM (fecha_finalizacion - fecha_inicio))/3600) 
       FROM servicios_tecnicos_asignados 
       WHERE estado = 'completado' 
       AND fecha_finalizacion IS NOT NULL 
       AND fecha_inicio IS NOT NULL), 24
    )::numeric as tiempo_promedio_resolucion,
    COALESCE(
      (SELECT SUM(costo_estimado) FROM servicios_tecnicos_asignados WHERE costo_estimado IS NOT NULL), 0
    )::numeric as costo_total_estimado;
END;
$$;