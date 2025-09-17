-- Crear tabla para gestión de patrullas coraza
CREATE TABLE public.patrullas_coraza (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id uuid REFERENCES public.clientes(id) ON DELETE CASCADE,
  year integer NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  month integer NOT NULL DEFAULT EXTRACT(MONTH FROM CURRENT_DATE),
  patrullas_disponibles integer NOT NULL DEFAULT 0,
  acompanamientos_disponibles integer NOT NULL DEFAULT 0,
  revistas_disponibles integer NOT NULL DEFAULT 0,
  patrullas_usadas integer NOT NULL DEFAULT 0,
  acompanamientos_usados integer NOT NULL DEFAULT 0,
  revistas_usadas integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(cliente_id, year, month)
);

-- Habilitar RLS
ALTER TABLE public.patrullas_coraza ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para patrullas_coraza
CREATE POLICY "Usuarios autenticados pueden ver patrullas_coraza" 
ON public.patrullas_coraza 
FOR SELECT 
USING (true);

CREATE POLICY "Administradores y directores pueden gestionar patrullas_coraza" 
ON public.patrullas_coraza 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('administrador'::user_role, 'director'::user_role)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('administrador'::user_role, 'director'::user_role)
  )
);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_patrullas_coraza_updated_at
  BEFORE UPDATE ON public.patrullas_coraza
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Función para descontar servicios cuando se genera una alarma
CREATE OR REPLACE FUNCTION public.descontar_servicios_alarma()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo descontar si la alarma se está creando (INSERT) o si cambió de estado a activa
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.estado != 'activa' AND NEW.estado = 'activa') THEN
    -- Descontar patrulla (siempre se usa una patrulla)
    UPDATE public.patrullas_coraza 
    SET patrullas_usadas = patrullas_usadas + 1,
        updated_at = now()
    WHERE cliente_id = NEW.cliente_id 
      AND year = EXTRACT(YEAR FROM NEW.created_at)
      AND month = EXTRACT(MONTH FROM NEW.created_at)
      AND patrullas_usadas < patrullas_disponibles;
    
    -- Descontar acompañamiento si el tipo de alarma lo requiere
    IF NEW.tipo IN ('acompanamiento', 'escolta') THEN
      UPDATE public.patrullas_coraza 
      SET acompanamientos_usados = acompanamientos_usados + 1,
          updated_at = now()
      WHERE cliente_id = NEW.cliente_id 
        AND year = EXTRACT(YEAR FROM NEW.created_at)
        AND month = EXTRACT(MONTH FROM NEW.created_at)
        AND acompanamientos_usados < acompanamientos_disponibles;
    END IF;
    
    -- Descontar revista si el tipo de alarma lo requiere
    IF NEW.tipo IN ('revista', 'inspeccion') THEN
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para descontar servicios automáticamente
CREATE TRIGGER trigger_descontar_servicios_alarma
  AFTER INSERT OR UPDATE ON public.alarmas
  FOR EACH ROW
  EXECUTE FUNCTION public.descontar_servicios_alarma();

-- Función para obtener el resumen de servicios de un cliente por mes
CREATE OR REPLACE FUNCTION public.get_cliente_servicios_mes(
  cliente_id_param uuid,
  year_param integer DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  month_param integer DEFAULT EXTRACT(MONTH FROM CURRENT_DATE)
)
RETURNS TABLE(
  patrullas_disponibles integer,
  patrullas_usadas integer,
  patrullas_restantes integer,
  acompanamientos_disponibles integer,
  acompanamientos_usados integer,
  acompanamientos_restantes integer,
  revistas_disponibles integer,
  revistas_usadas integer,
  revistas_restantes integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(pc.patrullas_disponibles, 0) as patrullas_disponibles,
    COALESCE(pc.patrullas_usadas, 0) as patrullas_usadas,
    COALESCE(pc.patrullas_disponibles - pc.patrullas_usadas, 0) as patrullas_restantes,
    COALESCE(pc.acompanamientos_disponibles, 0) as acompanamientos_disponibles,
    COALESCE(pc.acompanamientos_usados, 0) as acompanamientos_usados,
    COALESCE(pc.acompanamientos_disponibles - pc.acompanamientos_usados, 0) as acompanamientos_restantes,
    COALESCE(pc.revistas_disponibles, 0) as revistas_disponibles,
    COALESCE(pc.revistas_usadas, 0) as revistas_usadas,
    COALESCE(pc.revistas_disponibles - pc.revistas_usadas, 0) as revistas_restantes
  FROM public.patrullas_coraza pc
  WHERE pc.cliente_id = cliente_id_param
    AND pc.year = year_param
    AND pc.month = month_param
  UNION ALL
  SELECT 0, 0, 0, 0, 0, 0, 0, 0, 0
  WHERE NOT EXISTS (
    SELECT 1 FROM public.patrullas_coraza pc
    WHERE pc.cliente_id = cliente_id_param
      AND pc.year = year_param
      AND pc.month = month_param
  )
  LIMIT 1;
END;
$$;