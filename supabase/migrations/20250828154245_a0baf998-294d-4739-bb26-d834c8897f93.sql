-- Crear tabla de servicios técnicos con toda la información necesaria
CREATE TABLE IF NOT EXISTS public.servicios_tecnicos_asignados (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id uuid NOT NULL,
  cliente_razon_social text NOT NULL,
  cliente_direccion text NOT NULL,
  cliente_telefono text,
  cliente_email text,
  persona_encargada text NOT NULL,
  motivo_servicio text NOT NULL,
  descripcion_detallada text,
  tipo_servicio text NOT NULL DEFAULT 'instalacion',
  tecnico_id uuid,
  tecnico_tipo text CHECK (tecnico_tipo IN ('propio', 'externo')),
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aceptado', 'en_progreso', 'completado', 'cancelado')),
  prioridad text NOT NULL DEFAULT 'media' CHECK (prioridad IN ('baja', 'media', 'alta', 'urgente')),
  fecha_asignacion timestamp with time zone NOT NULL DEFAULT now(),
  fecha_aceptacion timestamp with time zone,
  fecha_inicio timestamp with time zone,
  fecha_finalizacion timestamp with time zone,
  observaciones_tecnico text,
  firma_tecnico text, -- Para almacenar la firma digital
  firma_cliente text, -- Para almacenar la firma del cliente
  materiales_utilizados jsonb DEFAULT '[]'::jsonb,
  tiempo_estimado_horas integer,
  costo_estimado numeric(10,2),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.servicios_tecnicos_asignados ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para servicios técnicos
CREATE POLICY "Técnicos pueden ver sus servicios asignados" 
ON public.servicios_tecnicos_asignados 
FOR SELECT 
USING (tecnico_id = auth.uid());

CREATE POLICY "Técnicos pueden actualizar sus servicios" 
ON public.servicios_tecnicos_asignados 
FOR UPDATE 
USING (tecnico_id = auth.uid());

CREATE POLICY "Administradores pueden gestionar todos los servicios" 
ON public.servicios_tecnicos_asignados 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('administrador', 'jefe_tecnicos')
  )
);

-- Crear tabla de observaciones de servicios técnicos
CREATE TABLE IF NOT EXISTS public.observaciones_servicios_tecnicos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  servicio_id uuid NOT NULL REFERENCES public.servicios_tecnicos_asignados(id) ON DELETE CASCADE,
  tecnico_id uuid NOT NULL,
  observacion text NOT NULL,
  tipo_observacion text DEFAULT 'general' CHECK (tipo_observacion IN ('general', 'inicio', 'progreso', 'material', 'problema', 'finalizacion')),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS para observaciones
ALTER TABLE public.observaciones_servicios_tecnicos ENABLE ROW LEVEL SECURITY;

-- Políticas para observaciones
CREATE POLICY "Técnicos pueden crear observaciones de sus servicios" 
ON public.observaciones_servicios_tecnicos 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.servicios_tecnicos_asignados 
    WHERE id = servicio_id AND tecnico_id = auth.uid()
  )
);

CREATE POLICY "Usuarios pueden ver observaciones de servicios relevantes" 
ON public.observaciones_servicios_tecnicos 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.servicios_tecnicos_asignados s
    WHERE s.id = servicio_id 
    AND (s.tecnico_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('administrador', 'jefe_tecnicos')
    ))
  )
);

-- Función para actualizar timestamp
CREATE OR REPLACE FUNCTION public.update_servicios_tecnicos_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar timestamp
CREATE TRIGGER update_servicios_tecnicos_updated_at
BEFORE UPDATE ON public.servicios_tecnicos_asignados
FOR EACH ROW
EXECUTE FUNCTION public.update_servicios_tecnicos_timestamp();

-- Insertar algunos servicios de ejemplo
INSERT INTO public.servicios_tecnicos_asignados (
  cliente_id, cliente_razon_social, cliente_direccion, cliente_telefono, 
  cliente_email, persona_encargada, motivo_servicio, descripcion_detallada,
  tipo_servicio, tecnico_tipo, prioridad, tiempo_estimado_horas, costo_estimado
) VALUES 
(
  gen_random_uuid(), 'Empresa ABC S.A.', 'Av. Principal 123, Piso 5', '+58-212-1234567',
  'contacto@empresaabc.com', 'Juan Pérez - Gerente IT', 'Instalación de sistema de alarmas',
  'Instalación completa de sistema de alarmas con 8 sensores de movimiento, 4 cámaras de seguridad y panel central de control',
  'instalacion', 'propio', 'alta', 8, 1500.00
),
(
  gen_random_uuid(), 'Hotel Boutique XYZ', 'Calle Comercio 456', '+58-212-9876543',
  'mantenimiento@hotelxyz.com', 'María González - Jefe de Mantenimiento', 'Mantenimiento preventivo',
  'Revisión y mantenimiento preventivo de 12 cámaras de seguridad distribuidas en 3 pisos del hotel',
  'mantenimiento', 'externo', 'media', 6, 800.00
),
(
  gen_random_uuid(), 'Residencias Los Pinos', 'Urb. Los Pinos, Casa 15', '+58-414-5555555',
  'administracion@lospinos.com', 'Carlos Rodríguez - Administrador', 'Reparación de sensor defectuoso',
  'Reparación o reemplazo de sensor de movimiento que está generando falsas alarmas en área de piscina',
  'reparacion', 'propio', 'urgente', 3, 250.00
);