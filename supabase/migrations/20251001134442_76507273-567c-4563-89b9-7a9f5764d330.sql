-- Fix RLS for DELETE on public.clientes to allow roles from user_roles or legacy users_auth
DROP POLICY IF EXISTS "Administradores, directores y operadores pueden eliminar client" ON public.clientes;

CREATE POLICY "Administradores, directores y operadores pueden eliminar clientes"
ON public.clientes
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid()
      AND ur.role = ANY (ARRAY['administrador'::user_role, 'director'::user_role, 'operador_alarmas'::user_role])
  )
  OR EXISTS (
    SELECT 1 FROM public.users_auth ua
    WHERE ua.email = (auth.jwt() ->> 'email')
      AND ua.active = true
      AND ua.role = ANY (ARRAY['administrador'::text, 'director'::text, 'operador_alarmas'::text])
  )
);
