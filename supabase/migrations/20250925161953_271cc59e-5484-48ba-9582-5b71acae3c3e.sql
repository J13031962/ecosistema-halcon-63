-- Crear tabla para observaciones de supervisor durante servicios
CREATE TABLE public.supervisor_observaciones_alarma (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alarma_id UUID NOT NULL,
  supervisor_id UUID NOT NULL,
  supervisor_nombre TEXT NOT NULL,
  observacion_texto TEXT,
  foto_url TEXT,
  tipo_observacion TEXT NOT NULL DEFAULT 'texto' CHECK (tipo_observacion IN ('texto', 'foto', 'mixta')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.supervisor_observaciones_alarma ENABLE ROW LEVEL SECURITY;

-- Política para que supervisores puedan crear sus observaciones
CREATE POLICY "Supervisores pueden crear sus observaciones" 
ON public.supervisor_observaciones_alarma 
FOR INSERT 
WITH CHECK (
  is_authenticated_user() AND (
    supervisor_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = supervisor_observaciones_alarma.supervisor_id
      AND (p.user_id = auth.uid() OR p.email = (auth.jwt() ->> 'email'))
    )
  )
);

-- Política para ver observaciones de alarmas relevantes
CREATE POLICY "Ver observaciones de alarmas relevantes" 
ON public.supervisor_observaciones_alarma 
FOR SELECT 
USING (
  -- El supervisor puede ver sus propias observaciones
  supervisor_id = auth.uid()
  OR
  -- Usuarios operativos pueden ver todas las observaciones
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role = ANY (ARRAY['administrador'::user_role, 'director'::user_role, 'despachador_patrullas'::user_role, 'operador_alarmas'::user_role])
  )
  OR
  -- Via profiles para supervisores
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = supervisor_observaciones_alarma.supervisor_id
    AND (p.user_id = auth.uid() OR p.email = (auth.jwt() ->> 'email'))
  )
);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_supervisor_observaciones_updated_at
BEFORE UPDATE ON public.supervisor_observaciones_alarma
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Crear bucket para fotos de observaciones de supervisor si no existe
INSERT INTO storage.buckets (id, name, public) 
VALUES ('supervisor-observaciones', 'supervisor-observaciones', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas para el bucket de fotos
CREATE POLICY "Supervisores pueden subir fotos de observaciones" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'supervisor-observaciones' 
  AND is_authenticated_user()
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id::text = (storage.foldername(name))[1]
      AND (p.user_id = auth.uid() OR p.email = (auth.jwt() ->> 'email'))
    )
  )
);

CREATE POLICY "Supervisores pueden ver sus fotos de observaciones" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'supervisor-observaciones' 
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role = ANY (ARRAY['administrador'::user_role, 'director'::user_role, 'despachador_patrullas'::user_role, 'operador_alarmas'::user_role])
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id::text = (storage.foldername(name))[1]
      AND (p.user_id = auth.uid() OR p.email = (auth.jwt() ->> 'email'))
    )
  )
);

CREATE POLICY "Supervisores pueden eliminar sus fotos de observaciones" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'supervisor-observaciones' 
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id::text = (storage.foldername(name))[1]
      AND (p.user_id = auth.uid() OR p.email = (auth.jwt() ->> 'email'))
    )
  )
);