-- Fix RLS violation when inserting into alarma_tiempos from trigger by using SECURITY DEFINER
-- and ensure trigger exists on alarmas updates.

-- 1) Replace function with SECURITY DEFINER and safe search_path
CREATE OR REPLACE FUNCTION public.registrar_evento_tiempo()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Registrar cuando el despachador toma la alarma
  IF NEW.tiempo_toma_despachador IS NOT NULL AND (OLD.tiempo_toma_despachador IS NULL OR OLD.tiempo_toma_despachador != NEW.tiempo_toma_despachador) THEN
    INSERT INTO public.alarma_tiempos (alarma_id, evento_tipo, timestamp_evento, usuario_id, usuario_nombre)
    VALUES (NEW.id, 'toma_despachador', NEW.tiempo_toma_despachador, NEW.despachador_id, NEW.despachador_nombre);
  END IF;
  
  -- Registrar cuando se asigna supervisor
  IF NEW.tiempo_asignacion_supervisor IS NOT NULL AND (OLD.tiempo_asignacion_supervisor IS NULL OR OLD.tiempo_asignacion_supervisor != NEW.tiempo_asignacion_supervisor) THEN
    INSERT INTO public.alarma_tiempos (alarma_id, evento_tipo, timestamp_evento, usuario_id, usuario_nombre)
    VALUES (NEW.id, 'asignacion_supervisor', NEW.tiempo_asignacion_supervisor, NEW.despachador_id, NEW.despachador_nombre);
  END IF;
  
  -- Registrar cuando el supervisor acepta
  IF NEW.tiempo_aceptacion_supervisor IS NOT NULL AND (OLD.tiempo_aceptacion_supervisor IS NULL OR OLD.tiempo_aceptacion_supervisor != NEW.tiempo_aceptacion_supervisor) THEN
    INSERT INTO public.alarma_tiempos (alarma_id, evento_tipo, timestamp_evento, usuario_id, usuario_nombre)
    VALUES (NEW.id, 'aceptacion_supervisor', NEW.tiempo_aceptacion_supervisor, NEW.supervisor_id, NEW.supervisor);
  END IF;
  
  -- Registrar primera lectura QR
  IF NEW.tiempo_primera_lectura_qr IS NOT NULL AND (OLD.tiempo_primera_lectura_qr IS NULL OR OLD.tiempo_primera_lectura_qr != NEW.tiempo_primera_lectura_qr) THEN
    INSERT INTO public.alarma_tiempos (alarma_id, evento_tipo, timestamp_evento, usuario_id, usuario_nombre, detalles)
    VALUES (NEW.id, 'primera_lectura_qr', NEW.tiempo_primera_lectura_qr, NEW.supervisor_id, NEW.supervisor, 
            jsonb_build_object('ubicacion', NEW.ubicacion_primer_qr));
  END IF;
  
  -- Registrar segunda lectura QR
  IF NEW.tiempo_segunda_lectura_qr IS NOT NULL AND (OLD.tiempo_segunda_lectura_qr IS NULL OR OLD.tiempo_segunda_lectura_qr != NEW.tiempo_segunda_lectura_qr) THEN
    INSERT INTO public.alarma_tiempos (alarma_id, evento_tipo, timestamp_evento, usuario_id, usuario_nombre, detalles)
    VALUES (NEW.id, 'segunda_lectura_qr', NEW.tiempo_segunda_lectura_qr, NEW.supervisor_id, NEW.supervisor,
            jsonb_build_object('ubicacion', NEW.ubicacion_segundo_qr));
  END IF;
  
  RETURN NEW;
END;
$$;

-- 2) Ensure trigger is present and unique
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM pg_trigger 
    WHERE tgname = 'trg_registrar_evento_tiempo'
  ) THEN
    -- Drop existing to recreate cleanly
    EXECUTE 'DROP TRIGGER trg_registrar_evento_tiempo ON public.alarmas';
  END IF;

  EXECUTE 'CREATE TRIGGER trg_registrar_evento_tiempo
    AFTER UPDATE ON public.alarmas
    FOR EACH ROW
    EXECUTE FUNCTION public.registrar_evento_tiempo()';
END $$;