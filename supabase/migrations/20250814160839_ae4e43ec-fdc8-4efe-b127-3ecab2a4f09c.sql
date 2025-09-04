-- Crear tabla cotizaciones
CREATE TABLE public.cotizaciones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  numero_cotizacion TEXT NOT NULL,
  cliente_nombre TEXT NOT NULL,
  cliente_id UUID REFERENCES public.clientes(id),
  total NUMERIC NOT NULL DEFAULT 0,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  descuento NUMERIC NOT NULL DEFAULT 0,
  fecha_expiracion DATE NOT NULL,
  terminos_pago TEXT,
  estado TEXT NOT NULL DEFAULT 'borrador',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla cotizacion_items
CREATE TABLE public.cotizacion_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cotizacion_id UUID NOT NULL REFERENCES public.cotizaciones(id) ON DELETE CASCADE,
  descripcion TEXT NOT NULL,
  cantidad INTEGER NOT NULL DEFAULT 1,
  precio_unitario NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.cotizaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cotizacion_items ENABLE ROW LEVEL SECURITY;

-- Políticas para cotizaciones
CREATE POLICY "Users can view their own cotizaciones" 
ON public.cotizaciones 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cotizaciones" 
ON public.cotizaciones 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cotizaciones" 
ON public.cotizaciones 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cotizaciones" 
ON public.cotizaciones 
FOR DELETE 
USING (auth.uid() = user_id);

-- Políticas para cotizacion_items
CREATE POLICY "Users can view items of their cotizaciones" 
ON public.cotizacion_items 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.cotizaciones 
  WHERE id = cotizacion_items.cotizacion_id 
  AND user_id = auth.uid()
));

CREATE POLICY "Users can create items for their cotizaciones" 
ON public.cotizacion_items 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.cotizaciones 
  WHERE id = cotizacion_items.cotizacion_id 
  AND user_id = auth.uid()
));

CREATE POLICY "Users can update items of their cotizaciones" 
ON public.cotizacion_items 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.cotizaciones 
  WHERE id = cotizacion_items.cotizacion_id 
  AND user_id = auth.uid()
));

CREATE POLICY "Users can delete items of their cotizaciones" 
ON public.cotizacion_items 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.cotizaciones 
  WHERE id = cotizacion_items.cotizacion_id 
  AND user_id = auth.uid()
));

-- Trigger para actualizar updated_at en cotizaciones
CREATE TRIGGER update_cotizaciones_updated_at
BEFORE UPDATE ON public.cotizaciones
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Crear usuario administrador por defecto
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  gen_random_uuid(),
  'admin@empresa.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Administrador"}',
  false,
  'authenticated'
) ON CONFLICT (email) DO NOTHING;