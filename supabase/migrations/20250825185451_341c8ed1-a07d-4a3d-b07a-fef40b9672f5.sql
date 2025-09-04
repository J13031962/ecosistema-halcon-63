-- Agregar campos de coordenadas a la tabla clientes
ALTER TABLE public.clientes 
ADD COLUMN IF NOT EXISTS latitud DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitud DECIMAL(11, 8);

-- Agregar comentarios para documentar las columnas
COMMENT ON COLUMN public.clientes.latitud IS 'Latitud GPS del cliente para ubicación geográfica';
COMMENT ON COLUMN public.clientes.longitud IS 'Longitud GPS del cliente para ubicación geográfica';