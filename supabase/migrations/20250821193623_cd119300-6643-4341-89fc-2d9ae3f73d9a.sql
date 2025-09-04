-- Agregar campos adicionales a la tabla clientes
ALTER TABLE public.clientes 
ADD COLUMN IF NOT EXISTS numero_cuenta TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS servicios_contratados JSONB DEFAULT '{"alarmas": 0, "revistas": 0, "acompañamientos": 0}'::jsonb,
ADD COLUMN IF NOT EXISTS fecha_contrato DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS observaciones TEXT;

-- Crear índices para mejorar las búsquedas
CREATE INDEX IF NOT EXISTS idx_clientes_numero_cuenta ON public.clientes(numero_cuenta);
CREATE INDEX IF NOT EXISTS idx_clientes_nombre ON public.clientes(nombre);
CREATE INDEX IF NOT EXISTS idx_clientes_email ON public.clientes(email);
CREATE INDEX IF NOT EXISTS idx_clientes_telefono ON public.clientes(telefono);
CREATE INDEX IF NOT EXISTS idx_clientes_fecha_contrato ON public.clientes(fecha_contrato);
CREATE INDEX IF NOT EXISTS idx_clientes_estado ON public.clientes(estado);

-- Función para generar número de cuenta automático si no se proporciona
CREATE OR REPLACE FUNCTION generate_numero_cuenta()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.numero_cuenta IS NULL OR NEW.numero_cuenta = '' THEN
    NEW.numero_cuenta := 'CTE-' || LPAD(nextval('clientes_numero_cuenta_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear secuencia para números de cuenta
CREATE SEQUENCE IF NOT EXISTS clientes_numero_cuenta_seq START 1000;

-- Crear trigger para generar número de cuenta automáticamente
DROP TRIGGER IF EXISTS trigger_generate_numero_cuenta ON public.clientes;
CREATE TRIGGER trigger_generate_numero_cuenta
  BEFORE INSERT ON public.clientes
  FOR EACH ROW
  EXECUTE FUNCTION generate_numero_cuenta();