-- Corregir la función de descuento para que funcione correctamente
DROP TRIGGER IF EXISTS trigger_descontar_servicios_alarma_global ON public.alarmas;

-- Función corregida para descontar servicios del pool global
CREATE OR REPLACE FUNCTION public.descontar_servicios_alarma_global()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  servicios_globales RECORD;
BEGIN
  -- Solo procesar si la alarma se está creando o activando
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.estado != 'activa' AND NEW.estado = 'activa') THEN
    
    -- Obtener servicios globales del mes actual
    SELECT * INTO servicios_globales 
    FROM get_servicios_globales_mes(
      EXTRACT(YEAR FROM NEW.created_at)::INTEGER,
      EXTRACT(MONTH FROM NEW.created_at)::INTEGER
    );
    
    -- Verificar que existan servicios globales configurados
    IF servicios_globales IS NOT NULL THEN
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
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Crear el trigger
CREATE TRIGGER trigger_descontar_servicios_alarma_global
  AFTER INSERT OR UPDATE ON public.alarmas
  FOR EACH ROW
  EXECUTE FUNCTION public.descontar_servicios_alarma_global();