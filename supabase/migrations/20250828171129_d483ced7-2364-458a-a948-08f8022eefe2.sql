-- ============================================
-- CORRECCIÓN DE FUNCIONES Y TRIGGERS DEPENDIENTES
-- ============================================

-- 1. Eliminar triggers primero
DROP TRIGGER IF EXISTS update_observaciones_count_trigger ON observaciones_alarmas;
DROP TRIGGER IF EXISTS calculate_patrulla_duration_trigger ON estados_patrulla;
DROP TRIGGER IF EXISTS update_servicios_tecnicos_timestamp_trigger ON servicios_tecnicos_asignados;
DROP TRIGGER IF EXISTS generate_numero_cuenta_trigger ON clientes;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Ahora eliminar funciones
DROP FUNCTION IF EXISTS public.update_observaciones_count() CASCADE;
DROP FUNCTION IF EXISTS public.calculate_patrulla_duration() CASCADE;
DROP FUNCTION IF EXISTS public.update_servicios_tecnicos_timestamp() CASCADE;
DROP FUNCTION IF EXISTS public.generate_numero_cuenta() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- 3. Recrear funciones con search_path correcto
CREATE OR REPLACE FUNCTION public.update_observaciones_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.alarmas 
  SET observaciones_count = (
    SELECT COUNT(*) 
    FROM public.observaciones_alarmas 
    WHERE alarma_id = NEW.alarma_id
  )
  WHERE id = NEW.alarma_id;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_patrulla_duration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.tiempo_fin IS NOT NULL AND NEW.tiempo_inicio IS NOT NULL THEN
    NEW.duracion_segundos = EXTRACT(EPOCH FROM (NEW.tiempo_fin - NEW.tiempo_inicio))::INTEGER;
  END IF;
  
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_servicios_tecnicos_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_numero_cuenta()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.numero_cuenta IS NULL OR NEW.numero_cuenta = '' THEN
    NEW.numero_cuenta := 'CTE-' || LPAD(nextval('clientes_numero_cuenta_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$;

-- 4. Recrear triggers
CREATE TRIGGER update_observaciones_count_trigger
AFTER INSERT ON public.observaciones_alarmas
FOR EACH ROW
EXECUTE FUNCTION public.update_observaciones_count();

CREATE TRIGGER calculate_patrulla_duration_trigger
BEFORE UPDATE ON public.estados_patrulla
FOR EACH ROW
EXECUTE FUNCTION public.calculate_patrulla_duration();

CREATE TRIGGER update_servicios_tecnicos_timestamp_trigger
BEFORE UPDATE ON public.servicios_tecnicos_asignados
FOR EACH ROW
EXECUTE FUNCTION public.update_servicios_tecnicos_timestamp();

CREATE TRIGGER generate_numero_cuenta_trigger
BEFORE INSERT ON public.clientes
FOR EACH ROW
EXECUTE FUNCTION public.generate_numero_cuenta();