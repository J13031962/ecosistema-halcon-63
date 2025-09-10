-- Limpiar todas las políticas existentes en alarmas y crear una configuración simple
-- que funcione con el sistema actual

-- Eliminar todas las políticas existentes
DROP POLICY IF EXISTS "Lectura_alarmas_usuarios_autenticados" ON public.alarmas;
DROP POLICY IF EXISTS "Insercion_alarmas_usuarios_autenticados" ON public.alarmas;
DROP POLICY IF EXISTS "Actualizacion_alarmas_usuarios_autenticados" ON public.alarmas;
DROP POLICY IF EXISTS "Eliminacion_alarmas_solo_administradores" ON public.alarmas;
DROP POLICY IF EXISTS "Acceso_completo_alarmas_lectura" ON public.alarmas;
DROP POLICY IF EXISTS "Acceso_completo_alarmas_insercion" ON public.alarmas;
DROP POLICY IF EXISTS "Acceso_completo_alarmas_actualizacion" ON public.alarmas;
DROP POLICY IF EXISTS "Solo_administradores_eliminar_alarmas" ON public.alarmas;

-- Crear políticas simples que funcionen
CREATE POLICY "full_access_alarmas_select" 
ON public.alarmas 
FOR SELECT 
USING (true);

CREATE POLICY "full_access_alarmas_insert" 
ON public.alarmas 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "full_access_alarmas_update" 
ON public.alarmas 
FOR UPDATE 
USING (true);

CREATE POLICY "admin_only_alarmas_delete" 
ON public.alarmas 
FOR DELETE 
USING (false); -- Desactivar eliminación por ahora