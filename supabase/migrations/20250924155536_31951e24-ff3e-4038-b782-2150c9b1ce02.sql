-- Add supervisor GPS location fields to alarmas table
ALTER TABLE public.alarmas 
ADD COLUMN ubicacion_supervisor_llegada jsonb,
ADD COLUMN ubicacion_supervisor_salida jsonb;

-- Add comments for clarity
COMMENT ON COLUMN public.alarmas.ubicacion_supervisor_llegada IS 'GPS location data when supervisor arrives at site (coordinates, accuracy, timestamp)';
COMMENT ON COLUMN public.alarmas.ubicacion_supervisor_salida IS 'GPS location data when supervisor departs from site (coordinates, accuracy, timestamp)';