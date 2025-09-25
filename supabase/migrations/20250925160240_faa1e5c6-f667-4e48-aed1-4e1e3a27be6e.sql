-- Drop the restrictive policy that only works with Supabase auth
DROP POLICY IF EXISTS "Operativos pueden ver todas las ubicaciones" ON public.supervisor_ubicaciones_tiempo_real;

-- Create a more permissive policy that works with both Supabase and legacy auth
CREATE POLICY "Usuarios operativos autenticados pueden ver ubicaciones" 
ON public.supervisor_ubicaciones_tiempo_real 
FOR SELECT 
USING (
  -- Allow if user is authenticated (Supabase or legacy) AND has operational roles
  is_authenticated_user() AND (
    -- Check if user has operational role in Supabase system
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role = ANY (ARRAY['administrador'::user_role, 'director'::user_role, 'despachador_patrullas'::user_role, 'operador_alarmas'::user_role])
    )
    OR
    -- Check if user has operational role in legacy system
    EXISTS (
      SELECT 1 FROM users_auth ua
      WHERE ua.email = (auth.jwt() ->> 'email')
      AND ua.active = true
      AND ua.role IN ('administrador', 'director', 'despachador_patrullas', 'operador_alarmas')
    )
  )
);