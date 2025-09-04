-- Asignar servicios a técnicos específicos
-- Primero, obtener IDs de usuarios técnicos
UPDATE public.servicios_tecnicos_asignados 
SET tecnico_id = (
  SELECT ur.user_id 
  FROM public.user_roles ur 
  WHERE ur.role = 'tecnico' 
  LIMIT 1
)
WHERE tecnico_tipo = 'propio';

-- Asignar servicios externos a técnicos externos (usando el mismo user_id por ahora para pruebas)
UPDATE public.servicios_tecnicos_asignados 
SET tecnico_id = (
  SELECT ur.user_id 
  FROM public.user_roles ur 
  WHERE ur.role = 'tecnico' 
  LIMIT 1
)
WHERE tecnico_tipo = 'externo';

-- Crear tabla para permisos adicionales por usuario específico
CREATE TABLE IF NOT EXISTS public.user_additional_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  permission_name text NOT NULL,
  permission_description text,
  granted_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.user_additional_permissions ENABLE ROW LEVEL SECURITY;

-- Políticas para permisos adicionales
CREATE POLICY "Usuarios pueden ver sus permisos adicionales" 
ON public.user_additional_permissions 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Administradores pueden gestionar permisos adicionales" 
ON public.user_additional_permissions 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'administrador'
  )
);

-- Insertar algunos permisos adicionales de ejemplo para usuarios técnicos
INSERT INTO public.user_additional_permissions (user_id, permission_name, permission_description, granted_by)
SELECT 
  ur.user_id,
  'ver_reportes_avanzados',
  'Acceso a reportes avanzados del sistema',
  (SELECT user_id FROM public.user_roles WHERE role = 'administrador' LIMIT 1)
FROM public.user_roles ur 
WHERE ur.role = 'tecnico';

INSERT INTO public.user_additional_permissions (user_id, permission_name, permission_description, granted_by)
SELECT 
  ur.user_id,
  'gestionar_inventario',
  'Acceso a gestión de inventario de materiales',
  (SELECT user_id FROM public.user_roles WHERE role = 'administrador' LIMIT 1)
FROM public.user_roles ur 
WHERE ur.role = 'tecnico';