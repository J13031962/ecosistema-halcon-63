-- Crear tabla para historial de cambios en turnos (corregido)
CREATE TABLE IF NOT EXISTS public.turnos_cambios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turno_tipo TEXT NOT NULL DEFAULT 'operador',
  turno_id UUID,
  fecha DATE NOT NULL,
  usuario_afectado_id UUID,
  usuario_afectado_nombre TEXT,
  descripcion TEXT,
  detalles JSONB,
  changed_by UUID DEFAULT auth.uid(),
  changed_by_nombre TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.turnos_cambios ENABLE ROW LEVEL SECURITY;

-- Ver cambios de mis turnos o por administradores
CREATE POLICY "Ver cambios de mis turnos o por administradores" 
ON public.turnos_cambios
FOR SELECT
USING (
  usuario_afectado_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role IN ('administrador'::user_role, 'director'::user_role)
  )
);

-- Registrar cambios turnos autenticados
CREATE POLICY "Registrar cambios turnos autenticados" 
ON public.turnos_cambios
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);