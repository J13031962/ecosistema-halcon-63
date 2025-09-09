-- Agregar campos para seguimiento detallado de tiempos en alarmas
ALTER TABLE public.alarmas 
ADD COLUMN IF NOT EXISTS tiempo_toma_despachador timestamp with time zone,
ADD COLUMN IF NOT EXISTS tiempo_asignacion_supervisor timestamp with time zone,
ADD COLUMN IF NOT EXISTS tiempo_aceptacion_supervisor timestamp with time zone,
ADD COLUMN IF NOT EXISTS tiempo_primera_lectura_qr timestamp with time zone,
ADD COLUMN IF NOT EXISTS tiempo_segunda_lectura_qr timestamp with time zone,
ADD COLUMN IF NOT EXISTS ubicacion_primer_qr text,
ADD COLUMN IF NOT EXISTS ubicacion_segundo_qr text;

-- Crear tabla para seguimiento de tiempos en tiempo real
CREATE TABLE IF NOT EXISTS public.alarma_tiempos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alarma_id uuid NOT NULL REFERENCES public.alarmas(id) ON DELETE CASCADE,
  evento_tipo text NOT NULL, -- 'toma_despachador', 'asignacion_supervisor', 'aceptacion_supervisor', 'primera_lectura_qr', 'segunda_lectura_qr'
  timestamp_evento timestamp with time zone NOT NULL DEFAULT now(),
  usuario_id uuid,
  usuario_nombre text,
  detalles jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS en la nueva tabla
ALTER TABLE public.alarma_tiempos ENABLE ROW LEVEL SECURITY;

-- Política para que usuarios autenticados puedan ver y crear registros de tiempos
CREATE POLICY "Usuarios autenticados pueden gestionar tiempos alarmas"
ON public.alarma_tiempos
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_alarma_tiempos_alarma_id ON public.alarma_tiempos(alarma_id);
CREATE INDEX IF NOT EXISTS idx_alarma_tiempos_evento_tipo ON public.alarma_tiempos(evento_tipo);

-- Función para calcular duraciones automáticamente
CREATE OR REPLACE FUNCTION public.calcular_duraciones_alarma()
RETURNS trigger AS $$
BEGIN
  -- Calcular tiempo de respuesta del despachador cuando se toma la alarma
  IF NEW.tiempo_toma_despachador IS NOT NULL AND OLD.tiempo_toma_despachador IS NULL THEN
    NEW.tiempo_respuesta_segundos = EXTRACT(EPOCH FROM (NEW.tiempo_toma_despachador - NEW.created_at))::integer;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para calcular duraciones automáticamente
DROP TRIGGER IF EXISTS trigger_calcular_duraciones_alarma ON public.alarmas;
CREATE TRIGGER trigger_calcular_duraciones_alarma
  BEFORE UPDATE ON public.alarmas
  FOR EACH ROW
  EXECUTE FUNCTION public.calcular_duraciones_alarma();

-- Función para registrar eventos de tiempo automáticamente
CREATE OR REPLACE FUNCTION public.registrar_evento_tiempo()
RETURNS trigger AS $$
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
$$ LANGUAGE plpgsql;

-- Trigger para registrar eventos automáticamente
DROP TRIGGER IF EXISTS trigger_registrar_evento_tiempo ON public.alarmas;
CREATE TRIGGER trigger_registrar_evento_tiempo
  AFTER UPDATE ON public.alarmas
  FOR EACH ROW
  EXECUTE FUNCTION public.registrar_evento_tiempo();