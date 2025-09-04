-- Crear tabla elementos_cotizables
CREATE TABLE public.elementos_cotizables (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo text NOT NULL UNIQUE,
  nombre text NOT NULL,
  descripcion text NOT NULL,
  categoria text NOT NULL,
  precio numeric NOT NULL DEFAULT 0,
  unidad text NOT NULL,
  estado text NOT NULL DEFAULT 'activo',
  observaciones text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.elementos_cotizables ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS
CREATE POLICY "Authenticated users can view elementos_cotizables" 
ON public.elementos_cotizables 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage elementos_cotizables" 
ON public.elementos_cotizables 
FOR ALL 
USING (true);

-- Crear trigger para updated_at
CREATE TRIGGER update_elementos_cotizables_updated_at
BEFORE UPDATE ON public.elementos_cotizables
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insertar algunos datos de ejemplo
INSERT INTO public.elementos_cotizables (codigo, nombre, descripcion, categoria, precio, unidad, estado, observaciones) VALUES
('SER001', 'Servicio de Vigilancia Básica', 'Servicio de vigilancia básica 8 horas', 'Servicios', 120000, 'día', 'activo', ''),
('EQ001', 'Cámara de Seguridad HD', 'Cámara de seguridad alta definición con visión nocturna', 'Equipos', 450000, 'unidad', 'activo', ''),
('INS001', 'Instalación de Sistema', 'Instalación completa de sistema de seguridad', 'Instalación', 200000, 'servicio', 'activo', ''),
('MAN001', 'Mantenimiento Preventivo', 'Mantenimiento preventivo mensual de equipos', 'Mantenimiento', 80000, 'mes', 'activo', ''),
('ACC001', 'Kit de Accesorios Básicos', 'Kit básico de accesorios para instalación', 'Accesorios', 150000, 'kit', 'activo', '');