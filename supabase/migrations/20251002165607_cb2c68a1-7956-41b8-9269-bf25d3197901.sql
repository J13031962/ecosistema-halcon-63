-- 1. Agregar empresa_contratada_id a profiles para vincular usuarios con empresas
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS empresa_contratada_id UUID REFERENCES public.empresas_contratadas(id) ON DELETE SET NULL;

-- Crear índice para mejorar performance en consultas
CREATE INDEX IF NOT EXISTS idx_profiles_empresa_contratada ON public.profiles(empresa_contratada_id);

-- 2. Función para revertir servicios utilizados cuando se cancela una alarma
CREATE OR REPLACE FUNCTION public.revertir_servicio_utilizado()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Solo ejecutar si el estado cambió a 'cancelada'
  IF NEW.estado = 'cancelada' AND (OLD.estado IS NULL OR OLD.estado != 'cancelada') THEN
    -- Eliminar el registro de servicios_utilizados asociado a esta alarma
    DELETE FROM public.servicios_utilizados
    WHERE alarma_id = NEW.id;
    
    RAISE NOTICE 'Servicio revertido para alarma: %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Crear trigger para ejecutar la función al actualizar una alarma
DROP TRIGGER IF EXISTS trigger_revertir_servicio_cancelado ON public.alarmas;
CREATE TRIGGER trigger_revertir_servicio_cancelado
  AFTER UPDATE ON public.alarmas
  FOR EACH ROW
  EXECUTE FUNCTION public.revertir_servicio_utilizado();

-- 3. Función auxiliar para obtener empresa de un usuario
CREATE OR REPLACE FUNCTION public.get_user_empresa(user_id_param UUID)
RETURNS UUID
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT empresa_contratada_id FROM public.profiles WHERE id = user_id_param;
$$;

-- 4. RLS policy para que usuarios solo vean datos de su empresa
-- (aplicaremos esto gradualmente en las tablas relevantes)