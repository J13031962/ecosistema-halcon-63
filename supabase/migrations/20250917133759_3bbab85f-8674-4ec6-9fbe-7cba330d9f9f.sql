-- Crear tabla para empresas contratadas
CREATE TABLE public.empresas_contratadas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  tipo_servicio TEXT NOT NULL DEFAULT 'seguridad',
  estado TEXT NOT NULL DEFAULT 'activo',
  contacto TEXT,
  telefono TEXT,
  email TEXT,
  descripcion TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Modificar tabla patrullas_coraza para agregar empresa_contratada_id
ALTER TABLE public.patrullas_coraza ADD COLUMN empresa_contratada_id UUID REFERENCES public.empresas_contratadas(id);

-- Modificar tabla clientes para agregar empresa_contratada_id
ALTER TABLE public.clientes ADD COLUMN empresa_contratada_id UUID REFERENCES public.empresas_contratadas(id);
ALTER TABLE public.clientes ADD COLUMN limite_patrullas_personalizado INTEGER;
ALTER TABLE public.clientes ADD COLUMN limite_acompanamientos_personalizado INTEGER;
ALTER TABLE public.clientes ADD COLUMN limite_revistas_personalizado INTEGER;

-- Modificar tabla servicios_utilizados para agregar empresa_contratada_id
ALTER TABLE public.servicios_utilizados ADD COLUMN empresa_contratada_id UUID REFERENCES public.empresas_contratadas(id);

-- Crear empresa Coraza por defecto
INSERT INTO public.empresas_contratadas (nombre, tipo_servicio, estado, descripcion)
VALUES ('Coraza', 'seguridad', 'activo', 'Empresa de supervisores y despachadores contratada');

-- Asignar la empresa Coraza a las configuraciones existentes (si las hay)
UPDATE public.patrullas_coraza 
SET empresa_contratada_id = (SELECT id FROM public.empresas_contratadas WHERE nombre = 'Coraza' LIMIT 1)
WHERE empresa_contratada_id IS NULL;

-- Crear configuración global inicial si no existe
INSERT INTO public.patrullas_coraza (
  cliente_id, 
  year, 
  month, 
  patrullas_disponibles, 
  acompanamientos_disponibles, 
  revistas_disponibles,
  empresa_contratada_id
)
SELECT 
  NULL as cliente_id,
  EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER as year,
  EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER as month,
  100 as patrullas_disponibles,
  50 as acompanamientos_disponibles,
  30 as revistas_disponibles,
  (SELECT id FROM public.empresas_contratadas WHERE nombre = 'Coraza' LIMIT 1) as empresa_contratada_id
WHERE NOT EXISTS (
  SELECT 1 FROM public.patrullas_coraza 
  WHERE cliente_id IS NULL 
  AND year = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER 
  AND month = EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER
);

-- Función para obtener servicios por empresa
CREATE OR REPLACE FUNCTION public.get_servicios_por_empresa(
  empresa_id_param UUID,
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
      (SELECT COUNT(*) FROM servicios_utilizados su
       WHERE su.empresa_contratada_id = empresa_id_param
       AND su.tipo_servicio = 'patrulla' 
       AND su.year = year_param 
       AND su.month = month_param), 0
    )::INTEGER as patrullas_usadas,
    GREATEST(
      COALESCE(pc.patrullas_disponibles, 0) - 
      COALESCE(
        (SELECT COUNT(*) FROM servicios_utilizados su
         WHERE su.empresa_contratada_id = empresa_id_param
         AND su.tipo_servicio = 'patrulla' 
         AND su.year = year_param 
         AND su.month = month_param), 0
      ), 0
    )::INTEGER as patrullas_restantes,
    
    COALESCE(pc.acompanamientos_disponibles, 0) as acompanamientos_disponibles,
    COALESCE(
      (SELECT COUNT(*) FROM servicios_utilizados su
       WHERE su.empresa_contratada_id = empresa_id_param
       AND su.tipo_servicio = 'acompanamiento' 
       AND su.year = year_param 
       AND su.month = month_param), 0
    )::INTEGER as acompanamientos_usados,
    GREATEST(
      COALESCE(pc.acompanamientos_disponibles, 0) - 
      COALESCE(
        (SELECT COUNT(*) FROM servicios_utilizados su
         WHERE su.empresa_contratada_id = empresa_id_param
         AND su.tipo_servicio = 'acompanamiento' 
         AND su.year = year_param 
         AND su.month = month_param), 0
      ), 0
    )::INTEGER as acompanamientos_restantes,
    
    COALESCE(pc.revistas_disponibles, 0) as revistas_disponibles,
    COALESCE(
      (SELECT COUNT(*) FROM servicios_utilizados su
       WHERE su.empresa_contratada_id = empresa_id_param
       AND su.tipo_servicio = 'revista' 
       AND su.year = year_param 
       AND su.month = month_param), 0
    )::INTEGER as revistas_usadas,
    GREATEST(
      COALESCE(pc.revistas_disponibles, 0) - 
      COALESCE(
        (SELECT COUNT(*) FROM servicios_utilizados su
         WHERE su.empresa_contratada_id = empresa_id_param
         AND su.tipo_servicio = 'revista' 
         AND su.year = year_param 
         AND su.month = month_param), 0
      ), 0
    )::INTEGER as revistas_restantes
  FROM public.patrullas_coraza pc
  WHERE pc.empresa_contratada_id = empresa_id_param
    AND pc.cliente_id IS NULL
    AND pc.year = year_param 
    AND pc.month = month_param
  UNION ALL
  SELECT 0, 0, 0, 0, 0, 0, 0, 0, 0
  WHERE NOT EXISTS (
    SELECT 1 FROM public.patrullas_coraza pc
    WHERE pc.empresa_contratada_id = empresa_id_param
      AND pc.cliente_id IS NULL
      AND pc.year = year_param 
      AND pc.month = month_param
  )
  LIMIT 1;
END;
$$;

-- Función para obtener resumen global de todas las empresas
CREATE OR REPLACE FUNCTION public.get_resumen_global_empresas(
  year_param INTEGER DEFAULT EXTRACT(year FROM CURRENT_DATE),
  month_param INTEGER DEFAULT EXTRACT(month FROM CURRENT_DATE)
)
RETURNS TABLE(
  empresa_nombre TEXT,
  empresa_id UUID,
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
    ec.nombre as empresa_nombre,
    ec.id as empresa_id,
    COALESCE(pc.patrullas_disponibles, 0) as patrullas_disponibles,
    COALESCE(
      (SELECT COUNT(*) FROM servicios_utilizados su
       WHERE su.empresa_contratada_id = ec.id
       AND su.tipo_servicio = 'patrulla' 
       AND su.year = year_param 
       AND su.month = month_param), 0
    )::INTEGER as patrullas_usadas,
    GREATEST(
      COALESCE(pc.patrullas_disponibles, 0) - 
      COALESCE(
        (SELECT COUNT(*) FROM servicios_utilizados su
         WHERE su.empresa_contratada_id = ec.id
         AND su.tipo_servicio = 'patrulla' 
         AND su.year = year_param 
         AND su.month = month_param), 0
      ), 0
    )::INTEGER as patrullas_restantes,
    
    COALESCE(pc.acompanamientos_disponibles, 0) as acompanamientos_disponibles,
    COALESCE(
      (SELECT COUNT(*) FROM servicios_utilizados su
       WHERE su.empresa_contratada_id = ec.id
       AND su.tipo_servicio = 'acompanamiento' 
       AND su.year = year_param 
       AND su.month = month_param), 0
    )::INTEGER as acompanamientos_usados,
    GREATEST(
      COALESCE(pc.acompanamientos_disponibles, 0) - 
      COALESCE(
        (SELECT COUNT(*) FROM servicios_utilizados su
         WHERE su.empresa_contratada_id = ec.id
         AND su.tipo_servicio = 'acompanamiento' 
         AND su.year = year_param 
         AND su.month = month_param), 0
      ), 0
    )::INTEGER as acompanamientos_restantes,
    
    COALESCE(pc.revistas_disponibles, 0) as revistas_disponibles,
    COALESCE(
      (SELECT COUNT(*) FROM servicios_utilizados su
       WHERE su.empresa_contratada_id = ec.id
       AND su.tipo_servicio = 'revista' 
       AND su.year = year_param 
       AND su.month = month_param), 0
    )::INTEGER as revistas_usadas,
    GREATEST(
      COALESCE(pc.revistas_disponibles, 0) - 
      COALESCE(
        (SELECT COUNT(*) FROM servicios_utilizados su
         WHERE su.empresa_contratada_id = ec.id
         AND su.tipo_servicio = 'revista' 
         AND su.year = year_param 
         AND su.month = month_param), 0
      ), 0
    )::INTEGER as revistas_restantes
  FROM public.empresas_contratadas ec
  LEFT JOIN public.patrullas_coraza pc ON pc.empresa_contratada_id = ec.id 
    AND pc.cliente_id IS NULL
    AND pc.year = year_param 
    AND pc.month = month_param
  WHERE ec.estado = 'activo'
  ORDER BY ec.nombre;
END;
$$;

-- Actualizar función de descuento para usar empresa contratada
DROP TRIGGER IF EXISTS trigger_descontar_servicios_alarma_global ON public.alarmas;

CREATE OR REPLACE FUNCTION public.descontar_servicios_alarma_empresa()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  cliente_empresa_id UUID;
  servicios_empresa RECORD;
BEGIN
  -- Solo procesar si la alarma se está creando o activando
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.estado != 'activa' AND NEW.estado = 'activa') THEN
    
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
        -- Siempre registrar el uso de patrulla
        IF servicios_empresa.patrullas_restantes > 0 THEN
          INSERT INTO public.servicios_utilizados (
            alarma_id, cliente_id, tipo_servicio, tipo_alarma, 
            year, month, operador_id, operador_nombre, empresa_contratada_id
          ) VALUES (
            NEW.id, NEW.cliente_id, 'patrulla', NEW.tipo,
            EXTRACT(YEAR FROM NEW.created_at)::INTEGER,
            EXTRACT(MONTH FROM NEW.created_at)::INTEGER,
            NEW.operador_id, NEW.operador_nombre, cliente_empresa_id
          );
        END IF;
        
        -- Registrar acompañamiento si aplica
        IF NEW.tipo IN ('acompanamiento', 'escolta') AND servicios_empresa.acompanamientos_restantes > 0 THEN
          INSERT INTO public.servicios_utilizados (
            alarma_id, cliente_id, tipo_servicio, tipo_alarma,
            year, month, operador_id, operador_nombre, empresa_contratada_id
          ) VALUES (
            NEW.id, NEW.cliente_id, 'acompanamiento', NEW.tipo,
            EXTRACT(YEAR FROM NEW.created_at)::INTEGER,
            EXTRACT(MONTH FROM NEW.created_at)::INTEGER,
            NEW.operador_id, NEW.operador_nombre, cliente_empresa_id
          );
        END IF;
        
        -- Registrar revista si aplica
        IF NEW.tipo IN ('revista', 'inspeccion') AND servicios_empresa.revistas_restantes > 0 THEN
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
$$;

-- Crear el nuevo trigger
CREATE TRIGGER trigger_descontar_servicios_alarma_empresa
  AFTER INSERT OR UPDATE ON public.alarmas
  FOR EACH ROW
  EXECUTE FUNCTION public.descontar_servicios_alarma_empresa();

-- RLS policies para empresas_contratadas
ALTER TABLE public.empresas_contratadas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios autenticados pueden ver empresas_contratadas" 
ON public.empresas_contratadas 
FOR SELECT 
USING (true);

CREATE POLICY "Administradores pueden gestionar empresas_contratadas" 
ON public.empresas_contratadas 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM user_roles ur
  WHERE ur.user_id = auth.uid() 
  AND ur.role = ANY (ARRAY['administrador'::user_role, 'director'::user_role])
))
WITH CHECK (EXISTS (
  SELECT 1 FROM user_roles ur
  WHERE ur.user_id = auth.uid() 
  AND ur.role = ANY (ARRAY['administrador'::user_role, 'director'::user_role])
));