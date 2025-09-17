-- Expand RLS policies to allow operational roles to manage contracted companies and configurations

-- Drop existing restrictive policies first if they exist
DROP POLICY IF EXISTS "Administradores pueden gestionar empresas_contratadas" ON public.empresas_contratadas;
DROP POLICY IF EXISTS "Administradores y directores pueden gestionar patrullas_coraza" ON public.patrullas_coraza;

-- Empresas contratadas: allow administrador, director, despachador_patrullas, operador_alarmas to INSERT/UPDATE/DELETE
CREATE POLICY "Operativos pueden insertar empresas_contratadas"
ON public.empresas_contratadas
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = ANY (ARRAY['administrador'::user_role, 'director'::user_role, 'despachador_patrullas'::user_role, 'operador_alarmas'::user_role])
  )
);

CREATE POLICY "Operativos pueden actualizar empresas_contratadas"
ON public.empresas_contratadas
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = ANY (ARRAY['administrador'::user_role, 'director'::user_role, 'despachador_patrullas'::user_role, 'operador_alarmas'::user_role])
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = ANY (ARRAY['administrador'::user_role, 'director'::user_role, 'despachador_patrullas'::user_role, 'operador_alarmas'::user_role])
  )
);

CREATE POLICY "Operativos pueden eliminar empresas_contratadas"
ON public.empresas_contratadas
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = ANY (ARRAY['administrador'::user_role, 'director'::user_role, 'despachador_patrullas'::user_role, 'operador_alarmas'::user_role])
  )
);

-- Patrullas coraza (configuraciones): allow the same roles to manage configurations
CREATE POLICY "Operativos pueden insertar patrullas_coraza"
ON public.patrullas_coraza
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = ANY (ARRAY['administrador'::user_role, 'director'::user_role, 'despachador_patrullas'::user_role, 'operador_alarmas'::user_role])
  )
);

CREATE POLICY "Operativos pueden actualizar patrullas_coraza"
ON public.patrullas_coraza
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = ANY (ARRAY['administrador'::user_role, 'director'::user_role, 'despachador_patrullas'::user_role, 'operador_alarmas'::user_role])
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = ANY (ARRAY['administrador'::user_role, 'director'::user_role, 'despachador_patrullas'::user_role, 'operador_alarmas'::user_role])
  )
);

CREATE POLICY "Operativos pueden eliminar patrullas_coraza"
ON public.patrullas_coraza
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = ANY (ARRAY['administrador'::user_role, 'director'::user_role, 'despachador_patrullas'::user_role, 'operador_alarmas'::user_role])
  )
);