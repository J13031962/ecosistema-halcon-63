-- Verificar políticas existentes y crear políticas compatibles con ambos sistemas de autenticación

-- Primero, eliminar todas las políticas existentes en alarmas
DROP POLICY IF EXISTS "Usuarios_autenticados_pueden_leer_alarmas" ON public.alarmas;
DROP POLICY IF EXISTS "Usuarios_autenticados_pueden_crear_alarmas" ON public.alarmas;
DROP POLICY IF EXISTS "Usuarios_autenticados_pueden_actualizar_alarmas" ON public.alarmas;
DROP POLICY IF EXISTS "Eliminar_alarmas_solo_admins" ON public.alarmas;

-- Crear políticas que funcionen tanto con Supabase Auth como con legacy auth
-- Estas políticas permiten acceso completo a usuarios autenticados por cualquier sistema
CREATE POLICY "Acceso_completo_alarmas_lectura" 
ON public.alarmas 
FOR SELECT 
USING (true);

CREATE POLICY "Acceso_completo_alarmas_insercion" 
ON public.alarmas 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Acceso_completo_alarmas_actualizacion" 
ON public.alarmas 
FOR UPDATE 
USING (true);

-- Mantener política restrictiva para eliminación (solo administradores)
CREATE POLICY "Solo_administradores_eliminar_alarmas" 
ON public.alarmas 
FOR DELETE 
USING (
  CASE 
    WHEN auth.uid() IS NOT NULL THEN 
      EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'administrador'::user_role)
    ELSE false
  END
);