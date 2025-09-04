-- Solucionar problemas de creación de alarmas - Versión simplificada
-- 1. Eliminar políticas conflictivas de INSERT en alarmas
DROP POLICY IF EXISTS "Allow all users to create alarmas" ON public.alarmas;
DROP POLICY IF EXISTS "Crear_alarmas_roles_autorizados" ON public.alarmas;

-- 2. Crear nueva política simplificada para creación de alarmas
CREATE POLICY "Crear_alarmas_usuarios_autenticados" 
ON public.alarmas 
FOR INSERT 
WITH CHECK (
  -- Permitir a usuarios autenticados con roles específicos
  auth.uid() IS NOT NULL 
  AND 
  (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = ANY(ARRAY['administrador'::user_role, 'operador_alarmas'::user_role, 'despachador_patrullas'::user_role])
    )
    OR
    -- También permitir si hay datos válidos de usuario en users_auth
    EXISTS (
      SELECT 1 FROM users_auth 
      WHERE id = auth.uid() 
      AND active = true
      AND role IN ('administrador', 'operador_alarmas', 'despachador_patrullas')
    )
  )
);

-- 3. Actualizar supervisor4 para que tenga permisos de operador también (solo usuarios existentes)
DO $$
DECLARE
    supervisor4_id uuid;
BEGIN
    -- Obtener el ID del supervisor4
    SELECT id INTO supervisor4_id 
    FROM public.profiles 
    WHERE email = 'supervisor4@teleguardia.com' 
    LIMIT 1;
    
    IF supervisor4_id IS NOT NULL THEN
        -- Asegurar que tiene el rol de operador_alarmas también para poder crear alarmas
        INSERT INTO public.user_roles (user_id, role)
        VALUES (supervisor4_id, 'operador_alarmas'::user_role)
        ON CONFLICT (user_id, role) DO NOTHING;
        
        -- Actualizar en users_auth también
        UPDATE public.users_auth 
        SET role = 'operador_alarmas',
            active = true
        WHERE email = 'supervisor4@teleguardia.com';
        
        RAISE NOTICE 'Supervisor4 configurado con permisos de operador_alarmas para crear alarmas';
    END IF;
END $$;