-- Add columns to track QR scans and site time for alarms
ALTER TABLE public.alarmas 
ADD COLUMN IF NOT EXISTS tiempo_llegada_sitio TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS tiempo_salida_sitio TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS qr_llegada_data JSONB,
ADD COLUMN IF NOT EXISTS qr_salida_data JSONB,
ADD COLUMN IF NOT EXISTS duracion_sitio_segundos INTEGER;

-- Create trigger to calculate site duration automatically
CREATE OR REPLACE FUNCTION public.calculate_site_duration()
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
  
  -- Update the updated_at timestamp
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Create trigger for automatic site duration calculation
DROP TRIGGER IF EXISTS calculate_site_duration_trigger ON public.alarmas;
CREATE TRIGGER calculate_site_duration_trigger
  BEFORE UPDATE ON public.alarmas
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_site_duration();

-- Add comments for clarity
COMMENT ON COLUMN public.alarmas.tiempo_llegada_sitio IS 'Timestamp when supervisor arrives at site (confirmed by QR scan)';
COMMENT ON COLUMN public.alarmas.tiempo_salida_sitio IS 'Timestamp when supervisor leaves site (confirmed by QR scan)';
COMMENT ON COLUMN public.alarmas.qr_llegada_data IS 'QR data scanned on arrival to verify location';
COMMENT ON COLUMN public.alarmas.qr_salida_data IS 'QR data scanned on departure to verify location';
COMMENT ON COLUMN public.alarmas.duracion_sitio_segundos IS 'Duration in seconds spent at the site';