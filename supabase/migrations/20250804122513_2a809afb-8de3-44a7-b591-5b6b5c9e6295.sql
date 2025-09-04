-- Crear tabla de clientes
CREATE TABLE public.clientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_cuenta TEXT NOT NULL UNIQUE,
  razon_social TEXT NOT NULL,
  direccion TEXT NOT NULL,
  telefono TEXT,
  email TEXT,
  coordenadas_lat DECIMAL(10, 8),
  coordenadas_lng DECIMAL(11, 8),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla de servicios técnicos
CREATE TABLE public.servicios_tecnicos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id),
  tecnico_id UUID NOT NULL,
  numero_servicio TEXT NOT NULL UNIQUE,
  motivo TEXT NOT NULL,
  descripcion TEXT,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_proceso', 'completado', 'cancelado')),
  fecha_asignacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  fecha_programada TIMESTAMP WITH TIME ZONE,
  fecha_completado TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla de materiales
CREATE TABLE public.materiales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  codigo TEXT UNIQUE,
  precio_unitario DECIMAL(10, 2),
  unidad_medida TEXT NOT NULL DEFAULT 'unidad',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla de materiales utilizados en servicios
CREATE TABLE public.servicio_materiales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  servicio_id UUID NOT NULL REFERENCES public.servicios_tecnicos(id),
  material_id UUID NOT NULL REFERENCES public.materiales(id),
  cantidad DECIMAL(10, 2) NOT NULL,
  precio_unitario DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla de historial de servicios
CREATE TABLE public.historial_servicios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id),
  servicio_id UUID NOT NULL REFERENCES public.servicios_tecnicos(id),
  fecha_servicio TIMESTAMP WITH TIME ZONE NOT NULL,
  tipo_servicio TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  tecnico_nombre TEXT NOT NULL,
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla de cotizaciones
CREATE TABLE public.cotizaciones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_cotizacion TEXT NOT NULL UNIQUE,
  cliente_nombre TEXT NOT NULL,
  cliente_email TEXT,
  cliente_telefono TEXT,
  vendedor_id UUID NOT NULL,
  fecha_expiracion DATE NOT NULL,
  terminos_pago TEXT NOT NULL,
  observaciones TEXT,
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
  descuento DECIMAL(5, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador', 'enviada', 'aprobada', 'rechazada')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla de items de cotización
CREATE TABLE public.cotizacion_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cotizacion_id UUID NOT NULL REFERENCES public.cotizaciones(id) ON DELETE CASCADE,
  descripcion TEXT NOT NULL,
  cantidad DECIMAL(10, 2) NOT NULL,
  precio_unitario DECIMAL(10, 2) NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS en todas las tablas
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicios_tecnicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materiales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicio_materiales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historial_servicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cotizaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cotizacion_items ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para clientes
CREATE POLICY "Administradores y técnicos pueden ver todos los clientes" 
ON public.clientes FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('administrador', 'tecnico', 'jefe_tecnicos', 'asesor_ventas')
  )
);

CREATE POLICY "Administradores pueden gestionar clientes" 
ON public.clientes FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'administrador'
  )
);

-- Políticas RLS para servicios técnicos
CREATE POLICY "Técnicos pueden ver sus servicios asignados" 
ON public.servicios_tecnicos FOR SELECT 
USING (
  tecnico_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('administrador', 'jefe_tecnicos')
  )
);

CREATE POLICY "Técnicos pueden actualizar sus servicios" 
ON public.servicios_tecnicos FOR UPDATE 
USING (
  tecnico_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('administrador', 'jefe_tecnicos')
  )
);

CREATE POLICY "Administradores y jefes pueden gestionar servicios" 
ON public.servicios_tecnicos FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('administrador', 'jefe_tecnicos')
  )
);

-- Políticas para materiales
CREATE POLICY "Usuarios autenticados pueden ver materiales" 
ON public.materiales FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Administradores pueden gestionar materiales" 
ON public.materiales FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'administrador'
  )
);

-- Políticas para servicio_materiales
CREATE POLICY "Técnicos pueden ver materiales de sus servicios" 
ON public.servicio_materiales FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM servicios_tecnicos 
    WHERE id = servicio_id 
    AND (tecnico_id = auth.uid() OR 
         EXISTS (
           SELECT 1 FROM user_roles 
           WHERE user_id = auth.uid() 
           AND role IN ('administrador', 'jefe_tecnicos')
         ))
  )
);

CREATE POLICY "Técnicos pueden agregar materiales a sus servicios" 
ON public.servicio_materiales FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM servicios_tecnicos 
    WHERE id = servicio_id 
    AND tecnico_id = auth.uid()
  )
);

-- Políticas para historial
CREATE POLICY "Ver historial según acceso al cliente" 
ON public.historial_servicios FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('administrador', 'tecnico', 'jefe_tecnicos', 'asesor_ventas')
  )
);

-- Políticas para cotizaciones
CREATE POLICY "Vendedores pueden ver sus cotizaciones" 
ON public.cotizaciones FOR SELECT 
USING (
  vendedor_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('administrador', 'director')
  )
);

CREATE POLICY "Vendedores pueden gestionar sus cotizaciones" 
ON public.cotizaciones FOR ALL 
USING (
  vendedor_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('administrador', 'director')
  )
);

CREATE POLICY "Vendedores pueden gestionar items de sus cotizaciones" 
ON public.cotizacion_items FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM cotizaciones 
    WHERE id = cotizacion_id 
    AND (vendedor_id = auth.uid() OR 
         EXISTS (
           SELECT 1 FROM user_roles 
           WHERE user_id = auth.uid() 
           AND role IN ('administrador', 'director')
         ))
  )
);

-- Función para actualizar timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_servicios_updated_at BEFORE UPDATE ON public.servicios_tecnicos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cotizaciones_updated_at BEFORE UPDATE ON public.cotizaciones FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();