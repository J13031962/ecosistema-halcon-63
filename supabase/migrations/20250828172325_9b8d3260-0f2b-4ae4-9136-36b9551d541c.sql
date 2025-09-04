-- ============================================
-- CORRECCIÓN DE POLÍTICAS RLS PARA ROLES
-- ============================================

-- Eliminar políticas existentes problemáticas
DROP POLICY IF EXISTS "Admins can insert user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete user roles" ON public.user_roles;

-- Crear políticas mejoradas que permitan todos los roles
CREATE POLICY "Administradores pueden insertar roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN profiles p ON ur.user_id = p.id
    WHERE p.id = auth.uid() AND ur.role = 'administrador'::user_role
  )
  OR 
  auth.jwt() ->> 'email' = 'admin@empresa.com'
);

CREATE POLICY "Administradores pueden actualizar roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN profiles p ON ur.user_id = p.id
    WHERE p.id = auth.uid() AND ur.role = 'administrador'::user_role
  )
  OR 
  auth.jwt() ->> 'email' = 'admin@empresa.com'
);

CREATE POLICY "Administradores pueden eliminar roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN profiles p ON ur.user_id = p.id
    WHERE p.id = auth.uid() AND ur.role = 'administrador'::user_role
  )
  OR 
  auth.jwt() ->> 'email' = 'admin@empresa.com'
);

-- Verificar que todos los roles estén disponibles en el enum
DO $$
BEGIN
  -- Verificar si el tipo user_role existe y tiene todos los roles necesarios
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM (
      'administrador',
      'director', 
      'operador_alarmas',
      'despachador_patrullas',
      'supervisor_motorizado',
      'tecnico',
      'tecnico_propio',
      'tecnico_externo',
      'director_tecnico',
      'jefe_tecnicos',
      'asesor_ventas'
    );
  END IF;
END $$;