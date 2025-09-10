-- Actualizar políticas RLS para la tabla alarmas para permitir acceso completo a usuarios autenticados

-- Eliminar políticas restrictivas existentes
DROP POLICY IF EXISTS "Operadores_pueden_leer_alarmas" ON public.alarmas;
DROP POLICY IF EXISTS "Operadores_pueden_crear_alarmas" ON public.alarmas;
DROP POLICY IF EXISTS "Usuarios_autorizados_pueden_actualizar_alarmas" ON public.alarmas;

-- Crear políticas más permisivas para operaciones normales
CREATE POLICY "Usuarios_autenticados_pueden_leer_alarmas" 
ON public.alarmas 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuarios_autenticados_pueden_crear_alarmas" 
ON public.alarmas 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuarios_autenticados_pueden_actualizar_alarmas" 
ON public.alarmas 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- Mantener la política de eliminación restrictiva solo para administradores
-- (Esta ya existe y es correcta)