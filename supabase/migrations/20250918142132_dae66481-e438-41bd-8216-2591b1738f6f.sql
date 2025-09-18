-- Fix service counting logic - Update functions to properly map alarm types to service types
-- Fixed version without UNACCENT function

-- Function 1: Fix descontar_servicios_alarma_empresa
CREATE OR REPLACE FUNCTION public.descontar_servicios_alarma_empresa()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  cliente_empresa_id UUID;
  servicios_empresa RECORD;
  tipo_normalizado TEXT;
  tipo_servicio_mapeado TEXT;
BEGIN
  -- Solo procesar si la alarma se está creando o activando
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.estado != 'activa' AND NEW.estado = 'activa') THEN
    
    -- Normalizar el tipo de alarma (lowercase)
    tipo_normalizado = LOWER(TRIM(NEW.tipo));
    
    -- Mapear tipo de alarma a tipo de servicio
    tipo_servicio_mapeado = CASE 
      WHEN tipo_normalizado IN ('acompanamiento', 'acompañamiento', 'escolta') THEN 'acompanamiento'
      WHEN tipo_normalizado IN ('revista', 'inspeccion', 'inspección') THEN 'revista'
      ELSE 'patrulla' -- Por defecto: alarma, panico, fuego, etc.
    END;
    
    -- Obtener la empresa contratada del cliente
    SELECT empresa_contratada_id INTO cliente_empresa_id
    FROM public.clientes 
    WHERE id = NEW.cliente_id;
    
    -- Si el cliente no tiene empresa asignada, usar la primera empresa activa (Coraza por defecto)
    IF cliente_empresa_id IS NULL THEN
      SELECT id INTO cliente_empresa_id
      FROM public.empresas_contratadas 
      WHERE estado = 'activo' 
      ORDER BY nombre 
      LIMIT 1;
    END IF;
    
    -- Obtener servicios de la empresa
    IF cliente_empresa_id IS NOT NULL THEN
      SELECT * INTO servicios_empresa 
      FROM get_servicios_por_empresa(
        cliente_empresa_id,
        EXTRACT(YEAR FROM NEW.created_at)::INTEGER,
        EXTRACT(MONTH FROM NEW.created_at)::INTEGER
      );
      
      -- Verificar que existan servicios configurados
      IF servicios_empresa IS NOT NULL THEN
        -- Registrar uso de servicio según el tipo mapeado
        IF tipo_servicio_mapeado = 'patrulla' AND servicios_empresa.patrullas_restantes > 0 THEN
          INSERT INTO public.servicios_utilizados (
            alarma_id, cliente_id, tipo_servicio, tipo_alarma, 
            year, month, operador_id, operador_nombre, empresa_contratada_id
          ) VALUES (
            NEW.id, NEW.cliente_id, 'patrulla', NEW.tipo,
            EXTRACT(YEAR FROM NEW.created_at)::INTEGER,
            EXTRACT(MONTH FROM NEW.created_at)::INTEGER,
            NEW.operador_id, NEW.operador_nombre, cliente_empresa_id
          );
        ELSIF tipo_servicio_mapeado = 'acompanamiento' AND servicios_empresa.acompanamientos_restantes > 0 THEN
          INSERT INTO public.servicios_utilizados (
            alarma_id, cliente_id, tipo_servicio, tipo_alarma,
            year, month, operador_id, operador_nombre, empresa_contratada_id
          ) VALUES (
            NEW.id, NEW.cliente_id, 'acompanamiento', NEW.tipo,
            EXTRACT(YEAR FROM NEW.created_at)::INTEGER,
            EXTRACT(MONTH FROM NEW.created_at)::INTEGER,
            NEW.operador_id, NEW.operador_nombre, cliente_empresa_id
          );
        ELSIF tipo_servicio_mapeado = 'revista' AND servicios_empresa.revistas_restantes > 0 THEN
          INSERT INTO public.servicios_utilizados (
            alarma_id, cliente_id, tipo_servicio, tipo_alarma,
            year, month, operador_id, operador_nombre, empresa_contratada_id
          ) VALUES (
            NEW.id, NEW.cliente_id, 'revista', NEW.tipo,
            EXTRACT(YEAR FROM NEW.created_at)::INTEGER,
            EXTRACT(MONTH FROM NEW.created_at)::INTEGER,
            NEW.operador_id, NEW.operador_nombre, cliente_empresa_id
          );
        END IF;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Function 2: Fix descontar_servicios_alarma_global
CREATE OR REPLACE FUNCTION public.descontar_servicios_alarma_global()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  servicios_globales RECORD;
  tipo_normalizado TEXT;
  tipo_servicio_mapeado TEXT;
BEGIN
  -- Solo procesar si la alarma se está creando o activando
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.estado != 'activa' AND NEW.estado = 'activa') THEN
    
    -- Normalizar el tipo de alarma (lowercase)
    tipo_normalizado = LOWER(TRIM(NEW.tipo));
    
    -- Mapear tipo de alarma a tipo de servicio
    tipo_servicio_mapeado = CASE 
      WHEN tipo_normalizado IN ('acompanamiento', 'acompañamiento', 'escolta') THEN 'acompanamiento'
      WHEN tipo_normalizado IN ('revista', 'inspeccion', 'inspección') THEN 'revista'
      ELSE 'patrulla' -- Por defecto: alarma, panico, fuego, etc.
    END;
    
    -- Obtener servicios globales del mes actual
    SELECT * INTO servicios_globales 
    FROM get_servicios_globales_mes(
      EXTRACT(YEAR FROM NEW.created_at)::INTEGER,
      EXTRACT(MONTH FROM NEW.created_at)::INTEGER
    );
    
    -- Verificar que existan servicios globales configurados
    IF servicios_globales IS NOT NULL THEN
      -- Registrar uso de servicio según el tipo mapeado
      IF tipo_servicio_mapeado = 'patrulla' AND servicios_globales.patrullas_restantes > 0 THEN
        INSERT INTO public.servicios_utilizados (
          alarma_id, cliente_id, tipo_servicio, tipo_alarma, 
          year, month, operador_id, operador_nombre
        ) VALUES (
          NEW.id, NEW.cliente_id, 'patrulla', NEW.tipo,
          EXTRACT(YEAR FROM NEW.created_at)::INTEGER,
          EXTRACT(MONTH FROM NEW.created_at)::INTEGER,
          NEW.operador_id, NEW.operador_nombre
        );
      ELSIF tipo_servicio_mapeado = 'acompanamiento' AND servicios_globales.acompanamientos_restantes > 0 THEN
        INSERT INTO public.servicios_utilizados (
          alarma_id, cliente_id, tipo_servicio, tipo_alarma,
          year, month, operador_id, operador_nombre
        ) VALUES (
          NEW.id, NEW.cliente_id, 'acompanamiento', NEW.tipo,
          EXTRACT(YEAR FROM NEW.created_at)::INTEGER,
          EXTRACT(MONTH FROM NEW.created_at)::INTEGER,
          NEW.operador_id, NEW.operador_nombre
        );
      ELSIF tipo_servicio_mapeado = 'revista' AND servicios_globales.revistas_restantes > 0 THEN
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
$function$;

-- Function 3: Fix descontar_servicios_alarma (for patrullas_coraza table)
CREATE OR REPLACE FUNCTION public.descontar_servicios_alarma()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  tipo_normalizado TEXT;
  tipo_servicio_mapeado TEXT;
BEGIN
  -- Solo descontar si la alarma se está creando (INSERT) o si cambió de estado a activa
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.estado != 'activa' AND NEW.estado = 'activa') THEN
    
    -- Normalizar el tipo de alarma (lowercase)
    tipo_normalizado = LOWER(TRIM(NEW.tipo));
    
    -- Mapear tipo de alarma a tipo de servicio
    tipo_servicio_mapeado = CASE 
      WHEN tipo_normalizado IN ('acompanamiento', 'acompañamiento', 'escolta') THEN 'acompanamiento'
      WHEN tipo_normalizado IN ('revista', 'inspeccion', 'inspección') THEN 'revista'
      ELSE 'patrulla' -- Por defecto: alarma, panico, fuego, etc.
    END;
    
    -- Descontar según el tipo de servicio mapeado
    IF tipo_servicio_mapeado = 'patrulla' THEN
      -- Descontar patrulla
      UPDATE public.patrullas_coraza 
      SET patrullas_usadas = patrullas_usadas + 1,
          updated_at = now()
      WHERE cliente_id = NEW.cliente_id 
        AND year = EXTRACT(YEAR FROM NEW.created_at)
        AND month = EXTRACT(MONTH FROM NEW.created_at)
        AND patrullas_usadas < patrullas_disponibles;
        
    ELSIF tipo_servicio_mapeado = 'acompanamiento' THEN
      -- Descontar acompañamiento
      UPDATE public.patrullas_coraza 
      SET acompanamientos_usados = acompanamientos_usados + 1,
          updated_at = now()
      WHERE cliente_id = NEW.cliente_id 
        AND year = EXTRACT(YEAR FROM NEW.created_at)
        AND month = EXTRACT(MONTH FROM NEW.created_at)
        AND acompanamientos_usados < acompanamientos_disponibles;
        
    ELSIF tipo_servicio_mapeado = 'revista' THEN
      -- Descontar revista
      UPDATE public.patrullas_coraza 
      SET revistas_usadas = revistas_usadas + 1,
          updated_at = now()
      WHERE cliente_id = NEW.cliente_id 
        AND year = EXTRACT(YEAR FROM NEW.created_at)
        AND month = EXTRACT(MONTH FROM NEW.created_at)
        AND revistas_usadas < revistas_disponibles;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Data correction script for current month
-- Corregir registros mal categorizados en servicios_utilizados del mes actual
UPDATE public.servicios_utilizados 
SET tipo_servicio = 'acompanamiento'
WHERE tipo_servicio = 'patrulla' 
  AND LOWER(TRIM(tipo_alarma)) IN ('acompanamiento', 'acompañamiento', 'escolta')
  AND year = EXTRACT(YEAR FROM CURRENT_DATE)
  AND month = EXTRACT(MONTH FROM CURRENT_DATE);

UPDATE public.servicios_utilizados 
SET tipo_servicio = 'revista'
WHERE tipo_servicio = 'patrulla' 
  AND LOWER(TRIM(tipo_alarma)) IN ('revista', 'inspeccion', 'inspección')
  AND year = EXTRACT(YEAR FROM CURRENT_DATE)
  AND month = EXTRACT(MONTH FROM CURRENT_DATE);