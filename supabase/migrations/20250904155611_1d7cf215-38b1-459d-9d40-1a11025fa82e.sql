-- Verificar y arreglar las políticas RLS para permitir actualización de alarmas
-- Primero verificar la política actual de actualización
SELECT 
  policyname,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'alarmas' 
AND cmd = 'UPDATE';

-- Eliminar política restrictiva de actualización si existe
DROP POLICY IF EXISTS "Actualizar_alarmas_roles_autorizados" ON public.alarmas;

-- Crear nueva política más permisiva para actualización de alarmas
CREATE POLICY "Actualizar_alarmas_unificado" 
ON public.alarmas 
FOR UPDATE 
USING (true)
WITH CHECK (true);