-- Crear tabla para registrar llamadas a clientes
CREATE TABLE public.llamadas_clientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID NOT NULL,
  operador_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  contacto_nombre TEXT NOT NULL,
  numero_telefono TEXT NOT NULL,
  tipo_llamada TEXT NOT NULL CHECK (tipo_llamada IN ('celular', 'smarturban')),
  motivo TEXT,
  observaciones TEXT,
  duracion_segundos INTEGER DEFAULT 0,
  estado TEXT DEFAULT 'completada' CHECK (estado IN ('completada', 'no_contesto', 'ocupado', 'fuera_servicio'))
);

-- Habilitar RLS
ALTER TABLE public.llamadas_clientes ENABLE ROW LEVEL SECURITY;

-- Crear políticas para llamadas
CREATE POLICY "Usuarios autenticados pueden gestionar llamadas" 
ON public.llamadas_clientes 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_llamadas_cliente_id ON public.llamadas_clientes(cliente_id);
CREATE INDEX idx_llamadas_operador_id ON public.llamadas_clientes(operador_id);
CREATE INDEX idx_llamadas_created_at ON public.llamadas_clientes(created_at);
CREATE INDEX idx_llamadas_tipo ON public.llamadas_clientes(tipo_llamada);

-- Crear trigger para actualizar updated_at si se agrega la columna
-- (por ahora solo tenemos created_at)