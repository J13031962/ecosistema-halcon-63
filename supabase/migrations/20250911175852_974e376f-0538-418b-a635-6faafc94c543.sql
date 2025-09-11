-- Crear tabla para la minuta de operaciones
CREATE TABLE public.minuta_operaciones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES auth.users(id),
  usuario_nombre TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  tipo_entrada TEXT NOT NULL DEFAULT 'general',
  contenido TEXT NOT NULL,
  turno TEXT,
  prioridad TEXT DEFAULT 'normal'
);

-- Habilitar RLS
ALTER TABLE public.minuta_operaciones ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso
CREATE POLICY "Usuarios autenticados pueden ver minuta" 
ON public.minuta_operaciones 
FOR SELECT 
USING (true);

CREATE POLICY "Usuarios autenticados pueden crear entradas" 
ON public.minuta_operaciones 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Crear índices para mejor rendimiento
CREATE INDEX idx_minuta_operaciones_fecha ON public.minuta_operaciones(created_at DESC);
CREATE INDEX idx_minuta_operaciones_tipo ON public.minuta_operaciones(tipo_entrada);

-- Trigger para timestamp automático
CREATE TRIGGER update_minuta_operaciones_updated_at
BEFORE UPDATE ON public.minuta_operaciones
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();