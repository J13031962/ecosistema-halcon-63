-- Solucionar creación de alarmas - Política temporal más permisiva
-- Solo afecta las alarmas, NO toca las políticas de clientes

-- 1. Eliminar la política actual de INSERT que está causando problemas
DROP POLICY IF EXISTS "Crear_alarmas_usuarios_autenticados" ON public.alarmas;

-- 2. Crear política temporal MUY permisiva para INSERT de alarmas
-- Esto permite a cualquier usuario autenticado crear alarmas mientras solucionamos el problema de roles
CREATE POLICY "Crear_alarmas_temporal_permisivo" 
ON public.alarmas 
FOR INSERT 
WITH CHECK (
  -- Solo verificar que hay un usuario autenticado
  auth.uid() IS NOT NULL
);

-- 3. Verificar que el usuario supervisor4 existe y está autenticado
-- Mostrar información de debug sobre el usuario actual
DO $$
BEGIN
    RAISE NOTICE 'Verificando configuración de usuario supervisor4...';
    
    -- Mostrar información sobre supervisor4 en profiles
    IF EXISTS (SELECT 1 FROM profiles WHERE email = 'supervisor4@teleguardia.com') THEN
        RAISE NOTICE 'Supervisor4 encontrado en profiles';
    ELSE
        RAISE NOTICE 'Supervisor4 NO encontrado en profiles';
    END IF;
    
    -- Mostrar información sobre supervisor4 en user_roles
    IF EXISTS (SELECT 1 FROM profiles p JOIN user_roles ur ON ur.user_id = p.id WHERE p.email = 'supervisor4@teleguardia.com') THEN
        RAISE NOTICE 'Supervisor4 tiene roles asignados';
    ELSE
        RAISE NOTICE 'Supervisor4 NO tiene roles asignados';
    END IF;
END $$;