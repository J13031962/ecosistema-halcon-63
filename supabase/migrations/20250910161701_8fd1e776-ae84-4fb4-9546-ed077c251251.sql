-- Remove trigger that's causing the updated_at error
DROP TRIGGER IF EXISTS calculate_site_duration_trigger ON public.alarmas;

-- Recreate the trigger without the updated_at field since alarmas table doesn't have it
CREATE OR REPLACE FUNCTION public.calculate_site_duration_without_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Calculate site duration when both arrival and departure times are set
  IF NEW.tiempo_salida_sitio IS NOT NULL AND NEW.tiempo_llegada_sitio IS NOT NULL THEN
    NEW.duracion_sitio_segundos = EXTRACT(EPOCH FROM (NEW.tiempo_salida_sitio - NEW.tiempo_llegada_sitio))::INTEGER;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create the corrected trigger
CREATE TRIGGER calculate_site_duration_trigger
BEFORE UPDATE ON public.alarmas
FOR EACH ROW
EXECUTE FUNCTION public.calculate_site_duration_without_updated_at();