-- Eliminar la política restrictiva actual
DROP POLICY IF EXISTS "Solo administradores pueden eliminar clientes" ON public.clientes;

-- Crear nueva política que permite a administradores, directores y operadores eliminar clientes
CREATE POLICY "Administradores, directores y operadores pueden eliminar clientes"
ON public.clientes
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = ANY(ARRAY['administrador'::user_role, 'director'::user_role, 'operador_alarmas'::user_role])
  )
);