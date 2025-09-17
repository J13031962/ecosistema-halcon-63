-- Hacer cliente_id nullable en patrullas_coraza para permitir configuraciones globales
ALTER TABLE public.patrullas_coraza 
ALTER COLUMN cliente_id DROP NOT NULL;

-- Crear tabla para tracking detallado de servicios utilizados
CREATE TABLE public.servicios_utilizados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alarma_id UUID NOT NULL,
  cliente_id UUID NOT NULL,
  tipo_servicio TEXT NOT NULL CHECK (tipo_servicio IN ('patrulla', 'acompanamiento', 'revista')),
  tipo_alarma TEXT NOT NULL,
  fecha_uso TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  year INTEGER NOT NULL DEFAULT EXTRACT(year FROM CURRENT_DATE),
  month INTEGER NOT NULL DEFAULT EXTRACT(month FROM CURRENT_DATE),
  operador_id UUID,
  operador_nombre TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS en la tabla servicios_utilizados
ALTER TABLE public.servicios_utilizados ENABLE ROW LEVEL SECURITY;

-- Crear políticas para servicios_utilizados
CREATE POLICY "Usuarios autenticados pueden ver servicios utilizados"
  ON public.servicios_utilizados
  FOR SELECT
  USING (true);

CREATE POLICY "Sistema puede insertar servicios utilizados"
  ON public.servicios_utilizados
  FOR INSERT
  WITH CHECK (true);

-- Índices para mejorar performance
CREATE INDEX idx_servicios_utilizados_cliente_fecha ON public.servicios_utilizados (cliente_id, year, month);
CREATE INDEX idx_servicios_utilizados_alarma ON public.servicios_utilizados (alarma_id);
CREATE INDEX idx_servicios_utilizados_tipo ON public.servicios_utilizados (tipo_servicio, year, month);

-- Función para obtener servicios globales del mes
CREATE OR REPLACE FUNCTION public.get_servicios_globales_mes(
  year_param INTEGER DEFAULT EXTRACT(year FROM CURRENT_DATE),
  month_param INTEGER DEFAULT EXTRACT(month FROM CURRENT_DATE)
)
RETURNS TABLE(
  patrullas_disponibles INTEGER,
  patrullas_usadas INTEGER,
  patrullas_restantes INTEGER,
  acompanamientos_disponibles INTEGER,
  acompanamientos_usados INTEGER,
  acompanamientos_restantes INTEGER,
  revistas_disponibles INTEGER,
  revistas_usadas INTEGER,
  revistas_restantes INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(pc.patrullas_disponibles, 0) as patrullas_disponibles,
    COALESCE(
      (SELECT COUNT(*) FROM servicios_utilizados 
       WHERE tipo_servicio = 'patrulla' 
       AND year = year_param 
       AND month = month_param), 0
    )::INTEGER as patrullas_usadas,
    GREATEST(
      COALESCE(pc.patrullas_disponibles, 0) - 
      COALESCE(
        (SELECT COUNT(*) FROM servicios_utilizados 
         WHERE tipo_servicio = 'patrulla' 
         AND year = year_param 
         AND month = month_param), 0
      ), 0
    )::INTEGER as patrullas_restantes,
    
    COALESCE(pc.acompanamientos_disponibles, 0) as acompanamientos_disponibles,
    COALESCE(
      (SELECT COUNT(*) FROM servicios_utilizados 
       WHERE tipo_servicio = 'acompanamiento' 
       AND year = year_param 
       AND month = month_param), 0
    )::INTEGER as acompanamientos_usados,
    GREATEST(
      COALESCE(pc.acompanamientos_disponibles, 0) - 
      COALESCE(
        (SELECT COUNT(*) FROM servicios_utilizados 
         WHERE tipo_servicio = 'acompanamiento' 
         AND year = year_param 
         AND month = month_param), 0
      ), 0
    )::INTEGER as acompanamientos_restantes,
    
    COALESCE(pc.revistas_disponibles, 0) as revistas_disponibles,
    COALESCE(
      (SELECT COUNT(*) FROM servicios_utilizados 
       WHERE tipo_servicio = 'revista' 
       AND year = year_param 
       AND month = month_param), 0
    )::INTEGER as revistas_usadas,
    GREATEST(
      COALESCE(pc.revistas_disponibles, 0) - 
      COALESCE(
        (SELECT COUNT(*) FROM servicios_utilizados 
         WHERE tipo_servicio = 'revista' 
         AND year = year_param 
         AND month = month_param), 0
      ), 0
    )::INTEGER as revistas_restantes
  FROM public.patrullas_coraza pc
  WHERE pc.cliente_id IS NULL 
    AND pc.year = year_param 
    AND pc.month = month_param
  UNION ALL
  SELECT 0, 0, 0, 0, 0, 0, 0, 0, 0
  WHERE NOT EXISTS (
    SELECT 1 FROM public.patrullas_coraza pc
    WHERE pc.cliente_id IS NULL 
      AND pc.year = year_param 
      AND pc.month = month_param
  )
  LIMIT 1;
END;
$$;

-- Función para obtener historial de servicios utilizados
CREATE OR REPLACE FUNCTION public.get_historial_servicios_utilizados(
  year_param INTEGER DEFAULT EXTRACT(year FROM CURRENT_DATE),
  month_param INTEGER DEFAULT EXTRACT(month FROM CURRENT_DATE)
)
RETURNS TABLE(
  id UUID,
  fecha_uso TIMESTAMP WITH TIME ZONE,
  cliente_nombre TEXT,
  cliente_numero_cuenta TEXT,
  tipo_servicio TEXT,
  tipo_alarma TEXT,
  operador_nombre TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    su.id,
    su.fecha_uso,
    c.nombre as cliente_nombre,
    c.numero_cuenta as cliente_numero_cuenta,
    su.tipo_servicio,
    su.tipo_alarma,
    su.operador_nombre
  FROM public.servicios_utilizados su
  LEFT JOIN public.clientes c ON c.id = su.cliente_id
  WHERE su.year = year_param 
    AND su.month = month_param
  ORDER BY su.fecha_uso DESC;
END;
$$;

-- Actualizar función de descuento para usar el nuevo sistema global
CREATE OR REPLACE FUNCTION public.descontar_servicios_alarma_global()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Solo procesar si la alarma se está creando o activando
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.estado != 'activa' AND NEW.estado = 'activa') THEN
    
    -- Verificar que hay servicios disponibles en el pool global
    DECLARE
      servicios_globales RECORD;
    BEGIN
      SELECT * INTO servicios_globales 
      FROM get_servicios_globales_mes(
        EXTRACT(YEAR FROM NEW.created_at)::INTEGER,
        EXTRACT(MONTH FROM NEW.created_at)::INTEGER
      );
      
      -- Siempre registrar el uso de patrulla
      IF servicios_globales.patrullas_restantes > 0 THEN
        INSERT INTO public.servicios_utilizados (
          alarma_id, cliente_id, tipo_servicio, tipo_alarma, 
          year, month, operador_id, operador_nombre
        ) VALUES (
          NEW.id, NEW.cliente_id, 'patrulla', NEW.tipo,
          EXTRACT(YEAR FROM NEW.created_at)::INTEGER,
          EXTRACT(MONTH FROM NEW.created_at)::INTEGER,
          NEW.operador_id, NEW.operador_nombre
        );
      END IF;
      
      -- Registrar acompañamiento si aplica
      IF NEW.tipo IN ('acompanamiento', 'escolta') AND servicios_globales.acompanamientos_restantes > 0 THEN
        INSERT INTO public.servicios_utilizados (
          alarma_id, cliente_id, tipo_servicio, tipo_alarma,
          year, month, operador_id, operador_nombre
        ) VALUES (
          NEW.id, NEW.cliente_id, 'acompanamiento', NEW.tipo,
          EXTRACT(YEAR FROM NEW.created_at)::INTEGER,
          EXTRACT(MONTH FROM NEW.created_at)::INTEGER,
          NEW.operador_id, NEW.operador_nombre
        );
      END IF;
      
      -- Registrar revista si aplica
      IF NEW.tipo IN ('revista', 'inspeccion') AND servicios_globales.revistas_restantes > 0 THEN
        INSERT INTO public.servicios_utilizados (
          alarma_id, cliente_id, tipo_servicio, tipo_alarma,
          year, month, operador_id, operador_nombre
        ) VALUES (
          NEW.id, NEW.cliente_id, 'revista', NEW.tipo,
          EXTRACT(YEAR FROM NEW.created_at)::INTEGER,
          EXTRACT(MONTH FROM NEW.created_at)::INTEGER,
          NEW.operador_id, NEW.operador_nombre
        );
      END IF;
    END;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Eliminar el trigger anterior y crear el nuevo
DROP TRIGGER IF EXISTS trigger_descontar_servicios_alarma ON public.alarmas;
CREATE TRIGGER trigger_descontar_servicios_alarma_global
  BEFORE INSERT OR UPDATE ON public.alarmas
  FOR EACH ROW
  EXECUTE FUNCTION public.descontar_servicios_alarma_global();