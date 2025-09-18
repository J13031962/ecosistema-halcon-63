-- Add zone information columns to alarmas table for Fire and Alarm types
ALTER TABLE public.alarmas 
ADD COLUMN numero_zona text,
ADD COLUMN nombre_zona text,
ADD COLUMN tipo_sensor text;