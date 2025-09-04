-- Primero, eliminamos la política restrictiva actual de system_functions
DROP POLICY IF EXISTS "Admins can manage all functions" ON public.system_functions;

-- Creamos políticas más granulares para system_functions
-- Permitir lectura a todos los usuarios autenticados (necesario para mostrar permisos)
CREATE POLICY "All authenticated users can read functions" 
ON public.system_functions 
FOR SELECT 
TO authenticated 
USING (true);

-- Permitir gestión completa solo a administradores
CREATE POLICY "Admins can manage functions" 
ON public.system_functions 
FOR ALL 
TO authenticated 
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() 
  AND role = 'administrador'::app_role
));

-- Asignar rol de administrador al primer usuario activo
-- (necesario para que alguien pueda gestionar usuarios)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'administrador'::app_role
FROM public.users 
WHERE active = true 
LIMIT 1
ON CONFLICT (user_id, role) DO NOTHING;